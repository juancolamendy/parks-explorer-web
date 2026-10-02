# Traceability Index

Navigation view only: rows hold IDs and links, never copied requirement or design prose. Requirements, design, and plan files remain authoritative. Maintained by `cg-exec` (one update per phase).

| Requirement / AC | Design | Task | Change | Code link | Test | Result |
|---|---|---|---|---|---|---|
| CON-001, CON-004 (enabler for AC-001 to AC-015 evidence) | DES-023, DES-024 | TASK-001 | CHG-001 | `package.json:26` | TEST-001 — `src/data/parks.sample.test.ts::[TEST-001]` | RESULT-002 — plan Part 1, Phase 1 completion evidence |
| CON-001, CON-004 | DES-024 | TASK-001 | CHG-002 | `vitest.config.ts:5` | TEST-001 — `src/data/parks.sample.test.ts::[TEST-001]` | RESULT-002 — plan Part 1, Phase 1 completion evidence |
| CON-001, CON-004 | DES-024 | TASK-001 | CHG-003 | `package.json:10` | TEST-001 — `src/data/parks.sample.test.ts::[TEST-001]` | RESULT-002 — plan Part 1, Phase 1 completion evidence |
| CON-001 | DES-024 | TASK-001 | CHG-004 | `AGENTS.md:10` | TEST-001 — `src/data/parks.sample.test.ts::[TEST-001]` | RESULT-002 — plan Part 1, Phase 1 completion evidence |
| REQ-F-001, REQ-F-005, CON-004 / AC-003, AC-004, AC-015 | DES-014 | TASK-002 | CHG-005 | `src/lib/types.ts:7` | TEST-002, TEST-003, TEST-004 — `src/lib/parks.test.ts` | RESULT-009 — plan Part 1, Phase 2 completion evidence |
| REQ-F-001, REQ-F-003, REQ-F-005, REQ-F-012 / AC-003, AC-004, AC-015 | DES-002, DES-014, DES-030 | TASK-002 | CHG-006 | `src/lib/parks.ts:89` (`normalizeParks`), `src/lib/parks.ts:103` (`getMarkerParks`) | TEST-002 (AC-003), TEST-003 (AC-015), TEST-004 (AC-004) — `src/lib/parks.test.ts` | RESULT-009, RESULT-013 — plan Part 1, Phase 2 completion evidence |
| DES-019 (untrusted image URLs; no AC) | DES-019 | TASK-002 | CHG-006 | `src/lib/parks.ts:89` | TEST-005 — `src/lib/parks.test.ts` | RESULT-009 — plan Part 1, Phase 2 completion evidence |
| AC-003, AC-004, AC-015 (shared test fixture) | DES-014 | TASK-002 | CHG-007 | `src/lib/fixtures/makePark.ts:8` | TEST-002 to TEST-005 — `src/lib/parks.test.ts` | RESULT-009 — plan Part 1, Phase 2 completion evidence |
