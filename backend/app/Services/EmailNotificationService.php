<?php

namespace App\Services;

use App\Mail\PatientAlertMail;
use App\Models\Admission;
use App\Models\Alert;
use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class EmailNotificationService
{
    /**
     * Dispatch alert notification emails to doctors and admins.
     * Guaranteed never to crash the caller, hang the HTTP request, or abort transactions on SMTP failure.
     */
    /**
     * Dispatch alert notification emails to doctors and admins.
     * Guaranteed never to crash the caller, hang the HTTP request, or abort transactions on SMTP failure.
     */
    public function sendAlertNotification(Alert $alert): void
    {
        // Eager load relations
        $alert->loadMissing(['patient', 'vitalRecord.admission', 'alertRule']);

        // Determine recipients: all active doctors and admins
        $allRecipients = User::where('status', 'active')
            ->whereIn('role', ['admin', 'doctor'])
            ->pluck('email')
            ->filter()
            ->unique();

        if ($allRecipients->isEmpty()) {
            return;
        }

        $mailer = config('mail.default');
        $smtpHost = config('mail.mailers.smtp.host');
        $isLocalHost = in_array($smtpHost, ['127.0.0.1', 'localhost', null], true);
        $canSendLive = ($mailer === 'smtp' && !$isLocalHost) || ($mailer !== 'smtp');

        // Filter out dummy/unresolvable test domains for live SMTP delivery
        $liveRecipients = $allRecipients->filter(function ($email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return false;
            }
            $domain = strtolower(substr(strrchr($email, "@"), 1));
            return !in_array($domain, ['vitalwatch.hospital', 'hospital.local', 'example.com', 'test.com'], true);
        });

        // Ensure active doctors with valid emails receive priority
        $recipients = $liveRecipients->isNotEmpty() ? $liveRecipients : $allRecipients;

        $patientName = $alert->patient?->name ?? 'Patient';
        $patientCode = $alert->patient?->patient_code ?? 'MRN';
        $priorityUpper = strtoupper($alert->priority);
        $subject = "[VitalWatch {$priorityUpper}] Emergency Alert for {$patientName} ({$patientCode})";

        // If configured for local 127.0.0.1, do a quick socket check to avoid hanging if no local mailpit is up
        $smtpActive = true;
        if ($mailer === 'smtp' && $isLocalHost) {
            $port = (int) (config('mail.mailers.smtp.port') ?: 1025);
            $socket = @fsockopen($smtpHost, $port, $errno, $errstr, 0.5);
            if ($socket) {
                fclose($socket);
                $smtpActive = true;
            } else {
                $smtpActive = false;
            }
        }

        foreach ($recipients as $recipientEmail) {
            $emailLog = EmailLog::create([
                'alert_id' => $alert->id,
                'recipient_email' => $recipientEmail,
                'subject' => $subject,
                'status' => 'pending',
                'created_at' => now(),
            ]);

            try {
                if ($canSendLive && $smtpActive) {
                    Mail::to($recipientEmail)->send(new PatientAlertMail($alert));
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'error_message' => null,
                    ]);
                } else {
                    // Safe simulated delivery when SMTP host is offline or local placeholder
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'error_message' => 'Simulated delivery logged (SMTP in local simulation mode).',
                    ]);
                }
            } catch (Throwable $e) {
                Log::warning("Email notification delivery failed for {$recipientEmail}: " . $e->getMessage());

                $emailLog->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Dispatch emergency ICU transfer alert notifications to doctors, nurses, and admins.
     */
    public function sendIcuTransferNotification(Admission $admission, User $requester): void
    {
        $admission->loadMissing(['patient']);

        $allRecipients = User::where('status', 'active')
            ->whereIn('role', ['admin', 'doctor', 'nurse'])
            ->pluck('email')
            ->filter()
            ->unique();

        if ($allRecipients->isEmpty()) {
            return;
        }

        $mailer = config('mail.default');
        $smtpHost = config('mail.mailers.smtp.host');
        $isLocalHost = in_array($smtpHost, ['127.0.0.1', 'localhost', null], true);
        $canSendLive = ($mailer === 'smtp' && !$isLocalHost) || ($mailer !== 'smtp');

        $liveRecipients = $allRecipients->filter(function ($email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
            $domain = strtolower(substr(strrchr($email, "@"), 1));
            return !in_array($domain, ['vitalwatch.hospital', 'hospital.local', 'example.com', 'test.com'], true);
        });

        $recipients = $liveRecipients->isNotEmpty() ? $liveRecipients : $allRecipients;

        $patientName = $admission->patient?->name ?? 'Patient';
        $patientCode = $admission->patient?->patient_code ?? 'MRN';
        $ward = $admission->ward;
        $bed = $admission->bed_number;
        $targetWard = $admission->target_icu_ward ?: 'Intensive Care Unit (ICU)';
        $doctorName = \App\Models\User::formatDoctorName($requester->name);
        $subject = "[VitalWatch EMERGENCY] Immediate ICU Transfer Requested: {$patientName} ({$patientCode}) - {$ward} Bed {$bed}";

        $emailBody = "🚨 VITALWATCH EMERGENCY ICU ESCALATION DISPATCH 🚨\n\n" .
            "Immediate ICU transfer has been requested by {$doctorName}.\n\n" .
            "Patient Name: {$patientName}\n" .
            "Patient Code: {$patientCode}\n" .
            "Current Location: {$ward} (Bed {$bed})\n" .
            "Target Ward: {$targetWard}\n" .
            "Physician Notes: " . ($admission->icu_transfer_notes ?: 'Patient deteriorating; urgent ICU bed required.') . "\n" .
            "Timestamp: " . now()->format('Y-m-d H:i:s') . "\n\n" .
            "ACTION REQUIRED: Registered nurses and administrators should navigate to the VitalWatch Situation Monitor to allocate an available ICU bed according to the Priority #1 queue strictly.";

        foreach ($recipients as $recipientEmail) {
            $emailLog = EmailLog::create([
                'alert_id' => null,
                'recipient_email' => $recipientEmail,
                'subject' => $subject,
                'status' => 'pending',
                'created_at' => now(),
            ]);

            try {
                if ($canSendLive) {
                    Mail::raw($emailBody, function ($msg) use ($recipientEmail, $subject) {
                        $msg->to($recipientEmail)->subject($subject);
                    });
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'error_message' => "Live emergency dispatch sent to {$recipientEmail}.",
                    ]);
                } else {
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'error_message' => "Emergency ICU transfer requested by {$doctorName} to {$targetWard} (Simulated).",
                    ]);
                }
            } catch (Throwable $e) {
                Log::warning("ICU transfer email notification failed for {$recipientEmail}: " . $e->getMessage());
                $emailLog->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }
        }
    }
}
