import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();

  const merchants = await prisma.user.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
      offers: {
        some: { validTo: { gte: now }, deletedAt: null },
      },
    },
    select: {
      id: true,
      businessName: true,
      category: true,
      city: true,
      exactAddress: true,
      lat: true,
      lng: true,
      logo: true,
      offers: {
        where: { validTo: { gte: now }, deletedAt: null },
        select: {
          id: true,
          title: true,
          discount: true,
          photo: true,
          bannerKey: true,
          validTo: true,
        },
        orderBy: { discount: "desc" },
        take: 5,
      },
    },
  });

  return NextResponse.json(merchants);
}
