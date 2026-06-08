import { NextResponse } from "next/server";
import { getConsumerSession } from "@/lib/auth-consumer";

export async function GET() {
  const session = await getConsumerSession();
  if (!session) return NextResponse.json(null);
  return NextResponse.json(session);
}
