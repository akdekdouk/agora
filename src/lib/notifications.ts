import { prisma } from "@/lib/prisma";

interface CreateNotifParams {
  merchantId: string;
  type: "NEW_OFFER" | "EXPIRING_SOON" | "STOCK_LOW";
  title: string;
  body: string;
  link?: string;
}

export async function notifyFollowers({ merchantId, type, title, body, link }: CreateNotifParams) {
  const followers = await prisma.followedMerchant.findMany({
    where: { merchantId },
    select: { consumerId: true },
  });

  if (followers.length === 0) return;

  await prisma.notification.createMany({
    data: followers.map((f) => ({
      consumerId: f.consumerId,
      type,
      title,
      body,
      link: link ?? null,
    })),
  });
}
