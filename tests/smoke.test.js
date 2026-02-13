// Smoke tests for R7 Assessment System
// Verifies the built index.html has the expected structure
// Run: node tests/smoke.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`        ${e.message}`);
  }
}

console.log('\n=== R7 Smoke Tests ===\n');

// Check index.html exists
test('index.html exists', () => {
  assert.ok(fs.existsSync(htmlPath), 'index.html not found');
});

const html = fs.readFileSync(htmlPath, 'utf8');

// --- Structure tests ---
console.log('Structure:');

test('Valid HTML5 doctype', () => {
  assert.ok(html.startsWith('<!DOCTYPE html>'));
});

test('Contains v3.1 title', () => {
  assert.ok(html.includes('R7 Assessment System v3.1'));
});

test('Includes Tailwind CSS CDN', () => {
  assert.ok(html.includes('cdn.tailwindcss.com'));
});

test('Includes Chart.js CDN', () => {
  assert.ok(html.includes('chart.js'));
});

test('Includes XLSX CDN', () => {
  assert.ok(html.includes('xlsx'));
});

// --- Page elements ---
console.log('\nPages:');

test('pageDashboard exists', () => {
  assert.ok(html.includes('id="pageDashboard"'));
});

test('pageHospitalDetail exists', () => {
  assert.ok(html.includes('id="pageHospitalDetail"'));
});

test('pageLogin exists', () => {
  assert.ok(html.includes('id="pageLogin"'));
});

test('pageMyDashboard exists', () => {
  assert.ok(html.includes('id="pageMyDashboard"'));
});

test('pageAssessment exists', () => {
  assert.ok(html.includes('id="pageAssessment"'));
});

test('pageReport exists', () => {
  assert.ok(html.includes('id="pageReport"'));
});

// --- Embedded data ---
console.log('\nEmbedded Data:');

test('EC (criteria) constant embedded', () => {
  assert.ok(html.includes('const EC='));
});

test('HS (historical scores) constant embedded', () => {
  assert.ok(html.includes('const HS='));
});

test('CATS constant defined', () => {
  assert.ok(html.includes('const CATS='));
});

// --- Key functions ---
console.log('\nKey Functions:');

const requiredFunctions = [
  'calcDims', 'calcDimsFromRec', 'processHistorical',
  'showPage', 'refreshDash', 'openDetail',
  'doLogin', 'doLogout', 'loadMyDash',
  'startAssess', 'editAssess', 'renderItems', 'saveAssess',
  'showReport', 'exportDashExcel', 'exportMyExcel', 'exportRptExcel',
  'buildRounds', 'collectForm', 'updLive'
];

requiredFunctions.forEach(fn => {
  test(`Function ${fn}() exists`, () => {
    assert.ok(html.includes(`function ${fn}(`), `Missing function: ${fn}`);
  });
});

// --- UI elements ---
console.log('\nUI Elements:');

const requiredIds = [
  'loadOverlay', 'loadMsg',
  'headerUser', 'btnMyDash', 'btnLogin', 'btnLogout', 'btnImport',
  'sumTotal', 'sumA', 'sumB', 'sumC', 'sumD', 'sumAvg',
  'fProv', 'fLev', 'fRnd',
  'cRadarDash', 'cDonutDash', 'tblBody',
  'dName', 'dComp', 'dGrade', 'cRadarDet', 'dCatBars', 'dHist', 'dBest',
  'inUser', 'inPass', 'loginErr', 'btnDoLogin', 'loginSpinner',
  'mName', 'mComp', 'mGrade', 'cRadarMy', 'mHist', 'mBest',
  'aRound', 'aDate', 'lComp', 'lGrd', 'aBar', 'aProg', 'aItems',
  'btnSave', 'saveSpinner', 'saveMsg',
  'rSub', 'rComp', 'rGrade', 'cRadarRpt', 'rStr', 'rWeak', 'rDelta',
  'importModal', 'impFile', 'impPrev'
];

requiredIds.forEach(id => {
  test(`Element #${id} exists`, () => {
    assert.ok(html.includes(`id="${id}"`), `Missing element: #${id}`);
  });
});

// --- data-testid attributes ---
console.log('\nData-testid Attributes:');

const requiredTestIds = [
  'page-dashboard', 'page-hospital-detail', 'page-login',
  'page-my-dashboard', 'page-assessment', 'page-report',
  'btn-login', 'btn-logout', 'btn-my-dash',
  'btn-save-assessment', 'btn-export-dash',
  'filter-province', 'filter-level', 'filter-round',
  'summary-total', 'summary-grade-a', 'summary-grade-b',
  'hospital-table-body', 'login-username', 'login-password',
  'live-composite', 'live-grade', 'assessment-items'
];

requiredTestIds.forEach(tid => {
  test(`data-testid="${tid}" exists`, () => {
    assert.ok(html.includes(`data-testid="${tid}"`), `Missing data-testid: ${tid}`);
  });
});

// --- Authorization ---
console.log('\nAuthorization:');

test('Role check for admin in showPage', () => {
  assert.ok(html.includes("role==='admin'") || html.includes('role==="admin"'));
});

test('Role check for btnImport visibility', () => {
  assert.ok(html.includes('btnImport'));
});

test('Regional role handling exists', () => {
  assert.ok(html.includes("regional") || html.includes("'regional'"));
});

// --- Security ---
console.log('\nSecurity:');

test('XSS escape function exists', () => {
  assert.ok(html.includes('function esc('));
});

test('Loading overlay exists', () => {
  assert.ok(html.includes('overlay-loader'));
});

test('pAPI error handling returns success:false', () => {
  assert.ok(html.includes('success:false'));
});

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
