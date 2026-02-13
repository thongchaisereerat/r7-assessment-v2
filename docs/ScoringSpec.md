# Scoring Specification
# R7 Assessment System v3.1

## 1. Criteria Structure

33 items across 6 categories, each scored 0-5:

| Category | Items | Count | Max Score |
|----------|-------|-------|-----------|
| 1. การนำและการวางแผนการเงิน | 1.1-1.6 | 6 | 30 |
| 2. ระบบเวชระเบียน | 2.1-2.2 | 2 | 10 |
| 3. ศูนย์จัดเก็บรายได้คุณภาพ | 3.1-3.14 | 14 | 70 |
| 4. แผนธุรกิจ (TOP 2 only) | 4.1-4.5 | 5 (use 2) | 10 |
| 5. PP Fee Schedule | 5.1 | 1 | 5 |
| 6. การควบคุมรายจ่าย | 6.1-6.5 | 5 | 25 |
| **Total** | | **33** | **150** |

## 2. Category 4 Special Rule

All 5 items (4.1-4.5) are scored, but only the **top 2 highest scores** count toward the total and Revenue dimension. Tie-breaking: lower item number wins.

```
sort items 4.1-4.5 by score DESC, then by item_number ASC
top2 = first 2 items after sort
```

## 3. Five Dimensions

Each item maps to exactly one dimension:

| Dimension | Items | Max Raw | Weight |
|-----------|-------|---------|--------|
| **Revenue** | Cat4 top2 + 5.1 | 15 | 0.35 |
| **Cost** | 6.1, 6.2, 6.3, 6.4, 6.5 | 25 | 0.15 |
| **Discipline** | 1.3, 1.4, 1.5, 1.6, 3.12, 3.13 | 30 | 0.30 |
| **Collection** | 3.7, 3.8, 3.9, 3.10, 3.11 | 25 | 0.15 |
| **Process** | 1.1, 1.2, 2.1, 2.2, 3.1-3.6, 3.14 | 55 | 0.05 |

## 4. Dimension Percentage Calculation

```
dimension_pct = round(raw_sum / max_raw * 100)
```

Example for Revenue: if top2 items score (5,4) and 5.1 scores 3:
```
raw_sum = 5 + 4 + 3 = 12
dimension_pct = round(12 / 15 * 100) = 80
```

## 5. Composite Score

```
composite = round(
  revenue_pct × 0.35 +
  cost_pct    × 0.15 +
  discipline_pct × 0.30 +
  collection_pct × 0.15 +
  process_pct × 0.05
)
```

## 6. Grade Thresholds

| Grade | Composite Range |
|-------|----------------|
| A | >= 85 |
| B | >= 75, < 85 |
| C | >= 65, < 75 |
| D | < 65 |

## 7. Total Raw Score

```
total_raw = sum of all items EXCEPT cat4 items not in top2
         = cat1(6) + cat2(2) + cat3(14) + cat4_top2(2) + cat5(1) + cat6(5)
         = 30 items × max 5 = max 150
```

## 8. Item-Dimension Mapping (Complete)

```json
{
  "1.1": "Process",  "1.2": "Process",
  "1.3": "Discipline", "1.4": "Discipline", "1.5": "Discipline", "1.6": "Discipline",
  "2.1": "Process",  "2.2": "Process",
  "3.1": "Process",  "3.2": "Process",  "3.3": "Process",  "3.4": "Process",
  "3.5": "Process",  "3.6": "Process",
  "3.7": "Collection", "3.8": "Collection", "3.9": "Collection",
  "3.10": "Collection", "3.11": "Collection",
  "3.12": "Discipline", "3.13": "Discipline",
  "3.14": "Process",
  "4.1": "Revenue",  "4.2": "Revenue",  "4.3": "Revenue",
  "4.4": "Revenue",  "4.5": "Revenue",
  "5.1": "Revenue",
  "6.1": "Cost",  "6.2": "Cost",  "6.3": "Cost",  "6.4": "Cost",  "6.5": "Cost"
}
```

## 9. Level Constraints

Item 6.4 applies only to levels M1, M2, A. All other items apply to ALL levels.

## 10. Reference Implementation

The scoring logic is implemented in `calcDims()` and `calcDimsFromRec()` in `build_v31.js` (lines 348-360, 248-260).

See also: `/config/scoring_rules.json` for the config-driven version.
