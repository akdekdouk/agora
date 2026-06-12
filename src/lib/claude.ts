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

  const systemPrompt = `You are Agora's friendly assistant. You help users find local deals and answer questions about the platform.

CRITICAL LANGUAGE RULE: You MUST respond EXCLUSIVELY in ${lang}. Every single word must be in ${lang}, regardless of what language the user writes in.

Today's date: ${today}
${profileSection}
${userTypeInstructions}

Active offers on the platform (use these IDs with show_offers tool):
${JSON.stringify(context.offers.map(o => ({
  id: o.id,
  title: o.title,
  discount: o.discount,
  merchant: o.merchantName,
  category: o.merchantCategory,
  city: o.merchantCity,
  validTo: o.validTo,
})), null, 2)}

--- PLATFORM KNOWLEDGE ---
Agora is a free local commerce platform built by Lumeria.
Contact / support: akdekdouk@gmail.com | +39 351 154 9779

How it works:
- Merchants register for free, publish offers and products on their profile
- Consumers browse, save offers/products, and claim offers to get a QR code
- Merchants scan the QR code in-store to validate and apply the discount
- Consumers can follow merchants and get email notifications for new offers

Common how-to:
- Claim an offer: click "Claim this offer" on any offer page, then show the QR code in store
- Save an offer: click the bookmark button (requires free consumer account)
- Change language: use the language selector in the top navigation bar
- Merchant registration: click "Merchant access" at the bottom of the page
- Merchant dashboard: log in as merchant to manage offers, products, and scan QR codes
- Technical problems or feedback: akdekdouk@gmail.com or +39 351 154 9779
---

Rules:
- Be concise, warm and engaging — like a great salesperson, not a robot
- COMMERCIAL REFLEX: When a user expresses any desire for offers/deals (even vague like "je voudrais des offres"), IMMEDIATELY call show_offers with the 3 best available offers, AND in your text message add ONE short follow-up question to refine (e.g. "Vous êtes dans quelle ville ?" or "Vous préférez quel type ?"). Never answer a vague request with ONLY a question — always show results first.
- CRITICAL: When calling show_offers, NEVER also describe the offers in plain text. The cards already show the details.
- Only skip show_offers if the conversation is purely about platform support/how-to unrelated to offers
- If no offers at all exist, say so honestly and suggest creating an account
- For support questions, use the platform knowledge above`;

  const offerMap = new Map(context.offers.map(o => [o.id, o]));

  // Force tool use for any offer-related intent (including vague requests)
  const lastUserMsg = messages[messages.length - 1]?.content?.toString().toLowerCase() ?? "";
  const isOfferQuery = context.offers.length > 0 &&
    /offr|deal|promo|réduction|reduction|discount|restaurant|shop|boutique|artisan|beauté|beauty|sport|hotel|services|bon plan|meilleur|trouv|cherch|recommand|suggest|montre|présent|quoi|available|dispo|voudrais|voudrait|aimerai|cherche|besoin|envie|montrez|montre/i.test(lastUserMsg);

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

  // Force tool use when user is asking about offers
  const response = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
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

  // Yield text character by character for streaming feel
  if (textContent) {
    for (const char of textContent) {
      yield char;
    }
  }

  // Yield structured offers as a sentinel at the end
  if (offersToShow.length > 0) {
    yield `\n__OFFERS__${JSON.stringify(offersToShow)}__END__`;
  }
}
