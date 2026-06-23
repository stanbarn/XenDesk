import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integration tests run against a dedicated test database. CI sets
// TEST_DATABASE_URL; locally we default to the xendesk_test database in the
// dev Postgres container (see README).
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://xendesk:xendesk_dev_pw@localhost:5433/xendesk_test?schema=public";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Populated into process.env before any module (incl. the Prisma client
    // singleton) is imported.
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      AUTH_SECRET: "test-secret",
    },
    // Tests share one database; run files serially to avoid write races.
    fileParallelism: false,
  },
});
