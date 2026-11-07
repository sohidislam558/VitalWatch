# VitalWatch — REST API Documentation

Base URL: `http://localhost:8000/api`

Standard Response Format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Standard Error Response Format:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": ["Specific validation message"]
  }
}
```

---

## 1. Authentication Endpoints
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate user credentials and return Sanctum token + user info | No |
| `POST` | `/auth/logout` | Revoke current user session / token | Yes |
| `GET` | `/auth/me` | Fetch authenticated user profile & permissions | Yes |

---

## 2. User Management Endpoints (Admin Only)
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/users` | List staff users with search, role, and status filters | Admin |
| `POST` | `/users` | Create a new staff account | Admin |
| `GET` | `/users/{id}` | Retrieve specific staff details | Admin |
| `PUT` | `/users/{id}` | Update staff profile details | Admin |
| `PATCH` | `/users/{id}/status` | Activate or deactivate staff account | Admin |

---

## 3. Patient Management Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/patients` | List patients with pagination, search, and ward filters | Admin, Doctor, Nurse |
| `POST` | `/patients` | Register a new patient | Admin, Nurse |
| `GET` | `/patients/{id}` | Get full patient profile, active admission, and latest vitals | Admin, Doctor, Nurse |
| `PUT` | `/patients/{id}` | Update patient demographic information | Admin, Nurse |
| `GET` | `/patients/{id}/admissions` | Retrieve full admission history for patient | Admin, Doctor, Nurse |

---

## 4. Admission Management Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/admissions` | List hospital admissions with ward & status filter | Admin, Doctor, Nurse |
| `POST` | `/admissions` | Admit a patient (validates no current active admission) | Admin, Nurse |
| `GET` | `/admissions/{id}` | Retrieve detailed admission record | Admin, Doctor, Nurse |
| `PATCH` | `/admissions/{id}/discharge` | Discharge patient and free bed/ward | Admin |

---

## 5. Vital Records Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/vitals` | List recent vital measurements across hospital | Admin, Doctor, Nurse |
| `POST` | `/vitals` | Manually record new vital signs; triggers Alert Engine | Admin, Nurse |
| `GET` | `/vitals/{id}` | Retrieve individual vital record details | Admin, Doctor, Nurse |
| `GET` | `/patients/{id}/vitals` | Retrieve time-series vital history for charts | Admin, Doctor, Nurse |

---

## 6. Dashboard Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/dashboard/summary` | Retrieve KPI card statistics (admitted, vitals count, alerts) | Admin, Doctor, Nurse |
| `GET` | `/dashboard/patients` | Retrieve active monitoring table with latest vitals & status | Admin, Doctor, Nurse |
| `GET` | `/dashboard/alerts` | Retrieve prioritized active alert feed | Admin, Doctor, Nurse |

---

## 7. Alerts & Alert Rules Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/alerts` | Query alerts by status, priority, patient, and date | Admin, Doctor, Nurse |
| `GET` | `/alerts/{id}` | Fetch alert details and historical acknowledgements | Admin, Doctor, Nurse |
| `PATCH` | `/alerts/{id}/acknowledge` | Acknowledge active alert with clinical note | Doctor, Nurse |
| `PATCH` | `/alerts/{id}/resolve` | Resolve alert with resolution outcome | Doctor |
| `GET` | `/alerts/{id}/history` | Retrieve complete audit trail of alert triage | Admin, Doctor, Nurse |
| `GET` | `/alert-rules` | List configured alert rules | Admin, Doctor, Nurse |
| `POST` | `/alert-rules` | Create a new alert rule | Admin |
| `PUT` | `/alert-rules/{id}` | Update threshold, operator, or priority | Admin |
| `PATCH` | `/alert-rules/{id}/status` | Enable or disable rule | Admin |

---

## 8. Reports & Audit Logs Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/reports/patients/{id}` | Preview patient report JSON payload | Admin, Doctor, Nurse |
| `GET` | `/reports/patients/{id}/pdf` | Stream or download formal Dompdf generated PDF report | Admin, Doctor, Nurse |
| `GET` | `/audit-logs` | Retrieve paginated system audit trails | Admin |

