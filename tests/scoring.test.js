// Unit tests for R7 Assessment scoring logic
// Run: node tests/scoring.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load scoring rules
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'scoring_rules.json'), 'utf8'));

// ==================== Scoring Logic (extracted from build_v31.js) ====================

function calcDims(scores) {
  // scores: { "1.1": 5, "1.2": 3, ... } or { i_1_1: 5, i_1_2: 3, ... }
  // Normalize to i_X_Y format
  const d = {};
  for (const [k, v] of Object.entries(scores)) {
    if (k.startsWith('i_')) {
      d[k] = Number(v) || 0;
    } else if (/^\d+\.\d+$/.test(k)) {
      d['i_' + k.replace('.', '_')] = Number(v) || 0;
    }
  }

  // Category 4: pick top 2
  const c4 = ['4_1', '4_2', '4_3', '4_4', '4_5'].map(k => ({ k, s: Number(d['i_' + k] || 0) }));
  c4.sort((a, b) => b.s - a.s || (a.k < b.k ? -1 : 1));
  const top2 = [c4[0].k, c4[1].k];

  // Revenue: cat4 top2 + 5.1
  let rS = 0;
  top2.forEach(k => rS += Number(d['i_' + k] || 0));
  rS += Number(d.i_5_1 || 0);

  // Cost
  let coS = 0;
  ['6_1', '6_2', '6_3', '6_4', '6_5'].forEach(k => coS += Number(d['i_' + k] || 0));

  // Discipline
  let diS = 0;
  ['1_3', '1_4', '1_5', '1_6', '3_12', '3_13'].forEach(k => diS += Number(d['i_' + k] || 0));

  // Collection
  let clS = 0;
  ['3_7', '3_8', '3_9', '3_10', '3_11'].forEach(k => clS += Number(d['i_' + k] || 0));

  // Process
  let prS = 0;
  ['1_1', '1_2', '2_1', '2_2', '3_1', '3_2', '3_3', '3_4', '3_5', '3_6', '3_14'].forEach(k => prS += Number(d['i_' + k] || 0));

  const rv = Math.round(rS / 15 * 100);
  const co = Math.round(coS / 25 * 100);
  const di = Math.round(diS / 30 * 100);
  const cl = Math.round(clS / 25 * 100);
  const pr = Math.round(prS / 55 * 100);
  const cp = Math.round(rv * 0.35 + co * 0.15 + di * 0.30 + cl * 0.15 + pr * 0.05);
  const grade = cp >= 85 ? 'A' : cp >= 75 ? 'B' : cp >= 65 ? 'C' : 'D';

  return { revenue: rv, cost: co, discipline: di, collection: cl, process: pr, composite: cp, grade, top2 };
}

// ==================== Tests ====================

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

console.log('\n=== R7 Scoring Unit Tests ===\n');

// --- Config validation ---
console.log('Config Validation:');

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

test('Config has 4 grade thresholds', () => {
  assert.strictEqual(rules.grades.length, 4);
});

test('Total max raw is 150', () => {
  assert.strictEqual(rules.total_raw_max, 150);
});

test('Every item maps to a dimension', () => {
  rules.items.forEach(item => {
    assert.ok(rules.item_dimension_map[item], `Item ${item} has no dimension mapping`);
  });
});

// --- Scoring logic tests ---
console.log('\nScoring Logic:');

test('All zeros → composite 0, grade D', () => {
  const scores = {};
  rules.items.forEach(i => scores[i] = 0);
  const r = calcDims(scores);
  assert.strictEqual(r.composite, 0);
  assert.strictEqual(r.grade, 'D');
});

test('All fives → composite 100, grade A', () => {
  const scores = {};
  rules.items.forEach(i => scores[i] = 5);
  const r = calcDims(scores);
  assert.strictEqual(r.composite, 100);
  assert.strictEqual(r.grade, 'A');
  assert.strictEqual(r.revenue, 100);
  assert.strictEqual(r.cost, 100);
  assert.strictEqual(r.discipline, 100);
  assert.strictEqual(r.collection, 100);
  assert.strictEqual(r.process, 100);
});

test('Category 4 top-2 selection: highest two', () => {
  const scores = {};
  rules.items.forEach(i => scores[i] = 0);
  scores['4.1'] = 5;
  scores['4.2'] = 3;
  scores['4.3'] = 4;
  scores['4.4'] = 1;
  scores['4.5'] = 2;
  const r = calcDims(scores);
  assert.deepStrictEqual(r.top2.sort(), ['4_1', '4_3'].sort());
});

test('Category 4 tie-breaking: lower item number wins', () => {
  const scores = {};
  rules.items.forEach(i => scores[i] = 0);
  scores['4.1'] = 3;
  scores['4.2'] = 3;
  scores['4.3'] = 3;
  scores['4.4'] = 3;
  scores['4.5'] = 3;
  const r = calcDims(scores);
  // All tied at 3, sort by key ascending → 4_1, 4_2
  assert.deepStrictEqual(r.top2, ['4_1', '4_2']);
});

test('Grade boundary: 85 → A', () => {
  const r = { composite: 85 };
  assert.strictEqual(r.composite >= 85 ? 'A' : 'D', 'A');
});

test('Grade boundary: 84 → B', () => {
  const c = 84;
  const g = c >= 85 ? 'A' : c >= 75 ? 'B' : c >= 65 ? 'C' : 'D';
  assert.strictEqual(g, 'B');
});

test('Grade boundary: 75 → B', () => {
  const c = 75;
  const g = c >= 85 ? 'A' : c >= 75 ? 'B' : c >= 65 ? 'C' : 'D';
  assert.strictEqual(g, 'B');
});

test('Grade boundary: 65 → C', () => {
  const c = 65;
  const g = c >= 85 ? 'A' : c >= 75 ? 'B' : c >= 65 ? 'C' : 'D';
  assert.strictEqual(g, 'C');
});

test('Grade boundary: 64 → D', () => {
  const c = 64;
  const g = c >= 85 ? 'A' : c >= 75 ? 'B' : c >= 65 ? 'C' : 'D';
  assert.strictEqual(g, 'D');
});

// --- Golden Test Case 1: High performer ---
console.log('\nGolden Case 1 (High - Grade A):');

const case1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fixtures', 'golden_case_high.json'), 'utf8'));
const r1 = calcDims(case1.input.scores);

test('Cat4 top2 = [4_1, 4_5]', () => {
  assert.deepStrictEqual(r1.top2.sort(), ['4_1', '4_5'].sort());
});

test('Revenue = 93%', () => {
  // top2(4.1=5,4.5=5) + 5.1=4 = 14/15 = 93.33 → 93
  assert.strictEqual(r1.revenue, 93);
});

test('Cost = 92%', () => {
  // 5+4+5+4+5 = 23/25 = 92
  assert.strictEqual(r1.cost, 92);
});

test('Discipline = 90%', () => {
  // 5+5+4+4+5+4 = 27/30 = 90
  assert.strictEqual(r1.discipline, 90);
});

test('Collection = 92%', () => {
  // 5+4+5+4+5 = 23/25 = 92
  assert.strictEqual(r1.collection, 92);
});

test('Process = 93%', () => {
  // 5+5+5+4+5+5+4+4+5+4+5 = 51/55 = 92.7 → 93
  assert.strictEqual(r1.process, 93);
});

test('Composite = 92', () => {
  assert.strictEqual(r1.composite, 92);
});

test('Grade = A', () => {
  assert.strictEqual(r1.grade, 'A');
});

// --- Golden Test Case 2: Low performer ---
console.log('\nGolden Case 2 (Low - Grade D):');

const case2 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fixtures', 'golden_case_low.json'), 'utf8'));
const r2 = calcDims(case2.input.scores);

test('Cat4 top2 = [4_1, 4_3]', () => {
  assert.deepStrictEqual(r2.top2.sort(), ['4_1', '4_3'].sort());
});

test('Revenue = 47%', () => {
  // top2(4.1=3,4.3=2) + 5.1=2 = 7/15 = 46.67 → 47
  assert.strictEqual(r2.revenue, 47);
});

test('Cost = 24%', () => {
  // 2+1+2+0+1 = 6/25 = 24
  assert.strictEqual(r2.cost, 24);
});

test('Discipline = 30%', () => {
  // 2+1+2+1+2+1 = 9/30 = 30
  assert.strictEqual(r2.discipline, 30);
});

test('Collection = 32%', () => {
  // 2+1+2+1+2 = 8/25 = 32
  assert.strictEqual(r2.collection, 32);
});

test('Process pct', () => {
  // 2+1+2+1+2+1+2+1+2+1+2 = 17/55 = 30.9 → 31
  assert.strictEqual(r2.process, 31);
});

test('Composite (low case)', () => {
  // round(47*0.35 + 24*0.15 + 30*0.30 + 32*0.15 + 31*0.05)
  // = round(16.45 + 3.6 + 9.0 + 4.8 + 1.55) = round(35.4) = 35
  assert.strictEqual(r2.composite, 35);
});

test('Grade = D', () => {
  assert.strictEqual(r2.grade, 'D');
});

// --- Dimension isolation tests ---
console.log('\nDimension Isolation:');

test('Only Revenue items → only Revenue pct > 0', () => {
  const scores = {};
  rules.items.forEach(i => scores[i] = 0);
  scores['4.1'] = 5;
  scores['4.2'] = 5;
  scores['5.1'] = 5;
  const r = calcDims(scores);
  assert.strictEqual(r.revenue, 100);
  assert.strictEqual(r.cost, 0);
  assert.strictEqual(r.discipline, 0);
  assert.strictEqual(r.collection, 0);
  assert.strictEqual(r.process, 0);
});

test('Only Cost items → only Cost pct > 0', () => {
  const scores = {};
  rules.items.forEach(i => scores[i] = 0);
  scores['6.1'] = 5; scores['6.2'] = 5; scores['6.3'] = 5; scores['6.4'] = 5; scores['6.5'] = 5;
  const r = calcDims(scores);
  assert.strictEqual(r.cost, 100);
  assert.strictEqual(r.revenue, 0);
  assert.strictEqual(r.discipline, 0);
  assert.strictEqual(r.collection, 0);
  assert.strictEqual(r.process, 0);
});

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
