# Scoring Specification
# R7 Assessment System v4.0

## 1. Criteria Structure

33 items across 6 categories, each scored 0 or 5 (binary):

| Category | Items | Count | Max Score |
|----------|-------|-------|-----------|
| 1. การนำและการวางแผนการเงิน | 1.1-1.6 | 6 | 30 |
| 2. ระบบเวชระเบียน | 2.1-2.2 | 2 | 10 |
| 3. ศูนย์จัดเก็บรายได้คุณภาพ | 3.1-3.14 | 14 | 70 |
| 4. แผนธุรกิจ (TOP 2 only) | 4.1-4.5 | 5 (use 2) | 10 |
| 5. PP Fee Schedule | 5.1 | 1 | 5 |
| 6. การควบคุมรายจ่าย | 6.1-6.5 | 5 | 25 |
| **Total** | | **33** | **150** |

## 2. PRIMARY Score: Weighted 0-100 (category-based)

```
weighted_pct = round(total_raw / total_max * 100, 1)
```

Where:
- `total_raw` = sum of all item scores (Cat4 uses top 2 only)
- `total_max` = 150 (or 145 if item 6.4 is N/A)

This is the **primary score** shown on dashboard and reports.
Raw `/150` is shown only as secondary detail ("รายละเอียด/ตรวจสอบ").

## 3. Grade Thresholds (v4.0)

| Grade | Label | Weighted % Range |
|-------|-------|-----------------|
| A | ดีเยี่ยม | >= 90 |
| B | ดี (ผ่าน) | >= 80, < 90 |
| C | พอใช้ | >= 70, < 80 |
| D | ต้องปรับปรุง | < 70 |

**Pass threshold:** >= 80% (Grade B or above).

## 4. Category 4 Special Rule

All 5 items (4.1-4.5) are scored, but only the **top 2 highest scores** count toward the total. Tie-breaking: lower item number wins.

```
sort items 4.1-4.5 by score DESC, then by item_number ASC
top2 = first 2 items after sort
```

## 5. Item 6.4 Level Constraint

Item 6.4 applies only to levels **M1, M2, A**. For all other levels:
- Item 6.4 is excluded from scoring
- Category 6 max adjusts from 25 → 20
- Total max adjusts from 150 → 145
- **No penalty** to the hospital's percentage

## 6. Five Dimensions (secondary, for radar chart)

| Dimension | Items | Max Raw | Weight |
|-----------|-------|---------|--------|
| **Revenue** | Cat4 top2 + 5.1 | 15 | 0.35 |
| **Cost** | 6.1-6.5 | 25 | 0.15 |
| **Discipline** | 1.3, 1.4, 1.5, 1.6, 3.12, 3.13 | 30 | 0.30 |
| **Collection** | 3.7-3.11 | 25 | 0.15 |
| **Process** | 1.1, 1.2, 2.1, 2.2, 3.1-3.6, 3.14 | 55 | 0.05 |

These are used for the radar chart only, not the primary score.

## 7. Reference Implementation

- Primary scoring: `calcCatScores(d, level)` in `build_v31.js`
- Secondary dimensions: `calcDims(d, level)` in `build_v31.js`
- Config: `/config/scoring_rules.json` (v4.0)
- Tests: `/tests/scoring.test.js`
