import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";

function getConsumerId(session: Awaited<ReturnType<typeof getConsumerSession>>): string | null {
  return (session?.user as { consumerId?: string } | undefined)?.consumerId ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = getConsumerId(session);
  if (!consumerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const claimId = req.nextUrl.searchParams.get("claimId");

  if (claimId) {
    const claim = await prisma.claim.findFirst({
      where: { id: claimId, consumerId },
      include: {
        offer: { include: { merchant: { select: { businessName: true, city: true } } } },
      },
    });
    if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(claim);
  }

  const claims = await prisma.claim.findMany({
    where: { consumerId },
    include: {
      offer: { include: { merchant: { select: { businessName: true, city: true } } } },
    },
    orderBy: { claimedAt: "desc" },
  });

  return NextResponse.json(claims);
}
