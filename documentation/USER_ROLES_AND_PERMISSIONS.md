# VitalWatch — User Roles & Clinical Permissions Matrix

## 1. System Roles

VitalWatch defines three standard hospital roles with strict separation of clinical responsibilities and authority:

1. **Floor / Bedside Nurse (`nurse`):**
   - Point-of-care caregiver responsible for patient ward admissions, bed occupancy assignments, and routine manual vital signs measurements.
   - Executes bed allocations for both Emergency ICU transfers and Ward Step-Downs according to the strict chronological FIFO priority queue.
   - Access is temporarily locked from recording vitals following an acute ICU transfer until the attending physician marks their bedside clinical assessment done.

2. **Attending Physician / Doctor (`doctor` / MO):**
   - Medical decision-maker who monitors inpatient situation status, telemetry trends, and early warning alarms.
   - Responds to bedside emergencies with **"🩺 Doctor in Action"** (strictly limited to **one active patient at a time** to prevent dangerous clinical divided-attention).
   - Authorizes formal emergency ICU escalations, ward step-down de-escalations, alarm resolutions, and patient discharges.

3. **Hospital Administrator (`admin`):**
   - Oversees hospital governance, staff accounts and identity badges, alert threshold engine rules, and regulatory clinical activity audit logs.
   - Cannot record vital signs (enforcing that only certified bedside nursing staff input physiological data) and cannot discharge patients.
   - Possesses authority to review, date-filter, inspect, and safely prune system audit trails.

---

## 2. Clinical Role-Based Permissions Matrix

| Feature / Action | Nurse | Attending Physician (Doctor / MO) | Hospital Administrator | Governing Policy / Implementation |
|---|:---:|:---:|:---:|---|
| **View Situation Monitor & Telemetry** | ✅ | ✅ | ✅ | `EnsureUserIsActive`, `SituationMonitor.jsx` |
| **Self-Register with Hospital Badge** | ✅ | ✅ | ❌ | Validates `HospitalStaffIdentity` badge number |
| **Manage Staff Accounts & Badges** | ❌ | ❌ | ✅ | `UserPolicy`, `role:admin` |
| **Admit Inpatient to Ward Bed** | ✅ | ❌ | ❌ | `AdmissionPolicy::create` (Nurse exclusive) |
| **Discharge Admitted Patient** | ❌ | ✅ | ❌ | `AdmissionPolicy::discharge` (Doctor exclusive; Admin blocked) |
| **Record Bedside Vital Signs** | ✅ | ❌ | ❌ | `VitalRecordPolicy::create` (Nurse exclusive; Doctor/Admin blocked) |
| **Post-ICU Transfer Vitals Entry** | 🔒 *(Locked)* | ❌ | ❌ | Locked until attending physician marks assessment done |
| **View Vital History & Trend Charts** | ✅ | ✅ | ✅ | `VitalRecordPolicy::viewAny`, `VitalHistory.jsx` |
| **Acknowledge Active Alarms** | ✅ | ✅ | ✅ | `AlertPolicy::acknowledge` |
| **Physician Bedside Response (In Action)**| ❌ | ✅ | ✅ | `AlertPolicy::doctorInAction` (**Single-patient concurrency limit**) |
| **Mark Clinical Assessment Done** | ❌ | ✅ | ✅ | `AlertService::markAssessmentDone` (Resolves alarm, unlocks nurse input) |
| **Request Emergency ICU Escalation** | ❌ | ✅ | ✅ | `AdmissionPolicy::requestIcuTransfer` |
| **Allocate ICU Bed (Strict FIFO Queue)**| ✅ | ✅ | ✅ | `AdmissionService::completeIcuTransfer` (**Strict FIFO Order**) |
| **Request Ward Step-Down De-escalation**| ❌ | ✅ | ✅ | `AdmissionPolicy::requestStepDown` (Requires clinical stability) |
| **Allocate Step-Down Bed (Strict FIFO)** | ✅ | ✅ | ✅ | `AdmissionService::completeStepDown` (**Strict FIFO Order**) |
| **Configure Alert Threshold Rules** | ❌ | ❌ | ✅ | `AlertRulePolicy`, `role:admin` |
| **View Clinical Activity Audit Logs** | ❌ | ❌ | ✅ | `role:admin`, `AdminPortal.jsx` |
| **Filter & Delete Audit Logs (Date/All)**| ❌ | ❌ | ✅ | `AuditController` |
| **Generate & Stream PDF Clinical Dossier**| ✅ | ✅ | ✅ | `ReportPolicy::downloadPdf` |
| **Modify or Delete Past Vital Records** | ❌ | ❌ | ❌ | **Forbidden for all roles** (Immutable medical records) |
| **Delete Active or Historical Alarms** | ❌ | ❌ | ❌ | **Forbidden for all roles** (Full triage traceability) |
