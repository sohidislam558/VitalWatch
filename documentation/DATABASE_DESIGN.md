# VitalWatch — Database Design

## 1. Schema Specifications
- **Database Name:** `vitalwatch_db`
- **Default Charset:** `utf8mb4`
- **Default Collation:** `utf8mb4_unicode_ci`
- **Storage Engine:** `InnoDB` (Required for foreign keys, row locks, and ACID transactions)

---

## 2. Entity Relationship Overview

```
 [HospitalStaffIdentity] 1 ----? 1 [User] (assigned_to)
 
 [User] 1 --------< N [VitalRecord] (recorded_by)
 [User] 1 --------< N [AlertAcknowledgement]
 [User] 1 --------< N [AuditLog]
 [User] 1 --------< N [AlertRule] (approved_by)
 [User] 1 --------< N [Admission] (icu_transfer_requested_by, step_down_requested_by)

 [Patient] 1 -----< N [Admission]
 [Patient] 1 -----< N [VitalRecord]
 [Patient] 1 -----< N [Alert]

 [Admission] 1 ---< N [VitalRecord]

 [VitalRecord] 1 -< N [Alert]

 [AlertRule] 1 ---< N [Alert]

 [Alert] 1 -------< N [AlertAcknowledgement]
 [Alert] 1 -------< N [EmailLog]
```

---

## 3. Table Definitions & Schemas

### 3.1 `users`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Unique user identifier |
| `name` | VARCHAR(255) | NOT NULL | Full name of staff member (sanitized via mutator) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Staff institutional email address |
| `hospital_id_number` | VARCHAR(64) | NULL | Verified hospital badge identification number |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | ENUM('admin', 'doctor', 'nurse') | NOT NULL | Role-based authorization tier |
| `status` | ENUM('active', 'inactive') | NOT NULL, DEFAULT 'active' | Staff account status |
| `remember_token` | VARCHAR(100) | NULL | Session token |
| `created_at` / `updated_at` | TIMESTAMP | NULL | Timestamps |

### 3.2 `hospital_staff_identities`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Identity record primary key |
| `identity_number` | VARCHAR(64) | UNIQUE, NOT NULL | Authorized hospital badge number (e.g. `VW-DOC-1001`) |
| `role` | ENUM('doctor', 'nurse') | NOT NULL | Designated clinical role |
| `department` | VARCHAR(100) | NOT NULL | Assigned hospital department |
| `is_assigned` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether claimed by a registered user |
| `assigned_to` | BIGINT UNSIGNED | NULL, FK -> `users.id` | User account claiming this badge |
| `created_at` / `updated_at` | TIMESTAMP | NULL | Timestamps |

### 3.3 `patients`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Internal surrogate primary key |
| `patient_code` | VARCHAR(64) | UNIQUE, NOT NULL | Formatted unique patient code (e.g. `PAT-2026-0001`) |
| `name` | VARCHAR(255) | NOT NULL | Patient legal full name |
| `date_of_birth` | DATE | NOT NULL | Date of birth |
| `gender` | ENUM('male', 'female', 'other') | NOT NULL | Patient biological gender |
| `contact` | VARCHAR(50) | NULL | Emergency phone or contact number |
| `address` | TEXT | NULL | Residential address |
| `created_at` / `updated_at` | TIMESTAMP | NULL | Audit timestamps |

### 3.4 `admissions`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Unique admission ID |
| `patient_id` | BIGINT UNSIGNED | FK -> `patients.id` | Patient reference |
| `admission_code` | VARCHAR(64) | UNIQUE, NOT NULL | Formatted unique admission code (e.g. `ADM-2026-0001`) |
| `ward` | VARCHAR(100) | NOT NULL | Hospital ward name (e.g., ICU, Cardiology ICU, General Ward) |
| `bed_number` | VARCHAR(50) | NOT NULL | Assigned bed number |
| `diagnosis` | VARCHAR(255) | NULL | Initial admitting clinical diagnosis |
| `admitted_at` | DATETIME | NOT NULL | Date and time of hospital admission |
| `discharged_at` | DATETIME | NULL | Date and time of formal discharge |
| `status` | ENUM('admitted', 'discharged') | NOT NULL, DEFAULT 'admitted' | Current admission status |
| `icu_transfer_requested` | BOOLEAN | NOT NULL, DEFAULT FALSE | Flag indicating active emergency ICU request |
| `icu_transfer_requested_at`| DATETIME | NULL | Timestamp doctor requested ICU (FIFO Queue Key) |
| `icu_transfer_requested_by`| BIGINT UNSIGNED | NULL, FK -> `users.id` | Physician requesting ICU transfer |
| `target_icu_ward` | VARCHAR(100) | NULL | Target ICU ward |
| `icu_transfer_notes` | TEXT | NULL | Physician clinical urgency notes |
| `icu_transferred` | BOOLEAN | NOT NULL, DEFAULT FALSE | Flag indicating patient has been moved to ICU |
| `icu_transferred_at` | DATETIME | NULL | Timestamp of ICU bed allocation |
| `icu_assessment_done` | BOOLEAN | NOT NULL, DEFAULT FALSE | Attending physician initial ICU assessment completion |
| `icu_assessment_done_at` | DATETIME | NULL | Timestamp physician completed ICU assessment |
| `step_down_requested` | BOOLEAN | NOT NULL, DEFAULT FALSE | Flag indicating active general ward step-down request |
| `step_down_requested_at` | DATETIME | NULL | Timestamp doctor requested step-down (FIFO Queue Key) |
| `step_down_requested_by` | BIGINT UNSIGNED | NULL, FK -> `users.id` | Physician requesting step-down |
| `target_step_down_ward` | VARCHAR(100) | NULL | Target non-ICU general ward |
| `step_down_notes` | TEXT | NULL | Clinical stability notes |
| `step_down_completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Flag indicating step-down bed allocation completed |
| `step_down_completed_at` | DATETIME | NULL | Timestamp of step-down bed allocation |
| `created_at` / `updated_at` | TIMESTAMP | NULL | Timestamps |

*Constraints:* 
- Enforced at database and service layer that a patient can have only one active admission (`status = 'admitted'`).
- Enforced that an occupied bed cannot be double-assigned.
- Strict FIFO priority queue ordering keyed by `COALESCE(icu_transfer_requested_at, created_at) ASC` and `COALESCE(step_down_requested_at, created_at) ASC`.

### 3.5 `vital_records`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Unique vital entry ID |
| `patient_id` | BIGINT UNSIGNED | FK -> `patients.id` | Associated patient |
| `admission_id` | BIGINT UNSIGNED | FK -> `admissions.id` | Associated active admission |
| `recorded_by` | BIGINT UNSIGNED | FK -> `users.id` | Staff member who entered the record (Nurse) |
| `heart_rate` | DECIMAL(5,1) | NOT NULL | Pulse / Heart rate in bpm (e.g. 75.0) |
| `systolic_bp` | DECIMAL(5,1) | NOT NULL | Systolic blood pressure in mmHg (e.g. 120.0) |
| `diastolic_bp` | DECIMAL(5,1) | NOT NULL | Diastolic blood pressure in mmHg (e.g. 80.0) |
| `spo2` | DECIMAL(4,1) | NOT NULL | Oxygen saturation percentage (e.g. 98.0) |
| `temperature` | DECIMAL(4,1) | NOT NULL | Body temperature in Celsius (e.g. 36.8) |
| `respiratory_rate` | DECIMAL(4,1) | NOT NULL | Breaths per minute (e.g. 16.0) |
| `notes` | TEXT | NULL | Staff clinical observations / notes |
| `measured_at` | DATETIME | NOT NULL | Exact time of physical bedside observation |
| `created_at` / `updated_at` | TIMESTAMP | NULL | Record creation timestamps (**Permanently Immutable**) |

### 3.6 `alert_rules`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Alert rule primary key |
| `name` | VARCHAR(255) | NOT NULL | Clean human-readable rule name (e.g. "Severe Tachycardia") |
| `parameter` | ENUM('heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'temperature', 'respiratory_rate') | NOT NULL | Target physiological vital sign |
| `operator` | ENUM('greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'equal_to') | NOT NULL | Evaluation operator |
| `threshold_value` | DECIMAL(8,2) | NOT NULL | Numerical cutoff boundary |
| `priority` | ENUM('review', 'urgent') | NOT NULL | Alert triage priority |
| `message_template` | VARCHAR(255) | NOT NULL | Dynamic message template with `{val}` interpolation |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Status toggle |
| `approved_by` | BIGINT UNSIGNED | NULL, FK -> `users.id` | Admin who configured/verified rule |
| `created_at` / `updated_at` | TIMESTAMP | NULL | Timestamps |

### 3.7 `alerts`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Alert unique identifier |
| `patient_id` | BIGINT UNSIGNED | FK -> `patients.id` | Patient flagged |
| `vital_record_id` | BIGINT UNSIGNED | FK -> `vital_records.id` | Triggering vital measurement |
| `alert_rule_id` | BIGINT UNSIGNED | FK -> `alert_rules.id` | Triggered rule |
| `message` | VARCHAR(255) | NOT NULL | Formatted alert prompt |
| `priority` | ENUM('review', 'urgent') | NOT NULL | Alert priority |
| `status` | ENUM('active', 'acknowledged', 'doctor_in_action', 'resolved') | NOT NULL, DEFAULT 'active' | Lifecycle status |
| `created_at` / `updated_at` | TIMESTAMP | NULL | Lifecycle timestamps |

### 3.8 `alert_acknowledgements`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Acknowledgement ID |
| `alert_id` | BIGINT UNSIGNED | FK -> `alerts.id` | Target alert |
| `user_id` | BIGINT UNSIGNED | FK -> `users.id` | Staff performing action |
| `action` | ENUM('acknowledged', 'doctor_in_action', 'assessment_done', 'resolved') | NOT NULL | Action taken |
| `note` | TEXT | NULL | Clinical bedside triage note |
| `created_at` | TIMESTAMP | NOT NULL | Action timestamp |

### 3.9 `audit_logs`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Unique audit log ID |
| `user_id` | BIGINT UNSIGNED | NULL, FK -> `users.id` | Acting user (null if system auto) |
| `action` | VARCHAR(100) | NOT NULL | Event name (e.g. `RECORD_VITALS`, `DOCTOR_IN_ACTION`, `PATIENT_TRANSFERRED_TO_ICU`) |
| `entity_type` | VARCHAR(100) | NOT NULL | Model class name |
| `entity_id` | BIGINT UNSIGNED | NULL | Target model primary key |
| `details` | JSON | NULL | Contextual attributes (passwords & tokens omitted) |
| `ip_address` | VARCHAR(45) | NULL | Remote IPv4/IPv6 address |
| `created_at` | TIMESTAMP | NOT NULL | Event timestamp |

### 3.10 `email_logs`
| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Email log ID |
| `alert_id` | BIGINT UNSIGNED | NULL, FK -> `alerts.id` | Reference to triggered alert (if applicable) |
| `recipient_email` | VARCHAR(255) | NOT NULL | Destination address |
| `subject` | VARCHAR(255) | NOT NULL | Email subject line |
| `status` | ENUM('pending', 'sent', 'failed') | NOT NULL, DEFAULT 'pending' | Delivery status |
| `error_message` | TEXT | NULL | Exception details if failed |
| `sent_at` | TIMESTAMP | NULL | Timestamp of transmission |
| `created_at` | TIMESTAMP | NOT NULL | Log creation timestamp |
