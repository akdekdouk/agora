import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const body = await request.json() as { email: string; password?: string; action: "check" | "reset" };
  const { email, action } = body;

  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "No account found with this email." }, { status: 404 });

  if (action === "check") {
    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    if (!body.password || body.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const hashed = await bcrypt.hash(body.password, 10);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
