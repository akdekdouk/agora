import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const merchantId = session.user.id;
  const now = new Date();

  // Build 12-month buckets
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("fr-FR", { month: "short", year: "2-digit" }) });
  }

  const [merchantOffers, merchantProducts] = await Promise.all([
    prisma.offer.findMany({ where: { merchantId }, select: { id: true, title: true, discount: true, category: true, validTo: true, deletedAt: true } }),
    prisma.product.findMany({ where: { merchantId }, select: { id: true, name: true, category: true } }),
  ]);
  const offerIds = merchantOffers.map((o) => o.id);
  const productIds = merchantProducts.map((p) => p.id);

  const [
    allClaims,
    savedOffers,
    savedProducts,
    productClaims,
    reviews,
    followers,
  ] = await Promise.all([
    prisma.claim.findMany({
      where: { offer: { merchantId } },
      select: { offerId: true, status: true, claimedAt: true },
    }),
    offerIds.length > 0 ? prisma.savedOffer.findMany({ where: { offerId: { in: offerIds } }, select: { offerId: true, savedAt: true } }) : [],
    productIds.length > 0 ? prisma.savedProduct.findMany({ where: { productId: { in: productIds } }, select: { productId: true, savedAt: true } }) : [],
    productIds.length > 0 ? prisma.productClaim.findMany({ where: { productId: { in: productIds } }, select: { productId: true, claimedAt: true } }) : [],
    prisma.review.findMany({
      where: { merchantId },
      select: { rating: true, createdAt: true },
    }),
    prisma.followedMerchant.count({ where: { merchantId } }),
  ]);

  // KPIs
  const totalClaims = allClaims.length;
  const usedClaims = allClaims.filter((c) => c.status === "used").length;
  const totalSavedOffers = savedOffers.length;
  const totalSavedProducts = savedProducts.length;
  const totalProductClaims = productClaims.length;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  // Claims per month (last 12)
  const claimsByMonth = months.map(({ year, month, label }) => ({
    label,
    claims: allClaims.filter((c) => {
      const d = new Date(c.claimedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length,
    productClaims: productClaims.filter((c) => {
      const d = new Date(c.claimedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length,
  }));

  const offers = merchantOffers;
  const products = merchantProducts;

  // Top offers by claims
  const offerClaimCounts = offers.map((o) => ({
    id: o.id,
    title: o.title,
    discount: o.discount,
    category: o.category,
    active: !o.deletedAt && new Date(o.validTo) >= now,
    claims: allClaims.filter((c) => c.offerId === o.id).length,
    saves: savedOffers.filter((s) => s.offerId === o.id).length,
  })).sort((a, b) => b.claims - a.claims).slice(0, 5);

  // Top products by reservations
  const productClaimCounts = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    claims: productClaims.filter((c) => c.productId === p.id).length,
    saves: savedProducts.filter((s) => s.productId === p.id).length,
  })).sort((a, b) => b.claims - a.claims).slice(0, 5);

  return NextResponse.json({
    kpis: { totalClaims, usedClaims, totalSavedOffers, totalSavedProducts, totalProductClaims, avgRating, followers },
    claimsByMonth,
    topOffers: offerClaimCounts,
    topProducts: productClaimCounts,
  });
}
