import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { User } from "@/types";

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

    // ── Mobile number + OTP (PW-style) ───────────────────────────────────
    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone?.trim();
        const otp = credentials?.otp?.trim();
        const name = credentials?.name?.trim();
        if (!phone || !otp) throw new Error("Phone and OTP are required");

        const record = await prisma.otp.findFirst({
          where: { phone, code: otp, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!record) throw new Error("Invalid or expired OTP");

        // Consume all OTPs for this number once verified.
        await prisma.otp.deleteMany({ where: { phone } });

        // Find-or-create the user keyed by phone number.
        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              name: name && name.length > 0 ? name : "Student",
              avatar: DEFAULT_AVATAR(phone),
              role: "student",
            },
          });

          // Auto-enroll new users in default courses for demo purposes
          const defaultSlugs = ["data-structures-using-cpp", "database-management-systems", "operating-systems"];
          const coursesToEnroll = await prisma.course.findMany({
            where: { slug: { in: defaultSlugs } },
          });

          if (coursesToEnroll.length > 0) {
            await prisma.enrollment.createMany({
              data: coursesToEnroll.map((c) => ({
                userId: user!.id,
                courseId: c.id,
                progress: 0,
              })),
            });
          }
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name,
          role: user.role,
          avatar: user.avatar ?? DEFAULT_AVATAR(phone),
          phone: user.phone ?? phone,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.name = user.name ?? "Student";
        token.picture = (user as any).avatar ?? null;
        (token as any).phone = (user as any).phone ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar =
          token.picture ?? DEFAULT_AVATAR(String(token.id ?? "user"));
        (session.user as any).phone = (token as any).phone ?? undefined;
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
