import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createConsumerSession, CONSUMER_COOKIE_NAME } from "@/lib/auth-consumer";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret");

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) return NextResponse.redirect(new URL("/consumer/login?error=oauth", req.url));

  try {
    await jwtVerify(state, secret);
  } catch {
    return NextResponse.redirect(new URL("/consumer/login?error=oauth", req.url));
  }

  // Exchange code for access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/consumer/oauth/callback/facebook`,
      code,
    })}`
  );
  if (!tokenRes.ok) return NextResponse.redirect(new URL("/consumer/login?error=oauth", req.url));
  const { access_token } = await tokenRes.json() as { access_token: string };

  // Get user info
  const userRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
  );
  if (!userRes.ok) return NextResponse.redirect(new URL("/consumer/login?error=oauth", req.url));
  const { id: facebookId, email, name } = await userRes.json() as { id: string; email?: string; name: string };

  if (!email) return NextResponse.redirect(new URL("/consumer/login?error=no_email", req.url));

  // Find or create consumer
  let consumer = await prisma.consumer.findFirst({
    where: { OR: [{ facebookId }, { email }] },
  });

  if (consumer) {
    if (!consumer.facebookId) {
      consumer = await prisma.consumer.update({ where: { id: consumer.id }, data: { facebookId } });
    }
  } else {
    consumer = await prisma.consumer.create({ data: { email, name, facebookId } });
  }

  const token = await createConsumerSession(consumer.id, consumer.email);
  const res = NextResponse.redirect(new URL("/consumer/dashboard", req.url));
  res.cookies.set(CONSUMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
