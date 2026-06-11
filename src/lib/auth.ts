import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession as nextAuthGetServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user?.password) return null;
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;
        return { id: user.id, email: user.email, name: user.businessName };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        if (!user.email) return false;
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email,
              businessName: user.name ?? user.email.split("@")[0],
              category: "shop",
              city: "",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) token.id = user.id;
      if (account?.provider === "google" || account?.provider === "facebook") {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email! } });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export async function getServerSession() {
  return nextAuthGetServerSession(authOptions);
}
