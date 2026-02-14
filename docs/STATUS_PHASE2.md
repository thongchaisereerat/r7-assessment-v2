# Phase 2 Status: Big-Button Entry + Autosave + Progress + Rules

**Status:** COMPLETE
**Date:** 2026-02-13

## What Changed

### Pre-existing features (already in v4.0 build script):
- Big-button entry (5=ทำได้, 0=ยังไม่ได้) with fine-tune 0-5
- Autosave on every change with "บันทึกร่างล่าสุดเมื่อ…" display
- Progress bar + per-category progress chips
- "ทำต่อ" resume button on My Dashboard
- Item 6.4 N/A handling (level constraint, denominator adjustment)
- Draft/Submitted state with localStorage

### New in Phase 2: Cat4 Choose-2 UI Enforcement

1. **CSS classes** — Added `.c4-unsel` (dims scoring UI for unselected Cat4 items) and `.c4-ck` (checkbox style)

2. **State variable** — `cat4Sel` Set tracks which 2 Cat4 items the user has selected

3. **Checkbox UI** — Each Cat4 item now shows a "เลือกข้อนี้" checkbox instead of the auto-selected "TOP" badge

4. **`toggleCat4(k)`** — Handles checkbox changes:
   - Enforces max 2 selection with alert if trying to select 3rd
   - Zeros score when item is unchecked
   - Updates UI visibility (dims unselected items)

5. **`updCat4UI()`** — Syncs checkbox states and `c4-unsel` class across all Cat4 rows

6. **`restoreCat4(data)`** — Restores Cat4 selections from saved draft/scores:
   - Uses `cat4_selected` array from draft if available
   - Falls back to inferring from non-zero scores

7. **`setScore(k,v)` guard** — Blocks scoring for unselected Cat4 items

8. **`saveAssess()` validation** — Requires exactly 2 Cat4 items selected before submitting

9. **Draft persistence** — `autoSave()` now stores `cat4_selected` array in draft

10. **`loadDraft()`, `startOrResume()`, `editAssess()`** — All restore Cat4 selections when loading data

## Files Touched

| File | Action |
|------|--------|
| build_v31.js | Modified (Cat4 choose-2 UI, CSS, state, functions) |
| tests/scoring.test.js | Modified (+1 test: Cat4 choose-2 simulation) |
| index.html | Rebuilt (260.7KB) |

## Commands Run

```
node build_v31.js             → Built index.html: 260.7KB
node tests/scoring.test.js    → 58 passed, 0 failed
node tests/smoke.test.js      → 121 passed, 0 failed
```

## data-testid Changes

None — all existing data-testid attributes preserved. New elements use regular IDs:
- `c4ck_{k}` — Cat4 item checkboxes (e.g., `c4ck_4_1`)
- `c4selCount` — Cat4 selection counter in header

## Next Steps

Phase 3: Excel-like Dashboard + auto analysis + Action Plan
