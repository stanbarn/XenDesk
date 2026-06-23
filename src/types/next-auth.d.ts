import type { Role } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

// Augment Auth.js types so `session.user.id` and `session.user.role` are
// strongly typed throughout the app.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// JWT lives in @auth/core/jwt; next-auth/jwt only re-exports it, so the
// augmentation must target the source module to merge correctly.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
