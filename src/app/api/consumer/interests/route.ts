import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";

export async function PUT(request: NextRequest) {
  const session = await getConsumerSession();
  if (!session?.user?.consumerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { interests: string[] };
  const interests = (body.interests ?? []).slice(0, 10); // max 10

  await prisma.consumer.update({
    where: { id: session.user.consumerId },
    data: { interests: JSON.stringify(interests) },
  });

  return NextResponse.json({ interests });
}
