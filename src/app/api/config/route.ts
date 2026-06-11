import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

async function getConfig() {
  return prisma.platformConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      activeCategories?: string[];
      theme?: string;
      fontStyle?: string;
    };

    const config = await prisma.platformConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        activeCategories: JSON.stringify(body.activeCategories ?? ["restaurant", "shop", "artisan", "beauty", "hotel"]),
        theme: body.theme ?? "orange",
        fontStyle: body.fontStyle ?? "modern",
      },
      update: {
        ...(body.activeCategories && { activeCategories: JSON.stringify(body.activeCategories) }),
        ...(body.theme && { theme: body.theme }),
        ...(body.fontStyle && { fontStyle: body.fontStyle }),
      },
    });

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
