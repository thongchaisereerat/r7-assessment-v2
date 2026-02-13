// Generate compact embedded JS data from JSON extracts
const fs = require('fs');

// === CRITERIA ===
const crit = JSON.parse(fs.readFileSync('./criteria_data.json','utf8'));

// Item order: 1.1-1.6, 2.1-2.2, 3.1-3.14, 4.1-4.5, 5.1, 6.1-6.5
const dimMap = {
  '1.1':'Process','1.2':'Process','1.3':'Discipline','1.4':'Discipline','1.5':'Discipline','1.6':'Discipline',
  '2.1':'Process','2.2':'Process',
  '3.1':'Process','3.2':'Process','3.3':'Process','3.4':'Process','3.5':'Process','3.6':'Process',
  '3.7':'Collection','3.8':'Collection','3.9':'Collection','3.10':'Collection','3.11':'Collection',
  '3.12':'Discipline','3.13':'Discipline','3.14':'Process',
  '4.1':'Revenue','4.2':'Revenue','4.3':'Revenue','4.4':'Revenue','4.5':'Revenue',
  '5.1':'Revenue',
  '6.1':'Cost','6.2':'Cost','6.3':'Cost','6.4':'Cost','6.5':'Cost'
};
const lcMap = {'6.4':'M1,M2,A'};

const items = [];
crit.categories.forEach(cat => {
  cat.items.forEach(it => {
    const num = it.item_number;
    const catNum = parseInt(num.split('.')[0]);
    items.push({
      c: num,
      n: it.item_name.replace(/\n/g,' ').trim(),
      cat: catNum,
      dim: dimMap[num] || 'Process',
      s0: (it.scores.score_0||'').replace(/\n/g,'\\n').trim(),
      s1: (it.scores.score_1||'').replace(/\n/g,'\\n').trim(),
      s2: (it.scores.score_2||'').replace(/\n/g,'\\n').trim(),
      s3: (it.scores.score_3||'').replace(/\n/g,'\\n').trim(),
      s4: (it.scores.score_4||'').replace(/\n/g,'\\n').trim(),
      s5: (it.scores.score_5||'').replace(/\n/g,'\\n').trim(),
      cs: (it.concept_standard||'').replace(/\n/g,'\\n').trim(),
      ev: (it.evidence_requirements||'').replace(/\n/g,'\\n').trim(),
      rg: (it.regulations||'').replace(/\n/g,'\\n').trim(),
      lc: lcMap[num] || 'ALL'
    });
  });
});

// === SCORES ===
const scores = JSON.parse(fs.readFileSync('./scores_data.json','utf8'));
const scoreKeys = scores.metadata.scoreColumns; // 33 columns
const itemCodes = ['1.1','1.2','1.3','1.4','1.5','1.6','2.1','2.2','3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','3.9','3.10','3.11','3.12','3.13','3.14','4.1','4.2','4.3','4.4','4.5','5.1','6.1','6.2','6.3','6.4','6.5'];

const hScores = scores.records.map(r => {
  const itemScores = {};
  scoreKeys.forEach((col,i) => {
    const code = itemCodes[i];
    const key = 'i_' + code.replace('.','_');
    itemScores[key] = r[col] !== undefined && r[col] !== null && r[col] !== '' ? Number(r[col]) : 0;
  });
  return {
    r: r['รอบตรวจราชการ'] || (r['รอบที่'] + '/' + r['ปีงบประมาณ']),
    h: r['รหัสรพ'],
    hn: r['ชื่อรพ'],
    pv: r['จังหวัด'],
    ts: r['คะแนนรวม'] || 0,
    pct: r['ร้อยละคะแนน'] || 0,
    pass: r['ผ่านเกณฑ์'] === 'ผ่าน',
    c1: r['หมวด1_การนำและวางแผน'] || 0,
    c2: r['หมวด2_เวชระเบียน'] || 0,
    c3: r['หมวด3_ศูนย์จัดเก็บ'] || 0,
    c4: r['หมวด4_แผนธุรกิจ'] || 0,
    c5: r['หมวด5_PPFeeSchedule'] || 0,
    c6: r['หมวด6_ควบคุมรายจ่าย'] || 0,
    ...itemScores
  };
});

// Write outputs
fs.writeFileSync('./embedded_criteria.js', 'const EC=' + JSON.stringify(items, null, 0) + ';\n');
fs.writeFileSync('./embedded_scores.js', 'const HS=' + JSON.stringify(hScores, null, 0) + ';\n');

console.log(`Generated ${items.length} criteria items`);
console.log(`Generated ${hScores.length} score records`);
console.log(`Criteria JS size: ${(fs.statSync('./embedded_criteria.js').size/1024).toFixed(1)}KB`);
console.log(`Scores JS size: ${(fs.statSync('./embedded_scores.js').size/1024).toFixed(1)}KB`);
