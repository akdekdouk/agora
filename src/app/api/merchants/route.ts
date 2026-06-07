import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const merchants = await prisma.user.findMany({
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
        _count: {
          select: {
            offers: true,
            products: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(merchants);
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      email: string;
      password: string;
      businessName: string;
      description?: string;
      category: string;
      city: string;
      address?: string;
      phone?: string;
    };

    const { email, password, businessName, description, category, city, address, phone } = body;

    if (!email || !password || !businessName || !category || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        businessName,
        description,
        category,
        city,
        address,
        phone,
      },
      select: {
        id: true,
        email: true,
        businessName: true,
        category: true,
        city: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating merchant:", error);
    return NextResponse.json(
      { error: "Failed to create merchant" },
      { status: 500 }
    );
  }
}
