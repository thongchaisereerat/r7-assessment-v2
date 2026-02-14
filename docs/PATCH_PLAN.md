# Patch Plan - R7 Assessment System v3.1

Fixes ordered by risk-reduction priority. Each step includes the issue(s) resolved, what to change, and how to verify.

---

## Step 1: Add admin guard to `doImport()` (ISS-006)

**Risk reduced:** Prevents any console caller from bulk-importing data without admin role.

**Changes:**
- `build_v31.js:804` — Add role check at the start of `doImport()`:
  ```js
  async function doImport(){
    if(!CU||CU.role!=='admin'){alert('เฉพาะ Admin เท่านั้น');return;}
    // ... existing code
  }
  ```

**Files:** `build_v31.js`
**Verify:** Log in as hospital user → `doImport()` in console → blocked. Log in as admin → `doImport()` works.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 2: Move login to POST (ISS-004)

**Risk reduced:** Credentials no longer appear in URL, browser history, or server logs.

**Changes:**
- `build_v31.js:521` — Replace `gAPI('login',...)` with `pAPI(...)`:
  ```js
  const r = await pAPI({action:'login', username:u, password:p});
  ```
- **Server-side (Google Apps Script):** In `doPost(e)`, add handler for `action:'login'` that performs the same credential check as the current `doGet` login handler.

**Files:** `build_v31.js`, server-side Apps Script
**Verify:** DevTools Network tab → login request is POST, no credentials in URL.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 3: Add session timeout (ISS-009)

**Risk reduced:** Unattended sessions auto-expire after 30 minutes.

**Changes:**
- `build_v31.js` — After `CU=r.user` in `doLogin()`, store timestamp:
  ```js
  CU=r.user; CU._loginAt=Date.now();
  ```
- In `showPage()`, add session check:
  ```js
  if(CU && CU._loginAt && (Date.now()-CU._loginAt > 30*60*1000)){
    alert('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    doLogout(); return;
  }
  ```

**Files:** `build_v31.js`
**Verify:** Log in → manually set `CU._loginAt = Date.now() - 31*60*1000` → navigate → auto-logout.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 4: Fix level constraint 6.4 scoring (ISS-008)

**Risk reduced:** Non-M1/M2/A hospitals get fair Cost dimension scoring (max 100% instead of capped at 80%).

**Changes:**
- `build_v31.js` — Modify `calcDims()` to accept an optional `level` parameter:
  ```js
  function calcDims(d, level){
    // ... existing cat4 and other dimension code ...
    const lvApplies64 = !level || ['M1','M2','A'].includes(level);
    let coS=0;
    ['6_1','6_2','6_3','6_4','6_5'].forEach(k => {
      if(k==='6_4' && !lvApplies64) return;
      coS += Number(d['i_'+k]||0);
    });
    const coMax = lvApplies64 ? 25 : 20;
    // ... replace /25 with /coMax for cost ...
    const co = Math.round(coS/coMax*100);
    // ... rest unchanged ...
  }
  ```
- Update ALL callers of `calcDims()` to pass hospital level:
  - `updLive()` → `calcDims(d, CH?CH.level:'')` (line 644)
  - `saveAssess()` → `calcDims(d, CH?CH.level:'')` (line 662)
  - `processHistorical()` → pass level from HS record
  - `viewRpt()` → pass `CH.level`
- Update `config/scoring_rules.json` to document: `"level_constraint_adjustment": {"6.4": {"excluded_levels_max_raw": 20}}`
- Add test case to `tests/scoring.test.js`:
  ```js
  test('F2 hospital: Cost max 100% without item 6.4', () => {
    const scores = {}; rules.items.forEach(i => scores[i] = 5);
    scores['6.4'] = 0; // excluded for F2
    const r = calcDimsWithLevel(scores, 'F2');
    assert.strictEqual(r.cost, 100); // 20/20 = 100%, not 20/25 = 80%
  });
  ```

**Files:** `build_v31.js`, `config/scoring_rules.json`, `tests/scoring.test.js`
**Verify:** Run `npm test` → new test passes. Build → open in browser → assess as F2 hospital → Cost shows 100% when all applicable items are 5.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 5: Fix Best Practice round filter (ISS-002)

**Risk reduced:** Best Practice comparison no longer mixes scores from different rounds.

**Changes:**
- `build_v31.js:505` — In `openDetail()`, add round filter:
  ```js
  const rn = document.getElementById('fRnd').value;
  const sl = AS.filter(s => {
    const hp = AH.find(x => String(x.code) === String(s.hospital_code));
    return hp && hp.level === h.level
      && String(s.hospital_code) !== codeStr
      && (!rn || s.round === rn);
  });
  ```
- `build_v31.js:572` — In `loadMyDash()`, same pattern. Use the latest round from user's own scores if no filter:
  ```js
  const latestRound = sorted[0] ? sorted[0].round : null;
  const sl = AS.filter(s => {
    const hp = AH.find(x => String(x.code) === String(s.hospital_code));
    return hp && hp.level === CH.level
      && String(s.hospital_code) !== codeStr
      && (!latestRound || s.round === latestRound);
  });
  ```

**Files:** `build_v31.js`
**Verify:** Filter dashboard to round "1/2568" → click hospital → Best Practice should only reference scores from "1/2568".
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 6: Fix import data validation (ISS-007)

**Risk reduced:** Prevents corrupted or malicious data from entering the system via Excel import.

**Changes:**
- `build_v31.js:804-811` — Add validation function and call before sending each row:
  ```js
  function validateImportRow(row) {
    if(!row.hospital_code || !row.round) return false;
    // Check round format: N/YYYY
    if(!/^\d\/\d{4}$/.test(row.round)) return false;
    // Only allow known keys
    const allowed = new Set(['hospital_code','round','date',
      ...EC.map(it=>'item_'+ik(it.c))]);
    for(let k in row) { if(!allowed.has(k)) delete row[k]; }
    return true;
  }
  ```
- In `doImport()` loop, skip invalid rows and report count.

**Files:** `build_v31.js`
**Verify:** Import Excel with extra columns → verify they are stripped. Import row without hospital_code → verify it is skipped.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 7: Fix draft autosave key mismatch (ISS-003)

**Risk reduced:** In-progress assessments are preserved across navigation.

**Changes:**
- `build_v31.js:658` — Change `autoSave()` to include round in key:
  ```js
  function autoSave(){
    if(!CH)return;
    const d=collectForm();
    d.date=document.getElementById('aDate').value;
    ls('r7_draft_'+CH.code+'_'+d.round, d);
  }
  ```
- `build_v31.js:580-587` — In `startAssess()`, after setting round, check for draft:
  ```js
  const draft = lg('r7_draft_'+CH.code+'_'+currentRound);
  if(draft && confirm('พบข้อมูลร่างที่ยังไม่ได้บันทึก ต้องการโหลดหรือไม่?')){
    EC.forEach(it=>{const k=ik(it.c),el=document.getElementById('sc_'+k);
      if(el&&draft['i_'+k]!==undefined)el.value=draft['i_'+k];});
  }
  ```
- In `saveAssess()` after successful save, clear draft:
  ```js
  lr('r7_draft_'+CH.code+'_'+d.round);
  ```

**Files:** `build_v31.js`
**Verify:** Start assessment → fill 5 items → navigate away → start assessment again → see "restore draft?" prompt → click OK → items pre-filled.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 8: Add pre-save completeness check (ISS-012)

**Risk reduced:** Prevents accidental submission of incomplete assessments.

**Changes:**
- `build_v31.js:660-663` — In `saveAssess()`, after the existing date check, add:
  ```js
  let filled=0,total=0;
  EC.forEach(it=>{
    const lc=it.lc||'ALL',hl=CH?CH.level:'',
      show=lc==='ALL'||lc.split(',').some(l=>l.trim()===hl);
    if(!show)return; total++;
    const el=document.getElementById('sc_'+ik(it.c));
    if(el&&el.value!=='')filled++;
  });
  if(filled<total && !confirm(`คุณกรอกเพียง ${filled}/${total} ข้อ ต้องการบันทึกหรือไม่?`))return;
  ```

**Files:** `build_v31.js`
**Verify:** Leave items empty → Save → see confirmation. Cancel → stay on form.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 9: Pin Tailwind CDN version (ISS-010)

**Risk reduced:** Prevents UI breakage from Tailwind v4 release.

**Changes:**
- `build_v31.js:14` — Change:
  ```
  cdn.tailwindcss.com
  ```
  to:
  ```
  cdn.tailwindcss.com/3.4.17
  ```
- Add smoke test assertion in `tests/smoke.test.js`:
  ```js
  test('Tailwind CDN version pinned', () => {
    assert.ok(html.includes('cdn.tailwindcss.com/3'));
  });
  ```

**Files:** `build_v31.js`, `tests/smoke.test.js`
**Verify:** `npm test` → new test passes. View source → verify versioned URL.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 10: Add audit trail to save payload (ISS-013)

**Risk reduced:** Establishes accountability for score submissions.

**Changes:**
- `build_v31.js:664` — Add to payload:
  ```js
  payload.submitted_by = CU ? CU.username : 'unknown';
  payload.submitted_role = CU ? CU.role : 'unknown';
  payload.submitted_at = new Date().toISOString();
  ```
- **Server-side:** Add `submitted_by`, `submitted_role`, `submitted_at` columns to the Scores sheet.

**Files:** `build_v31.js`, server-side Apps Script, Google Sheet structure
**Verify:** Save assessment → check Google Sheets → `submitted_by` column populated.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Step 11: Fix fixture documentation (ISS-011)

**Risk reduced:** Documentation accuracy — prevents confusion for future reviewers.

**Changes:**
- `data/fixtures/golden_case_low.json:53` — Change `"raw": 18` to `"raw": 17`
- `data/fixtures/golden_case_low.json:54` — Change `"pct": 33` to `"pct": 31`
- `data/fixtures/golden_case_low.json:55` — Update `items_note` to end with `= 17, pct = round(17/55*100) = 31`
- `data/fixtures/golden_case_low.json:59` — Update `composite_calc` to use `31*0.05` instead of `33*0.05`

**Files:** `data/fixtures/golden_case_low.json`
**Verify:** `npm test` → all 155 tests still pass (test assertions were already correct).

---

## Step 12: Add API timeout (ISS-014)

**Risk reduced:** Prevents indefinite UI hang on network failure.

**Changes:**
- `build_v31.js:281-289` — Wrap fetch calls with AbortController:
  ```js
  async function gAPI(a,p={}){
    const u=new URL(API);u.searchParams.append('action',a);
    for(let k in p)u.searchParams.append(k,p[k]);
    const ac=new AbortController();
    const t=setTimeout(()=>ac.abort(),15000);
    try{const r=await(await fetch(u,{signal:ac.signal})).json();clearTimeout(t);return r;}
    catch(e){clearTimeout(t);return{success:false,error:e.name==='AbortError'?'Request timeout':e.message};}
  }
  ```
  Same pattern for `pAPI()`.

**Files:** `build_v31.js`
**Verify:** Throttle network to "Offline" in DevTools → perform action → loading spinner disappears after 15s with error message.
**Rebuild:** `node build_v31.js` → `npm test`

---

## Summary

| Step | Issue(s) | Effort | Impact |
|------|----------|--------|--------|
| 1 | ISS-006 | 5 min | High - blocks unauthorized import |
| 2 | ISS-004 | 15 min | High - protects credentials |
| 3 | ISS-009 | 10 min | High - session hygiene |
| 4 | ISS-008 | 30 min | High - scoring fairness for ~50 hospitals |
| 5 | ISS-002 | 15 min | High - data accuracy |
| 6 | ISS-007 | 20 min | Medium - data integrity |
| 7 | ISS-003 | 15 min | Medium - UX improvement |
| 8 | ISS-012 | 10 min | Medium - prevents incomplete submissions |
| 9 | ISS-010 | 5 min | Low - future-proofing |
| 10 | ISS-013 | 10 min | Medium - accountability |
| 11 | ISS-011 | 5 min | Low - documentation accuracy |
| 12 | ISS-014 | 10 min | Medium - reliability |

**Note:** ISS-001 (client-side auth bypass) and ISS-005 (no server-side role enforcement) require **server-side changes** to the Google Apps Script backend, which is outside the scope of client-side patches. Steps 1-3 mitigate the worst consequences on the client side. A full fix requires implementing JWT/session tokens in the Apps Script API.

**Total estimated effort:** ~2.5 hours for all client-side patches.
