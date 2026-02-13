# Data Schema
# R7 Assessment System v3.1

## 1. Embedded Criteria (EC)

Array of 33 criteria items. Source: `embedded_criteria.js`

```typescript
interface CriteriaItem {
  c: string;    // Item number: "1.1", "3.14", etc.
  n: string;    // Item name (Thai)
  cat: number;  // Category: 1-6
  dim: string;  // Dimension: "Process"|"Revenue"|"Cost"|"Discipline"|"Collection"
  s0: string;   // Score 0 description
  s1: string;   // Score 1 description
  s2: string;   // Score 2 description
  s3: string;   // Score 3 description
  s4: string;   // Score 4 description
  s5: string;   // Score 5 description
  cs: string;   // Concept/Standard (แนวคิด/มาตรฐาน)
  ev: string;   // Evidence requirements (หลักฐาน)
  rg: string;   // Regulations (กฎระเบียบ)
  lc: string;   // Level constraint: "ALL" or "M1,M2,A"
}
```

## 2. Historical Scores (HS)

Array of 230 records. Source: `embedded_scores.js`

```typescript
interface HistoricalScore {
  r: string;     // Round: "2/2567", "1/2568", "2/2568"
  h: number;     // Hospital code: 10670, 10708, etc.
  hn: string;    // Hospital name (Thai)
  pv: string;    // Province (Thai): ขอนแก่น, กาฬสินธุ์, มหาสารคาม, ร้อยเอ็ด
  ts: number;    // Total raw score (0-150)
  pct: number;   // Percentage score
  pass: boolean; // Pass criteria
  c1: number;    // Category 1 subtotal
  c2: number;    // Category 2 subtotal
  c3: number;    // Category 3 subtotal
  c4: number;    // Category 4 subtotal
  c5: number;    // Category 5 subtotal
  c6: number;    // Category 6 subtotal
  // Item-level scores (33 items):
  i_1_1: number; i_1_2: number; ... i_6_5: number;
}
```

## 3. Processed Score (AS entry)

Internal format after processing historical + API data:

```typescript
interface ProcessedScore {
  hospital_code: string;
  round: string;
  date: string;
  total_raw: number;
  composite: number;       // 0-100
  grade: string;           // A|B|C|D
  dim_revenue: number;     // 0-100%
  dim_cost: number;        // 0-100%
  dim_discipline: number;  // 0-100%
  dim_collection: number;  // 0-100%
  dim_process: number;     // 0-100%
  updated_at: string;
  _src?: string;           // "hist" for historical
  _rec?: HistoricalScore;  // Original record ref
}
```

## 4. Hospital Record (AH entry)

```typescript
interface Hospital {
  code: string;
  name: string;
  province: string;
  level: string;  // A|S|M1|M2|F1|F2|F3
}
```

## 5. Current User (CU)

```typescript
interface CurrentUser {
  username: string;
  role: string;          // "admin"|"hospital"|"regional"
  hospital_code?: string; // For hospital role
  province?: string;      // For regional role
}
```

## 6. Form Data (collectForm output)

```typescript
interface FormData {
  round: string;     // e.g. "1/2569"
  date: string;      // ISO date
  i_1_1: string;     // Score for item 1.1 ("0"-"5" or "")
  i_1_2: string;     // Score for item 1.2
  // ... all 33 items as i_{cat}_{num}
  i_6_5: string;
}
```

## 7. API Payload (saveScore)

```typescript
interface SavePayload {
  action: "saveScore";
  hospital_code: string;
  round: string;
  date: string;
  composite: number;
  grade: string;
  dim_revenue: number;
  dim_cost: number;
  dim_discipline: number;
  dim_collection: number;
  dim_process: number;
  cat4_selected: string;  // e.g. "4.1,4.3"
  total_raw: number;
  item_1_1: string;       // Per-item scores
  // ... all 33 items
  item_6_5: string;
}
```

## 8. localStorage Keys

| Key Pattern | Value | Description |
|-------------|-------|-------------|
| `r7_scores_{code}_{round}` | FormData JSON | Cached item-level scores |
| `r7_draft_{code}` | FormData JSON | Autosaved draft |

## 9. API Endpoints (Google Apps Script)

Base URL: `https://script.google.com/macros/s/AKfycbz.../exec`

| Action | Method | Params | Response |
|--------|--------|--------|----------|
| `getHospitals` | GET | - | `{success, hospitals[]}` |
| `getHospital` | GET | `code` | `{success, hospital}` |
| `getAllScores` | GET | - | `{success, scores[]}` |
| `getScores` | GET | `hospital_code` | `{success, scores[]}` |
| `login` | GET | `username, password` | `{success, user}` |
| `saveScore` | POST | SavePayload | `{success}` |

## 10. Data Coverage

- **Rounds**: 2/2567, 1/2568, 2/2568 (historical) + dynamic future rounds
- **Hospitals**: 77 across 4 provinces
- **Provinces**: ขอนแก่น, กาฬสินธุ์, มหาสารคาม, ร้อยเอ็ด
- **Hospital Levels**: A, S, M1, M2, F1, F2, F3
