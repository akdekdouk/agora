import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";
import { getServerSession } from "@/lib/auth";
import { chatWithAssistant, ChatMessage, RecommendationOffer } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { messages, locale } = await req.json() as { messages: ChatMessage[]; locale?: string };
  if (!messages?.length) {
    return new Response("messages required", { status: 400 });
  }

  const [consumerSession, merchantSession] = await Promise.all([
    getConsumerSession(),
    getServerSession(),
  ]);

  const consumerId = consumerSession?.user?.consumerId;
  const merchantId = merchantSession?.user?.id;

  const now = new Date();

  // Base active offers (always loaded)
  const offersRaw = await prisma.offer.findMany({
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
  });

  const mappedOffers: RecommendationOffer[] = offersRaw.map((o) => ({
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

  // Consumer profile
  let consumerProfile = null;
  if (consumerId) {
    const consumer = await prisma.consumer.findUnique({
      where: { id: consumerId },
      select: {
        name: true,
        city: true,
        savedOffers: { select: { offerId: true } },
        savedProducts: { select: { productId: true } },
        followedMerchants: { select: { merchantId: true } },
        claims: {
          where: { status: "active" },
          select: { offerId: true },
          take: 10,
        },
      },
    });

    if (consumer) {
      const savedOfferIds = consumer.savedOffers.map(s => s.offerId);
      const activeClaimOfferIds = consumer.claims.map(c => c.offerId);
      const followedMerchantIds = consumer.followedMerchants.map(f => f.merchantId);

      const [savedOffersData, activeClaims, followedMerchants] = await Promise.all([
        savedOfferIds.length > 0
          ? prisma.offer.findMany({
              where: { id: { in: savedOfferIds } },
              select: { id: true, title: true, discount: true, merchant: { select: { businessName: true } } },
            })
          : Promise.resolve([]),
        activeClaimOfferIds.length > 0
          ? prisma.offer.findMany({
              where: { id: { in: activeClaimOfferIds } },
              select: { id: true, title: true, discount: true, validTo: true, merchant: { select: { businessName: true } } },
            })
          : Promise.resolve([]),
        followedMerchantIds.length > 0
          ? prisma.user.findMany({
              where: { id: { in: followedMerchantIds } },
              select: { id: true, businessName: true, category: true, city: true },
            })
          : Promise.resolve([]),
      ]);

      consumerProfile = {
        name: consumer.name,
        city: consumer.city,
        savedOffers: savedOffersData,
        followedMerchants,
        activeClaims: activeClaims.map(o => ({
          title: o.title,
          discount: o.discount,
          validTo: o.validTo.toISOString(),
          merchantName: o.merchant.businessName,
        })),
      };
    }
  }

  // Merchant profile
  let merchantProfile = null;
  if (merchantId) {
    const merchant = await prisma.user.findUnique({
      where: { id: merchantId },
      select: {
        businessName: true,
        category: true,
        city: true,
        _count: { select: { offers: true, products: true } },
        offers: {
          where: { validTo: { gte: now } },
          select: {
            title: true, discount: true, validTo: true,
            _count: { select: { claims: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        products: {
          select: { name: true, originalPrice: true, discountedPrice: true },
          take: 10,
        },
      },
    });

    if (merchant) {
      merchantProfile = {
        businessName: merchant.businessName,
        category: merchant.category,
        city: merchant.city,
        totalOffers: merchant._count.offers,
        totalProducts: merchant._count.products,
        activeOffers: merchant.offers.map(o => ({
          title: o.title,
          discount: o.discount,
          validTo: o.validTo.toISOString(),
          claimsCount: o._count.claims,
        })),
        products: merchant.products,
      };
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chatWithAssistant(messages, {
          offers: mappedOffers,
          locale,
          userType: merchantId ? "merchant" : consumerId ? "consumer" : "guest",
          consumerProfile,
          merchantProfile,
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
