# QA Report - R7 Assessment System v3.1

| Field | Value |
|-------|-------|
| System | R7 Assessment System |
| Version | 3.1 |
| Reviewer | QA / Security / PDPA / Product |
| Date | 2026-02-13 |
| Build | `node build_v31.js` → `index.html` (241.8 KB) |

---

## Task A: Repo & Execution Check

### A1 - Repository Structure

```
r7-assessment-v2/
  build_v31.js            (826 lines - main build script)
  generate_embedded.js    (criteria/scores → embedded JS)
  embedded_criteria.js    (generated)
  embedded_scores.js      (generated)
  index.html              (241.8 KB - generated SPA)
  package.json            (v3.1.0, npm test/build scripts)
  .gitignore
  config/
    scoring_rules.json    (config-driven scoring)
  data/
    criteria_data.json    (source criteria)
    scores_data.json      (source historical scores)
    fixtures/
      golden_case_high.json   (Grade A fixture)
      golden_case_low.json    (Grade D fixture)
  docs/
    PRD.md, ScoringSpec.md, DataSchema.md,
    Architecture.md, Run.md, Risk_PDPA_Security.md, UIMap.md
  tests/
    scoring.test.js       (34 tests - scoring logic)
    smoke.test.js         (121 tests - HTML structure)
```

**Verdict:** PASS - All expected files present. Structure follows docs/config/data/tests convention.

### A2 - Build & Test Execution

```
> node build_v31.js
Built index.html: 241.8KB
Done!

> npm test
=== R7 Scoring Unit Tests ===
  Config Validation:     7/7  PASS
  Scoring Logic:         9/9  PASS
  Golden Case 1 (High): 8/8  PASS
  Golden Case 2 (Low):  8/8  PASS
  Dimension Isolation:   2/2  PASS
  === Results: 34 passed, 0 failed ===

=== R7 Smoke Tests ===
  Structure:             5/5  PASS
  Pages:                 6/6  PASS
  Embedded Data:         3/3  PASS
  Key Functions:        20/20 PASS
  UI Elements:          41/41 PASS
  Data-testid:          22/22 PASS
  Authorization:         3/3  PASS
  Security:              3/3  PASS
  === Results: 121 passed, 0 failed ===

TOTAL: 155 passed, 0 failed
```

**Verdict:** PASS - Build clean, all 155 tests pass.

---

## Task B: Spec Compliance

### B1 - Scoring Correctness Audit

| Check | Result | Evidence |
|-------|--------|----------|
| Cat4 top-2 selection | **PASS** | `build_v31.js:355-357` sorts DESC score, ASC key for tie-break. Verified by `scoring.test.js` lines 139-162 with both distinct and tied inputs. |
| Dimension item mapping | **PASS** | `build_v31.js:358-362` matches `scoring_rules.json` dimensions exactly. Revenue = top2(cat4) + 5.1; Cost = 6.1-6.5; Discipline = 1.3,1.4,1.5,1.6,3.12,3.13; Collection = 3.7-3.11; Process = 1.1,1.2,2.1,2.2,3.1-3.6,3.14. |
| Dimension max_raw denominators | **PASS** | Revenue /15, Cost /25, Discipline /30, Collection /25, Process /55. Match `scoring_rules.json`. |
| Dimension weights | **PASS** | R×0.35 + Co×0.15 + D×0.30 + Cl×0.15 + P×0.05 = 1.00. `build_v31.js:364`. |
| Grade thresholds | **PASS** | A≥85, B≥75, C≥65, D<65. `build_v31.js:298` (`cg()`) + `scoring_rules.json:56-61`. Boundary tests at lines 164-191 in `scoring.test.js`. |
| Rounding method | **PASS** | Two-stage: `Math.round` per dimension %, then `Math.round` on weighted sum. Consistent between `build_v31.js:363-364` and `scoring.test.js:51-57`. |
| Golden case high (A) | **PASS** | Composite=92, Grade=A, top2=[4_1,4_5]. All 8 assertions pass. |
| Golden case low (D) | **PASS** | Composite=35, Grade=D, top2=[4_1,4_3]. All 8 assertions pass. |
| Level constraint 6.4 | **MAJOR BUG** | See ISS-001. Item 6.4 hidden for non-M1/M2/A at `build_v31.js:615-616`, but `collectForm()` at line 655 still sends `i_6_4='0'`, and `calcDims()` at line 359 includes `6_4` in Cost sum with max_raw=25. Non-eligible hospitals can never reach Cost>80%. |
| `calcDimsFromRec` consistency | **PASS** | `processHistorical()` builds `i_*` keys from HS records and feeds them through the same `calcDims` path. |

### B2 - Data Integrity

| Check | Result | Evidence |
|-------|--------|----------|
| FormData → SavePayload mapping | **PASS** | `saveAssess()` at `build_v31.js:664-666` maps `i_X_Y` → `item_X_Y` in payload. All 33 items iterated. |
| Score dedup in `getLS()` | **MINOR BUG** | `build_v31.js:306-314` uses `updated_at` string comparison. If two scores for the same hospital have identical `updated_at`, last-in-array wins (non-deterministic). Historical data uses `r` (round) field → `getLS` filters by round already, so practical impact is low. |
| localStorage cache write | **PASS** | `saveAssess()` line 685: `ls('r7_scores_'+CH.code+'_'+d.round, d)` writes all `i_*` fields. |
| Draft save vs draft load mismatch | **MINOR BUG** | See ISS-003. `autoSave()` line 658 writes to `r7_draft_<code>`. But `loadDraft()` line 602 reads from `r7_scores_<code>_<round>`. Draft data is written but never restored from the correct key. |
| Fixture documentation errors | **MINOR** | `golden_case_low.json:53-55`: documented `raw=18, pct=33` but correct values are `raw=17, pct=31`. `golden_case_low.json:59`: `composite_calc` references `pct=33` but correct composite path yields 35. Tests assert correct computed values so scoring is unaffected. |
| Import data validation | **MAJOR BUG** | See ISS-007. `doImport()` at `build_v31.js:808-809` copies all Excel columns directly to API payload with no validation: `for(let k in row) p[k]=row[k]`. Accepts arbitrary keys/values. |

### B3 - Dashboard Correctness

| Check | Result | Evidence |
|-------|--------|----------|
| Province filter | **PASS** | `refreshDash()` line 426: `fh=fh.filter(h=>h.province===pv)`. |
| Level filter | **PASS** | `refreshDash()` line 426: `fh=fh.filter(h=>h.level===lv)`. |
| Round filter | **PASS** | `getLS(AS, rn)` line 425 passes round to `getLS()` which filters `if(rnd&&s.round!==rnd)return`. |
| Summary cards | **PASS** | Lines 427-440: count A/B/C/D, compute average. Matches filter. |
| Radar chart average | **PASS** | Lines 441-442: averages dimension percentages across filtered hospitals with scores. |
| Table sort | **PASS** | `doSort()` line 459 toggles direction. `rows.sort()` line 449 uses `localeCompare('th')` for strings. |
| Best Practice comparison | **MAJOR BUG** | See ISS-002. `openDetail()` line 505 and `loadMyDash()` line 572: filter by `level` but NOT by round. Compares current hospital against best score from ANY round across ALL hospitals at same level. A hospital's best historical score can appear as "best practice" for the current round. |
| Export Excel | **PASS** | `exportDashExcel()` lines 737-752 respects current filter state and includes item-level scores from localStorage cache. |

---

## Task C: Security / PDPA

### C1 - Authentication & Authorization

| Check | Severity | Result | Evidence |
|-------|----------|--------|----------|
| Client-side auth state | **BLOCKER** | **FAIL** | `CU` is a plain global variable (`let CU=null`). Any user can set `CU={role:'admin',username:'x'}` in DevTools to gain admin access. No server-side session token. `build_v31.js:241`. |
| Login via GET | **MAJOR** | **FAIL** | `doLogin()` line 521 calls `gAPI('login',{username:u,password:p})` which appends credentials to URL as query parameters (`build_v31.js:282-284`). Credentials visible in browser history, server logs, and any proxy/CDN logs. |
| Server-side role enforcement | **BLOCKER** | **FAIL** | API `saveScore` action has no server-side check that the requesting user owns the hospital or has the correct role. Any authenticated (or unauthenticated) user who can call the API endpoint can write scores for any hospital. `build_v31.js:664` sends `hospital_code` as a POST field. |
| Import admin guard | **MAJOR** | **FAIL** | `doImport()` at line 804 has NO role check. It relies on UI hiding the Import button for non-admin (`build_v31.js:272`), but the function is globally callable from console. |
| Regional role restrictions | **PASS** | `showPage()` line 266 blocks pageMyDashboard/pageAssessment/pageReport. `startAssess`/`editAssess`/`saveAssess` have explicit guards. |
| Session timeout | **MAJOR** | **FAIL** | No session expiry. `CU` persists until page refresh or manual logout. A hospital user who walks away leaves the session open indefinitely. |
| Predictable passwords | **MAJOR** | **FAIL** | Per `docs/Run.md`, default password pattern is `r7<hospital_code>!`. E.g., hospital 10670 → `r710670!`. Trivially guessable. |

### C2 - Credential & Data Handling

| Check | Severity | Result | Evidence |
|-------|----------|--------|----------|
| API URL exposure | **MINOR** | **FAIL** | Google Apps Script URL hardcoded at `build_v31.js:240`. Visible in source. Anyone can call the endpoint directly. |
| XSS prevention | **PASS** | `esc()` function at line 302 uses `textContent`/`innerHTML` pattern (safe DOM escaping). Applied in table rendering and report display. |
| CORS / Content-Type workaround | **MINOR** | `pAPI()` line 287 uses `Content-Type: text/plain;charset=utf-8` to avoid CORS preflight. Not a vulnerability per se, but bypasses standard CORS protection. |
| localStorage PII | **MINOR** | Scores cached under `r7_scores_<code>_<round>` contain hospital assessment data. No encryption. Accessible to any script on the same origin. Acceptable for GitHub Pages (single-origin, no third-party scripts beyond CDNs). |

### C3 - PDPA & Governance

| Check | Result | Evidence |
|-------|--------|----------|
| Personal data in scores | **PASS** | Score records contain hospital_code, round, item scores, composite. No personal names, IDs, or patient data. |
| Assessor identity in data | **MINOR** | `saveAssess()` payload at line 664 does NOT include `username` or assessor identity. No audit trail of WHO submitted the assessment. |
| Data retention | **NOT IMPLEMENTED** | No data deletion, export, or retention policy mechanism. localStorage persists indefinitely. Google Sheets data has no TTL. |
| Consent mechanism | **N/A** | System handles institutional (hospital) data, not personal data. PDPA consent not strictly required for this data type, but assessor login credentials ARE personal data → password management should comply. |

---

## Task D: Usability (77 Hospital Assessors)

### D1 - Data Update Workflow

| Check | Result | Evidence |
|-------|--------|----------|
| Login → Dashboard → Assess flow | **PASS** | Login (`doLogin` line 524-528) → pageMyDashboard → startAssess → pageAssessment → save → pageReport. Smooth flow. |
| Edit existing assessment | **PASS** | `editAssess()` line 589-597 loads cached scores from localStorage and pre-fills form. |
| Score criteria visibility | **PASS** | `<details>` expandable panels show all 6 levels (0-5) with descriptions. Click-to-select via `pickLv()`. |
| Cat4 auto-select visibility | **PASS** | TOP badge shown on top-2 items via `updLive()` line 649-650. Clear instruction text on the category header. |
| Live composite display | **PASS** | `updLive()` called on every score change via `onSc()`. Shows composite + grade + progress bar. |
| Save feedback | **PASS** | Spinner + message on save. Success/error message displayed. |
| Draft recovery | **FAIL** | See ISS-003. `autoSave()` writes draft to wrong key. No "restore draft?" prompt on page load. |
| Pre-save validation | **MINOR** | No check that all applicable items have been scored. User can submit with empty/incomplete form. Only `date` is validated (`build_v31.js:663`). |

### D2 - Actionable Improvement Guidance

| Check | Result | Evidence |
|-------|--------|----------|
| Strengths list (score 4-5) | **PASS** | `showReport()` lines 698-702 iterates EC, filters sc≥4, shows item code + name + score description. |
| Weaknesses list (score 0-2) | **PASS** | Lines 704-711 iterates EC, filters sc≤2, shows current description. |
| Next-level recommendation | **PASS** | Line 707-708: `const nl=Math.min(sc+1,5)` then shows `it['s'+nl]` (next level's criteria text) as actionable recommendation. |
| Delta comparison | **PASS** | Lines 714-724: finds previous round, computes per-dimension delta with ↑↓ arrows. |
| Report export | **PASS** | `exportRptExcel()` lines 769-788 exports all item scores + summary to Excel. |

---

## Task E: Performance & Reliability

### E1 - File Size & CDN

| Check | Result | Evidence |
|-------|--------|----------|
| File size | **PASS** | 241.8 KB for a complete SPA with embedded data. Acceptable. |
| Tailwind CDN version | **MINOR BUG** | `build_v31.js:14`: `cdn.tailwindcss.com` has no version pin. Could break on Tailwind v4 release. |
| Chart.js CDN | **PASS** | `chart.js@4` — pinned to major version. |
| XLSX CDN | **PASS** | `xlsx@0.18.5` — pinned to exact version. |

### E2 - Error Handling

| Check | Result | Evidence |
|-------|--------|----------|
| API GET error handling | **PASS** | `gAPI()` line 284: try/catch returns `{success:false, error}`. |
| API POST error handling | **PASS** | `pAPI()` line 288: try/catch returns `{success:false, error}`. |
| Save failure: still caches locally | **PASS** | `saveAssess()` line 685 runs `ls(...)` regardless of API result (after the if/else block). |
| API retry/timeout | **FAIL** | No retry logic. No `AbortController` timeout. A slow/dead API will hang the UI indefinitely with the loading spinner. |
| Offline support | **NOT IMPLEMENTED** | No service worker. If offline, API calls fail silently. Historical data (embedded) still works. |

### E3 - XSS / Injection

| Check | Result | Evidence |
|-------|--------|----------|
| User input escaping | **PASS** | `esc()` function used in table rendering. Hospital names and user-visible strings go through `esc()`. |
| Template literal injection | **PASS** | All dynamic values in template literals use `esc()` or `nlbr()` (which calls `esc()` first). |
| Import data injection | **MINOR RISK** | `doImport()` sends raw Excel data to API. If API echoes unescaped data back, XSS possible. Server-side concern. |

---

## Top 10 Risks (Ordered by Severity × Likelihood)

| # | ID | Severity | Risk |
|---|-----|----------|------|
| 1 | ISS-001 | **BLOCKER** | Client-side auth bypass: `CU` variable settable via DevTools → full admin access |
| 2 | ISS-005 | **BLOCKER** | No server-side role enforcement on `saveScore` → any caller can write any hospital's scores |
| 3 | ISS-004 | **MAJOR** | Login credentials sent via GET query string → visible in logs, browser history, proxies |
| 4 | ISS-006 | **MAJOR** | `doImport()` has no admin role check → callable from console by any authenticated user |
| 5 | ISS-002 | **MAJOR** | Best Practice compares across ALL rounds → misleading benchmark data |
| 6 | ISS-008 | **MAJOR** | Level constraint 6.4: non-M1/M2/A hospitals penalized with max Cost=80% instead of adjusted denominator |
| 7 | ISS-009 | **MAJOR** | No session timeout → unattended sessions remain open |
| 8 | ISS-007 | **MAJOR** | Import accepts arbitrary data with no validation → data corruption risk |
| 9 | ISS-003 | **MINOR** | Draft autosave writes to wrong localStorage key → drafts never restored |
| 10 | ISS-010 | **MINOR** | Tailwind CDN unpinned → potential breakage on major version change |
