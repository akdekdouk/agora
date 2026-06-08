import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// GET /api/scan?code=xxx — merchant checks a claim code
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const claim = await prisma.claim.findUnique({
    where: { code },
    include: {
      offer: { include: { merchant: { select: { id: true, businessName: true } } } },
      consumer: { select: { name: true, email: true } },
    },
  });

  if (!claim) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  if (claim.offer.merchant.id !== session.user.id) {
    return NextResponse.json({ error: "This offer does not belong to your business" }, { status: 403 });
  }

  return NextResponse.json(claim);
}

// POST /api/scan — merchant validates (marks as used)
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await req.json() as { code: string };
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const claim = await prisma.claim.findUnique({
    where: { code },
    include: { offer: { include: { merchant: true } } },
  });

  if (!claim) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  if (claim.offer.merchant.id !== session.user.id) {
    return NextResponse.json({ error: "This offer does not belong to your business" }, { status: 403 });
  }
  if (claim.status === "used") {
    return NextResponse.json({ error: "This offer has already been used" }, { status: 400 });
  }
  if (new Date(claim.offer.validTo) < new Date()) {
    return NextResponse.json({ error: "This offer has expired" }, { status: 400 });
  }

  const updated = await prisma.claim.update({
    where: { code },
    data: { status: "used", usedAt: new Date() },
  });

  return NextResponse.json(updated);
}
