import { NextRequest, NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = (session?.user as { consumerId?: string })?.consumerId;
  if (!consumerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId } = await req.json();
  if (!offerId) {
    return NextResponse.json({ error: "offerId required" }, { status: 400 });
  }

  const existing = await prisma.savedOffer.findUnique({
    where: { consumerId_offerId: { consumerId, offerId } },
  });

  if (existing) {
    await prisma.savedOffer.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  } else {
    await prisma.savedOffer.create({ data: { consumerId, offerId } });
    return NextResponse.json({ saved: true });
  }
}
