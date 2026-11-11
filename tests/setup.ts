/**
 * tests/setup.ts — the single vitest setup file (vitest.config.ts setupFiles).
 *
 * Registers @testing-library/jest-dom matchers on the expect object so
 * component tests can assert `toBeInTheDocument()` and friends. Everything
 * else (globals like `describe`/`it`/`expect`) comes from vitest's
 * `globals: true` setting.
 */
import "@testing-library/jest-dom/vitest";
