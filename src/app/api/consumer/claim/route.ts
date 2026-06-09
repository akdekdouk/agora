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

  const { offerId } = await req.json() as { offerId: string };
  if (!offerId) return NextResponse.json({ error: "offerId required" }, { status: 400 });

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { _count: { select: { claims: true } } },
  });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (new Date(offer.validTo) < new Date()) {
    return NextResponse.json({ error: "Offer has expired" }, { status: 400 });
  }
  if (offer.maxClaims !== null && offer._count.claims >= offer.maxClaims) {
    return NextResponse.json({ error: "soldOut" }, { status: 409 });
  }

  const existing = await prisma.claim.findUnique({
    where: { consumerId_offerId: { consumerId, offerId } },
  });
  if (existing) return NextResponse.json(existing);

  const claim = await prisma.claim.create({ data: { consumerId, offerId } });
  return NextResponse.json(claim, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = getConsumerId(session);
  if (!consumerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offerId = req.nextUrl.searchParams.get("offerId");
  if (!offerId) return NextResponse.json({ error: "offerId required" }, { status: 400 });

  const claim = await prisma.claim.findUnique({
    where: { consumerId_offerId: { consumerId, offerId } },
  });
  return NextResponse.json(claim ?? null);
}
