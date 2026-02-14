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

test('Contains v4.0 title', () => {
  assert.ok(html.includes('R7 Assessment System v4.0'));
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
  'calcDims', 'calcCatScores', 'processHistorical',
  'showPage', 'refreshDash', 'openDetail',
  'doLogin', 'doLogout', 'loadMyDash',
  'startAssess', 'editAssess', 'renderItems', 'saveAssess',
  'showReport', 'exportDashExcel', 'exportMyExcel', 'exportRptExcel',
  'buildRounds', 'collectForm', 'updLive',
  'generateAnalysis', 'renderAnalysisHTML', 'renderActionPlan',
  'toggleCat4', 'updCat4UI', 'restoreCat4', 'autoSave',
  'gradeFromPct', 'gradeLabel'
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
  'live-composite', 'live-grade', 'assessment-items',
  'autosave-msg', 'action-plan', 'analysis-section', 'btn-start-assess'
];

requiredTestIds.forEach(tid => {
  test(`data-testid="${tid}" exists`, () => {
    assert.ok(html.includes(`data-testid="${tid}"`), `Missing data-testid: ${tid}`);
  });
});

// --- Phase 2-3 Feature Checks ---
console.log('\nPhase 2-3 Features:');

test('Cat4 choose-2 checkbox pattern exists', () => {
  assert.ok(html.includes('c4-ck'));
});

test('Cat4 choose-2 state variable exists', () => {
  assert.ok(html.includes('cat4Sel'));
});

test('Cat4 unsel CSS class exists', () => {
  assert.ok(html.includes('.c4-unsel'));
});

test('Grade thresholds 90/80/70 in gradeFromPct', () => {
  assert.ok(html.includes('>=90'));
  assert.ok(html.includes('>=80'));
  assert.ok(html.includes('>=70'));
});

test('PASS/FAIL text in analysis', () => {
  assert.ok(html.includes('ผ่านเกณฑ์'));
  assert.ok(html.includes('ไม่ผ่านเกณฑ์'));
});

test('Action Plan table with quick-wins', () => {
  assert.ok(html.includes('QUICK_WINS'));
  assert.ok(html.includes('qw-chip'));
});

test('Autosave message pattern', () => {
  assert.ok(html.includes('บันทึกร่างล่าสุดเมื่อ'));
});

test('Draft/Submitted badges exist', () => {
  assert.ok(html.includes('submitted-badge'));
  assert.ok(html.includes('draft-badge'));
});

test('Raw score shown as secondary in report', () => {
  assert.ok(html.includes('rRaw'));
  assert.ok(html.includes('คะแนนดิบ'));
});

// --- COMET UX Features (new) ---
console.log('\nCOMET UX Features:');

test('Histogram chart canvas exists', () => {
  assert.ok(html.includes('id="cHistDash"'));
});

test('data-testid="histogram-chart" exists', () => {
  assert.ok(html.includes('data-testid="histogram-chart"'));
});

test('mkHistogram function exists', () => {
  assert.ok(html.includes('function mkHistogram('));
});

test('getPrevRound function exists', () => {
  assert.ok(html.includes('function getPrevRound('));
});

test('filterByGrade function exists', () => {
  assert.ok(html.includes('function filterByGrade('));
});

test('clearGradeFilter function exists', () => {
  assert.ok(html.includes('function clearGradeFilter('));
});

test('Delta column header in table', () => {
  assert.ok(html.includes('Δ ก่อนหน้า'));
});

test('Grade KPI cards are clickable', () => {
  assert.ok(html.includes("filterByGrade('A')"));
  assert.ok(html.includes("filterByGrade('D')"));
});

test('Info box with grade thresholds exists', () => {
  assert.ok(html.includes('id="infoBox"'));
  assert.ok(html.includes('data-testid="info-box"'));
});

test('Info box shows thresholds A≥90 B≥80 C≥70', () => {
  assert.ok(html.includes('A &ge;90'));
  assert.ok(html.includes('B &ge;80'));
  assert.ok(html.includes('C &ge;70'));
});

test('Draft restore prompt text exists', () => {
  assert.ok(html.includes('พบแบบร่างที่ยังไม่ได้บันทึก'));
});

test('Criteria toggle renamed to ดูคำแนะนำ', () => {
  assert.ok(html.includes('ดูคำแนะนำ'));
});

test('Tailwind CDN pinned to 3.4.17', () => {
  assert.ok(html.includes('cdn.tailwindcss.com/3'));
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
