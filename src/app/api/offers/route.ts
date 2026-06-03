import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        validTo: { gte: now },
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            category: true,
            city: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      title: string;
      description: string;
      photo?: string;
      discount: number;
      validFrom: string;
      validTo: string;
    };

    const { title, description, photo, discount, validFrom, validTo } = body;

    if (!title || !description || !discount || !validFrom || !validTo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        photo,
        discount,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        merchantId: session.user.id,
      },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing offer id" }, { status: 400 });
    }

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer || offer.merchantId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    );
  }
}
