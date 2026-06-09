import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getConsumerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json() as {
    currentPassword: string;
    newPassword: string;
  };

  const consumer = await prisma.consumer.findUnique({
    where: { id: session.user.consumerId },
    select: { password: true },
  });
  if (!consumer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // OAuth-only accounts have no password
  if (consumer.password) {
    const valid = await bcrypt.compare(currentPassword, consumer.password);
    if (!valid) return NextResponse.json({ error: "wrongPassword" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.consumer.update({
    where: { id: session.user.consumerId },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
