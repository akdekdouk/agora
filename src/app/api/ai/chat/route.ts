import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";
import { chatWithAssistant, ChatMessage, RecommendationOffer } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: ChatMessage[] };
  if (!messages?.length) {
    return new Response("messages required", { status: 400 });
  }

  const session = await getConsumerSession();
  const consumerId = session?.user?.consumerId;

  const now = new Date();
  const [offers, consumer] = await Promise.all([
    prisma.offer.findMany({
      where: { validTo: { gte: now } },
      select: {
        id: true, title: true, description: true, photo: true,
        discount: true, maxClaims: true, validFrom: true, validTo: true,
        merchantId: true,
        merchant: { select: { businessName: true, category: true, city: true } },
        _count: { select: { claims: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    consumerId
      ? prisma.consumer.findUnique({
          where: { id: consumerId },
          select: { city: true },
        })
      : Promise.resolve(null),
  ]);

  const mappedOffers: RecommendationOffer[] = offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    photo: o.photo,
    discount: o.discount,
    maxClaims: o.maxClaims,
    claimsCount: o._count.claims,
    validFrom: o.validFrom.toISOString(),
    validTo: o.validTo.toISOString(),
    merchantId: o.merchantId,
    merchantName: o.merchant.businessName,
    merchantCategory: o.merchant.category,
    merchantCity: o.merchant.city,
  }));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chatWithAssistant(messages, {
          offers: mappedOffers,
          consumerCity: consumer?.city,
        })) {
          controller.enqueue(new TextEncoder().encode(chunk));
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
