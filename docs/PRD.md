# Product Requirements Document (PRD)
# R7 Assessment System v3.1

## 1. Product Overview

ระบบประเมินมาตรฐานการเงินการคลัง เขตสุขภาพที่ 7 (R7 Financial Assessment System) เป็นเว็บแอปพลิเคชันที่ใช้ประเมินและติดตามมาตรฐานการเงินการคลังของโรงพยาบาลในเขตสุขภาพที่ 7 ครอบคลุม 4 จังหวัด (ขอนแก่น, กาฬสินธุ์, มหาสารคาม, ร้อยเอ็ด) จำนวน 77 โรงพยาบาล

## 2. User Roles

| Role | Description | Capabilities |
|------|-------------|-------------|
| **Admin** | ผู้ดูแลระบบ (เขตสุขภาพที่ 7) | ดู Dashboard, Import Excel, จัดการข้อมูล |
| **Assessor (Hospital)** | ผู้ประเมินระดับ รพ. | ทำแบบประเมิน, ดูรายงาน, แก้ไขข้อมูล, Export |
| **Regional Viewer** | ผู้ชมระดับจังหวัด | ดู Dashboard (filter เฉพาะจังหวัด), Export |

## 3. Key Features

### 3.1 Public Dashboard (ไม่ต้อง login)
- **Summary Cards**: จำนวน รพ., Grade A/B/C/D, คะแนนเฉลี่ย
- **Filters**: จังหวัด, ระดับ รพ. (A/S/M1/M2/F1/F2/F3), รอบประเมิน
- **Charts**: Radar chart 5 มิติ (เฉลี่ย), Doughnut chart สัดส่วน Grade
- **Hospital Table**: sortable, filterable, คลิก drill-down
- **Download Excel**: export ข้อมูลตาม filter

### 3.2 Hospital Detail (Public)
- Radar chart 5 มิติ ของ รพ.
- Category progress bars (หมวด 1-6)
- ประวัติรอบประเมิน
- เปรียบเทียบกับ Best Practice (ระดับเดียวกัน)

### 3.3 Login & Authentication
- Mock authentication via Google Apps Script API
- Role-based redirection: Admin → Dashboard, Hospital → My Dashboard, Regional → Dashboard (filtered)

### 3.4 Hospital Dashboard (หลัง login)
- Composite Score + Grade + Radar chart
- Dimension scores (Revenue, Cost, Discipline, Collection, Process)
- Best Practice comparison
- Assessment history table with edit/report actions
- Start new assessment / Export Excel

### 3.5 Assessment Form
- 33 criteria items across 6 categories (scored 0-5)
- Expandable score descriptions (original template text)
- แนวคิด/มาตรฐาน (Concept Standard) per item
- Category 4: auto-select TOP 2 from 5 items
- Live composite score + progress bar
- localStorage autosave

### 3.6 Assessment Report
- Auto-generated after save
- จุดแข็ง (score 4-5) with descriptions
- จุดควรปรับปรุง (score 0-2) with recommendations (next level criteria)
- Delta comparison with previous round
- Export to Excel

### 3.7 Excel Import (Admin only)
- Upload .xlsx → preview → import via API
- Supports batch import of historical data

## 4. Data Sources
- **Criteria**: 33 items from R7_template_v9.xlsx (embedded as EC constant)
- **Historical Scores**: 230 records from R7_มาตรฐานการเงิน_ทุกรอบ_cleaned.xlsx (embedded as HS constant)
- **Live Scores**: Google Apps Script API + Google Sheets backend

## 5. Non-Functional Requirements
- Single-file HTML deployment (GitHub Pages)
- No server-side rendering required
- Works offline for cached data (localStorage)
- Mobile responsive (Tailwind CSS)
- Thai language UI

## 6. Constraints
- Client-side only (no backend server)
- API is Google Apps Script (slow cold start ~3-5s)
- CORS workaround: POST with `Content-Type: text/plain;charset=utf-8`
- Buddhist calendar year (พ.ศ. = AD + 543)
