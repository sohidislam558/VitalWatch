# VitalWatch — User Roles & Permissions Matrix

## 1. System Roles
VitalWatch defines three standard hospital roles with strict separation of duties:

1. **Admin (System Administrator):** Oversees user provisioning, global alert thresholds, system audit trails, and general system configuration.
2. **Doctor (Attending Physician):** Clinical reviewer who monitors admitted patient trends, reviews time-series vitals charts, acknowledges and formally resolves alerts, and exports reports.
3. **Nurse (Floor / Ward Nurse):** Point-of-care staff who registers patients, performs ward admissions, manually inputs vital sign measurements during rounds, and acknowledges early warning alerts.

---

## 2. Role-Based Permissions Matrix

| Feature / Action | Admin | Doctor | Nurse | Backend Enforcement |
|---|:---:|:---:|:---:|---|
| **View Central Dashboard** | Yes | Yes | Yes | `EnsureUserIsActive` |
| **Manage Staff Accounts** | Yes | No | No | `UserPolicy`, `role:admin` |
| **Register / Edit Patients** | Yes | No | Yes | `PatientPolicy` |
| **View Patient Details & Charts** | Yes | Yes | Yes | `PatientPolicy` |
| **Create Admissions** | Yes | No | Yes | `AdmissionPolicy` |
| **Discharge Patients** | Yes | No | No | `AdmissionPolicy` |
| **Manual Vital Sign Entry** | Yes | No | Yes | `VitalRecordPolicy` |
| **View Vital History Tables** | Yes | Yes | Yes | `VitalRecordPolicy` |
| **Acknowledge Alerts** | Yes | Yes | Yes | `AlertPolicy` |
| **Resolve Alerts** | Yes | Yes | No | `AlertPolicy` (Physician level) |
| **Manage Alert Rules (Thresholds)** | Yes | No | No | `AlertRulePolicy` |
| **View System Audit Logs** | Yes | No | No | `role:admin` |
| **Download PDF Reports** | Yes | Yes | Yes | `ReportPolicy` |
| **Modify Past Vital Measurements** | No | No | No | **Forbidden for all roles** (Immutable medical records) |

