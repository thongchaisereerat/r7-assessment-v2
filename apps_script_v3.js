// ==================== CONFIG ====================
const SHEET_ID = '1kn2roZuXOFXg5N2o_cqUGi72aNA2ke2hpv2smHADhgE';

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

// Item columns in the scores sheet (header names)
const ITEMS = ['1.1','1.2','1.3','1.4','1.5','1.6','2.1','2.2',
  '3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','3.9','3.10','3.11','3.12','3.13','3.14',
  '4.1','4.2','4.3','4.4','4.5','5.1','6.1','6.2','6.3','6.4','6.5'];

// ==================== HELPERS ====================
// Sanitize: replace NaN/Infinity/undefined with 0 for numeric, '' for string
function sanitize(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return 0;
    return val;
  }
  return val;
}

// Normalize round: Google Sheets may convert "1/2569" to a Date object
// Convert back to "X/YYYY" format
function normalizeRound(val) {
  if (!val) return '';
  // Already a string like "1/2569" or "2/2568"
  if (typeof val === 'string' && /^\d\/\d{4}$/.test(val)) return val;
  // If it's a Date object (Google Sheets auto-converted)
  if (val instanceof Date) {
    var month = val.getMonth() + 1; // 0-indexed
    var year = val.getFullYear();
    // Convert: Jan=1st half, Jul=2nd half
    var half = month <= 6 ? 1 : 2;
    // Year in Buddhist Era (already BE if > 2500)
    if (year < 2500) year += 543;
    return half + '/' + year;
  }
  // If it's a string that looks like ISO date "2569-01-01T..."
  var s = String(val);
  var isoMatch = s.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) {
    var yr = parseInt(isoMatch[1]);
    var mo = parseInt(isoMatch[2]);
    var h = mo <= 6 ? 1 : 2;
    if (yr < 2500) yr += 543;
    return h + '/' + yr;
  }
  return s;
}

// ==================== LOGGING ====================
function writeLog(action, user, detail) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var logSheet = ss.getSheetByName('logs');
    if (!logSheet) {
      logSheet = ss.insertSheet('logs');
      logSheet.appendRow(['timestamp', 'action', 'user', 'detail']);
      logSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    logSheet.appendRow([
      new Date().toISOString(),
      action || '',
      user || '',
      typeof detail === 'object' ? JSON.stringify(detail) : String(detail || '')
    ]);
  } catch(e) {
    // Logging should never break the main flow
  }
}

// ==================== MAIN HANDLER ====================
function doGet(e) {
  var action = e.parameter.action || 'test';
  var result;

  try {
    switch(action) {
      case 'test':
        result = { success: true, message: 'API v3 is working!', timestamp: new Date().toISOString() };
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
        var scoreData = JSON.parse(e.parameter.data || '{}');
        result = saveScore(scoreData);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { success: false, error: err.toString(), stack: err.stack };
    writeLog('error', '', { action: action, error: err.toString() });
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result;
  try {
    var data = JSON.parse(e.postData.contents);
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
  // Try users sheet first
  var sheet = getSheet('users');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) == String(username) && String(data[i][1]) == String(password)) {
        writeLog('login', String(username), { role: data[i][2] || 'hospital', method: 'users_sheet' });
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
  }

  // Admin hardcoded
  if (username === 'admin' && password === 'R7admin2568') {
    writeLog('login', 'admin', { role: 'admin', method: 'hardcoded' });
    return { success: true, user: { username: 'admin', role: 'admin', hospital_code: '' } };
  }

  // Fallback: auto-generate from hospitals sheet (password = R7 + code)
  var hospitals = getSheet('hospitals');
  if (hospitals) {
    var hData = hospitals.getDataRange().getValues();
    for (var i = 1; i < hData.length; i++) {
      var code = String(hData[i][0]);
      if (code === String(username) && ('R7' + code) === String(password)) {
        writeLog('login', code, { role: 'hospital', method: 'auto_generate' });
        return {
          success: true,
          user: { username: code, role: 'hospital', hospital_code: code }
        };
      }
    }
  }

  writeLog('login_failed', String(username), { reason: 'invalid_credentials' });
  return { success: false, error: 'Invalid username or password' };
}

// ==================== HOSPITALS ====================
function readHospitalsWithHeaders() {
  var sheet = getSheet('hospitals');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    result.push(row);
  }
  return result;
}

function mapHospitalRow(row) {
  var code = row['hcode'] || row['code'] || row['รหัส'] || '';
  var name = row['hname'] || row['name'] || row['ชื่อ'] || row['ชื่อหน่วยบริการ'] || '';
  var province = row['province'] || row['จังหวัด'] || row['changwat'] || '';
  var level = row['level'] || row['ระดับ'] || '';
  var group = row['group'] || row['กลุ่ม'] || row['type'] || '';
  var provinceCode = row['province_code'] || row['provcode'] || row['รหัสจังหวัด'] || '';

  return {
    code: String(code),
    name: String(name),
    province_code: String(provinceCode),
    province: String(province),
    level: String(level),
    group: String(group)
  };
}

function getHospital(code) {
  var hospitals = readHospitalsWithHeaders();
  for (var i = 0; i < hospitals.length; i++) {
    var h = mapHospitalRow(hospitals[i]);
    if (h.code === String(code)) {
      return { success: true, hospital: h };
    }
  }
  return { success: false, error: 'Hospital not found' };
}

function getHospitals() {
  var hospitals = readHospitalsWithHeaders();
  var result = hospitals.map(mapHospitalRow);
  return { success: true, hospitals: result };
}

function lookupHospital(code) {
  var hospitals = readHospitalsWithHeaders();
  for (var i = 0; i < hospitals.length; i++) {
    var h = mapHospitalRow(hospitals[i]);
    if (h.code === String(code)) {
      return h;
    }
  }
  return null;
}

// ==================== CRITERIA ====================
function getCriteria() {
  var sheet = getSheet('criteria');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var criteria = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    criteria.push(row);
  }
  return { success: true, criteria: criteria };
}

// ==================== SCORES ====================
function getScores(hospitalCode) {
  var sheet = getSheet('scores');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var scores = [];

  var hcodeCol = headers.indexOf('hcode');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][hcodeCol >= 0 ? hcodeCol : 1]) === String(hospitalCode)) {
      var row = sheetRowToApi(headers, data[i]);
      scores.push(row);
    }
  }
  return { success: true, scores: scores };
}

function getAllScores() {
  var sheet = getSheet('scores');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var scores = [];

  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][1]) continue;
    var row = sheetRowToApi(headers, data[i]);
    scores.push(row);
  }
  return { success: true, scores: scores };
}

// Convert sheet row → API format
function sheetRowToApi(headers, rowData) {
  var result = {};
  for (var j = 0; j < headers.length; j++) {
    var h = String(headers[j]);
    var v = rowData[j];

    if (h === 'round') {
      // Always normalize round (may be Date object from Sheets)
      result['round'] = normalizeRound(v);
    } else if (h === 'hcode') {
      result['hospital_code'] = String(v);
    } else if (/^\d+\.\d+$/.test(h)) {
      // Score column
      var numVal = (v === '' || v === null || v === undefined || v === 'NA') ? '' : Number(v);
      result['item_' + h.replace('.', '_')] = (typeof numVal === 'number' && isNaN(numVal)) ? 0 : numVal;
    } else if (['raw_total','c1','c2','c3','c4','c5','c6','composite',
                'dim_revenue','dim_cost','dim_discipline','dim_collection','dim_process',
                'pass_status'].indexOf(h) >= 0) {
      var n = (v === '' || v === null || v === undefined) ? '' : Number(v);
      result[h] = (typeof n === 'number' && isNaN(n)) ? 0 : n;
    } else {
      result[h] = v;
    }
  }
  // Ensure wpct exists
  if (result.wpct === undefined && result.composite !== undefined && result.composite !== '') {
    result.wpct = Number(result.composite);
    if (isNaN(result.wpct)) result.wpct = 0;
  }
  return result;
}

// ==================== SAVE SCORE ====================
function saveScore(data) {
  var sheet = getSheet('scores');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var roundCol = headers.indexOf('round');
  var hcodeCol = headers.indexOf('hcode');

  // Look up hospital info
  var hInfo = lookupHospital(data.hospital_code);

  // Build row data
  var rowData = {};
  var roundVal = String(data.round || '').replace(/^'/, '');
  rowData['round'] = roundVal;
  rowData['hcode'] = String(data.hospital_code || '');
  rowData['hname'] = hInfo ? hInfo.name : (data.hname || '');
  rowData['province'] = hInfo ? hInfo.province : (data.province || '');
  rowData['level'] = hInfo ? hInfo.level : (data.level || '');
  rowData['group'] = hInfo ? hInfo.group : (data.group || '');
  rowData['date'] = data.date || '';

  // Map item scores — ALWAYS as Number, handle NA
  ITEMS.forEach(function(item) {
    var key = 'item_' + item.replace('.', '_');
    var val = data[key];
    if (val === 'NA' || val === 'na') {
      rowData[item] = 'NA';
    } else if (val !== undefined && val !== null && val !== '') {
      var n = Number(val);
      rowData[item] = isNaN(n) ? 0 : n;
    } else {
      rowData[item] = 0;
    }
  });

  // Calculate raw_total
  var rawTotal = 0;
  ITEMS.forEach(function(item) {
    if (rowData[item] !== 'NA') rawTotal += Number(rowData[item] || 0);
  });
  rowData['raw_total'] = rawTotal;

  // Category sums
  rowData['c1'] = sumItems(rowData, ['1.1','1.2','1.3','1.4','1.5','1.6']);
  rowData['c2'] = sumItems(rowData, ['2.1','2.2']);
  rowData['c3'] = sumItems(rowData, ['3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8','3.9','3.10','3.11','3.12','3.13','3.14']);
  rowData['c4'] = sumItems(rowData, ['4.1','4.2','4.3','4.4','4.5']);
  rowData['c5'] = sumItems(rowData, ['5.1']);
  rowData['c6'] = sumItems(rowData, ['6.1','6.2','6.3','6.4','6.5']);

  // Composite + grade
  if (data.composite !== undefined && data.composite !== '') {
    rowData['composite'] = Number(data.composite) || 0;
    rowData['grade'] = data.grade || gradeFromComposite(rowData['composite']);
  } else {
    var dims = calculateDimensions(data);
    rowData['composite'] = dims.composite;
    rowData['grade'] = dims.grade;
  }
  rowData['pass_status'] = rowData['composite'] >= 80 ? 1 : 0;

  // Dimension scores
  if (data.dim_revenue !== undefined) {
    rowData['dim_revenue'] = Number(data.dim_revenue) || 0;
    rowData['dim_cost'] = Number(data.dim_cost) || 0;
    rowData['dim_discipline'] = Number(data.dim_discipline) || 0;
    rowData['dim_collection'] = Number(data.dim_collection) || 0;
    rowData['dim_process'] = Number(data.dim_process) || 0;
  } else {
    var dims2 = calculateDimensions(data);
    rowData['dim_revenue'] = dims2.revenue;
    rowData['dim_cost'] = dims2.cost;
    rowData['dim_discipline'] = dims2.discipline;
    rowData['dim_collection'] = dims2.collection;
    rowData['dim_process'] = dims2.process;
  }

  // Metadata
  rowData['cat4_selected'] = data.cat4_selected || '';
  rowData['submitted_by'] = data.submitted_by || '';
  rowData['submitted_at'] = data.submitted_at || new Date().toISOString();
  rowData['updated_at'] = new Date().toISOString();

  // Build row array — sanitize every value
  var newRow = headers.map(function(h) {
    var val = rowData[h] !== undefined ? rowData[h] : (data[h] !== undefined ? data[h] : '');
    return sanitize(val);
  });

  // Find existing entry (same hcode + round) — also match date-converted rounds
  var allData = sheet.getDataRange().getValues();
  var existingRow = -1;

  if (roundCol >= 0 && hcodeCol >= 0) {
    for (var i = 1; i < allData.length; i++) {
      var rowHcode = String(allData[i][hcodeCol]);
      var rowRound = normalizeRound(allData[i][roundCol]);
      if (rowHcode === String(data.hospital_code) && rowRound === roundVal) {
        existingRow = i + 1;
        break;
      }
    }
  }

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, headers.length).setValues([newRow]);
    // Force round cell to plain text so "1/2569" is not converted to date
    if (roundCol >= 0) {
      var roundCell = sheet.getRange(existingRow, roundCol + 1);
      roundCell.setNumberFormat('@');
      roundCell.setValue(roundVal);
    }
  } else {
    sheet.appendRow(newRow);
    var lastRow = sheet.getLastRow();
    // Force round cell to plain text
    if (roundCol >= 0) {
      var roundCell = sheet.getRange(lastRow, roundCol + 1);
      roundCell.setNumberFormat('@');
      roundCell.setValue(roundVal);
    }
  }

  // Log
  writeLog('saveScore', data.submitted_by || data.hospital_code, {
    hospital_code: data.hospital_code,
    hname: rowData['hname'],
    round: roundVal,
    composite: rowData['composite'],
    grade: rowData['grade'],
    raw_total: rawTotal,
    updated: existingRow > 0
  });

  return {
    success: true,
    message: 'บันทึกสำเร็จ',
    updated: existingRow > 0,
    hospital_code: data.hospital_code,
    round: roundVal,
    composite: rowData['composite'],
    grade: rowData['grade']
  };
}

function gradeFromComposite(c) {
  if (c >= 90) return 'A';
  if (c >= 80) return 'B';
  if (c >= 70) return 'C';
  return 'D';
}

function sumItems(rowData, items) {
  var total = 0;
  items.forEach(function(item) {
    if (rowData[item] !== '' && rowData[item] !== undefined && rowData[item] !== 'NA') {
      var n = Number(rowData[item]);
      if (!isNaN(n)) total += n;
    }
  });
  return total;
}

function calculateDimensions(data) {
  var cat4Selected = (data.cat4_selected || '').split(',').map(function(s) { return s.trim(); });
  var revenueSum = 0, revenueMax = 15;

  ['4_1','4_2','4_3','4_4','4_5'].forEach(function(item) {
    if (cat4Selected.indexOf(item.replace('_','.')) >= 0) {
      revenueSum += Number(data['item_' + item] || 0);
    }
  });
  revenueSum += Number(data.item_5_1 || 0);

  var costSum = 0, costMax = 25;
  ['6_1','6_2','6_3','6_4','6_5'].forEach(function(item) {
    costSum += Number(data['item_' + item] || 0);
  });

  var discSum = 0, discMax = 30;
  ['1_3','1_4','1_5','1_6','3_12','3_13'].forEach(function(item) {
    discSum += Number(data['item_' + item] || 0);
  });

  var collSum = 0, collMax = 25;
  ['3_7','3_8','3_9','3_10','3_11'].forEach(function(item) {
    collSum += Number(data['item_' + item] || 0);
  });

  var procSum = 0, procMax = 55;
  ['1_1','1_2','2_1','2_2','3_1','3_2','3_3','3_4','3_5','3_6','3_14'].forEach(function(item) {
    procSum += Number(data['item_' + item] || 0);
  });

  var revenue = revenueMax > 0 ? Math.round((revenueSum / revenueMax) * 100) : 0;
  var cost = costMax > 0 ? Math.round((costSum / costMax) * 100) : 0;
  var discipline = discMax > 0 ? Math.round((discSum / discMax) * 100) : 0;
  var collection = collMax > 0 ? Math.round((collSum / collMax) * 100) : 0;
  var process = procMax > 0 ? Math.round((procSum / procMax) * 100) : 0;

  var composite = Math.round(
    revenue * 0.35 +
    discipline * 0.30 +
    cost * 0.15 +
    collection * 0.15 +
    process * 0.05
  );

  return { revenue: revenue, cost: cost, discipline: discipline, collection: collection, process: process, composite: composite, grade: gradeFromComposite(composite) };
}

// ==================== BEST PRACTICE ====================
function getBestPractice(level) {
  var scoresSheet = getSheet('scores');
  var hospitalsSheet = getSheet('hospitals');

  var scoresData = scoresSheet.getDataRange().getValues();
  var hospitalsData = hospitalsSheet.getDataRange().getValues();

  var hospitalLevels = {};
  for (var i = 1; i < hospitalsData.length; i++) {
    hospitalLevels[String(hospitalsData[i][0])] = hospitalsData[i][4];
  }

  var bestScore = null;
  var bestComposite = 0;
  var headers = scoresData[0];
  var compositeIdx = headers.indexOf('composite');
  var hcodeIdx = headers.indexOf('hcode');

  for (var i = 1; i < scoresData.length; i++) {
    var code = String(scoresData[i][hcodeIdx >= 0 ? hcodeIdx : 1]);
    var hLevel = hospitalLevels[code];

    if (hLevel === level) {
      var comp = Number(scoresData[i][compositeIdx >= 0 ? compositeIdx : 0] || 0);
      if (!isNaN(comp) && comp > bestComposite) {
        bestComposite = comp;
        bestScore = sheetRowToApi(headers, scoresData[i]);
      }
    }
  }

  return { success: true, bestPractice: bestScore };
}
