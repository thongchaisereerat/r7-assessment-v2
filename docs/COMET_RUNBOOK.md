# COMET Runbook - R7 Assessment System v4.1

End-to-end test steps using `data-testid` selectors. Designed for manual QA or Playwright/Cypress automation.

**URL:** `https://kfintrack.github.io/r7-assessment-v2/`
**Browser:** Chrome 120+ (DevTools required for some steps)

---

## Notation

- `[tid="X"]` = `document.querySelector('[data-testid="X"]')`
- `#id` = `document.getElementById('id')`
- **ASSERT** = verification step (fail if false)
- **ACTION** = user interaction step

---

## TC-01: Public Dashboard Loads Without Login

**Precondition:** Fresh page load, no login

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Navigate to site URL | — | Page loads |
| 2 | ASSERT: Dashboard page visible | `[tid="page-dashboard"]` | Not `.hidden` |
| 3 | ASSERT: Login button visible | `[tid="btn-login"]` | Not `.hidden` |
| 4 | ASSERT: Logout button hidden | `[tid="btn-logout"]` | Has `.hidden` |
| 5 | ASSERT: My Dashboard button hidden | `[tid="btn-my-dash"]` | Has `.hidden` |
| 6 | ASSERT: Summary total shows number | `[tid="summary-total"]` | `textContent` matches `/^\d+$/` |
| 7 | ASSERT: Grade A count shown | `[tid="summary-grade-a"]` | `textContent` matches `/^\d+$/` |
| 8 | ASSERT: Grade B count shown | `[tid="summary-grade-b"]` | `textContent` matches `/^\d+$/` |
| 9 | ASSERT: Hospital table has rows | `[tid="hospital-table-body"]` | Contains `<tr>` elements |
| 10 | ASSERT: Export button visible | `[tid="btn-export-dash"]` | Not `.hidden` |
| 11 | ASSERT: Score column header says "คะแนน (%)" | table header | Primary score is weighted 0-100 |

---

## TC-02: Dashboard Filters

**Precondition:** Dashboard loaded (TC-01 complete)

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Set Province = "ขอนแก่น" | `[tid="filter-province"]` | Set `.value = "ขอนแก่น"`, trigger `change` |
| 2 | ASSERT: Table shows only ขอนแก่น hospitals | `[tid="hospital-table-body"]` | Every row's province column = "ขอนแก่น" |
| 3 | ASSERT: Summary total updated | `[tid="summary-total"]` | Number ≤ previous total |
| 4 | ACTION: Set Level = "M1" | `[tid="filter-level"]` | Set `.value = "M1"`, trigger `change` |
| 5 | ASSERT: Table shows only M1 hospitals | `[tid="hospital-table-body"]` | Every row's level column = "M1" |
| 6 | ACTION: Reset all filters | All filter selectors | Set `.value = ""` |
| 7 | ASSERT: Full data restored | `[tid="summary-total"]` | Back to original count |

---

## TC-03: Hospital Detail Drill-Down

**Precondition:** Dashboard loaded with data

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Click first hospital row | `[tid="hospital-table-body"] tr:first-child` | Click |
| 2 | ASSERT: Detail page visible | `[tid="page-hospital-detail"]` | Not `.hidden` |
| 3 | ASSERT: Weighted score shown (0-100) | `#dComp` | `textContent` matches `/^\d+(\.\d)?$/` |
| 4 | ASSERT: Grade badge shows Thai label | `#dGrade` | Contains one of: ดีเยี่ยม, ดี, พอใช้, ต้องปรับปรุง |
| 5 | ASSERT: Analysis section shown | `[tid="analysis-section"]` | `innerHTML` not empty |
| 6 | ASSERT: Category bars shown | `#dCatBars` | `innerHTML` not empty, 6 bars |
| 7 | ASSERT: Radar chart rendered | `#cRadarDet` | Canvas has non-zero dimensions |
| 8 | ACTION: Click back button | — | Click "กลับหน้า Dashboard" |
| 9 | ASSERT: Dashboard visible again | `[tid="page-dashboard"]` | Not `.hidden` |

---

## TC-04: Login - Hospital User

**Precondition:** Dashboard loaded, not logged in

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Click Login button | `[tid="btn-login"]` | Click |
| 2 | ASSERT: Login page visible | `[tid="page-login"]` | Not `.hidden` |
| 3 | ACTION: Enter username "10670" | `[tid="login-username"]` | Set `.value = "10670"` |
| 4 | ACTION: Enter password "R710670" | `[tid="login-password"]` | Set `.value = "R710670"` |
| 5 | ACTION: Click Login submit | `#btnDoLogin` | Click |
| 6 | ASSERT: My Dashboard page visible | `[tid="page-my-dashboard"]` | Not `.hidden` |
| 7 | ASSERT: Start assess button visible | `[tid="btn-start-assess"]` | Visible |
| 8 | ASSERT: Weighted score shown | `#mComp` | `textContent` is number or "-" |

---

## TC-05: Assessment - Big Button Entry

**Precondition:** Logged in as hospital user (TC-04)

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Click start assessment | `[tid="btn-start-assess"]` | Click |
| 2 | ASSERT: Assessment page visible | `[tid="page-assessment"]` | Not `.hidden` |
| 3 | ASSERT: Items rendered | `[tid="assessment-items"]` | Contains item divs |
| 4 | ACTION: Click "ทำได้ (5)" for item 1.1 | `#by_1_1` | Click big green button |
| 5 | ASSERT: Button becomes active | `#by_1_1` | Has class `.active` |
| 6 | ASSERT: Score value set to 5 | `#sc_1_1` | `.value === "5"` |
| 7 | ACTION: Click "ยังไม่ได้ (0)" for item 1.2 | `#bn_1_2` | Click big red button |
| 8 | ASSERT: Score value set to 0 | `#sc_1_2` | `.value === "0"` |
| 9 | ASSERT: Autosave message appears | `[tid="autosave-msg"]` | Contains "บันทึกร่างล่าสุดเมื่อ" |
| 10 | ASSERT: Live score updates | `[tid="live-composite"]` | Shows a number |
| 11 | ASSERT: Progress updates | `#aProg` | Shows e.g. "2/30" |

---

## TC-06: Cat4 Choose-2 Enforcement

**Precondition:** On assessment page (TC-05)

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ASSERT: All Cat4 items have checkboxes | `#c4ck_4_1` through `#c4ck_4_5` | Checkboxes present |
| 2 | ASSERT: Cat4 items initially dimmed | `#row_4_1` | Has class `.c4-unsel` |
| 3 | ACTION: Check item 4.1 | `#c4ck_4_1` | Click checkbox |
| 4 | ASSERT: Item 4.1 scoring enabled | `#row_4_1` | `.c4-unsel` removed |
| 5 | ACTION: Check item 4.3 | `#c4ck_4_3` | Click checkbox |
| 6 | ASSERT: 2 items selected | `#c4selCount` | Shows "(เลือก 2/2)" |
| 7 | ACTION: Try checking item 4.5 | `#c4ck_4_5` | Click checkbox |
| 8 | ASSERT: Alert shown | — | Alert: "สามารถเลือกได้สูงสุด 2 ข้อเท่านั้น" |
| 9 | ASSERT: Item 4.5 still unchecked | `#c4ck_4_5` | Not checked |
| 10 | ACTION: Score 4.1 = 5 | `#by_4_1` | Click big button |
| 11 | ACTION: Score 4.3 = 5 | `#by_4_3` | Click big button |
| 12 | ASSERT: Selected items contribute to total | `[tid="live-composite"]` | Score reflects Cat4 contribution |

---

## TC-07: Item 6.4 N/A for Non-Applicable Levels

**Precondition:** Logged in as F2-level hospital

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Start assessment | `[tid="btn-start-assess"]` | Click |
| 2 | ASSERT: Item 6.4 shows N/A | `#row_6_4` | Shows "N/A" badge, scoring hidden |
| 3 | ASSERT: Item 6.4 select is "NA" | `#sc_6_4` | `.value === "NA"` |
| 4 | ACTION: Score all other Cat6 items = 5 | `#by_6_1` through `#by_6_5` (except 6.4) | Click big buttons |
| 5 | ASSERT: Cat6 pct = 100% | Live score section | Cat6 4/4 items, 20/20 |

---

## TC-08: Draft / Submitted State

**Precondition:** Logged in, assessment started

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Score a few items, do NOT save | — | Fill 5-6 items |
| 2 | ASSERT: Autosave message shown | `[tid="autosave-msg"]` | Contains timestamp |
| 3 | ACTION: Navigate away then back | `[tid="btn-my-dash"]`, then `[tid="btn-start-assess"]` | |
| 4 | ASSERT: Draft restored | Item scores | Previously entered values still present |
| 5 | ACTION: Complete all items, click Save | `[tid="btn-save-assessment"]` | Click |
| 6 | ASSERT: Report page shown | `[tid="page-report"]` | Not `.hidden` |
| 7 | ASSERT: Action plan rendered | `[tid="action-plan"]` | Contains table with quick-win chips |
| 8 | ACTION: Go to My Dashboard | — | Navigate |
| 9 | ASSERT: History shows "ส่งแล้ว" badge | `#mHist` | Contains class `.submitted-badge` |
| 10 | ACTION: Try edit submitted assessment | — | Click "แก้ไข" if shown |
| 11 | ASSERT: Edit blocked | — | Alert: "ส่งแล้ว ต้องขอ Admin ปลดล็อค" |

---

## TC-09: Weighted Score Display

**Precondition:** Assessment completed and saved (TC-08)

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ASSERT: Report primary score 0-100 | `#rComp` | Number between 0 and 100 |
| 2 | ASSERT: Raw score shown as secondary | `#rRaw` | Contains "คะแนนดิบ X/150" or "X/145" |
| 3 | ASSERT: Grade uses new thresholds | `#rGrade` | Thai label from: ดีเยี่ยม/ดี/พอใช้/ต้องปรับปรุง |
| 4 | ASSERT: Category table in report | `#rCatTable` | 6 rows with ได้/เต็ม/%/ระดับ/Gap |
| 5 | ASSERT: Analysis shows PASS or FAIL | `#rAnalysis` | Contains "ผ่านเกณฑ์" or "ไม่ผ่านเกณฑ์" |
| 6 | ASSERT: Lowest category identified | `#rAnalysis` | Shows "จุดต้องพัฒนาเร่งด่วน" with category name |

---

## TC-10: Logout and Access Control

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Click Logout | `[tid="btn-logout"]` | Click |
| 2 | ASSERT: Dashboard shown | `[tid="page-dashboard"]` | Not `.hidden` |
| 3 | ASSERT: Login button visible | `[tid="btn-login"]` | Not `.hidden` |
| 4 | ASSERT: Logout/My Dash buttons hidden | `[tid="btn-logout"]`, `[tid="btn-my-dash"]` | Has `.hidden` |

---

## TC-11: Composite Histogram (COMET P1-1)

**Precondition:** Public dashboard loaded with data

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ASSERT: Histogram chart visible | `[tid="histogram-chart"]` | Canvas element exists |
| 2 | ASSERT: Histogram has bars | `#cHistDash` | Chart rendered with bin labels (<70..95-100) |
| 3 | ASSERT: Colors reflect grades | — | Red (<70), amber (70-80), blue (80-90), green (90-100) |

---

## TC-12: Delta vs Previous Round (COMET P1-3)

**Precondition:** Public dashboard with round filter

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ASSERT: Delta column header exists | Table header | "Δ ก่อนหน้า" column visible |
| 2 | ASSERT: Hospitals with previous data show delta | Table body | Green "↑+X" or red "↓-X" arrows |
| 3 | ASSERT: First-time hospitals show dash | Table body | Gray "-" |
| 4 | ACTION: Sort by delta | Click "Δ ก่อนหน้า" header | Table sorted by delta value |

---

## TC-13: Clickable Grade KPI Cards (COMET P1-4)

**Precondition:** Public dashboard loaded

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Click Grade A card | `[tid="summary-grade-a"]` parent | Click |
| 2 | ASSERT: Table filtered to Grade A only | `[tid="hospital-table-body"]` | All rows show grade A |
| 3 | ASSERT: Active card has outline | `#sumA` parent | `outline` style set |
| 4 | ASSERT: Clear filter button appears | Table header | "ล้าง filter" link visible |
| 5 | ACTION: Click "ล้าง filter" | Table header button | Click |
| 6 | ASSERT: All hospitals shown again | `[tid="hospital-table-body"]` | All grades present |

---

## TC-14: Info Box Persistent (COMET P0-1)

**Precondition:** Any page loaded

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ASSERT: Info box visible | `[tid="info-box"]` | Contains "A ≥90", "B ≥80", "C ≥70" |
| 2 | ASSERT: Formula shown | `[tid="info-box"]` | Contains "คะแนนรวม ÷ คะแนนเต็ม × 100" |
| 3 | ASSERT: Pass threshold shown | `[tid="info-box"]` | Contains "≥80%" |
| 4 | ACTION: Navigate to Assessment page | Login → start assessment | |
| 5 | ASSERT: Info box still visible | `[tid="info-box"]` | Still present on assessment page |

---

## TC-15: Draft Restore Prompt (COMET P0-4b / ISS-003)

**Precondition:** Logged in as hospital user

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ACTION: Start assessment, score 3 items | — | Score items 1.1, 1.2, 1.3 |
| 2 | ASSERT: Autosave triggered | `[tid="autosave-msg"]` | Timestamp shown |
| 3 | ACTION: Navigate to My Dashboard | `[tid="btn-my-dash"]` | Click |
| 4 | ACTION: Click "ทำต่อการประเมิน" | `[tid="btn-start-assess"]` | Click |
| 5 | ASSERT: Confirm dialog shown | — | "พบแบบร่างที่ยังไม่ได้บันทึก ต้องการกู้คืนหรือไม่?" |
| 6 | ACTION: Click OK | — | Confirm |
| 7 | ASSERT: Previous scores restored | `#sc_1_1`, `#sc_1_2`, `#sc_1_3` | Values match previously entered |

---

## TC-16: Province Column Hidden (COMET observation)

**Precondition:** Public dashboard

| # | Step | Selector | Expected |
|---|------|----------|----------|
| 1 | ASSERT: Province column visible | Table header | "จังหวัด" column present |
| 2 | ACTION: Select province filter | `[tid="filter-province"]` | Select "ขอนแก่น" |
| 3 | ASSERT: Province column hidden | Table header | "จังหวัด" column not present |
| 4 | ACTION: Clear province filter | `[tid="filter-province"]` | Select "ทั้งหมด" |
| 5 | ASSERT: Province column visible again | Table header | "จังหวัด" column present |

---

## data-testid Reference

| Selector | Element | Page |
|----------|---------|------|
| `page-dashboard` | Public dashboard container | Dashboard |
| `page-hospital-detail` | Hospital detail container | Detail |
| `page-login` | Login form container | Login |
| `page-my-dashboard` | Hospital dashboard container | My Dashboard |
| `page-assessment` | Assessment form container | Assessment |
| `page-report` | Report container | Report |
| `btn-login` | Login nav button | Header |
| `btn-logout` | Logout nav button | Header |
| `btn-my-dash` | My Dashboard nav button | Header |
| `btn-start-assess` | Start/Resume assessment | My Dashboard |
| `btn-save-assessment` | Save & submit assessment | Assessment |
| `btn-export-dash` | Export dashboard Excel | Dashboard |
| `filter-province` | Province filter dropdown | Dashboard |
| `filter-level` | Level filter dropdown | Dashboard |
| `filter-round` | Round filter dropdown | Dashboard |
| `summary-total` | Total hospital count | Dashboard |
| `summary-grade-a` | Grade A count | Dashboard |
| `summary-grade-b` | Grade B count | Dashboard |
| `hospital-table-body` | Hospital table body | Dashboard |
| `login-username` | Username input | Login |
| `login-password` | Password input | Login |
| `live-composite` | Live weighted score | Assessment |
| `live-grade` | Live grade badge | Assessment |
| `assessment-items` | Assessment items container | Assessment |
| `autosave-msg` | Autosave status message | Assessment |
| `action-plan` | Action plan container | Report |
| `analysis-section` | Auto-analysis section | Detail |
| `histogram-chart` | Score histogram bar chart | Dashboard |
| `info-box` | Persistent grade thresholds info | All pages |

## Element ID Reference (non-testid)

| ID | Purpose |
|----|---------|
| `c4ck_4_1` through `c4ck_4_5` | Cat4 item selection checkboxes |
| `c4selCount` | Cat4 selection counter display |
| `row_X_Y` | Assessment item row container |
| `by_X_Y` | Big "ทำได้ (5)" button |
| `bn_X_Y` | Big "ยังไม่ได้ (0)" button |
| `sc_X_Y` | Hidden score select element |
| `sv_X_Y` | Score value display |
| `fine_X_Y` | Fine-tune 0-5 button panel |
| `rRaw` | Raw score secondary display |
| `rCatTable` | Category summary table |
| `rAnalysis` | Analysis section in report |
| `rActionPlan` | Action plan in report |
| `cHistDash` | Histogram chart canvas |
| `infoBox` | Persistent info box banner |

---

## Golden Case Category Reference (v4.1)

### Case 1 (High - Grade A, level M1)
| Category | Raw | Max | Pct |
|----------|-----|-----|-----|
| Cat1 วางแผน | 28 | 30 | 93.3% |
| Cat2 เวชระเบียน | 9 | 10 | 90.0% |
| Cat3 จัดเก็บรายได้ | 64 | 70 | 91.4% |
| Cat4 แผนธุรกิจ (top2) | 10 | 10 | 100.0% |
| Cat5 PP Fee | 4 | 5 | 80.0% |
| Cat6 ควบคุมจ่าย | 23 | 25 | 92.0% |
| **Total** | **138** | **150** | **92.0%** → **ดีเยี่ยม (A)** |

### Case 2 (Low - Grade D, level F2)
| Category | Raw | Max | Pct |
|----------|-----|-----|-----|
| Cat1 วางแผน | 9 | 30 | 30.0% |
| Cat2 เวชระเบียน | 3 | 10 | 30.0% |
| Cat3 จัดเก็บรายได้ | 22 | 70 | 31.4% |
| Cat4 แผนธุรกิจ (top2) | 5 | 10 | 50.0% |
| Cat5 PP Fee | 2 | 5 | 40.0% |
| Cat6 ควบคุมจ่าย (6.4 N/A) | 6 | 20 | 30.0% |
| **Total** | **47** | **145** | **32.4%** → **ต้องปรับปรุง (D)** |
