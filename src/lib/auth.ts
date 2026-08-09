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
    // Keep the JWT small. Storing large values (e.g. base64 avatars) in the
    // token bloats the session cookie and causes 494 REQUEST_HEADER_TOO_LARGE.
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.name = (user as any).name ?? "Student";
        token.email = (user as any).email ?? undefined;
      }
      delete (token as any).picture;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.name = (token.name as string) ?? "Student";
        session.user.email = (token.email as string) ?? session.user.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: (session.user as any).id as string },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      plan: true,
    },
  });

  if (!dbUser) {
    return null;
  }

  return {
    id: dbUser.id,
    name: dbUser.name ?? "Student",
    email: dbUser.email ?? undefined,
    phone: dbUser.phone ?? undefined,
    avatar: dbUser.avatar ?? DEFAULT_AVATAR(dbUser.email ?? dbUser.id),
    role: dbUser.role,
    plan: dbUser.plan,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user;
}
