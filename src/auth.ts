import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials provider requires JWT sessions (no DB session rows).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate shape before touching the database.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // Returned object is persisted into the JWT (see callbacks below).
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
        };
      },
    }),
  ],
  callbacks: {
    // Persist id + role onto the token at sign-in.
    jwt({ token, user }) {
      if (user) {
        // `user` is only present at sign-in and always carries id/role from
        // our authorize() return (id is optional in Auth.js's base type).
        token.id = user.id!;
        token.role = user.role;
        token.company = user.company;
      }
      return token;
    },
    // Expose id + role + company on the session consumed by the app.
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.company = token.company;
      return session;
    },
  },
});
