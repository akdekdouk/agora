import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchWithClaude, SearchContext } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { query: string };
    const { query } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const [merchants, offers, products] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          businessName: true,
          category: true,
          city: true,
          description: true,
        },
      }),
      prisma.offer.findMany({
        include: {
          merchant: {
            select: { businessName: true, city: true },
          },
        },
      }),
      prisma.product.findMany({
        include: {
          merchant: {
            select: { businessName: true, city: true },
          },
        },
      }),
    ]);

    const context: SearchContext = {
      merchants,
      offers: offers.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        discount: o.discount,
        validFrom: o.validFrom.toISOString(),
        validTo: o.validTo.toISOString(),
        merchantId: o.merchantId,
        merchantName: o.merchant.businessName,
        merchantCity: o.merchant.city,
        photo: o.photo,
        bannerKey: o.bannerKey,
      })),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        originalPrice: p.originalPrice,
        discountedPrice: p.discountedPrice,
        merchantId: p.merchantId,
        merchantName: p.merchant.businessName,
        merchantCity: p.merchant.city,
        images: p.images,
      })),
    };

    const results = await searchWithClaude(query, context);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
