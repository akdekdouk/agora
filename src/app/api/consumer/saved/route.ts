import { NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getConsumerSession();
  const consumerId = (session?.user as { consumerId?: string })?.consumerId;
  if (!consumerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [savedOffers, savedProducts, followedMerchants, productClaims] = await Promise.all([
    prisma.savedOffer.findMany({ where: { consumerId } }),
    prisma.savedProduct.findMany({ where: { consumerId } }),
    prisma.followedMerchant.findMany({ where: { consumerId } }),
    prisma.productClaim.findMany({ where: { consumerId }, select: { productId: true } }),
  ]);

  const offerIds = savedOffers.map((s) => s.offerId);
  const productIds = savedProducts.map((s) => s.productId);
  const merchantIds = followedMerchants.map((s) => s.merchantId);
  const claimedProductIds = productClaims.map((c) => c.productId);

  const [offers, products, merchants] = await Promise.all([
    offerIds.length > 0
      ? prisma.offer.findMany({
          where: { id: { in: offerIds }, deletedAt: null },
          include: { merchant: { select: { businessName: true, city: true } } },
        })
      : [],
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { merchant: { select: { businessName: true, city: true } } },
        })
      : [],
    merchantIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: merchantIds } },
          select: { id: true, businessName: true, city: true, category: true, logo: true },
        })
      : [],
  ]);

  return NextResponse.json({ offers, products, merchants, claimedProductIds });
}
