import { NextRequest, NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";
import { prisma } from "@/lib/prisma";

function getConsumerId(session: Awaited<ReturnType<typeof getConsumerSession>>): string | null {
  return (session?.user as { consumerId?: string } | undefined)?.consumerId ?? null;
}

// GET — list notifications (latest 30)
export async function GET() {
  const session = await getConsumerSession();
  const consumerId = getConsumerId(session);
  if (!consumerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { consumerId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { consumerId, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH — mark notifications as read
export async function PATCH(req: NextRequest) {
  const session = await getConsumerSession();
  const consumerId = getConsumerId(session);
  if (!consumerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id?: string };

  if (id) {
    await prisma.notification.updateMany({
      where: { id, consumerId },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { consumerId, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}
