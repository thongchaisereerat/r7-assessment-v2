# R7 Assessment System - Project Context

## Project Overview
- ระบบประเมินมาตรฐานการเงินการคลัง สำนักงานเขตสุขภาพที่ 7
- Single-page HTML app (index.html) ใช้ build_v31.js generate
- Backend: Google Sheets + Apps Script API
- Deploy: GitHub Pages → https://thongchaisereerat.github.io/r7-assessment-v2/

## Key Files
- `index.html` — ตัวเว็บหลัก (generated, ~277KB)
- `build_v31.js` — build script ที่ generate index.html
- `criteria_data.json` / `embedded_criteria.js` — ข้อมูลเกณฑ์ 33 ข้อ
- `scores_data.json` / `embedded_scores.js` — ข้อมูลคะแนนย้อนหลัง
- `R7_Handoff_ClaudeCode.md` — เอกสาร handoff ครบทุกเกณฑ์ทั้ง 6 หมวด
- `config/` — configuration files
- `data/` — data files
- `tests/` — test files

## Architecture
- 6 หมวด, 33 ข้อ, 150 คะแนนเต็ม (ผ่าน ≥120 = 80%)
- หมวด 4: เลือก 2 จาก 5 ข้อ
- หมวด 6.4: เฉพาะ รพ.ระดับ M1, M2, A
- Composite Score: 5 มิติ (Revenue 35%, Discipline 30%, Cost 15%, Collection 15%, Process 5%)

## APIs
- Apps Script v2: https://script.google.com/macros/s/AKfycbzOfoslb872k5viPjuVwaQJE21jc9sV_38S9Y3uq0LS1jTrIPQb9XXRjMZCtBUTOZ3V1g/exec
- ใช้ GET + URL params (action, data)

## Completed Features (as of 2026-02-14)
- Public Dashboard + Login system (Admin/Hospital)
- Assessment form ครบ 33 ข้อ พร้อมเกณฑ์เต็มจากคู่มือ
- รอบประเมิน dynamic (-5/+3 ปี)
- Composite Score + Grade (A/B/C/D)
- COMET UX: histogram, delta comparison, grade filters
- Export Excel
- Status badge (ร่าง/ส่งแล้ว)

## Login Credentials (ทดสอบ)
- Admin: admin / R7admin2568
- Hospital: 10670 / R710670 (รพ.ขอนแก่น)
