import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const products = await prisma.product.findMany({
    where: { merchantId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}
