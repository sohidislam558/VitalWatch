<?php

namespace App\Jobs;

use App\Models\Admission;
use App\Models\EmailLog;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendIcuTransferNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $admissionId,
        public int $requesterId,
        public array $recipientEmails
    ) {}

    public function handle(): void
    {
        $admission = Admission::with('patient')->find($this->admissionId);
        $requester = User::find($this->requesterId);
        if (!$admission || !$requester || empty($this->recipientEmails)) {
            return;
        }

        $patientName = $admission->patient?->name ?? 'Patient';
        $patientCode = $admission->patient?->patient_code ?? 'MRN';
        $ward = $admission->ward;
        $bed = $admission->bed_number;
        $targetWard = $admission->target_icu_ward ?: 'Intensive Care Unit (ICU)';
        $doctorName = User::formatDoctorName($requester->name);
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

        $mailer = config('mail.default');
        $smtpHost = config('mail.mailers.smtp.host');
        $isLocalHost = in_array($smtpHost, ['127.0.0.1', 'localhost', null], true);
        $canSendLive = ($mailer === 'smtp' && !$isLocalHost) || ($mailer !== 'smtp');

        foreach ($this->recipientEmails as $recipientEmail) {
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
