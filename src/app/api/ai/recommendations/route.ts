import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";
import { getPersonalizedRecommendations, RecommendationOffer } from "@/lib/claude";

export async function GET() {
  const session = await getConsumerSession();
  if (!session?.user?.consumerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const consumerId = session.user.consumerId;

  const now = new Date();
  const [consumer, offers, claims, saved] = await Promise.all([
    prisma.consumer.findUnique({
      where: { id: consumerId },
      select: { interests: true, city: true },
    }),
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
      take: 50,
    }),
    prisma.claim.findMany({ where: { consumerId }, select: { offerId: true } }),
    prisma.savedOffer.findMany({ where: { consumerId }, select: { offerId: true } }),
  ]);

  const interests = JSON.parse(consumer?.interests ?? "[]") as string[];
  const claimedOfferIds = claims.map((c) => c.offerId);
  const savedOfferIds = saved.map((s) => s.offerId);

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

  const recommended = await getPersonalizedRecommendations(mappedOffers, {
    interests,
    city: consumer?.city,
    claimedOfferIds,
    savedOfferIds,
  });

  return NextResponse.json(recommended);
}
