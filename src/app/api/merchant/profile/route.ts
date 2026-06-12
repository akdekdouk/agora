import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessName, description, category, city, address, phone, logo } = await req.json() as {
    businessName?: string; description?: string; category?: string;
    city?: string; address?: string; phone?: string; logo?: string;
  };

  if (!businessName?.trim() || !category?.trim() || !city?.trim()) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      businessName: businessName.trim(),
      description: description?.trim() || null,
      category: category.trim(),
      city: city.trim(),
      address: address?.trim() || null,
      phone: phone?.trim() || null,
      ...(logo !== undefined && { logo: logo || null }),
    },
    select: { businessName: true, description: true, category: true, city: true, address: true, phone: true, logo: true },
  });

  return NextResponse.json(updated);
}
