import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const merchant = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        businessName: true,
        description: true,
        category: true,
        city: true,
        address: true,
        phone: true,
        logo: true,
        createdAt: true,
        offers: {
          orderBy: { createdAt: "desc" },
        },
        products: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || session.user.id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      businessName?: string;
      description?: string;
      category?: string;
      city?: string;
      address?: string;
      phone?: string;
      logo?: string;
    };

    const merchant = await prisma.user.update({
      where: { id: params.id },
      data: body,
      select: {
        id: true,
        email: true,
        businessName: true,
        description: true,
        category: true,
        city: true,
        address: true,
        phone: true,
        logo: true,
      },
    });

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("Error updating merchant:", error);
    return NextResponse.json(
      { error: "Failed to update merchant" },
      { status: 500 }
    );
  }
}
