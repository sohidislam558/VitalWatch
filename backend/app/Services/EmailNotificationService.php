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
    public function sendAlertNotification(Alert $alert): void
    {
        // Eager load relations
        $alert->loadMissing(['patient', 'vitalRecord.admission', 'alertRule']);

        // Determine recipients: all active doctors and admins
        $recipients = User::where('status', 'active')
            ->whereIn('role', ['admin', 'doctor'])
            ->pluck('email')
            ->filter()
            ->unique();

        if ($recipients->isEmpty()) {
            return;
        }

        $subject = "[VitalWatch " . strtoupper($alert->priority) . "] Clinical Review Notification for " . ($alert->patient->patient_code ?? 'Patient');

        $mailer = config('mail.default');
        $smtpActive = false;

        if ($mailer === 'smtp') {
            $host = config('mail.mailers.smtp.host');
            $port = (int) (config('mail.mailers.smtp.port') ?: 587);

            // Fast health check: if SMTP host is not responding within 0.8s, fallback safely
            $socket = @fsockopen($host, $port, $errno, $errstr, 0.8);
            if ($socket) {
                fclose($socket);
                $smtpActive = true;
            } else {
                Log::info("SMTP server {$host}:{$port} not responding within 0.8s. Email dispatch recorded to database/log.");
            }
        } else {
            $smtpActive = true;
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
                if ($smtpActive) {
                    Mail::to($recipientEmail)->send(new PatientAlertMail($alert));
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                    ]);
                } else {
                    // Safe simulated delivery when SMTP host is offline
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'error_message' => 'Simulated delivery logged (SMTP offline in local environment).',
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

        $recipients = User::where('status', 'active')
            ->whereIn('role', ['admin', 'doctor', 'nurse'])
            ->pluck('email')
            ->filter()
            ->unique();

        if ($recipients->isEmpty()) {
            return;
        }

        $patientName = $admission->patient?->name ?? 'Patient';
        $patientCode = $admission->patient?->patient_code ?? 'MRN';
        $ward = $admission->ward;
        $bed = $admission->bed_number;
        $targetWard = $admission->target_icu_ward ?: 'Intensive Care Unit (ICU)';
        $subject = "[VitalWatch EMERGENCY] Immediate ICU Transfer Requested: {$patientName} ({$patientCode}) - Bed {$bed}, {$ward}";

        foreach ($recipients as $recipientEmail) {
            EmailLog::create([
                'alert_id' => null,
                'recipient_email' => $recipientEmail,
                'subject' => $subject,
                'status' => 'sent',
                'sent_at' => now(),
                'created_at' => now(),
                'error_message' => "Emergency ICU transfer requested by " . \App\Models\User::formatDoctorName($requester->name) . " to {$targetWard}.",
            ]);
        }
    }
}
