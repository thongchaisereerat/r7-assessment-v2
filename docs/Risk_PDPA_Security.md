# Risk, PDPA & Security Assessment
# R7 Assessment System v3.1

## 1. Risk Register

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|------------|------------|
| R1 | API key exposed in client-side code | Medium | High | API is read-heavy, write requires auth. GAS has built-in abuse protection. |
| R2 | localStorage data loss on browser clear | Medium | Medium | Primary data stored in Google Sheets. localStorage is cache only. |
| R3 | CDN dependency (Tailwind, Chart.js) failure | Low | Low | Pin CDN versions. Consider self-hosting for critical deployments. |
| R4 | Google Apps Script cold start latency | Medium | High | Embedded historical data (HS) ensures instant dashboard. API is supplementary. |
| R5 | Single-file becomes too large | Low | Medium | Currently 240KB. Monitor growth. Consider splitting if >500KB. |
| R6 | No audit trail for score edits | Medium | High | API logs timestamps. Consider adding edit history in future. |
| R7 | Cross-site scripting (XSS) | High | Low | All user input escaped via `esc()` function. No `innerHTML` with raw user input. |
| R8 | CORS policy changes by Google | Medium | Low | Using `text/plain` content-type to avoid preflight. Monitor GAS updates. |

## 2. PDPA Compliance (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล)

### 2.1 Data Classification

| Data Type | Classification | PDPA Applies? |
|-----------|---------------|---------------|
| Hospital codes/names | Public | No |
| Assessment scores | Organization data | No (not personal) |
| Province/level info | Public | No |
| Login credentials | Personal | Yes |
| Assessor names (if added) | Personal | Yes |

### 2.2 Current Status

- **Minimal personal data**: System stores hospital-level data, not individual assessor information
- **No patient data**: Assessment is about hospital financial management, not patient records
- **Login credentials**: Stored in Google Sheets (server-side), not in client code
- **localStorage**: Contains only scores and draft data, no personal identifiers

### 2.3 Recommendations

1. **Privacy Notice**: Add a brief privacy notice on login page explaining data usage
2. **Data Retention**: Define retention policy for historical assessment data
3. **Access Logs**: Consider logging who accessed/modified scores (audit trail)
4. **Consent**: If adding assessor names, obtain explicit consent
5. **Data Minimization**: Current design already follows data minimization principles

## 3. Security Assessment

### 3.1 Authentication

| Aspect | Current State | Recommendation |
|--------|--------------|----------------|
| Auth method | Username/password via API | Acceptable for internal use |
| Password storage | Google Sheets (server-side) | Consider hashing |
| Session management | In-memory (CU variable) | No persistent sessions - OK |
| Brute force protection | None client-side | GAS has rate limiting |
| Password policy | Static passwords (R7+code) | Consider password change feature |

### 3.2 Authorization

| Aspect | Current State | Recommendation |
|--------|--------------|----------------|
| Role enforcement | Client-side UI visibility | Add server-side role checks in GAS |
| Hospital isolation | Code-level check (own hospital) | Enforce in API |
| Admin access | Full dashboard + import | Limit import to specific formats |

### 3.3 Data Security

| Aspect | Current State | Recommendation |
|--------|--------------|----------------|
| Transport | HTTPS (GitHub Pages + GAS) | OK |
| Data at rest | Google Sheets (encrypted by Google) | OK |
| Client cache | localStorage (unencrypted) | Acceptable - no sensitive data |
| XSS prevention | `esc()` function for all output | OK |
| CSRF | Not applicable (no cookies/sessions) | OK |

### 3.4 Known Limitations

1. **Client-side authorization only**: Role checks are in JavaScript. A determined user could bypass UI restrictions. Server-side enforcement needed for production.
2. **No rate limiting on client**: API calls are not throttled client-side.
3. **Static credentials**: Passwords follow predictable pattern (R7+hospital_code).
4. **No password change**: Users cannot change their passwords through the UI.
5. **No session timeout**: Logged-in state persists until page reload or manual logout.

## 4. Threat Model

### 4.1 Attack Surface

```
[Browser] ──HTTPS──▶ [GitHub Pages] (static, read-only)
[Browser] ──HTTPS──▶ [Google Apps Script API] (read/write)
```

### 4.2 Threats

| Threat | Likelihood | Impact | Status |
|--------|------------|--------|--------|
| XSS injection | Low | High | Mitigated (esc function) |
| API abuse/spam | Low | Medium | GAS rate limiting |
| Data tampering via API | Low | High | Auth required for writes |
| localStorage poisoning | Low | Low | Data validated before use |
| CDN supply chain attack | Very Low | High | Pin specific versions |

## 5. Compliance Checklist

- [x] No patient health data stored
- [x] HTTPS transport encryption
- [x] Input sanitization (XSS prevention)
- [x] Role-based access control (client-side)
- [x] No third-party analytics/tracking
- [ ] Server-side authorization enforcement
- [ ] Audit logging for data modifications
- [ ] Privacy notice on login page
- [ ] Data retention policy documented
- [ ] Regular security review schedule
