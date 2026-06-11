import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createConsumerSession, CONSUMER_COOKIE_NAME } from "@/lib/auth-consumer";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret");
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://agora-production-4668.up.railway.app";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) return NextResponse.redirect(`${BASE_URL}/consumer/login?error=oauth`);

  try {
    await jwtVerify(state, secret);
  } catch {
    return NextResponse.redirect(`${BASE_URL}/consumer/login?error=oauth`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${BASE_URL}/api/consumer/oauth/callback/google`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return NextResponse.redirect(`${BASE_URL}/consumer/login?error=oauth`);
  const { access_token } = await tokenRes.json() as { access_token: string };

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return NextResponse.redirect(`${BASE_URL}/consumer/login?error=oauth`);
  const { id: googleId, email, name } = await userRes.json() as { id: string; email: string; name: string };

  let consumer = await prisma.consumer.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (consumer) {
    if (!consumer.googleId) {
      consumer = await prisma.consumer.update({ where: { id: consumer.id }, data: { googleId } });
    }
  } else {
    consumer = await prisma.consumer.create({ data: { email, name, googleId } });
  }

  const token = await createConsumerSession(consumer.id, consumer.email, consumer.name);
  const res = NextResponse.redirect(`${BASE_URL}/consumer/dashboard`);
  res.cookies.set(CONSUMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
