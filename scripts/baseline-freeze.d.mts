/**
 * baseline-freeze.d.mts — TypeScript surface for scripts/baseline-freeze.mjs
 * (the Phase 2 item 14 baseline tool), so tests/phase2-baseline.test.ts
 * type-checks under `tsc --noEmit` without turning `allowJs` on. The runtime
 * implementation is the .mjs file; this declaration mirrors its exports.
 */
export interface FrozenFile {
  sha256: string;
  tests: number;
}

export interface BaselineManifest {
  version: number;
  frozenAs: string;
  frozenAt: string;
  suite: { files: number; tests: number };
  environment: Record<string, string>;
  gate: string;
  files: Record<string, FrozenFile>;
}

export interface VerifyReport {
  ok: boolean;
  error?: string;
  missing: string[];
  changed: string[];
  added: string[];
  manifest?: BaselineManifest;
}

export const MANIFEST_REL: string;

export const SELF_EXCLUDED: readonly string[];

export function discoverTestFiles(from?: string): string[];

export function sha256File(rel: string, from?: string): string;

export function verifyBaseline(from?: string): VerifyReport;
