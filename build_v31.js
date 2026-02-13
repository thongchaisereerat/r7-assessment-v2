// Build R7 Assessment System v3.1
// Combines embedded data + updated code into single index.html
const fs = require('fs');

const criteriaJS = fs.readFileSync('./embedded_criteria.js','utf8').trim();
const scoresJS = fs.readFileSync('./embedded_scores.js','utf8').trim();

const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>R7 Assessment System v3.1</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"><\/script>
<style>
.hidden{display:none!important}
.grade-a{background:#10b981;color:#fff}.grade-b{background:#3b82f6;color:#fff}.grade-c{background:#f59e0b;color:#fff}.grade-d{background:#ef4444;color:#fff}
.dim-card{transition:transform .2s}.dim-card:hover{transform:translateY(-2px)}
.cat-1{border-left:4px solid #3b82f6;background:#eff6ff}.cat-2{border-left:4px solid #22c55e;background:#f0fdf4}.cat-3{border-left:4px solid #8b5cf6;background:#f5f3ff}.cat-4{border-left:4px solid #f59e0b;background:#fffbeb}.cat-5{border-left:4px solid #ec4899;background:#fdf2f8}.cat-6{border-left:4px solid #ef4444;background:#fef2f2}
.score-level{cursor:pointer;padding:6px 10px;border-radius:6px;margin:2px 0;transition:all .15s}.score-level:hover{background:#dbeafe}.score-level.selected{background:#3b82f6;color:#fff}
.top-badge{background:#f59e0b;color:#fff;font-size:10px;padding:2px 8px;border-radius:9999px;font-weight:700;margin-left:6px;vertical-align:middle}
.fade-in{animation:fadeIn .3s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.sortable{cursor:pointer;user-select:none}.sortable:hover{color:#4f46e5}
.progress-bar-inner{transition:width .4s ease}
.loader{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-radius:50%;border-top-color:#fff;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.overlay-loader{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:100;display:flex;align-items:center;justify-content:center}
.overlay-loader .spinner{width:48px;height:48px;border:4px solid #e5e7eb;border-radius:50%;border-top-color:#4f46e5;animation:spin .8s linear infinite}
.nl{white-space:pre-line}
</style>
</head>
<body class="bg-gray-50 min-h-screen">

<!-- LOADING OVERLAY -->
<div id="loadOverlay" class="overlay-loader hidden"><div class="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center gap-3"><div class="spinner"></div><div id="loadMsg" class="text-gray-600 text-sm">กำลังโหลด...</div></div></div>

<!-- HEADER -->
<header class="bg-gradient-to-r from-indigo-800 to-blue-700 text-white shadow-lg sticky top-0 z-50">
<div class="container mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
<h1 class="text-lg md:text-xl font-bold cursor-pointer" onclick="showPage('pageDashboard')">R7 Assessment System v3.1</h1>
<div class="flex items-center gap-2 flex-wrap">
<span id="headerUser" class="hidden text-sm opacity-90"></span>
<button id="btnMyDash" data-testid="btn-my-dash" onclick="showPage('pageMyDashboard')" class="hidden bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition">Dashboard รพ.</button>
<button id="btnLogin" data-testid="btn-login" onclick="showPage('pageLogin')" class="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg text-sm transition">เข้าสู่ระบบ</button>
<button id="btnLogout" data-testid="btn-logout" onclick="doLogout()" class="hidden bg-red-500/80 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm transition">ออกจากระบบ</button>
</div>
</div>
</header>

<!-- PAGE: PUBLIC DASHBOARD -->
<div id="pageDashboard" data-testid="page-dashboard" class="container mx-auto px-4 py-6 fade-in">
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"><div class="text-gray-500 text-xs mb-1">รพ.ทั้งหมด</div><div id="sumTotal" data-testid="summary-total" class="text-2xl font-bold text-indigo-600">-</div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"><div class="text-gray-500 text-xs mb-1">Grade A</div><div id="sumA" data-testid="summary-grade-a" class="text-2xl font-bold text-emerald-500">-</div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"><div class="text-gray-500 text-xs mb-1">Grade B</div><div id="sumB" data-testid="summary-grade-b" class="text-2xl font-bold text-blue-500">-</div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"><div class="text-gray-500 text-xs mb-1">Grade C</div><div id="sumC" class="text-2xl font-bold text-amber-500">-</div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"><div class="text-gray-500 text-xs mb-1">Grade D</div><div id="sumD" class="text-2xl font-bold text-red-500">-</div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center"><div class="text-gray-500 text-xs mb-1">คะแนนเฉลี่ย</div><div id="sumAvg" class="text-2xl font-bold text-purple-600">-</div></div>
</div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-end">
<div><label class="text-gray-500 text-xs block mb-1">จังหวัด</label><select id="fProv" data-testid="filter-province" onchange="refreshDash()" class="border border-gray-200 p-2 rounded-lg text-sm"><option value="">ทั้งหมด</option><option value="ขอนแก่น">ขอนแก่น</option><option value="กาฬสินธุ์">กาฬสินธุ์</option><option value="มหาสารคาม">มหาสารคาม</option><option value="ร้อยเอ็ด">ร้อยเอ็ด</option></select></div>
<div><label class="text-gray-500 text-xs block mb-1">ระดับ</label><select id="fLev" data-testid="filter-level" onchange="refreshDash()" class="border border-gray-200 p-2 rounded-lg text-sm"><option value="">ทั้งหมด</option><option>A</option><option>S</option><option>M1</option><option>M2</option><option>F1</option><option>F2</option><option>F3</option></select></div>
<div><label class="text-gray-500 text-xs block mb-1">รอบ</label><select id="fRnd" data-testid="filter-round" onchange="refreshDash()" class="border border-gray-200 p-2 rounded-lg text-sm"></select></div>
<div class="ml-auto flex gap-2">
<button id="btnImport" onclick="document.getElementById('importModal').classList.remove('hidden')" class="hidden bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition">Import Excel</button>
<button data-testid="btn-export-dash" onclick="exportDashExcel()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition">Download Excel</button>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h3 class="font-bold text-gray-700 mb-2 text-sm">Radar: เฉลี่ย 5 มิติ</h3><div style="position:relative;height:280px"><canvas id="cRadarDash"></canvas></div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h3 class="font-bold text-gray-700 mb-2 text-sm">สัดส่วน Grade</h3><div style="position:relative;height:280px"><canvas id="cDonutDash"></canvas></div></div>
</div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr>
<th class="p-3 text-left sortable" onclick="doSort('code')">รหัส</th>
<th class="p-3 text-left sortable" onclick="doSort('name')">ชื่อ รพ.</th>
<th class="p-3 text-left sortable" onclick="doSort('province')">จังหวัด</th>
<th class="p-3 text-center sortable" onclick="doSort('level')">ระดับ</th>
<th class="p-3 text-center sortable" onclick="doSort('raw')">คะแนนรวม</th>
<th class="p-3 text-center sortable" onclick="doSort('composite')">Composite</th>
<th class="p-3 text-center sortable" onclick="doSort('grade')">Grade</th>
</tr></thead><tbody id="tblBody" data-testid="hospital-table-body"><tr><td colspan="7" class="p-8 text-center text-gray-400">กำลังโหลดข้อมูล...</td></tr></tbody></table></div>
</div>
</div>

<!-- PAGE: HOSPITAL DETAIL -->
<div id="pageHospitalDetail" data-testid="page-hospital-detail" class="hidden container mx-auto px-4 py-6 fade-in">
<button onclick="showPage('pageDashboard')" class="mb-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm">&larr; กลับหน้า Dashboard</button>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="space-y-4">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 id="dName" class="text-xl font-bold text-gray-800 mb-1">-</h3><p id="dProv" class="text-gray-500 text-sm mb-2">-</p><span id="dLev" class="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">-</span></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"><div class="text-gray-500 text-xs mb-1">Composite</div><div id="dComp" class="text-5xl font-bold text-indigo-600 mb-2">-</div><div id="dGrade" class="inline-block px-4 py-1.5 rounded-full text-sm font-bold">-</div></div>
</div>
<div class="lg:col-span-2 space-y-4">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h4 class="font-bold text-gray-700 mb-2 text-sm">Radar 5 มิติ</h4><div style="position:relative;height:260px"><canvas id="cRadarDet"></canvas></div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h4 class="font-bold text-gray-700 mb-2 text-sm">คะแนนรายหมวด</h4><div id="dCatBars" class="space-y-2"></div></div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h4 class="font-bold text-gray-700 mb-2 text-sm">ประวัติรอบประเมิน</h4><div id="dHist">-</div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h4 class="font-bold text-gray-700 mb-2 text-sm">Best Practice (ระดับเดียวกัน)</h4><div id="dBest" class="text-gray-500 text-sm">-</div></div>
</div>
</div>

<!-- PAGE: LOGIN -->
<div id="pageLogin" data-testid="page-login" class="hidden flex items-center justify-center min-h-[80vh] fade-in">
<div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
<h2 class="text-2xl font-bold text-center mb-6 text-gray-800">เข้าสู่ระบบ</h2>
<div id="loginErr" class="hidden bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm"></div>
<div class="mb-4"><label class="block text-gray-600 text-sm mb-1">Username</label><input type="text" id="inUser" data-testid="login-username" class="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="admin หรือ รหัส รพ."></div>
<div class="mb-6"><label class="block text-gray-600 text-sm mb-1">Password</label><input type="password" id="inPass" data-testid="login-password" class="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="รหัสผ่าน"></div>
<button onclick="doLogin()" id="btnDoLogin" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"><span>เข้าสู่ระบบ</span><span id="loginSpinner" class="loader hidden"></span></button>
<p class="text-center mt-4"><a href="#" onclick="showPage('pageDashboard');return false" class="text-indigo-600 hover:underline text-sm">กลับหน้าหลัก</a></p>
</div>
</div>

<!-- PAGE: MY DASHBOARD -->
<div id="pageMyDashboard" data-testid="page-my-dashboard" class="hidden container mx-auto px-4 py-6 fade-in">
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div class="space-y-4">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 id="mName" class="text-xl font-bold text-gray-800 mb-1">-</h3><p id="mProv" class="text-gray-500 text-sm mb-2">-</p><span id="mLev" class="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">-</span></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"><div class="text-gray-500 text-xs mb-1">Composite Score</div><div id="mComp" class="text-5xl font-bold text-indigo-600 mb-2">-</div><div id="mGrade" class="inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-gray-200">-</div></div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><div style="position:relative;height:220px"><canvas id="cRadarMy"></canvas></div></div>
</div>
<div class="lg:col-span-2 space-y-4">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
<h4 class="font-bold text-gray-700 mb-3 text-sm">คะแนนรายมิติ</h4>
<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
<div class="dim-card bg-emerald-50 p-3 rounded-lg text-center border border-emerald-100"><div class="text-emerald-600 font-bold text-xl" id="mDR">-</div><div class="text-gray-500 text-xs">Revenue 35%</div></div>
<div class="dim-card bg-amber-50 p-3 rounded-lg text-center border border-amber-100"><div class="text-amber-600 font-bold text-xl" id="mDCo">-</div><div class="text-gray-500 text-xs">Cost 15%</div></div>
<div class="dim-card bg-blue-50 p-3 rounded-lg text-center border border-blue-100"><div class="text-blue-600 font-bold text-xl" id="mDD">-</div><div class="text-gray-500 text-xs">Discipline 30%</div></div>
<div class="dim-card bg-violet-50 p-3 rounded-lg text-center border border-violet-100"><div class="text-violet-600 font-bold text-xl" id="mDCl">-</div><div class="text-gray-500 text-xs">Collection 15%</div></div>
<div class="dim-card bg-rose-50 p-3 rounded-lg text-center border border-rose-100"><div class="text-rose-600 font-bold text-xl" id="mDP">-</div><div class="text-gray-500 text-xs">Process 5%</div></div>
</div>
</div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h4 class="font-bold text-gray-700 mb-2 text-sm">Best Practice (ระดับเดียวกัน)</h4><div id="mBest" class="text-gray-500 text-sm">-</div></div>
<div class="flex gap-3">
<button onclick="startAssess()" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition text-sm">ทำแบบประเมินใหม่</button>
<button onclick="exportMyExcel()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition text-sm">Export Excel</button>
</div>
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"><h4 class="font-bold text-gray-700 mb-2 text-sm">ประวัติการประเมิน</h4><div id="mHist" class="text-gray-500 text-sm">-</div></div>
</div>
</div>
</div>

<!-- PAGE: ASSESSMENT -->
<div id="pageAssessment" data-testid="page-assessment" class="hidden container mx-auto px-4 py-6 fade-in">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
<div class="flex justify-between items-center mb-4">
<h3 class="text-lg font-bold text-gray-800">แบบประเมินมาตรฐานการเงินการคลัง</h3>
<button onclick="showPage('pageMyDashboard')" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
</div>
<div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
<div><label class="block text-gray-600 text-xs mb-1">รอบประเมิน</label><select id="aRound" onchange="loadDraft()" class="w-full p-2 border border-gray-200 rounded-lg text-sm"></select></div>
<div><label class="block text-gray-600 text-xs mb-1">วันที่ประเมิน</label><input type="date" id="aDate" class="w-full p-2 border border-gray-200 rounded-lg text-sm"></div>
<div class="text-center"><div class="text-gray-500 text-xs mb-1">Live Score</div><span id="lComp" data-testid="live-composite" class="text-3xl font-bold text-indigo-600">0</span><span id="lGrd" data-testid="live-grade" class="ml-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-200">-</span></div>
<div><div class="text-gray-500 text-xs mb-1">ความคืบหน้า</div><div class="w-full bg-gray-200 rounded-full h-4 mt-1 overflow-hidden"><div id="aBar" class="progress-bar-inner bg-indigo-500 h-4 rounded-full" style="width:0%"></div></div><div id="aProg" class="text-xs text-gray-500 mt-1">0/33</div></div>
</div>
<div id="aItems" data-testid="assessment-items"></div>
<div class="mt-6 text-center">
<button onclick="saveAssess()" id="btnSave" data-testid="btn-save-assessment" class="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 mx-auto"><span>บันทึกการประเมิน</span><span id="saveSpinner" class="loader hidden"></span></button>
<p id="saveMsg" class="mt-2 text-gray-400 text-sm"></p>
</div>
</div>
</div>

<!-- PAGE: REPORT -->
<div id="pageReport" data-testid="page-report" class="hidden container mx-auto px-4 py-6 fade-in">
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
<h3 class="text-lg font-bold text-gray-800 mb-1">รายงานผลประเมิน</h3>
<p id="rSub" class="text-gray-500 text-sm mb-4">-</p>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
<div class="text-center"><div class="text-gray-500 text-xs mb-1">Composite Score</div><div id="rComp" class="text-5xl font-bold text-indigo-600 mb-1">-</div><div id="rGrade" class="inline-block px-4 py-1 rounded-full text-sm font-bold">-</div></div>
<div style="position:relative;height:240px"><canvas id="cRadarRpt"></canvas></div>
</div>
<div class="mb-6"><h4 class="font-bold text-emerald-700 mb-2 text-sm">จุดแข็ง (คะแนน 4-5)</h4><div id="rStr" class="space-y-2"></div></div>
<div class="mb-6"><h4 class="font-bold text-red-600 mb-2 text-sm">จุดควรปรับปรุง (คะแนน 0-2)</h4><div id="rWeak" class="space-y-2"></div></div>
<div class="mb-6"><h4 class="font-bold text-indigo-700 mb-2 text-sm">เปรียบเทียบกับรอบก่อน</h4><div id="rDelta" class="text-gray-500 text-sm">-</div></div>
<div class="flex gap-3 justify-center mt-4">
<button onclick="exportRptExcel()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition">Export Excel</button>
<button onclick="showPage('pageMyDashboard')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition">กลับ Dashboard</button>
</div>
</div>
</div>

<!-- IMPORT MODAL -->
<div id="importModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
<div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
<h3 class="text-lg font-bold text-gray-800 mb-4">Import Excel</h3>
<input type="file" id="impFile" accept=".xlsx,.xls" class="w-full mb-4 text-sm">
<div id="impPrev" class="max-h-48 overflow-auto mb-4 text-xs"></div>
<div class="flex gap-3 justify-end">
<button onclick="document.getElementById('importModal').classList.add('hidden')" class="px-4 py-2 border border-gray-200 rounded-lg text-sm">ยกเลิก</button>
<button onclick="doImport()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">นำเข้าข้อมูล</button>
</div>
</div>
</div>

<script>
// ==================== EMBEDDED CRITERIA (from original template) ====================
${criteriaJS}

// ==================== HISTORICAL SCORES (from cleaned Excel) ====================
${scoresJS}

// ==================== CONSTANTS ====================
const CATS=[
{id:1,nm:"หมวด 1: การนำและการวางแผนการเงิน (6 ข้อ)",css:"cat-1",col:"#3b82f6",mx:30},
{id:2,nm:"หมวด 2: ระบบเวชระเบียน (2 ข้อ)",css:"cat-2",col:"#22c55e",mx:10},
{id:3,nm:"หมวด 3: ศูนย์จัดเก็บรายได้คุณภาพ (14 ข้อ)",css:"cat-3",col:"#8b5cf6",mx:70},
{id:4,nm:"หมวด 4: แผนธุรกิจ - ระบบเลือก Top 2 (5 ข้อ)",css:"cat-4",col:"#f59e0b",mx:10},
{id:5,nm:"หมวด 5: PP Fee Schedule (1 ข้อ)",css:"cat-5",col:"#ec4899",mx:5},
{id:6,nm:"หมวด 6: การควบคุมรายจ่าย (5 ข้อ)",css:"cat-6",col:"#ef4444",mx:25}
];

const API='https://script.google.com/macros/s/AKfycbzYRBtTbeZZ_w4yM15PlqNgvAFNU1lj98mZwgpaXqTVPQxkS7SgvyQPVJHNvkUkzT4hNA/exec';
let CU=null,CH=null,AH=[],AS=[],sf='composite',sd=-1,_rd=null,_rptD=null,_rptDm=null;
let chRD=null,chDD=null,chDet=null,chMy=null,chRpt=null;

// ==================== PROCESS HISTORICAL SCORES ====================
function processHistorical(){
  // Convert HS records into the AS format expected by the dashboard
  const processed=[];
  HS.forEach(rec=>{
    const dm=calcDimsFromRec(rec);
    processed.push({
      hospital_code:String(rec.h),
      round:rec.r,
      date:'',
      total_raw:rec.ts||0,
      composite:dm.composite,
      grade:dm.grade,
      dim_revenue:dm.revenue,
      dim_cost:dm.cost,
      dim_discipline:dm.discipline,
      dim_collection:dm.collection,
      dim_process:dm.process,
      updated_at:rec.r,
      _src:'hist',
      _rec:rec
    });
  });
  return processed;
}

function calcDimsFromRec(d){
  const c4=['4_1','4_2','4_3','4_4','4_5'].map(k=>({k,s:Number(d['i_'+k]||0)}));
  c4.sort((a,b)=>b.s-a.s||(a.k<b.k?-1:1));
  const t2=[c4[0].k,c4[1].k];
  let rS=0;t2.forEach(k=>rS+=Number(d['i_'+k]||0));rS+=Number(d.i_5_1||0);
  let coS=0;['6_1','6_2','6_3','6_4','6_5'].forEach(k=>coS+=Number(d['i_'+k]||0));
  let diS=0;['1_3','1_4','1_5','1_6','3_12','3_13'].forEach(k=>diS+=Number(d['i_'+k]||0));
  let clS=0;['3_7','3_8','3_9','3_10','3_11'].forEach(k=>clS+=Number(d['i_'+k]||0));
  let prS=0;['1_1','1_2','2_1','2_2','3_1','3_2','3_3','3_4','3_5','3_6','3_14'].forEach(k=>prS+=Number(d['i_'+k]||0));
  const rv=Math.round(rS/15*100),co=Math.round(coS/25*100),di=Math.round(diS/30*100),cl=Math.round(clS/25*100),pr=Math.round(prS/55*100);
  const cp=Math.round(rv*.35+co*.15+di*.30+cl*.15+pr*.05);
  return{revenue:rv,cost:co,discipline:di,collection:cl,process:pr,composite:cp,grade:cg(cp),top2:t2};
}

// ==================== NAVIGATION ====================
const PG=['pageDashboard','pageHospitalDetail','pageLogin','pageMyDashboard','pageAssessment','pageReport'];
function showPage(id){
  // Authorization: block restricted pages for regional viewers
  if(CU&&CU.role==='regional'&&['pageMyDashboard','pageAssessment','pageReport'].includes(id)){id='pageDashboard';}
  PG.forEach(p=>{const e=document.getElementById(p);if(e)e.classList.toggle('hidden',p!==id);});
  document.getElementById('btnLogin').classList.toggle('hidden',!!CU);
  document.getElementById('btnLogout').classList.toggle('hidden',!CU);
  document.getElementById('headerUser').classList.toggle('hidden',!CU);
  document.getElementById('btnMyDash').classList.toggle('hidden',!(CU&&CU.role==='hospital'));
  document.getElementById('btnImport').classList.toggle('hidden',!(CU&&CU.role==='admin'&&id==='pageDashboard'));
  // Regional viewer: auto-filter by province
  if(CU&&CU.role==='regional'&&CU.province&&id==='pageDashboard'){
    const fp=document.getElementById('fProv');if(fp&&CU.province){fp.value=CU.province;refreshDash();}
  }
  window.scrollTo(0,0);
}

// ==================== API ====================
async function gAPI(a,p={}){
  const u=new URL(API);u.searchParams.append('action',a);
  for(let k in p)u.searchParams.append(k,p[k]);
  try{return await(await fetch(u)).json();}catch(e){return{success:false,error:e.message};}
}
async function pAPI(d){
  try{return await(await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(d)})).json();}
  catch(e){return{success:false,error:e.message};}
}

// ==================== LOADING ====================
function showLoad(msg){document.getElementById('loadMsg').textContent=msg||'กำลังโหลด...';document.getElementById('loadOverlay').classList.remove('hidden');}
function hideLoad(){document.getElementById('loadOverlay').classList.add('hidden');}

// ==================== UTILS ====================
function ik(c){return String(c).replace('.','_');}
function gc(g){return g==='A'?'grade-a':g==='B'?'grade-b':g==='C'?'grade-c':g==='D'?'grade-d':'bg-gray-200';}
function cg(c){return c>=85?'A':c>=75?'B':c>=65?'C':'D';}
function ls(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function lg(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}}
function lr(k){try{localStorage.removeItem(k);}catch(e){}}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function nlbr(s){return esc(String(s||'')).replace(/\\\\n/g,'<br>').replace(/\\n/g,'<br>');}

// Build latest score map per hospital, optionally filtered by round
function getLS(scores,rnd){
  const m={};
  (scores||[]).forEach(s=>{
    if(rnd&&s.round!==rnd)return;
    const k=String(s.hospital_code);
    if(!m[k]||(s.updated_at||'')>(m[k].updated_at||''))m[k]=s;
  });
  return m;
}

// ==================== DYNAMIC ROUND SELECTOR ====================
function buildRounds(){
  // Collect rounds from historical data
  const roundSet=new Set();
  HS.forEach(r=>roundSet.add(r.r));
  AS.forEach(s=>{if(s.round)roundSet.add(s.round);});

  // Also generate future rounds based on current Buddhist year
  const now=new Date();
  const by=now.getFullYear()+543;
  for(let y=by-2;y<=by+1;y++){
    roundSet.add('1/'+y);
    roundSet.add('2/'+y);
  }

  // Sort: newest first
  const rounds=[...roundSet].sort((a,b)=>{
    const [ra,ya]=a.split('/').map(Number);
    const [rb,yb]=b.split('/').map(Number);
    return yb!==ya?yb-ya:rb-ra;
  });
  return rounds;
}

function populateRoundSelectors(){
  const rounds=buildRounds();
  // Dashboard filter
  const fRnd=document.getElementById('fRnd');
  fRnd.innerHTML='<option value="">ล่าสุด</option>'+rounds.map(r=>'<option value="'+r+'">'+r+'</option>').join('');
  // Assessment round
  const aRound=document.getElementById('aRound');
  const now=new Date();
  const by=now.getFullYear()+543;
  const currentRound=(now.getMonth()<6?'1/':'2/')+by;
  aRound.innerHTML=rounds.map(r=>'<option value="'+r+'"'+(r===currentRound?' selected':'')+'>'+r+'</option>').join('');
}

// ==================== CALC DIMS ====================
function calcDims(d){
  const c4=['4_1','4_2','4_3','4_4','4_5'].map(k=>({k,s:Number(d['i_'+k]||0)}));
  c4.sort((a,b)=>b.s-a.s||(a.k<b.k?-1:1));
  const t2=[c4[0].k,c4[1].k];
  let rS=0;t2.forEach(k=>rS+=Number(d['i_'+k]||0));rS+=Number(d.i_5_1||0);
  let coS=0;['6_1','6_2','6_3','6_4','6_5'].forEach(k=>coS+=Number(d['i_'+k]||0));
  let diS=0;['1_3','1_4','1_5','1_6','3_12','3_13'].forEach(k=>diS+=Number(d['i_'+k]||0));
  let clS=0;['3_7','3_8','3_9','3_10','3_11'].forEach(k=>clS+=Number(d['i_'+k]||0));
  let prS=0;['1_1','1_2','2_1','2_2','3_1','3_2','3_3','3_4','3_5','3_6','3_14'].forEach(k=>prS+=Number(d['i_'+k]||0));
  const rv=Math.round(rS/15*100),co=Math.round(coS/25*100),di=Math.round(diS/30*100),cl=Math.round(clS/25*100),pr=Math.round(prS/55*100);
  const cp=Math.round(rv*.35+co*.15+di*.30+cl*.15+pr*.05);
  return{revenue:rv,cost:co,discipline:di,collection:cl,process:pr,composite:cp,grade:cg(cp),top2:t2};
}

// ==================== INIT ====================
async function init(){
  // Process historical data first (instant)
  const histScores=processHistorical();

  // Store item-level scores from historical data in localStorage
  HS.forEach(rec=>{
    const d={round:rec.r};
    EC.forEach(it=>{const k=ik(it.c);d['i_'+k]=rec['i_'+k]||0;});
    ls('r7_scores_'+rec.h+'_'+rec.r,d);
  });

  // Build hospitals from historical data
  const hMap={};
  HS.forEach(rec=>{
    if(!hMap[rec.h])hMap[rec.h]={code:String(rec.h),name:rec.hn||String(rec.h),province:rec.pv||'-',level:'-'};
  });

  // Try API for hospitals (may have level info)
  try{
    const [h,s]=await Promise.all([gAPI('getHospitals'),gAPI('getAllScores')]);
    if(h.success&&h.hospitals&&h.hospitals.length>0){
      AH=h.hospitals;
      // Merge level info
      AH.forEach(ah=>{if(hMap[ah.code])hMap[ah.code].level=ah.level;});
    }
    if(s.success&&s.scores&&s.scores.length>0){
      AS=s.scores.concat(histScores);
    }else{
      AS=histScores;
    }
  }catch(e){
    AS=histScores;
  }

  // If API didn't return hospitals, use historical
  if(!AH.length){AH=Object.values(hMap);}else{
    // Add any hospitals from historical that API doesn't have
    Object.values(hMap).forEach(hh=>{
      if(!AH.find(a=>String(a.code)===String(hh.code)))AH.push(hh);
    });
  }

  populateRoundSelectors();
  refreshDash();
}

window.addEventListener('DOMContentLoaded',()=>{
  showPage('pageDashboard');init();
  document.getElementById('inPass').addEventListener('keypress',e=>{if(e.key==='Enter')doLogin();});
  document.getElementById('inUser').addEventListener('keypress',e=>{if(e.key==='Enter')document.getElementById('inPass').focus();});
  document.getElementById('impFile').addEventListener('change',previewImport);
});

// ==================== DASHBOARD ====================
function refreshDash(){
  const pv=document.getElementById('fProv').value,lv=document.getElementById('fLev').value,rn=document.getElementById('fRnd').value;
  const lm=getLS(AS,rn);
  let fh=AH.slice();if(pv)fh=fh.filter(h=>h.province===pv);if(lv)fh=fh.filter(h=>h.level===lv);
  let cA=0,cB=0,cC=0,cD=0,tot=0,cnt=0,dS={R:0,Co:0,D:0,Cl:0,P:0},dc=0;
  fh.forEach(h=>{
    const s=lm[String(h.code)];
    if(s){
      const v=Number(s.composite)||0;
      if(v>=85)cA++;else if(v>=75)cB++;else if(v>=65)cC++;else cD++;
      tot+=v;cnt++;
      dS.R+=Number(s.dim_revenue||0);dS.Co+=Number(s.dim_cost||0);dS.D+=Number(s.dim_discipline||0);dS.Cl+=Number(s.dim_collection||0);dS.P+=Number(s.dim_process||0);dc++;
    }
  });
  document.getElementById('sumTotal').textContent=fh.length;
  document.getElementById('sumA').textContent=cA;document.getElementById('sumB').textContent=cB;
  document.getElementById('sumC').textContent=cC;document.getElementById('sumD').textContent=cD;
  document.getElementById('sumAvg').textContent=cnt>0?Math.round(tot/cnt):'-';
  const avg=dc>0?[dS.R/dc,dS.Co/dc,dS.D/dc,dS.Cl/dc,dS.P/dc].map(v=>Math.round(v)):[0,0,0,0,0];
  mkRadar('cRadarDash','chRD',avg);mkDonut([cA,cB,cC,cD]);
  const rows=fh.map(h=>{
    const s=lm[String(h.code)];
    return{code:h.code,name:h.name,province:h.province,level:h.level,
      raw:s?Number(s.total_raw)||0:0,
      composite:s?Number(s.composite)||0:0,grade:s?s.grade||'-':'-'};
  });
  rows.sort((a,b)=>{let x=a[sf],y=b[sf];if(typeof x==='string')return sd*x.localeCompare(y,'th');return sd*((x||0)-(y||0));});
  const tb=document.getElementById('tblBody');
  if(!rows.length){tb.innerHTML='<tr><td colspan="7" class="p-8 text-center text-gray-400">ไม่พบข้อมูล</td></tr>';return;}
  tb.innerHTML=rows.map(r=>\`<tr class="border-b border-gray-50 hover:bg-indigo-50/50 cursor-pointer transition" onclick="openDetail('\${r.code}')">
<td class="p-3 text-gray-600">\${r.code}</td><td class="p-3 font-medium text-gray-800">\${r.name}</td><td class="p-3 text-gray-600">\${r.province}</td>
<td class="p-3 text-center"><span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">\${r.level}</span></td>
<td class="p-3 text-center">\${r.raw||'-'}</td>
<td class="p-3 text-center font-bold">\${r.composite||'-'}</td>
<td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-bold \${gc(r.grade)}">\${r.grade}</span></td></tr>\`).join('');
}
function doSort(f){if(sf===f)sd*=-1;else{sf=f;sd=-1;}refreshDash();}

// ==================== CHARTS ====================
function mkRadar(id,vn,vals){
  const ctx=document.getElementById(id).getContext('2d');if(window[vn])window[vn].destroy();
  window[vn]=new Chart(ctx,{type:'radar',data:{labels:['Revenue','Cost','Discipline','Collection','Process'],datasets:[{label:'%',data:vals,backgroundColor:'rgba(79,70,229,0.15)',borderColor:'rgba(79,70,229,0.8)',borderWidth:2,pointBackgroundColor:'rgba(79,70,229,1)',pointRadius:4}]},
  options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:0,max:100,ticks:{stepSize:20,font:{size:9}},pointLabels:{font:{size:11}}}},plugins:{legend:{display:false}}}});
}
function mkDonut(c){
  const ctx=document.getElementById('cDonutDash').getContext('2d');if(chDD)chDD.destroy();
  chDD=new Chart(ctx,{type:'doughnut',data:{labels:['Grade A','Grade B','Grade C','Grade D'],datasets:[{data:c,backgroundColor:['#10b981','#3b82f6','#f59e0b','#ef4444'],borderWidth:2,borderColor:'#fff'}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:12}}}}});
}

// ==================== DETAIL ====================
function openDetail(code){
  const codeStr=String(code);
  const h=AH.find(x=>String(x.code)===codeStr);if(!h)return;
  document.getElementById('dName').textContent=h.name;document.getElementById('dProv').textContent=h.province;
  document.getElementById('dLev').textContent='ระดับ '+h.level;
  const hs=AS.filter(s=>String(s.hospital_code)===codeStr).sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||''));
  const la=hs[0];
  if(la){
    document.getElementById('dComp').textContent=la.composite||'-';
    const g=la.grade||'-';const e=document.getElementById('dGrade');e.textContent='Grade '+g;e.className='inline-block px-4 py-1.5 rounded-full text-sm font-bold '+gc(g);
    mkRadar('cRadarDet','chDet',[Number(la.dim_revenue||0),Number(la.dim_cost||0),Number(la.dim_discipline||0),Number(la.dim_collection||0),Number(la.dim_process||0)]);
  }else{
    document.getElementById('dComp').textContent='-';document.getElementById('dGrade').textContent='-';document.getElementById('dGrade').className='inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-gray-200';
    mkRadar('cRadarDet','chDet',[0,0,0,0,0]);
  }
  // Category bars from cached item scores
  const cached=la?lg('r7_scores_'+codeStr+'_'+la.round):null;
  let bars='';CATS.forEach(cat=>{
    const its=EC.filter(x=>x.cat===cat.id);let sum=0,mx=cat.mx;
    if(cached)its.forEach(it=>sum+=Number(cached['i_'+ik(it.c)]||0));
    const pct=mx>0?Math.round(sum/mx*100):0;
    bars+=\`<div><div class="flex justify-between text-xs mb-1"><span class="text-gray-700">\${cat.nm.split('(')[0]}</span><span class="font-bold" style="color:\${cat.col}">\${cached?sum+'/'+mx:'-'} (\${pct}%)</span></div><div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" style="width:\${pct}%;background:\${cat.col}"></div></div></div>\`;
  });
  document.getElementById('dCatBars').innerHTML=bars;

  // History table
  if(hs.length>0){
    document.getElementById('dHist').innerHTML=\`<table class="w-full text-xs"><thead class="bg-gray-50"><tr><th class="p-2 text-left">รอบ</th><th class="p-2 text-center">คะแนนรวม</th><th class="p-2 text-center">Composite</th><th class="p-2 text-center">Grade</th></tr></thead><tbody>\${hs.map(s=>\`<tr class="border-b border-gray-50"><td class="p-2">\${s.round||'-'}</td><td class="p-2 text-center">\${s.total_raw||'-'}/150</td><td class="p-2 text-center font-bold">\${s.composite||'-'}</td><td class="p-2 text-center"><span class="px-2 py-0.5 rounded text-xs font-bold \${gc(s.grade)}">\${s.grade||'-'}</span></td></tr>\`).join('')}</tbody></table>\`;
  }else{document.getElementById('dHist').innerHTML='<p class="text-gray-400 text-xs">ยังไม่มีประวัติ</p>';}

  // Best practice
  const sl=AS.filter(s=>{const hp=AH.find(x=>String(x.code)===String(s.hospital_code));return hp&&hp.level===h.level&&String(s.hospital_code)!==codeStr;});
  if(sl.length>0){
    const b=sl.reduce((a,b)=>(Number(b.composite)||0)>(Number(a.composite)||0)?b:a,sl[0]);
    const bh=AH.find(x=>String(x.code)===String(b.hospital_code));
    document.getElementById('dBest').innerHTML=\`<span class="font-medium">\${bh?bh.name:b.hospital_code}</span> - Composite: <span class="font-bold text-indigo-600">\${b.composite}</span> Grade \${b.grade}\`;
  }else{document.getElementById('dBest').textContent='ไม่มีข้อมูลเปรียบเทียบ';}
  showPage('pageHospitalDetail');
}

// ==================== LOGIN ====================
async function doLogin(){
  const u=document.getElementById('inUser').value.trim(),p=document.getElementById('inPass').value.trim();
  if(!u||!p){document.getElementById('loginErr').textContent='กรุณากรอก Username และ Password';document.getElementById('loginErr').classList.remove('hidden');return;}
  document.getElementById('loginErr').classList.add('hidden');
  document.getElementById('loginSpinner').classList.remove('hidden');
  document.getElementById('btnDoLogin').disabled=true;
  const r=await gAPI('login',{username:u,password:p});
  document.getElementById('loginSpinner').classList.add('hidden');
  document.getElementById('btnDoLogin').disabled=false;
  if(r.success){
    CU=r.user;document.getElementById('headerUser').textContent=CU.username+' ('+CU.role+')';
    if(CU.role==='admin'){showPage('pageDashboard');}
    else if(CU.role==='regional'){showPage('pageDashboard');}
    else{showLoad('กำลังโหลดข้อมูล รพ...');await loadMyDash(CU.hospital_code);hideLoad();showPage('pageMyDashboard');}
  }else{document.getElementById('loginErr').textContent=r.error||'เข้าสู่ระบบไม่สำเร็จ';document.getElementById('loginErr').classList.remove('hidden');}
}
function doLogout(){CU=null;CH=null;document.getElementById('inUser').value='';document.getElementById('inPass').value='';document.getElementById('loginErr').classList.add('hidden');showPage('pageDashboard');}

// ==================== MY DASHBOARD ====================
async function loadMyDash(code){
  const codeStr=String(code);
  // Get hospital info from API or fallback
  const hr=await gAPI('getHospital',{code:codeStr});
  if(hr.success)CH=hr.hospital;
  if(!CH)CH=AH.find(h=>String(h.code)===codeStr)||{code:codeStr,name:codeStr,province:'-',level:'-'};

  document.getElementById('mName').textContent=CH.name;document.getElementById('mProv').textContent=CH.province;document.getElementById('mLev').textContent='ระดับ '+CH.level;

  // Get scores: API + historical
  let sc=[];
  const sr=await gAPI('getScores',{hospital_code:codeStr});
  if(sr.success&&sr.scores&&sr.scores.length>0)sc=sr.scores;

  // Also include historical scores for this hospital
  const histForHosp=AS.filter(s=>String(s.hospital_code)===codeStr);
  // Merge: API scores take precedence over historical for same round
  const roundMap={};
  histForHosp.forEach(s=>roundMap[s.round]=s);
  sc.forEach(s=>roundMap[s.round]=s);
  const sorted=Object.values(roundMap).sort((a,b)=>(b.updated_at||b.round||'').localeCompare(a.updated_at||a.round||''));
  const la=sorted[0];

  if(la){
    document.getElementById('mComp').textContent=la.composite||'-';
    const g=la.grade||'-';const e=document.getElementById('mGrade');e.textContent='Grade '+g;e.className='inline-block px-4 py-1.5 rounded-full text-sm font-bold '+gc(g);
    document.getElementById('mDR').textContent=(la.dim_revenue||0)+'%';document.getElementById('mDCo').textContent=(la.dim_cost||0)+'%';document.getElementById('mDD').textContent=(la.dim_discipline||0)+'%';document.getElementById('mDCl').textContent=(la.dim_collection||0)+'%';document.getElementById('mDP').textContent=(la.dim_process||0)+'%';
    mkRadar('cRadarMy','chMy',[Number(la.dim_revenue||0),Number(la.dim_cost||0),Number(la.dim_discipline||0),Number(la.dim_collection||0),Number(la.dim_process||0)]);
  }else{
    document.getElementById('mComp').textContent='-';document.getElementById('mGrade').textContent='ยังไม่มีข้อมูล';document.getElementById('mGrade').className='inline-block px-4 py-1.5 rounded-full text-sm bg-gray-200';
    ['mDR','mDCo','mDD','mDCl','mDP'].forEach(x=>document.getElementById(x).textContent='-');mkRadar('cRadarMy','chMy',[0,0,0,0,0]);
  }

  if(sorted.length>0){
    document.getElementById('mHist').innerHTML=\`<table class="w-full text-xs"><thead class="bg-gray-50"><tr><th class="p-2 text-left">รอบ</th><th class="p-2 text-center">คะแนนรวม</th><th class="p-2 text-center">Composite</th><th class="p-2 text-center">Grade</th><th class="p-2 text-center">จัดการ</th></tr></thead><tbody>\${sorted.map(s=>\`<tr class="border-b border-gray-50"><td class="p-2">\${s.round||'-'}</td><td class="p-2 text-center">\${s.total_raw||'-'}/150</td><td class="p-2 text-center font-bold">\${s.composite||'-'}</td><td class="p-2 text-center"><span class="px-2 py-0.5 rounded text-xs font-bold \${gc(s.grade)}">\${s.grade||'-'}</span></td><td class="p-2 text-center"><button onclick="editAssess('\${s.round}')" class="text-indigo-600 hover:underline text-xs">แก้ไข</button> <button onclick="viewRpt('\${s.round}')" class="text-emerald-600 hover:underline text-xs ml-1">รายงาน</button></td></tr>\`).join('')}</tbody></table>\`;
  }else{document.getElementById('mHist').innerHTML='<p class="text-gray-400 text-xs">ยังไม่มีประวัติ</p>';}

  // Best practice
  const sl=AS.filter(s=>{const hp=AH.find(x=>String(x.code)===String(s.hospital_code));return hp&&hp.level===CH.level&&String(s.hospital_code)!==codeStr;});
  if(sl.length>0){
    const b=sl.reduce((a,b)=>(Number(b.composite)||0)>(Number(a.composite)||0)?b:a,sl[0]);const bh=AH.find(x=>String(x.code)===String(b.hospital_code));
    document.getElementById('mBest').innerHTML=\`<span class="font-medium">\${bh?bh.name:b.hospital_code}</span> - Composite: <span class="font-bold text-indigo-600">\${b.composite}</span> Grade \${b.grade}\`;
  }else{document.getElementById('mBest').textContent='ไม่มีข้อมูลเปรียบเทียบ';}
}

// ==================== ASSESSMENT ====================
function startAssess(){
  if(!CU||CU.role==='regional'){alert('คุณไม่มีสิทธิ์ทำแบบประเมิน');return;}
  _rd=null;
  const now=new Date();const by=now.getFullYear()+543;
  const currentRound=(now.getMonth()<6?'1/':'2/')+by;
  document.getElementById('aRound').value=currentRound;
  document.getElementById('aDate').value=now.toISOString().split('T')[0];
  renderItems();showPage('pageAssessment');
}
function editAssess(round){
  if(!CU||CU.role==='regional'){alert('คุณไม่มีสิทธิ์แก้ไขแบบประเมิน');return;}
  _rd=round;document.getElementById('aRound').value=round;document.getElementById('aDate').value=new Date().toISOString().split('T')[0];
  renderItems();
  if(CH){
    const c=lg('r7_scores_'+CH.code+'_'+round);
    if(c){EC.forEach(it=>{const k=ik(it.c),el=document.getElementById('sc_'+k);if(el&&c['i_'+k]!==undefined&&c['i_'+k]!=='')el.value=c['i_'+k];});if(c.date)document.getElementById('aDate').value=c.date;}
  }
  updLive();showPage('pageAssessment');
}
function loadDraft(){
  const rnd=document.getElementById('aRound').value;
  if(CH){
    const c=lg('r7_scores_'+CH.code+'_'+rnd);
    if(c){EC.forEach(it=>{const k=ik(it.c),el=document.getElementById('sc_'+k);if(el&&c['i_'+k]!==undefined)el.value=c['i_'+k];});}
    else{EC.forEach(it=>{const el=document.getElementById('sc_'+ik(it.c));if(el)el.value='';});}
  }
  updLive();
}

function renderItems(){
  const ct=document.getElementById('aItems');let h='';
  CATS.forEach(cat=>{
    const its=EC.filter(x=>x.cat===cat.id);
    h+=\`<div class="mb-4 border border-gray-200 rounded-xl overflow-hidden"><div class="\${cat.css} p-3 font-bold text-gray-800 text-sm">\${cat.nm}\${cat.id===4?'<div class="text-xs font-normal text-gray-600 mt-1">**ให้หน่วยบริการให้คะแนนทุกข้อ ระบบจะเลือก 2 ข้อที่คะแนนสูงสุดอัตโนมัติ</div>':''}</div><div class="p-4 space-y-4">\`;
    its.forEach(it=>{
      const k=ik(it.c),lc=it.lc||'ALL',hl=CH?CH.level:'',show=lc==='ALL'||lc.split(',').some(l=>l.trim()===hl);
      if(!show)return;
      // Concept/standard section
      const csHtml=it.cs?\`<div class="bg-blue-50 border border-blue-100 rounded-lg p-2 mt-1 mb-2"><div class="text-xs font-bold text-blue-700 mb-1">แนวคิด/มาตรฐาน</div><div class="text-xs text-blue-800 nl">\${nlbr(it.cs)}</div></div>\`:'';
      const evHtml=it.ev?\`<div class="text-xs text-gray-500 mt-1"><span class="font-medium">หลักฐาน:</span> \${nlbr(it.ev)}</div>\`:'';
      const rgHtml=it.rg?\`<div class="text-xs text-gray-500 mt-1"><span class="font-medium">กฎระเบียบ:</span> \${nlbr(it.rg)}</div>\`:'';

      h+=\`<div class="border-b border-gray-100 pb-3 last:border-b-0" id="row_\${k}">
<div class="flex items-center gap-2 mb-1 flex-wrap"><span class="text-indigo-600 font-bold text-sm">\${it.c}</span><span class="text-gray-700 text-sm">\${esc(it.n)}</span>\${it.cat===4?'<span id="tb_'+k+'" class="top-badge hidden">TOP</span>':''}</div>
\${csHtml}
<div class="flex items-center gap-2 mb-1"><select id="sc_\${k}" onchange="onSc('\${k}')" class="border border-gray-200 p-1.5 rounded-lg text-sm w-32 bg-white"><option value="">-- เลือก --</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select><span class="text-gray-400 text-xs">/ 5</span></div>
<details class="text-xs"><summary class="cursor-pointer text-indigo-500 hover:text-indigo-700 select-none">ดูเกณฑ์ทุกระดับ</summary><div class="mt-1 space-y-0.5 pl-1">\${[0,1,2,3,4,5].map(lv=>\`<div class="score-level" id="lv_\${k}_\${lv}" onclick="pickLv('\${k}',\${lv})"><span class="font-bold text-indigo-700">\${lv}:</span> <span class="text-gray-600 nl">\${nlbr(it['s'+lv]||'ไม่มีข้อมูล')}</span></div>\`).join('')}</div></details>
\${evHtml}\${rgHtml}
</div>\`;
    });
    h+='</div></div>';
  });
  ct.innerHTML=h;document.getElementById('saveMsg').textContent='';updLive();
}

function pickLv(k,lv){const el=document.getElementById('sc_'+k);if(el){el.value=String(lv);onSc(k);}}
function onSc(k){
  for(let i=0;i<=5;i++){const e=document.getElementById('lv_'+k+'_'+i);if(e)e.classList.remove('selected');}
  const el=document.getElementById('sc_'+k);
  if(el&&el.value!==''){const e=document.getElementById('lv_'+k+'_'+el.value);if(e)e.classList.add('selected');}
  updLive();autoSave();
}

function updLive(){
  const d=collectForm(),dm=calcDims(d);
  document.getElementById('lComp').textContent=dm.composite;
  const ge=document.getElementById('lGrd');ge.textContent=dm.grade;ge.className='ml-1 px-2 py-0.5 rounded text-xs font-bold '+gc(dm.grade);
  let filled=0,total=0;EC.forEach(it=>{const lc=it.lc||'ALL',hl=CH?CH.level:'',show=lc==='ALL'||lc.split(',').some(l=>l.trim()===hl);if(!show)return;total++;const el=document.getElementById('sc_'+ik(it.c));if(el&&el.value!=='')filled++;});
  const pct=total>0?Math.round(filled/total*100):0;document.getElementById('aBar').style.width=pct+'%';document.getElementById('aProg').textContent=filled+'/'+total;
  ['4_1','4_2','4_3','4_4','4_5'].forEach(k=>{const b=document.getElementById('tb_'+k);if(b)b.classList.add('hidden');});
  if(dm.top2)dm.top2.forEach(k=>{const b=document.getElementById('tb_'+k);if(b)b.classList.remove('hidden');});
}

function collectForm(){
  const d={round:document.getElementById('aRound').value,date:document.getElementById('aDate').value};
  EC.forEach(it=>{const k=ik(it.c),el=document.getElementById('sc_'+k);d['i_'+k]=el?el.value||'0':'0';});return d;
}

function autoSave(){if(!CH)return;const d=collectForm();d.date=document.getElementById('aDate').value;ls('r7_draft_'+CH.code,d);}

async function saveAssess(){
  if(!CU||CU.role==='regional'){alert('คุณไม่มีสิทธิ์บันทึกแบบประเมิน');return;}
  const d=collectForm(),dm=calcDims(d);
  if(!d.date){alert('กรุณาเลือกวันที่ประเมิน');return;}
  const payload={action:'saveScore',hospital_code:CH.code,round:d.round,date:d.date,composite:dm.composite,grade:dm.grade,dim_revenue:dm.revenue,dim_cost:dm.cost,dim_discipline:dm.discipline,dim_collection:dm.collection,dim_process:dm.process,cat4_selected:(dm.top2||[]).map(k=>k.replace('_','.')).join(',')};
  let totalRaw=0;const t2s=new Set(dm.top2||[]);
  EC.forEach(it=>{const k=ik(it.c);payload['item_'+k]=d['i_'+k];if(it.cat===4){if(t2s.has(k))totalRaw+=Number(d['i_'+k]||0);}else{totalRaw+=Number(d['i_'+k]||0);}});
  payload.total_raw=totalRaw;

  document.getElementById('saveMsg').textContent='กำลังบันทึก...';
  document.getElementById('saveSpinner').classList.remove('hidden');
  document.getElementById('btnSave').disabled=true;
  const result=await pAPI(payload);
  document.getElementById('saveSpinner').classList.add('hidden');
  document.getElementById('btnSave').disabled=false;

  if(!result.success){
    document.getElementById('saveMsg').textContent='บันทึกไม่สำเร็จ: '+(result.error||'กรุณาลองใหม่');
    document.getElementById('saveMsg').className='mt-2 text-red-500 text-sm';
    // Still save locally
  }else{
    document.getElementById('saveMsg').textContent='บันทึกสำเร็จ';
    document.getElementById('saveMsg').className='mt-2 text-emerald-500 text-sm';
  }

  ls('r7_scores_'+CH.code+'_'+d.round,d);lr('r7_draft_'+CH.code);
  try{const sr=await gAPI('getAllScores');if(sr.success&&sr.scores&&sr.scores.length>0)AS=sr.scores.concat(processHistorical());else AS=processHistorical();}catch(e){}
  showReport(d,dm);
}

// ==================== REPORT ====================
function showReport(d,dm){
  _rptD=d;_rptDm=dm;
  document.getElementById('rSub').textContent=(CH?CH.name:'')+' - รอบ '+d.round;
  document.getElementById('rComp').textContent=dm.composite;
  const ge=document.getElementById('rGrade');ge.textContent='Grade '+dm.grade;ge.className='inline-block px-4 py-1 rounded-full text-sm font-bold '+gc(dm.grade);
  mkRadar('cRadarRpt','chRpt',[dm.revenue,dm.cost,dm.discipline,dm.collection,dm.process]);

  let sh='';EC.forEach(it=>{
    const k=ik(it.c),sc=Number(d['i_'+k]||0);
    if(sc>=4)sh+=\`<div class="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm"><span class="font-bold text-emerald-700">\${it.c}</span> \${esc(it.n)} <span class="ml-1 font-bold text-emerald-600">(\${sc}/5)</span><div class="text-gray-600 text-xs mt-1 nl">\${nlbr(it['s'+sc])}</div></div>\`;
  });
  document.getElementById('rStr').innerHTML=sh||'<p class="text-gray-400 text-sm">ไม่มีข้อที่ได้ 4-5 คะแนน</p>';

  let wh='';EC.forEach(it=>{
    const k=ik(it.c),sc=Number(d['i_'+k]||0);
    if(sc<=2){
      const nl=Math.min(sc+1,5),rec=it['s'+nl]||'';
      wh+=\`<div class="bg-red-50 border border-red-100 rounded-lg p-3 text-sm"><span class="font-bold text-red-600">\${it.c}</span> \${esc(it.n)} <span class="ml-1 font-bold text-red-500">(\${sc}/5)</span><div class="text-gray-600 text-xs mt-1 nl">\${nlbr(it['s'+sc])}</div>\${rec?\`<div class="mt-1 text-indigo-700 text-xs bg-indigo-50 p-2 rounded nl">&rarr; เพื่อพัฒนาสู่ระดับ \${nl}: \${nlbr(rec)}</div>\`:''}</div>\`;
    }
  });
  document.getElementById('rWeak').innerHTML=wh||'<p class="text-gray-400 text-sm">ไม่มีข้อที่ได้ 0-2 คะแนน</p>';

  // Delta comparison
  if(CH){
    const codeStr=String(CH.code);
    const prev=AS.filter(s=>String(s.hospital_code)===codeStr&&s.round!==d.round).sort((a,b)=>(b.updated_at||b.round||'').localeCompare(a.updated_at||a.round||''));
    const p=prev[0];
    if(p){
      const dd=[{n:'Revenue',c:dm.revenue,p:Number(p.dim_revenue||0)},{n:'Cost',c:dm.cost,p:Number(p.dim_cost||0)},{n:'Discipline',c:dm.discipline,p:Number(p.dim_discipline||0)},{n:'Collection',c:dm.collection,p:Number(p.dim_collection||0)},{n:'Process',c:dm.process,p:Number(p.dim_process||0)}];
      let ch=\`<div class="text-xs text-gray-500 mb-2">เทียบกับรอบ \${p.round}</div><div class="grid grid-cols-2 md:grid-cols-5 gap-2">\`;
      dd.forEach(x=>{const dt=x.c-x.p,ar=dt>0?\`<span class="text-emerald-600 font-bold">&uarr;+\${dt}</span>\`:dt<0?\`<span class="text-red-500 font-bold">&darr;\${dt}</span>\`:'<span class="text-gray-400">=</span>';
      ch+=\`<div class="bg-gray-50 rounded-lg p-2 text-center text-xs"><div class="text-gray-500">\${x.n}</div><div>\${x.p}&rarr;\${x.c} \${ar}</div></div>\`;});
      ch+='</div>';document.getElementById('rDelta').innerHTML=ch;
    }else{document.getElementById('rDelta').textContent='ไม่มีข้อมูลรอบก่อนหน้า';}
  }
  showPage('pageReport');
}

function viewRpt(round){
  if(!CH)return;
  const c=lg('r7_scores_'+CH.code+'_'+round);
  if(c){c.round=round;const dm=calcDims(c);showReport(c,dm);}
  else{alert('ไม่พบข้อมูลรายข้อ กรุณาแก้ไขเพื่อเก็บข้อมูลก่อน');}
}

// ==================== EXPORTS ====================
function exportDashExcel(){
  const pv=document.getElementById('fProv').value,lv=document.getElementById('fLev').value,rn=document.getElementById('fRnd').value;
  const lm=getLS(AS,rn);let fh=AH.slice();if(pv)fh=fh.filter(h=>h.province===pv);if(lv)fh=fh.filter(h=>h.level===lv);

  const rows=fh.map(h=>{
    const s=lm[String(h.code)]||{};
    const cached=lg('r7_scores_'+h.code+'_'+(s.round||''));
    const row={'รหัส รพ.':h.code,'ชื่อ รพ.':h.name,'จังหวัด':h.province,'ระดับ':h.level,'รอบ':s.round||rn||'-','คะแนนรวม':s.total_raw||'-','Revenue%':s.dim_revenue||'-','Cost%':s.dim_cost||'-','Discipline%':s.dim_discipline||'-','Collection%':s.dim_collection||'-','Process%':s.dim_process||'-','Composite':s.composite||'-','Grade':s.grade||'-'};
    // Add item-level scores
    if(cached){EC.forEach(it=>{row[it.c+' '+it.n.substring(0,30)]=cached['i_'+ik(it.c)]||'-';});}
    return row;
  });
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Hospitals');
  XLSX.writeFile(wb,'R7_Dashboard_'+(rn||'all').replace('/','_')+'.xlsx');
}

function exportMyExcel(){
  if(!CH)return;
  const codeStr=String(CH.code);
  const hs=AS.filter(s=>String(s.hospital_code)===codeStr);
  const rows=hs.map(s=>{
    const row={'รอบ':s.round||'-','คะแนนรวม':s.total_raw||'-','Revenue%':s.dim_revenue||'-','Cost%':s.dim_cost||'-','Discipline%':s.dim_discipline||'-','Collection%':s.dim_collection||'-','Process%':s.dim_process||'-','Composite':s.composite||'-','Grade':s.grade||'-'};
    const cached=lg('r7_scores_'+codeStr+'_'+s.round);
    if(cached){EC.forEach(it=>{row[it.c]=cached['i_'+ik(it.c)]||'-';});}
    return row;
  });
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Scores');
  XLSX.writeFile(wb,'R7_'+CH.code+'_Export.xlsx');
}

function exportRptExcel(){
  if(!_rptD||!_rptDm)return;
  const rows=EC.map(it=>{
    const k=ik(it.c),sc=Number(_rptD['i_'+k]||0);
    return{'ข้อ':it.c,'หัวข้อ':it.n,'หมวด':it.cat,'มิติ':it.dim,'คะแนน':sc,'คำอธิบาย':String(it['s'+sc]||'').replace(/\\\\n/g,'\\n')};
  });
  rows.push({},{});
  rows.push({'ข้อ':'รพ.','คะแนน':CH?CH.name:'-'});
  rows.push({'ข้อ':'รอบ','คะแนน':_rptD.round||'-'});
  rows.push({'ข้อ':'คะแนนรวม','คะแนน':_rptDm.composite});
  rows.push({'ข้อ':'Grade','คะแนน':_rptDm.grade});
  rows.push({'ข้อ':'Revenue%','คะแนน':_rptDm.revenue});
  rows.push({'ข้อ':'Cost%','คะแนน':_rptDm.cost});
  rows.push({'ข้อ':'Discipline%','คะแนน':_rptDm.discipline});
  rows.push({'ข้อ':'Collection%','คะแนน':_rptDm.collection});
  rows.push({'ข้อ':'Process%','คะแนน':_rptDm.process});
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Report');
  XLSX.writeFile(wb,'R7_Report_'+(CH?CH.name:'')+'_'+(_rptD.round||'').replace('/','_')+'.xlsx');
}

// ==================== IMPORT ====================
let impRows=null;
function previewImport(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=function(ev){
    const wb=XLSX.read(ev.target.result,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];
    impRows=XLSX.utils.sheet_to_json(ws);
    const p=document.getElementById('impPrev');
    if(impRows.length>0){
      const cols=Object.keys(impRows[0]);
      p.innerHTML=\`<p class="mb-1 font-bold">\${impRows.length} แถว</p><table class="w-full border text-xs"><thead><tr>\${cols.map(c=>'<th class="border p-1 bg-gray-50">'+esc(c)+'</th>').join('')}</tr></thead><tbody>\${impRows.slice(0,5).map(r=>'<tr>'+cols.map(c=>'<td class="border p-1">'+esc(String(r[c]||''))+'</td>').join('')+'</tr>').join('')}</tbody></table>\${impRows.length>5?'<p class="mt-1 text-gray-400">...แสดง 5 แถวแรก</p>':''}\`;
    }else{p.innerHTML='<p class="text-gray-400">ไม่พบข้อมูล</p>';}
  };r.readAsArrayBuffer(f);
}
async function doImport(){
  if(!impRows||!impRows.length){alert('ไม่มีข้อมูล');return;}
  showLoad('กำลังนำเข้า '+impRows.length+' แถว...');
  let ok=0;
  for(const row of impRows){
    const p={action:'saveScore'};for(let k in row)p[k]=row[k];
    const r=await pAPI(p);if(r.success)ok++;
  }
  hideLoad();
  alert('นำเข้าสำเร็จ '+ok+'/'+impRows.length+' แถว');
  document.getElementById('importModal').classList.add('hidden');impRows=null;document.getElementById('impPrev').innerHTML='';document.getElementById('impFile').value='';
  try{const sr=await gAPI('getAllScores');if(sr.success&&sr.scores&&sr.scores.length>0)AS=sr.scores.concat(processHistorical());else AS=processHistorical();}catch(e){}
  refreshDash();
}
<\/script>
</body>
</html>`;

fs.writeFileSync('./index.html', html, 'utf8');
const size = fs.statSync('./index.html').size;
console.log('Built index.html: ' + (size/1024).toFixed(1) + 'KB');
console.log('Done!');
