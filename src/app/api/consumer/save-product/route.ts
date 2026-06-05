import { NextRequest, NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = (session?.user as { consumerId?: string })?.consumerId;
  if (!consumerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const existing = await prisma.savedProduct.findUnique({
    where: { consumerId_productId: { consumerId, productId } },
  });

  if (existing) {
    await prisma.savedProduct.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  } else {
    await prisma.savedProduct.create({ data: { consumerId, productId } });
    return NextResponse.json({ saved: true });
  }
}
