# Architecture
# R7 Assessment System v3.1

## 1. High-Level Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser     │────▶│  GitHub      │     │  Google Apps  │
│  (index.html)│     │  Pages       │     │  Script API   │
│              │◀────│  (static)    │     │  + Sheets DB  │
│  localStorage│     └──────────────┘     └──────┬───────┘
│  (cache)     │──────────────────────────────────┘
└─────────────┘           fetch (GET/POST)
```

## 2. Single-File Architecture

Everything is in `index.html` (~240KB):
- HTML structure (pages as hidden `<div>`)
- CSS (Tailwind CDN + inline styles)
- JavaScript (all logic inline)
- Embedded data constants (EC: criteria, HS: historical scores)

### Why Single File?
- Deployed on GitHub Pages (static hosting)
- No build step for deployment (just push)
- No server-side rendering needed
- Simplifies deployment for non-technical admins

## 3. Build Pipeline

```
criteria_data.json ──┐
                     ├──▶ generate_embedded.js ──▶ embedded_criteria.js ─┐
R7_template_v9.xlsx ─┘                           embedded_scores.js  ──┤
                                                                        ├──▶ build_v31.js ──▶ index.html
scores_data.json ────────────────────────────────────────────────────────┘
```

### Build Steps:
1. `node generate_embedded.js` - Convert JSON data → compact JS constants
2. `node build_v31.js` - Combine template + data → index.html

## 4. Page Navigation (SPA)

Client-side routing via `showPage(id)`:

```
pageDashboard ──────── Public (default)
pageHospitalDetail ─── Public (drill-down)
pageLogin ─────────── Auth
pageMyDashboard ────── Assessor/Hospital
pageAssessment ─────── Assessor/Hospital
pageReport ────────── Assessor/Hospital
```

All pages are `<div>` elements toggled via `.hidden` class.

## 5. Data Flow

### 5.1 Initialization
```
DOMContentLoaded
  ├── processHistorical() → convert HS → AS format
  ├── Cache HS item scores to localStorage
  ├── Build hospital map from HS
  ├── fetch API (getHospitals + getAllScores) in parallel
  ├── Merge API data with historical
  ├── populateRoundSelectors()
  └── refreshDash()
```

### 5.2 Assessment Save
```
saveAssess()
  ├── collectForm() → form data
  ├── calcDims(data) → dimensions + composite + grade
  ├── Build payload with all item scores
  ├── POST to API (saveScore)
  ├── Cache to localStorage
  ├── Refresh global scores
  └── showReport(data, dims)
```

## 6. Key Functions

| Function | Purpose |
|----------|---------|
| `calcDims(d)` | Calculate 5 dimensions + composite from form data |
| `calcDimsFromRec(d)` | Same calculation from HS record format |
| `processHistorical()` | Convert HS → AS format |
| `refreshDash()` | Rebuild dashboard from filtered data |
| `openDetail(code)` | Show hospital detail panel |
| `renderItems()` | Build assessment form UI |
| `saveAssess()` | Save assessment + show report |
| `showReport(d, dm)` | Render report with strengths/weaknesses |
| `showPage(id)` | SPA navigation |

## 7. Authorization Model

```
showPage(id):
  btnLogin:   visible if !CU (not logged in)
  btnLogout:  visible if CU
  btnMyDash:  visible if CU && role !== 'admin'
  btnImport:  visible if CU && role === 'admin' && page === 'pageDashboard'
```

Role enforcement in code:
- **Admin**: Access all pages + Import Excel
- **Hospital/Assessor**: Access myDashboard, assessment, report (own hospital only)
- **Regional**: Access dashboard (filtered by province), no assessment

## 8. External Dependencies (CDN)

| Library | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | latest | Styling |
| Chart.js | 4.x | Radar + Doughnut charts |
| SheetJS (xlsx) | 0.18.5 | Excel import/export |

## 9. Storage Strategy

| Store | Data | Lifetime |
|-------|------|----------|
| Embedded JS (EC) | Criteria definitions | Static (build-time) |
| Embedded JS (HS) | Historical scores | Static (build-time) |
| API (Google Sheets) | Live scores, hospitals, users | Persistent |
| localStorage | Cached scores, drafts | Per-browser |

## 10. File Structure

```
r7-assessment-v2/
├── index.html              # Main application (deployed)
├── build_v31.js            # Build script (generates index.html)
├── generate_embedded.js    # Data extraction script
├── embedded_criteria.js    # Generated: criteria data
├── embedded_scores.js      # Generated: historical scores
├── criteria_data.json      # Source: criteria from template
├── scores_data.json        # Source: scores from Excel
├── config/
│   └── scoring_rules.json  # Config-driven scoring rules
├── data/
│   └── fixtures/           # Golden test cases
├── docs/
│   ├── PRD.md
│   ├── ScoringSpec.md
│   ├── DataSchema.md
│   ├── Architecture.md
│   ├── Run.md
│   ├── Risk_PDPA_Security.md
│   └── UIMap.md
├── tests/
│   ├── scoring.test.js     # Unit tests for scoring logic
│   └── smoke.test.js       # Smoke tests for page rendering
├── package.json
└── .gitignore
```
