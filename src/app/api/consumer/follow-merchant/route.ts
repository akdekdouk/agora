import { NextRequest, NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = (session?.user as { consumerId?: string })?.consumerId;
  if (!consumerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { merchantId } = await req.json();
  if (!merchantId) {
    return NextResponse.json({ error: "merchantId required" }, { status: 400 });
  }

  const existing = await prisma.followedMerchant.findUnique({
    where: { consumerId_merchantId: { consumerId, merchantId } },
  });

  if (existing) {
    await prisma.followedMerchant.delete({ where: { id: existing.id } });
    return NextResponse.json({ followed: false });
  } else {
    await prisma.followedMerchant.create({ data: { consumerId, merchantId } });
    return NextResponse.json({ followed: true });
  }
}
