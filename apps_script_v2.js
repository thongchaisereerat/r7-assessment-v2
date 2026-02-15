// ==================== CONFIG ====================
const SHEET_ID = '1kn2roZuXOFXg5N2o_cqUGi72aNA2ke2hpv2smHADhgE';

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

// Item columns in the scores sheet (header names)
const ITEMS = ['1.1','1.2','1.3','1.4','1.5','1.6','2.1','2.2',
  '3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','3.9','3.10','3.11','3.12','3.13','3.14',
  '4.1','4.2','4.3','4.4','4.5','5.1','6.1','6.2','6.3','6.4','6.5'];

// ==================== MAIN HANDLER ====================
function doGet(e) {
  const action = e.parameter.action || 'test';
  let result;

  try {
    switch(action) {
      case 'test':
        result = { success: true, message: 'API is working!', timestamp: new Date().toISOString() };
        break;
      case 'login':
        result = login(e.parameter.username, e.parameter.password);
        break;
      case 'getHospital':
        result = getHospital(e.parameter.code);
        break;
      case 'getHospitals':
        result = getHospitals();
        break;
      case 'getCriteria':
        result = getCriteria();
        break;
      case 'getScores':
        result = getScores(e.parameter.hospital_code);
        break;
      case 'getAllScores':
        result = getAllScores();
        break;
      case 'getBestPractice':
        result = getBestPractice(e.parameter.level);
        break;
      case 'saveScore':
        // รับ data จาก URL parameter (GET)
        var scoreData = JSON.parse(e.parameter.data || '{}');
        result = saveScore(scoreData);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result;
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'saveScore') {
      result = saveScore(data);
    } else {
      result = { success: false, error: 'Unknown action' };
    }
  } catch(err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== AUTH ====================
function login(username, password) {
  const sheet = getSheet('users');
  if (!sheet) {
    // Auto-generate from hospitals sheet
    const hospitals = getSheet('hospitals');
    const hData = hospitals.getDataRange().getValues();
    for (let i = 1; i < hData.length; i++) {
      const code = String(hData[i][0]);
      if (code === String(username) && ('R7' + code) === String(password)) {
        return {
          success: true,
          user: { username: code, role: 'hospital', hospital_code: code }
        };
      }
    }
    if (username === 'admin' && password === 'R7admin2568') {
      return { success: true, user: { username: 'admin', role: 'admin', hospital_code: '' } };
    }
    return { success: false, error: 'Invalid username or password' };
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) == String(username) && String(data[i][1]) == String(password)) {
      return {
        success: true,
        user: {
          username: String(data[i][0]),
          role: data[i][2] || 'hospital',
          hospital_code: String(data[i][3] || data[i][0])
        }
      };
    }
  }

  // Fallback: auto-generate from hospitals
  const hospitals = getSheet('hospitals');
  const hData = hospitals.getDataRange().getValues();
  for (let i = 1; i < hData.length; i++) {
    const code = String(hData[i][0]);
    if (code === String(username) && ('R7' + code) === String(password)) {
      return {
        success: true,
        user: { username: code, role: 'hospital', hospital_code: code }
      };
    }
  }

  return { success: false, error: 'Invalid username or password' };
}

// ==================== HOSPITALS ====================
function getHospital(code) {
  const sheet = getSheet('hospitals');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(code)) {
      return {
        success: true,
        hospital: {
          code: data[i][0],
          name: data[i][1],
          province_code: data[i][2],
          province: data[i][3],
          level: data[i][4]
        }
      };
    }
  }
  return { success: false, error: 'Hospital not found' };
}

function getHospitals() {
  const sheet = getSheet('hospitals');
  const data = sheet.getDataRange().getValues();
  const hospitals = [];

  for (let i = 1; i < data.length; i++) {
    hospitals.push({
      code: data[i][0],
      name: data[i][1],
      province_code: data[i][2],
      province: data[i][3],
      level: data[i][4]
    });
  }
  return { success: true, hospitals: hospitals };
}

// ==================== CRITERIA ====================
function getCriteria() {
  const sheet = getSheet('criteria');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const criteria = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    criteria.push(row);
  }
  return { success: true, criteria: criteria };
}

// ==================== SCORES ====================
function getScores(hospitalCode) {
  const sheet = getSheet('scores');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const scores = [];

  // Find hcode column
  const hcodeCol = headers.indexOf('hcode');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][hcodeCol >= 0 ? hcodeCol : 1]) === String(hospitalCode)) {
      const row = sheetRowToApi(headers, data[i]);
      scores.push(row);
    }
  }
  return { success: true, scores: scores };
}

function getAllScores() {
  const sheet = getSheet('scores');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const scores = [];

  for (let i = 1; i < data.length; i++) {
    // Skip empty rows
    if (!data[i][0] && !data[i][1]) continue;
    const row = sheetRowToApi(headers, data[i]);
    scores.push(row);
  }
  return { success: true, scores: scores };
}

// Convert sheet row → API format (hcode → hospital_code, 1.1 → item_1_1)
function sheetRowToApi(headers, rowData) {
  const result = {};
  for (let j = 0; j < headers.length; j++) {
    const h = String(headers[j]);
    const v = rowData[j];

    if (h === 'hcode') {
      result['hospital_code'] = v;
    } else if (/^\d+\.\d+$/.test(h)) {
      // Score column like "1.1" → "item_1_1"
      result['item_' + h.replace('.', '_')] = v;
    } else {
      result[h] = v;
    }
  }
  // Ensure wpct exists (from composite)
  if (result.wpct === undefined && result.composite !== undefined) {
    result.wpct = Number(result.composite);
  }
  return result;
}

// ==================== SAVE SCORE ====================
function saveScore(data) {
  const sheet = getSheet('scores');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Look up hospital info
  const hInfo = lookupHospital(data.hospital_code);

  // Build row data mapped to sheet headers
  const rowData = {};

  // Clean round (remove leading apostrophe if present)
  rowData['round'] = String(data.round || '').replace(/^'/, '');
  rowData['hcode'] = String(data.hospital_code || '');
  rowData['hname'] = hInfo ? hInfo.name : '';
  rowData['province'] = hInfo ? hInfo.province : '';
  rowData['level'] = hInfo ? hInfo.level : '';
  rowData['group'] = hInfo ? hInfo.group : '';
  rowData['date'] = data.date || '';

  // Map item scores: item_X_Y → X.Y
  ITEMS.forEach(function(item) {
    var key = 'item_' + item.replace('.', '_');
    rowData[item] = data[key] !== undefined ? Number(data[key]) : '';
  });

  // Calculate raw_total (sum all items, for cat4 use all 5)
  var rawTotal = 0;
  ITEMS.forEach(function(item) {
    if (rowData[item] !== '') rawTotal += Number(rowData[item]);
  });
  rowData['raw_total'] = rawTotal;

  // Calculate category sums
  rowData['c1'] = sumItems(rowData, ['1.1','1.2','1.3','1.4','1.5','1.6']);
  rowData['c2'] = sumItems(rowData, ['2.1','2.2']);
  rowData['c3'] = sumItems(rowData, ['3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','3.9','3.10','3.11','3.12','3.13','3.14']);
  rowData['c4'] = sumItems(rowData, ['4.1','4.2','4.3','4.4','4.5']);
  rowData['c5'] = sumItems(rowData, ['5.1']);
  rowData['c6'] = sumItems(rowData, ['6.1','6.2','6.3','6.4','6.5']);

  // Composite + grade (from client or recalculate)
  var dims = calculateDimensions(data);
  rowData['composite'] = dims.composite;
  rowData['grade'] = dims.grade;
  rowData['pass_status'] = dims.composite >= 80 ? 1 : 0;

  // Dimension scores
  rowData['dim_revenue'] = dims.revenue;
  rowData['dim_cost'] = dims.cost;
  rowData['dim_discipline'] = dims.discipline;
  rowData['dim_collection'] = dims.collection;
  rowData['dim_process'] = dims.process;

  // Metadata
  rowData['cat4_selected'] = data.cat4_selected || '';
  rowData['submitted_by'] = data.submitted_by || '';
  rowData['submitted_at'] = data.submitted_at || new Date().toISOString();
  rowData['updated_at'] = new Date().toISOString();

  // Build the row array matching headers
  var newRow = headers.map(function(h) {
    return rowData[h] !== undefined ? rowData[h] : (data[h] || '');
  });

  // Check for existing entry (same hcode + round) → update instead of duplicate
  var allData = sheet.getDataRange().getValues();
  var roundCol = headers.indexOf('round');
  var hcodeCol = headers.indexOf('hcode');
  var existingRow = -1;

  if (roundCol >= 0 && hcodeCol >= 0) {
    for (var i = 1; i < allData.length; i++) {
      if (String(allData[i][hcodeCol]) === String(data.hospital_code) &&
          String(allData[i][roundCol]) === rowData['round']) {
        existingRow = i + 1; // 1-indexed in Sheets
        break;
      }
    }
  }

  if (existingRow > 0) {
    // Update existing row
    sheet.getRange(existingRow, 1, 1, headers.length).setValues([newRow]);
  } else {
    // Append new row
    sheet.appendRow(newRow);
  }

  return {
    success: true,
    message: 'บันทึกสำเร็จ',
    updated: existingRow > 0,
    hospital_code: data.hospital_code,
    round: rowData['round'],
    composite: dims.composite,
    grade: dims.grade
  };
}

function lookupHospital(code) {
  var sheet = getSheet('hospitals');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(code)) {
      return {
        code: data[i][0],
        name: data[i][1],
        province: data[i][3],
        level: data[i][4],
        group: data[i][5] || ''
      };
    }
  }
  return null;
}

function sumItems(rowData, items) {
  var total = 0;
  items.forEach(function(item) {
    if (rowData[item] !== '' && rowData[item] !== undefined) {
      total += Number(rowData[item]);
    }
  });
  return total;
}

function calculateDimensions(data) {
  // Revenue: cat4 top 2 + 5.1
  var cat4Selected = (data.cat4_selected || '').split(',').map(function(s) { return s.trim(); });
  var revenueSum = 0;
  var revenueMax = 15; // 2 items from cat4 (10) + 5.1 (5)

  ['4_1','4_2','4_3','4_4','4_5'].forEach(function(item) {
    if (cat4Selected.indexOf(item.replace('_','.')) >= 0) {
      revenueSum += Number(data['item_' + item] || 0);
    }
  });
  revenueSum += Number(data.item_5_1 || 0);

  // Cost: 6.1-6.5
  var costSum = 0;
  var costMax = 25;
  ['6_1','6_2','6_3','6_4','6_5'].forEach(function(item) {
    costSum += Number(data['item_' + item] || 0);
  });

  // Discipline: 1.3-1.6, 3.12, 3.13
  var discSum = 0;
  var discMax = 30;
  ['1_3','1_4','1_5','1_6','3_12','3_13'].forEach(function(item) {
    discSum += Number(data['item_' + item] || 0);
  });

  // Collection: 3.7-3.11
  var collSum = 0;
  var collMax = 25;
  ['3_7','3_8','3_9','3_10','3_11'].forEach(function(item) {
    collSum += Number(data['item_' + item] || 0);
  });

  // Process: 1.1, 1.2, 2.1, 2.2, 3.1-3.6, 3.14
  var procSum = 0;
  var procMax = 55;
  ['1_1','1_2','2_1','2_2','3_1','3_2','3_3','3_4','3_5','3_6','3_14'].forEach(function(item) {
    procSum += Number(data['item_' + item] || 0);
  });

  // Calculate percentages
  var revenue = revenueMax > 0 ? Math.round((revenueSum / revenueMax) * 100) : 0;
  var cost = costMax > 0 ? Math.round((costSum / costMax) * 100) : 0;
  var discipline = discMax > 0 ? Math.round((discSum / discMax) * 100) : 0;
  var collection = collMax > 0 ? Math.round((collSum / collMax) * 100) : 0;
  var process = procMax > 0 ? Math.round((procSum / procMax) * 100) : 0;

  // Weighted composite (Revenue 35%, Discipline 30%, Cost 15%, Collection 15%, Process 5%)
  var composite = Math.round(
    revenue * 0.35 +
    discipline * 0.30 +
    cost * 0.15 +
    collection * 0.15 +
    process * 0.05
  );

  // Grade
  var grade = 'D';
  if (composite >= 90) grade = 'A';
  else if (composite >= 80) grade = 'B';
  else if (composite >= 70) grade = 'C';

  // Total raw
  var totalRaw = 0;
  for (var key in data) {
    if (key.indexOf('item_') === 0) {
      totalRaw += Number(data[key] || 0);
    }
  }

  return { revenue: revenue, cost: cost, discipline: discipline, collection: collection, process: process, composite: composite, grade: grade, total_raw: totalRaw };
}

// ==================== BEST PRACTICE ====================
function getBestPractice(level) {
  var scoresSheet = getSheet('scores');
  var hospitalsSheet = getSheet('hospitals');

  var scoresData = scoresSheet.getDataRange().getValues();
  var hospitalsData = hospitalsSheet.getDataRange().getValues();

  var hospitalLevels = {};
  for (var i = 1; i < hospitalsData.length; i++) {
    hospitalLevels[hospitalsData[i][0]] = hospitalsData[i][4];
  }

  var bestScore = null;
  var bestComposite = 0;

  var headers = scoresData[0];
  var compositeIdx = headers.indexOf('composite');
  var hcodeIdx = headers.indexOf('hcode');

  for (var i = 1; i < scoresData.length; i++) {
    var code = scoresData[i][hcodeIdx >= 0 ? hcodeIdx : 1];
    var hLevel = hospitalLevels[code];

    if (hLevel === level) {
      var comp = Number(scoresData[i][compositeIdx >= 0 ? compositeIdx : 0] || 0);
      if (comp > bestComposite) {
        bestComposite = comp;
        bestScore = sheetRowToApi(headers, scoresData[i]);
      }
    }
  }

  return { success: true, bestPractice: bestScore };
}
