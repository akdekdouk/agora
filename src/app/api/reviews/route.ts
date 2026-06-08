import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";

function getConsumerId(session: Awaited<ReturnType<typeof getConsumerSession>>): string | null {
  return (session?.user as { consumerId?: string } | undefined)?.consumerId ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = getConsumerId(session);
  if (!consumerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { merchantId, rating, comment } = await req.json() as {
    merchantId: string; rating: number; comment?: string;
  };
  if (!merchantId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: { consumerId_merchantId: { consumerId, merchantId } },
    update: { rating, comment },
    create: { consumerId, merchantId, rating, comment },
  });

  return NextResponse.json(review, { status: 201 });
}

export async function GET(req: NextRequest) {
  const merchantId = req.nextUrl.searchParams.get("merchantId");
  if (!merchantId) return NextResponse.json({ error: "merchantId required" }, { status: 400 });

  const reviews = await prisma.review.findMany({
    where: { merchantId },
    include: { consumer: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  return NextResponse.json({ reviews, average: avg, count: reviews.length });
}
