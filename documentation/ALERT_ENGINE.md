# VitalWatch — Alert Engine & Clinical Alarm Lifecycle Specification

## 1. Safety Notice & Clinical Scope

> [!IMPORTANT]
> **ACADEMIC CLINICAL PROTOTYPE — NOT CLINICALLY VALIDATED.**  
> VitalWatch is an early warning decision support platform designed to optimize bedside situational awareness:
> - An early warning alarm is an informative prompt for certified human clinical review, **not** an automated diagnostic conclusion.
> - The system does **not** prescribe medications or medical interventions.
> - A lack of active alarms must **never** be used to infer that a patient is clinically stable.

---

## 2. Physiological Alert Processing Pipeline

Whenever an authorized bedside nurse inputs physiological measurements via `POST /api/vitals`:

```
1. Validate physiological input bounds via StoreVitalRequest
               |
2. Verify Admission Status:
   - Patient must have an active admission (status = 'admitted')
   - If icu_transferred = true and icu_assessment_done = false:
     --> REJECT with 422: Locked awaiting attending physician assessment
               |
3. DB Transaction Start
               |
4. Save permanently immutable VitalRecord (attributed to the nurse)
               |
5. AlertService queries all enabled AlertRule records:
   - Evaluates: Heart Rate, Systolic BP, Diastolic BP, SpO2, Temperature, Respiratory Rate
   - Compares value against threshold_value using configured operator (>, >=, <, <=, ==)
   - If threshold breached:
       * Check if duplicate active alert already exists for (patient_id, alert_rule_id)
       * If no duplicate active alarm:
           - Generate new Alert record (status = 'active')
           - Stamp priority ('review' or 'urgent')
           - Dispatch emergency notification (EmailService SMTP dispatch)
   - If ALL vital parameters fall within normal ranges:
       * Automatically transitions active/acknowledged alarms for this patient to 'resolved'
       * Updates situation telemetry status to "Normal & Stable"
               |
6. Record AuditLog event ('RECORD_VITALS', payload, user, IP)
               |
7. DB Transaction Commit
               |
8. Real-Time Broadcast:
   - Cross-window event broadcast via BroadcastChannel ('vitalwatch_telemetry_sync')
   - Same-window CustomEvent dispatch
               |
9. Return JSON payload (VitalRecord + Triggered Alerts)
```

---

## 3. Supported Parameters, Operators & Priorities

### Physiological Parameters
- `heart_rate`: Pulse rate in beats per minute (bpm). Technical bounds: 20–280 bpm.
- `systolic_bp`: Systolic arterial pressure in mmHg. Technical bounds: 40–280 mmHg.
- `diastolic_bp`: Diastolic arterial pressure in mmHg. Technical bounds: 20–180 mmHg.
- `spo2`: Blood oxygen saturation percentage. Technical bounds: 50–100%.
- `temperature`: Core body temperature in Celsius. Technical bounds: 25.0–45.0 °C.
- `respiratory_rate`: Respiratory rate in breaths per minute. Technical bounds: 4–60 /min.

### Evaluation Operators
- `greater_than` (`>`): Triggered when measured value exceeds threshold.
- `greater_than_or_equal` (`>=`): Triggered when measured value meets or exceeds threshold.
- `less_than` (`<`): Triggered when measured value falls below threshold (e.g. Hypoxemia SpO2 < 90%).
- `less_than_or_equal` (`<=`): Triggered when measured value is less than or equal to threshold.
- `equal_to` (`==`): Triggered upon exact parameter match.

### Alert Priorities
- **REVIEW (Yellow / Amber):** Abnormal observation requiring bedside re-check or routine nursing assessment.
- **URGENT (Red / Rose):** Critical physiological deterioration requiring immediate physician intervention.

---

## 4. Bedside Physician Workflow & Concurrency Controls

### 4.1 "Doctor in Action" Bedside Attendance
- An attending physician responds to an emergency alert by clicking **"🩺 Doctor in Action"**.
- **Single-Patient Concurrency Limit:** The backend enforces that a physician cannot attend more than one patient at a time. If the physician has an active attendance session open, the request is rejected with HTTP `422`, prompting them to complete that assessment before attending another bedside.
- When activated, **all active alarms for that patient** transition to `doctor_in_action` status simultaneously.

### 4.2 "Assessment Done" Emergency Resolution
- After stabilizing or examining the patient, the doctor clicks **"✅ Assessment Done"** (or resolves the alarm).
- This completes the bedside attendance session, transitions patient alerts to `resolved`, clears the physician's concurrency lock, and unlocks the bedside nurse's ability to input follow-up vitals.

### 4.3 Acute Transfer Escalation
- If the physician determines the patient cannot be managed on a general ward, they can click **"🚑 Request ICU"** directly from the alarm triage interface.
- This queues the patient in the **Strict FIFO Emergency ICU Bed Allocation Queue**, automatically prioritizing the patient by request timestamp.
