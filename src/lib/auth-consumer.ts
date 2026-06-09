import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "consumer-token";
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "consumer-fallback-secret-change-me"
);

export async function createConsumerSession(consumerId: string, email: string, name?: string | null) {
  const token = await new SignJWT({ consumerId, email, name: name ?? null, role: "consumer" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
  return token;
}

export async function getConsumerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      user: {
        consumerId: payload.consumerId as string,
        email: payload.email as string,
        name: (payload.name as string | null) ?? null,
        role: "consumer",
      },
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME as CONSUMER_COOKIE_NAME };
