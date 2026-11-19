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
| Method | Route | Description | Auth Required | Roles |
|---|---|---|---|---|
| `POST` | `/auth/login` | Authenticate user credentials and return Sanctum Bearer token + user profile | No | Public |
| `POST` | `/auth/register` | Self-register staff account (Requires valid unused `hospital_id_number` badge) | No | Doctor, Nurse (Admin self-registration forbidden) |
| `POST` | `/auth/logout` | Revoke current user session / token | Yes | All Authenticated |
| `GET` | `/auth/me` | Fetch authenticated user profile, role & permissions | Yes | All Authenticated |

---

## 2. User Management Endpoints (Admin Only)
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/users` | List hospital staff users with search, role, and status filters | Admin |
| `POST` | `/users` | Create an authorized staff account with role and badge ID | Admin |
| `GET` | `/users/{id}` | Retrieve specific staff user details | Admin |
| `PUT` | `/users/{id}` | Update staff profile details (name, email, role) | Admin |
| `PATCH` | `/users/{id}/status` | Activate or deactivate staff account | Admin |

---

## 3. Patient Management Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/patients` | List patients with pagination, search, admission status, and ward filters | Admin, Doctor, Nurse |
| `POST` | `/patients` | Register a new patient and automatically generate formatted code (`PAT-YYYY-XXXX`) | Admin, Nurse |
| `GET` | `/patients/{id}` | Get full patient profile, active admission details, and latest vital records | Admin, Doctor, Nurse |
| `PUT` | `/patients/{id}` | Update patient demographic information | Admin, Nurse |
| `DELETE` | `/patients/{id}` | Delete patient record (permitted only if no immutable clinical vital history exists) | Admin |
| `GET` | `/patients/{id}/admissions` | Retrieve full historical admission records for patient | Admin, Doctor, Nurse |
| `GET` | `/patients/{id}/vitals` | Retrieve time-series vital history for Recharts graphs | Admin, Doctor, Nurse |

---

## 4. Admission & Bed Management Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/admissions` | List hospital admissions with ward & status filters | Admin, Doctor, Nurse |
| `GET` | `/admissions/beds` | Query occupied and available beds in a specific ward (`?ward=...`) | Admin, Doctor, Nurse |
| `POST` | `/admissions` | Admit patient to ward & bed (validates bed occupancy and blocks duplicate active admissions) | Nurse |
| `GET` | `/admissions/{id}` | Retrieve detailed admission record with patient and vital trail | Admin, Doctor, Nurse |
| `PATCH` | `/admissions/{id}/discharge` | Formally discharge patient and free assigned bed (**Doctors only**, Admins/Nurses blocked) | Doctor |
| `POST` | `/admissions/{id}/request-icu-transfer` | Request emergency ICU escalation for a deteriorating patient | Doctor, Admin |
| `POST` | `/admissions/{id}/complete-icu-transfer` | Allocate ICU bed (**Strict FIFO Priority Queue**: blocks lower priority if earlier request is pending) | Nurse, Admin, Doctor |
| `POST` | `/admissions/{id}/cancel-icu-transfer` | Revoke / cancel emergency ICU transfer request | Doctor, Admin |
| `POST` | `/admissions/{id}/request-step-down` | Request de-escalation from ICU to general ward (Requires clinical stability) | Doctor, Admin |
| `POST` | `/admissions/{id}/complete-step-down` | Allocate general ward bed (**Strict FIFO Priority Queue**: blocks out-of-order allocations) | Nurse, Admin, Doctor |
| `POST` | `/admissions/{id}/cancel-step-down` | Revoke / cancel ward step-down request | Doctor, Nurse, Admin |

---

## 5. Vital Signs Observation Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/vitals` | List recent vital measurements across hospital with patient and date-range filters | Admin, Doctor, Nurse |
| `POST` | `/vitals` | Bedside vital signs entry (**Nurses only**, Doctors/Admins blocked; locked if post-ICU transfer assessment is pending) | Nurse |
| `GET` | `/vitals/{id}` | Retrieve individual vital measurement record with triggered alerts | Admin, Doctor, Nurse |

*Note on Data Immutability: Vital signs records are permanently immutable. No `PUT`, `PATCH`, or `DELETE` endpoints exist on `/vitals`.*

---

## 6. Dashboard & Telemetry Endpoints
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/dashboard/summary` | Retrieve KPI card metrics (total admitted, active emergencies, normal & stable count) | Admin, Doctor, Nurse |
| `GET` | `/dashboard/patients` | Retrieve live situation telemetry roster with plain-English status pills & vital signs | Admin, Doctor, Nurse |
| `GET` | `/dashboard/alerts` | Retrieve prioritized active alert feed | Admin, Doctor, Nurse |
| `GET` | `/dashboard/activities` | Retrieve clinical and administrative event audit log stream | Admin |

---

## 7. Alerts & Bedside Physician Actions
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/alerts` | Query alarms by status, priority, patient, and date | Admin, Doctor, Nurse |
| `GET` | `/alerts/{id}` | Fetch alert details and full chronological triage history | Admin, Doctor, Nurse |
| `PATCH` | `/alerts/{id}/acknowledge` | Acknowledge active alarm with clinical note | Doctor, Nurse, Admin |
| `PATCH` | `/alerts/{id}/doctor-in-action` | Physician bedside attendance (**Single-patient concurrency limit**: blocked if attending another patient) | Doctor, Admin |
| `PATCH` | `/alerts/{id}/assessment-done` | Complete physician bedside attendance, resolve alarm, and unlock nurse vital sign entry | Doctor, Admin |
| `POST` | `/alerts/{id}/request-icu-transfer` | Shortcut to request emergency ICU transfer from active bedside alarm | Doctor, Admin |
| `PATCH` | `/alerts/{id}/resolve` | Formally resolve alarm with clinical disposition notes | Doctor, Admin |
| `GET` | `/alerts/{id}/history` | Retrieve complete audit trail of alert acknowledgements and state transitions | Admin, Doctor, Nurse |

---

## 8. Early Warning Alert Rules (Admin Configurable)
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/alert-rules` | List configured early warning threshold rules | Admin, Doctor, Nurse |
| `POST` | `/alert-rules` | Create a new physiological threshold rule | Admin |
| `PUT` | `/alert-rules/{id}` | Update threshold boundary, operator, priority, or message template | Admin |
| `PATCH` | `/alert-rules/{id}/status` | Enable or disable rule evaluation | Admin |

---

## 9. Clinical Reports & System Audit Logs
| Method | Route | Description | Roles |
|---|---|---|---|
| `GET` | `/reports/patients/{id}` | Preview structured patient clinical report JSON payload | Admin, Doctor, Nurse |
| `GET` | `/reports/patients/{id}/pdf` | Stream or download formal Dompdf generated multi-page clinical dossier | Admin, Doctor, Nurse |
| `GET` | `/audit-logs` | Retrieve paginated hospital audit events with category and date filtering | Admin |
| `DELETE` | `/audit-logs/all` | Permanently clear all system audit logs | Admin |
| `POST` | `/audit-logs/delete-by-date` | Delete audit logs within a specific date range (`start_date`, `end_date`) | Admin |
| `DELETE` | `/audit-logs/{id}` | Delete a specific individual audit log event | Admin |
