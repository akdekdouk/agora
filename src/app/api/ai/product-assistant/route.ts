import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const localeNames: Record<string, string> = {
  en: "English", fr: "French", it: "Italian", ar: "Arabic", tr: "Turkish", es: "Spanish",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProductFields {
  name?: string;
  description?: string;
  category?: string;
  originalPrice?: number;
  discountedPrice?: number;
  imageUrl?: string;
}

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

const SYSTEM_PROMPT = (lang: string, merchantName: string) => `You are a friendly product creation assistant for Agora, a local commerce platform.
You are helping ${merchantName} add a new product to their store through a natural conversation.

CRITICAL LANGUAGE RULE: You MUST respond EXCLUSIVELY in ${lang}.

Your goal is to collect the following product information through friendly conversation:
1. Product name (required)
2. Description (required) - help write a compelling one if needed
3. Category (optional) - e.g. Clothing, Electronics, Food, Home, Beauty, etc.
4. Original price in € (required)
5. Discounted/sale price in € (required)
6. Product photo URL (required) - a product without a photo cannot be published on Agora; explain this kindly and insist that a good photo is essential to attract customers

Be conversational, helpful, and encouraging. Ask one or two questions at a time.
If the merchant seems stuck, offer suggestions or help write descriptions.
Once you have ALL required fields including the photo URL, confirm with the merchant and encourage them to publish.

After EVERY response, append a JSON block on a new line with this EXACT format (no markdown code fences):
FIELDS_JSON:{"name":"...","description":"...","category":"...","originalPrice":0,"discountedPrice":0,"imageUrl":"..."}

Rules for FIELDS_JSON:
- Include only fields that have been confirmed/provided — omit fields not yet collected
- Use null for optional fields that are explicitly not provided
- originalPrice and discountedPrice must be numbers (not strings)
- imageUrl should be a valid URL string or omitted if not provided
- The JSON must be valid and on a single line after "FIELDS_JSON:"`;

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, locale, merchantName } = await req.json() as {
    messages: Message[];
    locale?: string;
    merchantName?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const lang = localeNames[locale ?? "en"] ?? "English";
  const name = merchantName ?? "the merchant";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = getAnthropic().messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          system: SYSTEM_PROMPT(lang, name),
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function PUT(req: NextRequest) {
  // Extract structured fields from conversation history
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fullText } = await req.json() as { fullText: string };
  const match = fullText.match(/FIELDS_JSON:(\{[^\n]+\})/);
  if (!match) return NextResponse.json({});

  try {
    const fields = JSON.parse(match[1]) as ProductFields;
    return NextResponse.json(fields);
  } catch {
    return NextResponse.json({});
  }
}
