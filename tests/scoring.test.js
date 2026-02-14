// Unit tests for R7 Assessment scoring logic (v4.0)
// Run: node tests/scoring.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load scoring rules
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'scoring_rules.json'), 'utf8'));

// ==================== Grade System (new thresholds: 90/80/70) ====================
function gradeFromPct(pct) { return pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : 'D'; }
function gradeLabel(g) { return g === 'A' ? 'ดีเยี่ยม' : g === 'B' ? 'ดี (ผ่าน)' : g === 'C' ? 'พอใช้' : 'ต้องปรับปรุง'; }

// ==================== PRIMARY: Category-based weighted 0-100 ====================
function calcCatScores(scores, level) {
  const d = {};
  for (const [k, v] of Object.entries(scores)) {
    if (k.startsWith('i_')) d[k] = Number(v) || 0;
    else if (/^\d+\.\d+$/.test(k)) d['i_' + k.replace('.', '_')] = Number(v) || 0;
  }

  const results = []; let totalRaw = 0, totalMax = 0;

  rules.categories.forEach(cat => {
    let raw = 0, mx = cat.max_score;

    if (cat.id === 4) {
      const c4 = cat.items.map(item => ({ k: item.replace('.', '_'), s: Number(d['i_' + item.replace('.', '_')] || 0) }));
      c4.sort((a, b) => b.s - a.s || (a.k < b.k ? -1 : 1));
      raw = c4[0].s + c4[1].s;
      results.push({ id: cat.id, raw, mx, pct: mx > 0 ? Math.round(raw / mx * 1000) / 10 : 0, top2: [c4[0].k, c4[1].k] });
    } else if (cat.id === 6) {
      const lv64 = !level || (rules.level_constraints['6.4'] || []).includes(level);
      cat.items.forEach(item => {
        const k = item.replace('.', '_');
        if (k === '6_4' && !lv64) { mx -= 5; return; }
        raw += Number(d['i_' + k] || 0);
      });
      results.push({ id: cat.id, raw, mx, pct: mx > 0 ? Math.round(raw / mx * 1000) / 10 : 0 });
    } else {
      cat.items.forEach(item => { raw += Number(d['i_' + item.replace('.', '_')] || 0); });
      results.push({ id: cat.id, raw, mx, pct: mx > 0 ? Math.round(raw / mx * 1000) / 10 : 0 });
    }
    totalRaw += raw; totalMax += mx;
  });

  const wpct = totalMax > 0 ? Math.round(totalRaw / totalMax * 1000) / 10 : 0;
  const grade = gradeFromPct(wpct);
  if (totalRaw > totalMax) totalRaw = totalMax;
  return { categories: results, totalRaw, totalMax, wpct, grade, top2: results.find(c => c.id === 4)?.top2 || [] };
}

// ==================== SECONDARY: 5-Dimension scoring (for radar) ====================
function calcDims(scores) {
  const d = {};
  for (const [k, v] of Object.entries(scores)) {
    if (k.startsWith('i_')) d[k] = Number(v) || 0;
    else if (/^\d+\.\d+$/.test(k)) d['i_' + k.replace('.', '_')] = Number(v) || 0;
  }
  const c4 = ['4_1', '4_2', '4_3', '4_4', '4_5'].map(k => ({ k, s: Number(d['i_' + k] || 0) }));
  c4.sort((a, b) => b.s - a.s || (a.k < b.k ? -1 : 1));
  const top2 = [c4[0].k, c4[1].k];
  let rS = 0; top2.forEach(k => rS += Number(d['i_' + k] || 0)); rS += Number(d.i_5_1 || 0);
  let coS = 0; ['6_1', '6_2', '6_3', '6_4', '6_5'].forEach(k => coS += Number(d['i_' + k] || 0));
  let diS = 0; ['1_3', '1_4', '1_5', '1_6', '3_12', '3_13'].forEach(k => diS += Number(d['i_' + k] || 0));
  let clS = 0; ['3_7', '3_8', '3_9', '3_10', '3_11'].forEach(k => clS += Number(d['i_' + k] || 0));
  let prS = 0; ['1_1', '1_2', '2_1', '2_2', '3_1', '3_2', '3_3', '3_4', '3_5', '3_6', '3_14'].forEach(k => prS += Number(d['i_' + k] || 0));
  const rv = Math.round(rS / 15 * 100), co = Math.round(coS / 25 * 100), di = Math.round(diS / 30 * 100);
  const cl = Math.round(clS / 25 * 100), pr = Math.round(prS / 55 * 100);
  return { revenue: rv, cost: co, discipline: di, collection: cl, process: pr, top2 };
}

// ==================== Test runner ====================
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.error(`  FAIL: ${name}`); console.error(`        ${e.message}`); }
}

console.log('\n=== R7 Scoring Unit Tests (v4.0) ===\n');

// --- Config validation ---
console.log('Config Validation:');

test('Config version is 4.0', () => {
  assert.strictEqual(rules.version, '4.0');
});

test('Config has 33 items', () => {
  assert.strictEqual(rules.items.length, 33);
});

test('Config has 6 categories', () => {
  assert.strictEqual(rules.categories.length, 6);
});

test('Config has 5 dimensions', () => {
  assert.strictEqual(Object.keys(rules.dimensions).length, 5);
});

test('Dimension weights sum to 1.0', () => {
  const sum = Object.values(rules.dimensions).reduce((s, d) => s + d.weight, 0);
  assert.strictEqual(Math.round(sum * 100), 100);
});

test('Config has 4 grade thresholds (new: 90/80/70/0)', () => {
  assert.strictEqual(rules.grades.length, 4);
  assert.strictEqual(rules.grades[0].min_pct, 90);
  assert.strictEqual(rules.grades[1].min_pct, 80);
  assert.strictEqual(rules.grades[2].min_pct, 70);
  assert.strictEqual(rules.grades[3].min_pct, 0);
});

test('Config grade labels are Thai', () => {
  assert.strictEqual(rules.grades[0].label, 'ดีเยี่ยม');
  assert.strictEqual(rules.grades[1].label, 'ดี (ผ่าน)');
  assert.strictEqual(rules.grades[2].label, 'พอใช้');
  assert.strictEqual(rules.grades[3].label, 'ต้องปรับปรุง');
});

test('Pass threshold is 80%', () => {
  assert.strictEqual(rules.pass_threshold_pct, 80);
});

test('Total max raw is 150', () => {
  assert.strictEqual(rules.total_raw_max, 150);
});

test('Category max scores sum to 150', () => {
  const sum = rules.categories.reduce((s, c) => s + c.max_score, 0);
  assert.strictEqual(sum, 150);
});

test('Every item maps to a dimension', () => {
  rules.items.forEach(item => {
    assert.ok(rules.item_dimension_map[item], `Item ${item} has no dimension mapping`);
  });
});

test('6.4 level_constraints defined', () => {
  assert.deepStrictEqual(rules.level_constraints['6.4'], ['M1', 'M2', 'A']);
});

// --- New Grade Threshold Tests (90/80/70) ---
console.log('\nGrade Thresholds (new 90/80/70):');

test('Grade boundary: 100 → A (ดีเยี่ยม)', () => {
  assert.strictEqual(gradeFromPct(100), 'A');
  assert.strictEqual(gradeLabel('A'), 'ดีเยี่ยม');
});

test('Grade boundary: 90 → A', () => {
  assert.strictEqual(gradeFromPct(90), 'A');
});

test('Grade boundary: 89.9 → B', () => {
  assert.strictEqual(gradeFromPct(89.9), 'B');
});

test('Grade boundary: 80 → B (ดี ผ่าน)', () => {
  assert.strictEqual(gradeFromPct(80), 'B');
  assert.strictEqual(gradeLabel('B'), 'ดี (ผ่าน)');
});

test('Grade boundary: 79.9 → C', () => {
  assert.strictEqual(gradeFromPct(79.9), 'C');
});

test('Grade boundary: 70 → C (พอใช้)', () => {
  assert.strictEqual(gradeFromPct(70), 'C');
  assert.strictEqual(gradeLabel('C'), 'พอใช้');
});

test('Grade boundary: 69.9 → D', () => {
  assert.strictEqual(gradeFromPct(69.9), 'D');
});

test('Grade boundary: 0 → D (ต้องปรับปรุง)', () => {
  assert.strictEqual(gradeFromPct(0), 'D');
  assert.strictEqual(gradeLabel('D'), 'ต้องปรับปรุง');
});

// --- Weighted 0-100 Category Scoring ---
console.log('\nWeighted 0-100 (calcCatScores):');

test('All zeros → wpct 0, grade D', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  const r = calcCatScores(scores, 'M1');
  assert.strictEqual(r.wpct, 0);
  assert.strictEqual(r.grade, 'D');
  assert.strictEqual(r.totalRaw, 0);
  assert.strictEqual(r.totalMax, 150);
});

test('All fives → wpct 100, grade A', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'M1');
  assert.strictEqual(r.wpct, 100);
  assert.strictEqual(r.grade, 'A');
  assert.strictEqual(r.totalRaw, 150);
  assert.strictEqual(r.totalMax, 150);
});

test('totalRaw never exceeds totalMax', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'M1');
  assert.ok(r.totalRaw <= r.totalMax, `totalRaw ${r.totalRaw} > totalMax ${r.totalMax}`);
});

test('Category 4 top-2 selection: highest two', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  scores['4.1'] = 5; scores['4.2'] = 3; scores['4.3'] = 4; scores['4.4'] = 1; scores['4.5'] = 2;
  const r = calcCatScores(scores, 'M1');
  assert.deepStrictEqual(r.top2.sort(), ['4_1', '4_3'].sort());
  const cat4 = r.categories.find(c => c.id === 4);
  assert.strictEqual(cat4.raw, 9); // 5+4
  assert.strictEqual(cat4.mx, 10);
});

test('Category 4 tie-breaking: lower item number wins', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  scores['4.1'] = 3; scores['4.2'] = 3; scores['4.3'] = 3; scores['4.4'] = 3; scores['4.5'] = 3;
  const r = calcCatScores(scores, 'M1');
  assert.deepStrictEqual(r.top2, ['4_1', '4_2']);
});

test('Cat4 top-2 only contributes to total (not all 5)', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  scores['4.1'] = 5; scores['4.2'] = 5; scores['4.3'] = 5; scores['4.4'] = 5; scores['4.5'] = 5;
  const r = calcCatScores(scores, 'M1');
  const cat4 = r.categories.find(c => c.id === 4);
  assert.strictEqual(cat4.raw, 10); // only top 2 × 5 = 10
  assert.strictEqual(r.totalRaw, 10);
});

test('Cat4 choose-2: only selected items contribute (simulated by zeroing unselected)', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  // User selects 4.2 and 4.4, scores them 5 each. Others stay 0.
  scores['4.2'] = 5; scores['4.4'] = 5;
  const r = calcCatScores(scores, 'M1');
  assert.deepStrictEqual(r.top2.sort(), ['4_2', '4_4'].sort());
  const cat4 = r.categories.find(c => c.id === 4);
  assert.strictEqual(cat4.raw, 10);
});

// --- 6.4 N/A Denominator Tests ---
console.log('\n6.4 N/A Denominator Adjustment:');

test('Level M1 → 6.4 applies, denominator 25', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'M1');
  const cat6 = r.categories.find(c => c.id === 6);
  assert.strictEqual(cat6.mx, 25);
  assert.strictEqual(r.totalMax, 150);
});

test('Level M2 → 6.4 applies, denominator 25', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'M2');
  const cat6 = r.categories.find(c => c.id === 6);
  assert.strictEqual(cat6.mx, 25);
});

test('Level A → 6.4 applies, denominator 25', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'A');
  const cat6 = r.categories.find(c => c.id === 6);
  assert.strictEqual(cat6.mx, 25);
});

test('Level F1 → 6.4 N/A, denominator 20', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'F1');
  const cat6 = r.categories.find(c => c.id === 6);
  assert.strictEqual(cat6.mx, 20);
  assert.strictEqual(r.totalMax, 145);
});

test('Level F2 → 6.4 N/A, denominator 20', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'F2');
  const cat6 = r.categories.find(c => c.id === 6);
  assert.strictEqual(cat6.mx, 20);
});

test('Level S → 6.4 N/A, denominator 20', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'S');
  const cat6 = r.categories.find(c => c.id === 6);
  assert.strictEqual(cat6.mx, 20);
});

test('6.4 N/A does not penalize: all fives + F2 still 100%', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 5);
  const r = calcCatScores(scores, 'F2');
  assert.strictEqual(r.wpct, 100);
  assert.strictEqual(r.grade, 'A');
});

test('6.4 N/A adjusts pct correctly: F2 with mixed scores', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  scores['6.1'] = 5; scores['6.2'] = 5; scores['6.3'] = 5; scores['6.4'] = 0; scores['6.5'] = 5;
  const r = calcCatScores(scores, 'F2');
  const cat6 = r.categories.find(c => c.id === 6);
  // F2 → 6.4 excluded; raw = 5+5+5+5 = 20, mx = 20, pct = 100
  assert.strictEqual(cat6.raw, 20);
  assert.strictEqual(cat6.mx, 20);
  assert.strictEqual(cat6.pct, 100);
});

// --- Golden Test Case 1: High performer ---
console.log('\nGolden Case 1 (High - Grade A, level M1):');

const case1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fixtures', 'golden_case_high.json'), 'utf8'));
const r1 = calcCatScores(case1.input.scores, case1.hospital.level);
const d1 = calcDims(case1.input.scores);

test('Cat4 top2 = [4_1, 4_5]', () => {
  assert.deepStrictEqual(r1.top2.sort(), case1.expected.cat4_top2.sort());
});

test('totalRaw = 138', () => { assert.strictEqual(r1.totalRaw, case1.expected.total_raw); });
test('totalMax = 150', () => { assert.strictEqual(r1.totalMax, case1.expected.total_max); });
test('wpct = 92.0', () => { assert.strictEqual(r1.wpct, case1.expected.wpct); });
test('grade = A', () => { assert.strictEqual(r1.grade, case1.expected.grade); });

test('Cat1 = 28/30 (93.3%)', () => {
  const c = r1.categories.find(x => x.id === 1);
  assert.strictEqual(c.raw, 28); assert.strictEqual(c.pct, 93.3);
});

test('Cat3 = 64/70 (91.4%)', () => {
  const c = r1.categories.find(x => x.id === 3);
  assert.strictEqual(c.raw, 64); assert.strictEqual(c.pct, 91.4);
});

test('Cat4 = 10/10 (100%)', () => {
  const c = r1.categories.find(x => x.id === 4);
  assert.strictEqual(c.raw, 10); assert.strictEqual(c.pct, 100);
});

test('Cat6 = 23/25 (92%) [M1 → 6.4 applies]', () => {
  const c = r1.categories.find(x => x.id === 6);
  assert.strictEqual(c.raw, 23); assert.strictEqual(c.mx, 25); assert.strictEqual(c.pct, 92);
});

// Dimension secondary checks
test('[secondary] Revenue dim = 93', () => { assert.strictEqual(d1.revenue, 93); });
test('[secondary] Cost dim = 92', () => { assert.strictEqual(d1.cost, 92); });

// --- Golden Test Case 2: Low performer ---
console.log('\nGolden Case 2 (Low - Grade D, level F2):');

const case2 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fixtures', 'golden_case_low.json'), 'utf8'));
const r2 = calcCatScores(case2.input.scores, case2.hospital.level);
const d2 = calcDims(case2.input.scores);

test('Cat4 top2 = [4_1, 4_3]', () => {
  assert.deepStrictEqual(r2.top2.sort(), case2.expected.cat4_top2.sort());
});

test('totalRaw = 47', () => { assert.strictEqual(r2.totalRaw, case2.expected.total_raw); });
test('totalMax = 145 (6.4 N/A)', () => { assert.strictEqual(r2.totalMax, case2.expected.total_max); });
test('wpct = 32.4', () => { assert.strictEqual(r2.wpct, case2.expected.wpct); });
test('grade = D', () => { assert.strictEqual(r2.grade, case2.expected.grade); });

test('Cat6 = 6/20 (30%) [F2 → 6.4 excluded]', () => {
  const c = r2.categories.find(x => x.id === 6);
  assert.strictEqual(c.raw, 6); assert.strictEqual(c.mx, 20); assert.strictEqual(c.pct, 30);
});

test('Cat3 = 22/70 (31.4%)', () => {
  const c = r2.categories.find(x => x.id === 3);
  assert.strictEqual(c.raw, 22); assert.strictEqual(c.pct, 31.4);
});

// Dimension secondary checks
test('[secondary] Revenue dim = 47', () => { assert.strictEqual(d2.revenue, 47); });
test('[secondary] Discipline dim = 30', () => { assert.strictEqual(d2.discipline, 30); });
test('[secondary] Process dim = 31', () => { assert.strictEqual(d2.process, 31); });

// --- Dimension isolation tests (secondary) ---
console.log('\nDimension Isolation (secondary):');

test('Only Revenue items → only Revenue pct > 0', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  scores['4.1'] = 5; scores['4.2'] = 5; scores['5.1'] = 5;
  const r = calcDims(scores);
  assert.strictEqual(r.revenue, 100);
  assert.strictEqual(r.cost, 0);
  assert.strictEqual(r.discipline, 0);
});

test('Only Cost items → only Cost pct > 0', () => {
  const scores = {}; rules.items.forEach(i => scores[i] = 0);
  ['6.1', '6.2', '6.3', '6.4', '6.5'].forEach(k => scores[k] = 5);
  const r = calcDims(scores);
  assert.strictEqual(r.cost, 100);
  assert.strictEqual(r.revenue, 0);
});

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
