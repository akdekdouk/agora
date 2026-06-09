import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOfferDescription } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, discount } = await req.json() as { title: string; discount: number };
  if (!title || !discount) {
    return NextResponse.json({ error: "title and discount required" }, { status: 400 });
  }

  const merchant = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { businessName: true, category: true },
  });
  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const description = await generateOfferDescription(
    title,
    discount,
    merchant.category,
    merchant.businessName
  );

  return NextResponse.json({ description });
}
