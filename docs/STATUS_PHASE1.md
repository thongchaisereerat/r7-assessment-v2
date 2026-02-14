# Phase 1 Status: Weighted 0-100 + Grade Thresholds

**Status:** COMPLETE
**Date:** 2026-02-13

## What Changed

1. **scoring_rules.json** — Updated to v4.0:
   - Grade thresholds changed: 85/75/65 → 90/80/70
   - Added Thai labels: ดีเยี่ยม, ดี (ผ่าน), พอใช้, ต้องปรับปรุง
   - Added `pass_threshold_pct: 80`
   - Old `min_composite` keys replaced with `min_pct`

2. **tests/scoring.test.js** — Rewritten for v4.0:
   - Added `calcCatScores()` function (primary scoring: category-based weighted 0-100)
   - Added `gradeFromPct()` + `gradeLabel()` with new 90/80/70 thresholds
   - Added 8 grade boundary tests (including edge cases like 89.9, 79.9, 69.9)
   - Added 6 weighted-percentage tests (all-zero, all-five, cap, cat4 top-2, tie-break)
   - Added 8 item-6.4 N/A denominator tests (M1/M2/A → 25, F1/F2/S → 20, no-penalty)
   - Updated golden case 1 (high) and golden case 2 (low) to use category-based expected values
   - Kept `calcDims()` secondary tests for radar chart validation
   - **Total: 57 tests, 0 failures**

3. **data/fixtures/golden_case_high.json** — New expected values:
   - totalRaw=138, totalMax=150, wpct=92.0, grade=A (was composite=92)
   - Added per-category scores (Cat3=64/70=91.4%, not 69 as hand-calc error)

4. **data/fixtures/golden_case_low.json** — New expected values:
   - totalRaw=47, totalMax=145, wpct=32.4, grade=D
   - Cat6: mx=20 (F2→6.4 excluded), pct=30%

5. **docs/ScoringSpec.md** — Updated to v4.0:
   - Primary score is now `weighted_pct = round(total_raw/total_max*100, 1)`
   - Grade thresholds 90/80/70 with Thai labels documented
   - Item 6.4 denominator adjustment documented
   - Dimensions marked as secondary (radar chart only)

6. **tests/smoke.test.js** — Updated:
   - Version check: v3.1 → v4.0
   - Function check: `calcDimsFromRec` → `calcCatScores`

## Files Touched

| File | Action |
|------|--------|
| config/scoring_rules.json | Modified (thresholds + labels) |
| tests/scoring.test.js | Rewritten (57 tests) |
| tests/smoke.test.js | Modified (2 lines) |
| data/fixtures/golden_case_high.json | Modified (expected values) |
| data/fixtures/golden_case_low.json | Modified (expected values) |
| docs/ScoringSpec.md | Rewritten |
| index.html | Rebuilt (no logic change, just rebuild) |

## Commands Run

```
node tests/scoring.test.js   → 57 passed, 0 failed
node build_v31.js             → Built index.html: 258.1KB
node tests/smoke.test.js      → 121 passed, 0 failed
```

## data-testid Changes

None — all existing data-testid attributes preserved.

## Next Steps

Phase 2: Big-button entry UI + autosave + progress + Cat4 choose-2 + 6.4 N/A toggle
