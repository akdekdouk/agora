import NextAuth from "next-auth";
import { consumerAuthOptions } from "@/lib/auth-consumer";

const handler = NextAuth(consumerAuthOptions);

export { handler as GET, handler as POST };
