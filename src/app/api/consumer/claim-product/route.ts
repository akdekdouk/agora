import { NextRequest, NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";
import { prisma } from "@/lib/prisma";

function getConsumerId(session: Awaited<ReturnType<typeof getConsumerSession>>): string | null {
  return (session?.user as { consumerId?: string } | undefined)?.consumerId ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = getConsumerId(session);
  if (!consumerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json() as { productId?: string };
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const existing = await prisma.productClaim.findUnique({
    where: { consumerId_productId: { consumerId, productId } },
  });
  if (existing) return NextResponse.json({ error: "alreadyClaimed" }, { status: 409 });

  const claim = await prisma.productClaim.create({
    data: { consumerId, productId },
  });
  return NextResponse.json({ id: claim.id, code: claim.code });
}
