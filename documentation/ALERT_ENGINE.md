# VitalWatch — Alert Engine Specification

## 1. Safety Notice & Clinical Scope
> [!IMPORTANT]
> **DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED.**
> VitalWatch is an academic software prototype designed to assist data visibility.
> - An alert is an informative prompt for human clinical review, **not** an automated medical diagnosis.
> - The system does **not** recommend medications or treatments.
> - The system does **not** predict emergency trajectories.
> - A lack of active alerts must **never** be used to infer that a patient is clinically stable.

---

## 2. Alert Processing Pipeline

Whenever an authorized staff member records a new set of vital signs via `POST /api/vitals`:

```
1. Validate input bounds via StoreVitalRequest
               |
2. DB Transaction Start
               |
3. Save immutable VitalRecord (attributed to user)
               |
4. AlertService retrieves all active AlertRule records
               |
5. For each rule:
   - Extract corresponding vital parameter from new record
   - Compare value against threshold_value using configured operator
   - If condition met:
       * Check if duplicate active alert already exists for (patient_id, alert_rule_id)
       * If no duplicate active alert:
           - Generate new Alert record (status = 'active')
           - Stamp priority ('review' or 'urgent')
           - Enqueue/Trigger Email notification if configured
               |
6. Record AuditLog event ('RECORD_VITALS', generated alert count)
               |
7. DB Transaction Commit
               |
8. Return JSON payload containing VitalRecord + newly triggered Alerts
```

---

## 3. Supported Parameters & Evaluators

### Parameters
- `heart_rate` (Pulse in bpm)
- `systolic_bp` (mmHg)
- `diastolic_bp` (mmHg)
- `spo2` (Oxygen saturation percentage)
- `temperature` (Degrees Celsius)
- `respiratory_rate` (Breaths per minute)

### Operators
- `greater_than` (`>`)
- `greater_than_or_equal` (`>=`)
- `less_than` (`<`)
- `less_than_or_equal` (`<=`)
- `equal_to` (`==`)

### Priorities
- **REVIEW:** Flagged for nursing reassessment or routine doctor review.
- **URGENT:** High-priority clinical notice requiring immediate staff attention.

