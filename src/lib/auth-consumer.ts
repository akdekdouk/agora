import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession as nextAuthGetServerSession } from "next-auth";

export const consumerAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "consumer-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const consumer = await prisma.consumer.findUnique({
          where: { email: credentials.email },
        });

        if (!consumer) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          consumer.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: consumer.id,
          email: consumer.email,
          name: consumer.name ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.consumerId = user.id;
        token.role = "consumer";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { consumerId?: string; role?: string } & typeof session.user).consumerId = token.consumerId as string;
        (session.user as { consumerId?: string; role?: string } & typeof session.user).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/consumer/login",
  },
};

export async function getConsumerSession() {
  return nextAuthGetServerSession(consumerAuthOptions);
}
