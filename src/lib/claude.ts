import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

  const message = await anthropic.messages.create({
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
