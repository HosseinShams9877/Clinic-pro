# REFERENCE_PRESERVATION_REPORT — proof the source of truth is untouched

> Phase 0 deliverable · Reports layer · Master spec: *"do not modify, delete, rename, overwrite, or
> move any original reference file."* This report is the verification, not the promise.

---

## 1. What was protected

`D:\New folder\Clinic-pro\پلتفرم\` — the complete reference project.

| Metric | Value |
|---|---|
| Files | **114** |
| Directories | 10 |
| Modified after Phase 0 began (2026-11-09) | **0** |
| Files matched against the session-start snapshot | all 114 timestamps identical to directory creation |

Every reference file carries its original mtime (`2026-11-09 09:29`, the working-copy creation time);
**no file shows a later mtime**, which is what a modification, rename, or overwrite would produce.

## 2. Method used in Phase 0

- All inspection was **read-only**: `Read`, `Grep`, `Glob`, non-mutating `ls`/`grep`/`wc` probes.
- No command was run with write intent against the reference tree (`>` redirection, `sed -i`,
  `-touch`, `mv`, `rm`, `cp` into the tree — none used).
- All Phase 0 output went to `D:\New folder\Clinic-pro\docs\` (30 files) and this session's planned
  root file — **outside** the reference tree.
- No packages were installed, no build tool executed, no framework or formatter ever had the chance to
  rewrite a file.

## 3. Structural integrity

- Page count: 22 HTML pages — matches `PAGE_INVENTORY.md`.
- Script count: 24 JS files — matches `REFERENCE_SOURCE_ANALYSIS.md`.
- CSS count: 15 — matches `ASSETS_INVENTORY.md`.
- Assets: 31 images + 2 fonts — matches `ASSETS_INVENTORY.md`.
- **No file listed in any inventory is missing from disk** — inventories were generated from the
  directory, so any discrepancy would indicate an unrecorded change. None found.

## 4. What changed in `D:\New folder\Clinic-pro`

| Path | Change | Allowed? |
|---|---|---|
| `پلتفرم/` (the reference) | **nothing** | required |
| `docs/` | added 30 markdown files | yes — Phase 0 deliverable, additive only |
| `CLAUDE.md` (root) | added — agent instructions | yes, outside the reference tree |

Nothing else exists in the working directory.

## 5. Ongoing rule (binds all future phases)

1. The reference tree is a **read-only artifact** for the lifetime of the project, not just Phase 0.
2. Content extracted into the new app is *copied* into `modules/*/content` with provenance recorded
   (`CONTENT_INVENTORY.md` §7); the reference file stays as the original record.
3. Any Phase 1+ task that appears to require editing the reference is a **stop-and-ask**, not a
   judgment call.
4. This report is re-verified at each phase gate: the mtime probe of §1 must again return 0 files
   newer than the Phase 0 session start.
