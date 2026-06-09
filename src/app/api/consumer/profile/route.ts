import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConsumerSession } from "@/lib/auth-consumer";

export async function GET() {
  const session = await getConsumerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const consumer = await prisma.consumer.findUnique({
    where: { id: session.user.consumerId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      city: true,
      interests: true,
      emailNotifications: true,
      googleId: true,
      facebookId: true,
    },
  });
  if (!consumer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(consumer);
}

export async function PATCH(req: NextRequest) {
  const session = await getConsumerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name?: string;
    phone?: string;
    city?: string;
    interests?: string[];
    emailNotifications?: boolean;
  };

  const updated = await prisma.consumer.update({
    where: { id: session.user.consumerId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.interests !== undefined && { interests: JSON.stringify(body.interests) }),
      ...(body.emailNotifications !== undefined && { emailNotifications: body.emailNotifications }),
    },
    select: { id: true, name: true, phone: true, city: true, interests: true, emailNotifications: true },
  });

  return NextResponse.json(updated);
}
