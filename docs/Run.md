# Run / Build / Deploy Guide
# R7 Assessment System v3.1

## Prerequisites

- Node.js >= 16
- npm

## Install Dependencies

```bash
cd r7-assessment-v2
npm install
```

## Build

### Step 1: Generate Embedded Data (only if source data changed)

```bash
node generate_embedded.js
```

Reads `criteria_data.json` and `scores_data.json`, produces:
- `embedded_criteria.js` (~72KB) - 33 criteria items
- `embedded_scores.js` (~113KB) - 230 historical records

### Step 2: Build index.html

```bash
node build_v31.js
```

Reads embedded JS files and produces `index.html` (~240KB).

## Run Locally

Just open `index.html` in a browser. No server needed.

For a local dev server:
```bash
npx http-server . -p 8080
```

Then visit `http://localhost:8080`

## Run Tests

```bash
npm test
```

This runs:
1. **Scoring unit tests** (`tests/scoring.test.js`) - Verifies calcDims logic against golden fixtures
2. **Smoke tests** (`tests/smoke.test.js`) - Verifies page structure and key elements

### Test Details

Tests use Node.js built-in `assert` module (no external test framework needed).

```bash
# Run scoring tests only
node tests/scoring.test.js

# Run smoke tests only
node tests/smoke.test.js
```

## Deploy

### GitHub Pages

1. Commit `index.html` to `main` branch
2. Push to GitHub: `git push origin main`
3. GitHub Pages serves `index.html` automatically

```bash
git add index.html
git commit -m "deploy: update v3.1"
git push origin main
```

### Manual Deploy

Copy `index.html` to any static file server. No other files needed for production.

## Login Credentials (Test)

| Username | Password | Role |
|----------|----------|------|
| admin | R7admin2568 | Admin |
| 10670 | R710670 | Hospital (ขอนแก่น) |
| 10708 | R710708 | Hospital (กาฬสินธุ์) |
| regional_kk | R7regional | Regional Viewer (ขอนแก่น) |

## Environment

- **API**: Google Apps Script (auto-deployed)
- **DB**: Google Sheets (managed by admin)
- **CDN**: Tailwind CSS, Chart.js 4.x, SheetJS 0.18.5
