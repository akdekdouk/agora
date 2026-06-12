import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

export interface SearchContext {
  merchants: Array<{
    id: string;
    businessName: string;
    category: string;
    city: string;
    description?: string | null;
  }>;
  offers: Array<{
    id: string;
    title: string;
    description: string;
    discount: number;
    validFrom: string;
    validTo: string;
    merchantId: string;
    merchantName: string;
    merchantCity: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    category?: string | null;
    originalPrice: number;
    discountedPrice: number;
    merchantId: string;
    merchantName: string;
    merchantCity: string;
  }>;
}

export interface SearchResult {
  merchants: SearchContext["merchants"];
  offers: SearchContext["offers"];
  products: SearchContext["products"];
}

export async function searchWithClaude(
  query: string,
  context: SearchContext
): Promise<SearchResult> {
  const systemPrompt = `You are a helpful search assistant for Agora, a local business discount platform.
You will receive a user's natural language search query and a JSON context of merchants, offers, and products.
Your task is to find the most relevant results matching the query.

Return ONLY a valid JSON object with this exact structure:
{
  "merchants": [...matching merchant objects from context...],
  "offers": [...matching offer objects from context...],
  "products": [...matching product objects from context...]
}

Rules:
- Only return items that genuinely match the query
- Match by location (city), category, keywords in names/descriptions
- For date-based queries like "this week", compare against today's date: ${new Date().toISOString().split("T")[0]}
- Return empty arrays if no matches found
- Preserve the complete object structure from the context
- Do not add or modify any fields`;

  const userMessage = `Search query: "${query}"

Context data:
${JSON.stringify(context, null, 2)}`;

  const message = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    system: systemPrompt,
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return { merchants: [], offers: [], products: [] };
  }

  try {
    // Extract JSON from the response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { merchants: [], offers: [], products: [] };
    }
    const result = JSON.parse(jsonMatch[0]) as SearchResult;
    return {
      merchants: result.merchants ?? [],
      offers: result.offers ?? [],
      products: result.products ?? [],
    };
  } catch {
    return { merchants: [], offers: [], products: [] };
  }
}

// --- Feature 2: Auto-generate offer description ---

export async function generateOfferDescription(
  title: string,
  discount: number,
  merchantCategory: string,
  merchantName: string
): Promise<string> {
  const message = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: `You are a copywriter for a local commerce platform. Write short, punchy, commercial offer descriptions in 1-2 sentences. Be enthusiastic but concise. Match the language of the merchant category. Output ONLY the description text, no quotes, no extra formatting.`,
    messages: [{
      role: "user",
      content: `Merchant: ${merchantName} (${merchantCategory})\nOffer title: ${title}\nDiscount: ${discount}%\n\nWrite a compelling description for this offer.`,
    }],
  });
  const content = message.content[0];
  return content.type === "text" ? content.text.trim() : "";
}

// --- Feature 1: Personalized recommendations ---

export interface RecommendationOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  validFrom: string;
  validTo: string;
  maxClaims: number | null;
  claimsCount: number;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  merchantCity: string;
  photo?: string | null;
}

export async function getPersonalizedRecommendations(
  offers: RecommendationOffer[],
  consumerProfile: {
    interests: string[];
    city?: string | null;
    claimedOfferIds: string[];
    savedOfferIds: string[];
  }
): Promise<RecommendationOffer[]> {
  if (offers.length === 0) return [];

  const message = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a recommendation engine for a local commerce platform. Given a consumer profile and a list of active offers, return the IDs of the top 6 most relevant offers for this consumer, ordered by relevance (best first).

Rules:
- Prioritize offers matching the consumer's category interests
- Prioritize offers in or near the consumer's city
- Exclude offers the consumer has already claimed or saved
- Prefer offers with higher discounts when other factors are equal
- Return ONLY a JSON array of offer IDs, e.g. ["id1","id2","id3"]`,
    messages: [{
      role: "user",
      content: `Consumer profile:
- Interests: ${consumerProfile.interests.length > 0 ? consumerProfile.interests.join(", ") : "all categories"}
- City: ${consumerProfile.city ?? "not specified"}
- Already claimed: ${consumerProfile.claimedOfferIds.length} offers
- Already saved: ${consumerProfile.savedOfferIds.length} offers

Available offers:
${JSON.stringify(offers.map(o => ({
  id: o.id,
  title: o.title,
  discount: o.discount,
  category: o.merchantCategory,
  city: o.merchantCity,
  alreadyClaimed: consumerProfile.claimedOfferIds.includes(o.id),
  alreadySaved: consumerProfile.savedOfferIds.includes(o.id),
})), null, 2)}`,
    }],
  });

  const content = message.content[0];
  if (content.type !== "text") return offers.slice(0, 6);

  try {
    const match = content.text.match(/\[[\s\S]*\]/);
    if (!match) return offers.slice(0, 6);
    const ids = JSON.parse(match[0]) as string[];
    const offerMap = new Map(offers.map(o => [o.id, o]));
    return ids.map(id => offerMap.get(id)).filter(Boolean) as RecommendationOffer[];
  } catch {
    return offers.slice(0, 6);
  }
}

// --- Feature 3: AI Chat assistant ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const localeNames: Record<string, string> = {
  en: "English", fr: "French", it: "Italian", ar: "Arabic", tr: "Turkish", es: "Spanish",
};

export interface ConsumerProfile {
  name?: string | null;
  city?: string | null;
  savedOffers: Array<{ id: string; title: string; discount: number; merchant: { businessName: string } }>;
  followedMerchants: Array<{ id: string; businessName: string; category: string; city: string }>;
  activeClaims: Array<{ title: string; discount: number; validTo: string; merchantName: string }>;
}

export interface MerchantProfile {
  businessName: string;
  category: string;
  city: string;
  totalOffers: number;
  totalProducts: number;
  activeOffers: Array<{ title: string; discount: number; validTo: string; claimsCount: number }>;
  products: Array<{ name: string; originalPrice: number; discountedPrice: number }>;
}

export interface ChatContext {
  offers: RecommendationOffer[];
  locale?: string;
  userType: "consumer" | "merchant" | "guest";
  consumerProfile?: ConsumerProfile | null;
  merchantProfile?: MerchantProfile | null;
}

export async function* chatWithAssistant(
  messages: ChatMessage[],
  context: ChatContext
): AsyncGenerator<string> {
  const lang = localeNames[context.locale ?? "en"] ?? "English";
  const today = new Date().toISOString().split("T")[0];

  let profileSection = "";

  if (context.userType === "consumer" && context.consumerProfile) {
    const p = context.consumerProfile;
    profileSection = `
--- CONSUMER PROFILE ---
Name: ${p.name ?? "unknown"}
City: ${p.city ?? "not specified"}
Saved offers (${p.savedOffers.length}): ${p.savedOffers.map(o => `"${o.title}" -${o.discount}% at ${o.merchant.businessName}`).join(", ") || "none"}
Followed merchants (${p.followedMerchants.length}): ${p.followedMerchants.map(m => `${m.businessName} (${m.category}, ${m.city})`).join(", ") || "none"}
Active claims (${p.activeClaims.length}): ${p.activeClaims.map(c => `"${c.title}" -${c.discount}% at ${c.merchantName}, valid until ${c.validTo.split("T")[0]}`).join(", ") || "none"}
---`;
  } else if (context.userType === "merchant" && context.merchantProfile) {
    const m = context.merchantProfile;
    profileSection = `
--- MERCHANT PROFILE ---
Business: ${m.businessName} (${m.category}) in ${m.city}
Total offers: ${m.totalOffers} | Active offers: ${m.activeOffers.length} | Products: ${m.totalProducts}
Active offers: ${m.activeOffers.map(o => `"${o.title}" -${o.discount}% (${o.claimsCount} claims, valid until ${o.validTo.split("T")[0]})`).join(", ") || "none"}
Products: ${m.products.map(p => `"${p.name}" ${p.originalPrice}→${p.discountedPrice}`).join(", ") || "none"}
---`;
  }

  const userTypeInstructions = context.userType === "merchant"
    ? `You are talking to a MERCHANT (business owner). Help them manage their business on Agora: understand their stats, improve their offers, attract more customers, and use platform features effectively. Address them as a business owner.`
    : context.userType === "consumer"
    ? `You are talking to a CONSUMER. Help them find deals, manage their saved offers and claims, discover new merchants, and use the platform. Address them by name if available.`
    : `You are talking to a VISITOR (not logged in). Help them discover deals and encourage them to create a free account to save offers and claim discounts.`;

  const systemPrompt = `You are a warm and effective commercial advisor for Agora, a local deals platform. You help people find and claim discounts from local merchants.

LANGUAGE: Always respond in ${lang}. Every word must be in ${lang}.

Today: ${today}
${profileSection}
${userTypeInstructions}

Available offers you can show (pass IDs to show_offers):
${JSON.stringify(context.offers.map(o => ({
  id: o.id,
  title: o.title,
  discount: o.discount,
  merchant: o.merchantName,
  category: o.merchantCategory,
  city: o.merchantCity,
})), null, 2)}

PLATFORM INFO:
- Free platform: merchants publish offers, consumers claim them with a QR code shown in-store
- To claim: click "Claim this offer" → show QR code at the store
- To save: click the bookmark icon (free account needed)
- Contact: akdekdouk@gmail.com | +39 351 154 9779

YOUR ROLE — act like a skilled sales advisor:

1. GREETINGS ("bonjour", "salut", "ça va", "hello", short pleasantries):
   Respond warmly in 1 sentence, then ask ONE specific question to learn their criteria (city? category? budget?). Do NOT show offers yet.

2. CRITERIA DETECTED — any of: city name, category, type of product, desire for deal, short answer to your own question (e.g. user replies "La Rochelle" to your city question):
   IMMEDIATELY call show_offers with the 3 BEST matching offers (maximum 3, never more). Add ONE short warm sentence after. Never describe offers in text — the cards are shown visually.

3. CASUAL CHAT or UNCLEAR response:
   Respond warmly in 1-2 sentences, then ask ONE simple question. Example: if they said a city but no category → "Super ! Et vous cherchez quel type de commerce — restaurant, beauté, boutique ?"

4. KEEP CONVERSATION ALIVE: ALWAYS end with a question. Never a dead end. Even a vague answer like "je ne sais pas" → respond warmly and give them 2-3 easy category options to choose from.

5. CRITICAL: When calling show_offers, NEVER list or describe the offers in text. The visual cards handle that.

6. If offers don't satisfy: ask one refining question (different city? different category?) then call show_offers again.

7. NEVER BLOCK: If the user's message is ambiguous or minimal, always find a way to continue the conversation warmly.`;

  const offerMap = new Map(context.offers.map(o => [o.id, o]));

  const lastUserMsg = messages[messages.length - 1]?.content?.toString().toLowerCase() ?? "";

  // Pure first-message greetings only — once conversation is going, never block
  const isFirstMessage = messages.length === 1;
  const isPleasantry = isFirstMessage &&
    /^(bonjour|salut|bonsoir|hello|hi|ciao|hola|merhaba|ça va|ca va|salam|comment (allez|vas|tu vas)|vous allez|bien merci|merci|bonne journée|bonne soirée)[^a-z]{0,10}$/i.test(lastUserMsg.trim());

  // Scan full conversation for any useful context (city, category, desire)
  const allUserText = messages
    .filter(m => m.role === "user")
    .map(m => m.content?.toString().toLowerCase() ?? "")
    .join(" ");

  const hasRealContext =
    /offr|deal|promo|réduction|reduction|remise|discount|restaurant|shop|boutique|artisan|beauté|beauty|sport|hotel|service|bon plan|trouv|cherch|recommand|voudrais|cherche|besoin|envie|voir les|je veux|je cherche|je suis (à|a|en)|je vis (à|a|en)|paris|lyon|marseille|toulouse|nice|nantes|bordeaux|lille|strasbourg|rennes|rochelle|toulon|grenoble|montpellier|rouen|reims|dijon|angers|metz|brest|le havre|tours|saint/i.test(allUserText);

  // Mid-conversation (3+ user messages) → always show offers, user has given enough info
  const deepInConversation = messages.filter(m => m.role === "user").length >= 3;

  const isOfferQuery = !isPleasantry && context.offers.length > 0 &&
    (deepInConversation || hasRealContext);

  const tools: Anthropic.Tool[] = [
    {
      name: "show_offers",
      description: "Display visual offer cards to the user. ALWAYS call this when recommending offers — pass the IDs of the 3 best matching offers. The user will see beautiful cards, not text.",
      input_schema: {
        type: "object" as const,
        properties: {
          offer_ids: {
            type: "array",
            items: { type: "string" },
            description: "IDs of offers to display (max 3)",
          },
        },
        required: ["offer_ids"],
      },
    },
  ];

  const response = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 768,
    system: systemPrompt,
    tools,
    tool_choice: isOfferQuery ? { type: "any" } : { type: "auto" },
    messages,
  });

  // Extract text and tool use blocks
  let textContent = "";
  let offersToShow: RecommendationOffer[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      textContent += block.text;
    } else if (block.type === "tool_use" && block.name === "show_offers") {
      const input = block.input as { offer_ids: string[] };
      offersToShow = (input.offer_ids ?? [])
        .slice(0, 3)
        .map(id => offerMap.get(id))
        .filter(Boolean) as RecommendationOffer[];
    }
  }

  // Failsafe: never return empty — if model produced nothing, give a nudge
  if (!textContent && offersToShow.length === 0) {
    textContent = "Je suis là pour vous aider 😊 Dites-moi dans quelle ville vous cherchez, ou quel type de commerce vous intéresse ?";
  }

  // Yield text character by character for streaming feel
  if (textContent) {
    for (const char of textContent) {
      yield char;
    }
  }

  // Yield structured offers as a sentinel at the end
  if (offersToShow.length > 0) {
    yield "\n__OFFERS__" + JSON.stringify(offersToShow) + "__END__";
  }
}
