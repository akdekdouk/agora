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
  en: "English", fr: "French", it: "Italian", ar: "Arabic", tr: "Turkish",
};

export interface ChatContext {
  offers: RecommendationOffer[];
  consumerCity?: string | null;
  locale?: string;
}

export async function* chatWithAssistant(
  messages: ChatMessage[],
  context: ChatContext
): AsyncGenerator<string> {
  const lang = localeNames[context.locale ?? "en"] ?? "English";
  const systemPrompt = `You are Agora's friendly shopping assistant. Help consumers find the best local deals.

CRITICAL LANGUAGE RULE: You MUST respond EXCLUSIVELY in ${lang}. This is non-negotiable. Do not use any other language under any circumstances, even if the user writes in a different language. Every single word of your response must be in ${lang}.

Today's date: ${new Date().toISOString().split("T")[0]}
Consumer's city: ${context.consumerCity ?? "not specified"}

Active offers available:
${JSON.stringify(context.offers.map(o => ({
  id: o.id,
  title: o.title,
  discount: o.discount,
  merchant: o.merchantName,
  category: o.merchantCategory,
  city: o.merchantCity,
  validTo: o.validTo,
})), null, 2)}

Rules:
- Answer in the same language as the user's message
- Be concise, friendly and helpful
- When recommending offers, mention the merchant name, discount %, and city
- If you recommend an offer, format it as: **[Title]** (-X%) at *MerchantName* in City
- If no matching offers exist, say so honestly and suggest browsing other categories`;

  const stream = getAnthropic().messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
