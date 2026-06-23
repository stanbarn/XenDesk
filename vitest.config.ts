import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

loadEnv(); // make .env values (DATABASE_URL) visible to this config

/**
 * Integration tests run against a dedicated test database, resolved in order:
 *   1. TEST_DATABASE_URL (CI sets this explicitly), else
 *   2. the dev DATABASE_URL with its database name suffixed "_test", else
 *   3. a local default.
 * Deriving from .env keeps real credentials out of this committed file.
 */
function resolveTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (base) {
    try {
      const url = new URL(base);
      url.pathname = url.pathname.replace(/\/([^/]+)$/, "/$1_test");
      return url.toString();
    } catch {
      /* fall through */
    }
  }
  return "postgresql://postgres:postgres@localhost:5432/xendesk_test?schema=public";
}

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Populated into process.env before any module (incl. the Prisma client
    // singleton) is imported.
    env: {
      DATABASE_URL: resolveTestDatabaseUrl(),
      AUTH_SECRET: "test-secret",
    },
    // Tests share one database; run files serially to avoid write races.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scope coverage to the testable backend (API + service + validation +
      // auth logic). The UI, Auth.js glue, seed, and generated client are
      // verified by running the app, not by unit tests.
      include: [
        "src/app/api/**/route.ts",
        "src/lib/services/**",
        "src/lib/validation/**",
        "src/lib/api/http.ts",
        "src/lib/auth/rbac.ts",
        "src/lib/auth/password.ts",
        "src/lib/errors.ts",
      ],
    },
  },
});
