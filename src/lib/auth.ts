import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { User } from "@/types";
import { createAndSendVerificationEmail } from "@/lib/email-verification";

const DEFAULT_AVATAR = (seed: string) =>
  `https://i.pravatar.cc/160?u=${encodeURIComponent(seed)}`;

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Email + password (existing demo accounts) ────────────────────────
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        if (user.isDisabled) {
          throw new Error("This account has been disabled by the administrator.");
        }

        if (!user.emailVerified) {
          await createAndSendVerificationEmail(user);
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name,
          role: user.role,
          avatar: user.avatar ?? DEFAULT_AVATAR(user.email ?? user.id),
          phone: user.phone ?? undefined,
        } as any;
      },
    }),

  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.name = user.name ?? "Student";
        token.picture = (user as any).avatar ?? null;
      }

      if (trigger === "update") {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, avatar: true, email: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.picture =
            fresh.avatar ?? DEFAULT_AVATAR(fresh.email ?? (token.id as string));
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar =
          token.picture ?? DEFAULT_AVATAR(String(token.id ?? "user"));
        session.user.name = (token.name as string) ?? "Student";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return session.user as any as User;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user;
}
