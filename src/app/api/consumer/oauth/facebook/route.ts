export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret");

export async function GET() {
  const state = await new SignJWT({ t: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(secret);

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/consumer/oauth/callback/facebook`,
    scope: "email,public_profile",
    state,
  });

  return NextResponse.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
}
