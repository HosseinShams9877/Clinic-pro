/**
 * tests/setup.ts — the single vitest setup file (vitest.config.ts setupFiles).
 *
 * Registers @testing-library/jest-dom matchers on the expect object so
 * component tests can assert `toBeInTheDocument()` and friends. Everything
 * else (globals like `describe`/`it`/`expect`) comes from vitest's
 * `globals: true` setting.
 *
 * Database (loan feature, 2026-11-18): set BEFORE any module imports, so
 * the Prisma singleton (which reads DATABASE_URL at construction) resolves
 * to the throwaway test database (prisma/test.db) rather than the dev
 * database. Tests that persist truncate their tables; the file is gitignored
 * alongside the dev db. This only runs under vitest, never in the app.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./test.db";

import "@testing-library/jest-dom/vitest";
