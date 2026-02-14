# UI Map: Routes & Selectors
# R7 Assessment System v4.1 (COMET UX Sprint)

## Pages (Routes)

All pages are `<div>` elements toggled by `showPage(id)`. No URL-based routing.

| Page ID | data-testid | Description | Access |
|---------|-------------|-------------|--------|
| `pageDashboard` | `page-dashboard` | Public dashboard (default) | All |
| `pageHospitalDetail` | `page-hospital-detail` | Hospital drill-down | All |
| `pageLogin` | `page-login` | Login form | Unauthenticated |
| `pageMyDashboard` | `page-my-dashboard` | Hospital dashboard | Hospital/Assessor |
| `pageAssessment` | `page-assessment` | Assessment form | Hospital/Assessor |
| `pageReport` | `page-report` | Assessment report | Hospital/Assessor |

## Navigation Buttons

| Element ID | data-testid | Action | Visibility |
|------------|-------------|--------|------------|
| `btnLogin` | `btn-login` | → pageLogin | Not logged in |
| `btnLogout` | `btn-logout` | Logout → pageDashboard | Logged in |
| `btnMyDash` | `btn-my-dash` | → pageMyDashboard | Hospital role only |
| `btnImport` | N/A | Open import modal | Admin + pageDashboard |

## Dashboard Filters

| Element ID | data-testid | Type | Options |
|------------|-------------|------|---------|
| `fProv` | `filter-province` | `<select>` | ทั้งหมด, ขอนแก่น, กาฬสินธุ์, มหาสารคาม, ร้อยเอ็ด |
| `fLev` | `filter-level` | `<select>` | ทั้งหมด, A, S, M1, M2, F1, F2, F3 |
| `fRnd` | `filter-round` | `<select>` | Dynamic (ล่าสุด + all rounds) |

## Summary Cards

| Element ID | data-testid | Content |
|------------|-------------|---------|
| `sumTotal` | `summary-total` | Total hospitals count |
| `sumA` | `summary-grade-a` | Grade A count |
| `sumB` | `summary-grade-b` | Grade B count |
| `sumC` | N/A | Grade C count |
| `sumD` | N/A | Grade D count |
| `sumAvg` | N/A | Average composite |

## Hospital Table

| Element ID | data-testid | Description |
|------------|-------------|-------------|
| `tblBody` | `hospital-table-body` | Table body with hospital rows |

Each row: `onclick="openDetail(code)"` → navigates to pageHospitalDetail.

Sortable columns: `doSort('code'|'name'|'province'|'level'|'wpct'|'delta'|'grade')`

Note: Province column hidden dynamically when province filter is active.
Delta column (Δ ก่อนหน้า) shows change vs previous round.

## Persistent Info Box

| Element ID | data-testid | Content |
|------------|-------------|---------|
| `infoBox` | `info-box` | Grade thresholds + formula + pass threshold (visible on all pages) |

## Grade KPI Card Filters

Grade KPI cards (`sumA`, `sumB`, `sumC`, `sumD`) are clickable → calls `filterByGrade('A'|'B'|'C'|'D')`.
Active filter shows outline. "ล้าง filter" button appears in table header when filter is active.

## Charts (Canvas)

| Element ID | data-testid | Chart Type | Page |
|------------|-------------|-----------|------|
| `cRadarDash` | — | Radar (6 categories avg) | Dashboard |
| `cDonutDash` | — | Doughnut (grade dist) | Dashboard |
| `cHistDash` | `histogram-chart` | Bar (score histogram, 7 bins) | Dashboard |
| `cRadarDet` | — | Radar (hospital) | Hospital Detail |
| `cRadarMy` | — | Radar (my hospital) | My Dashboard |
| `cRadarRpt` | — | Radar (report) | Report |

## Hospital Detail Page

| Element ID | Content |
|------------|---------|
| `dName` | Hospital name |
| `dProv` | Province |
| `dLev` | Level badge |
| `dComp` | Composite score |
| `dGrade` | Grade badge |
| `dCatBars` | Category progress bars |
| `dHist` | History table |
| `dBest` | Best practice comparison |

## Login Form

| Element ID | data-testid | Type |
|------------|-------------|------|
| `inUser` | `login-username` | `<input type="text">` |
| `inPass` | `login-password` | `<input type="password">` |
| `loginErr` | N/A | Error message div |
| `btnDoLogin` | N/A | Submit button |
| `loginSpinner` | N/A | Loading spinner |

## My Dashboard

| Element ID | Content |
|------------|---------|
| `mName` | Hospital name |
| `mProv` | Province |
| `mLev` | Level |
| `mComp` | Composite score |
| `mGrade` | Grade badge |
| `mDR` | Revenue % |
| `mDCo` | Cost % |
| `mDD` | Discipline % |
| `mDCl` | Collection % |
| `mDP` | Process % |
| `mBest` | Best practice |
| `mHist` | History table |

## Assessment Form

| Element ID | data-testid | Content |
|------------|-------------|---------|
| `aRound` | N/A | Round selector |
| `aDate` | N/A | Date picker |
| `lComp` | `live-composite` | Live composite score |
| `lGrd` | `live-grade` | Live grade badge |
| `aBar` | N/A | Progress bar fill |
| `aProg` | N/A | Progress text (x/33) |
| `aItems` | `assessment-items` | Criteria items container |
| `btnSave` | `btn-save-assessment` | Save button |
| `saveSpinner` | N/A | Save loading spinner |
| `saveMsg` | N/A | Save result message |

Per-item selectors (dynamic):
- Score select: `#sc_{cat}_{num}` (e.g., `#sc_1_1`)
- Score level: `#lv_{cat}_{num}_{level}` (e.g., `#lv_1_1_3`)
- Top badge (cat4): `#tb_{cat}_{num}` (e.g., `#tb_4_1`)
- Row container: `#row_{cat}_{num}` (e.g., `#row_1_1`)

## Report Page

| Element ID | Content |
|------------|---------|
| `rSub` | Subtitle (hospital + round) |
| `rComp` | Composite score |
| `rGrade` | Grade badge |
| `rStr` | Strengths list (score 4-5) |
| `rWeak` | Weaknesses list (score 0-2) |
| `rDelta` | Delta comparison |

## Export Buttons

| Location | data-testid | Function |
|----------|-------------|----------|
| Dashboard | `btn-export-dash` | `exportDashExcel()` |
| My Dashboard | N/A | `exportMyExcel()` |
| Report | N/A | `exportRptExcel()` |

## Modals

| Element ID | Trigger | Content |
|------------|---------|---------|
| `importModal` | btnImport click | Excel import form |
| `impFile` | N/A | File input |
| `impPrev` | N/A | Preview table |

## Role-Based Visibility Matrix

| Element | Admin | Hospital/Assessor | Regional | Anonymous |
|---------|-------|-------------------|----------|-----------|
| pageDashboard | Yes | Yes | Yes (filtered) | Yes |
| pageHospitalDetail | Yes | Yes | Yes | Yes |
| pageLogin | N/A | N/A | N/A | Yes |
| pageMyDashboard | No | Yes | Blocked | No |
| pageAssessment | No | Yes | Blocked | No |
| pageReport | No | Yes | Blocked | No |
| btnImport | Yes | No | No | No |
| btnMyDash | No | Yes | No | No |
| Export Excel | Yes | Yes | Yes | Yes |
