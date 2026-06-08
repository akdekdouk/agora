import { NextResponse } from "next/server";
import { CONSUMER_COOKIE_NAME } from "@/lib/auth-consumer";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CONSUMER_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
