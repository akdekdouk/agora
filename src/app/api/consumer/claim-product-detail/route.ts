import { NextRequest, NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";
import { prisma } from "@/lib/prisma";

function getConsumerId(session: Awaited<ReturnType<typeof getConsumerSession>>): string | null {
  return (session?.user as { consumerId?: string } | undefined)?.consumerId ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = getConsumerId(session);
  if (!consumerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const claimId = req.nextUrl.searchParams.get("claimId");
  if (!claimId) return NextResponse.json({ error: "claimId required" }, { status: 400 });

  const claim = await prisma.productClaim.findFirst({
    where: { id: claimId, consumerId },
    include: {
      product: {
        include: { merchant: { select: { businessName: true, city: true } } },
      },
    },
  });
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(claim);
}
