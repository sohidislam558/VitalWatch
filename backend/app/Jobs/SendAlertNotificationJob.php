<?php

namespace App\Jobs;

use App\Mail\PatientAlertMail;
use App\Models\Alert;
use App\Models\EmailLog;
use App\Models\VitalRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendAlertNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param array<int> $alertIds
     * @param array<string> $recipientEmails
     */
    public function __construct(
        public array $alertIds,
        public ?int $vitalRecordId,
        public array $recipientEmails
    ) {}

    public function handle(): void
    {
        if (empty($this->alertIds) || empty($this->recipientEmails)) {
            return;
        }

        $alerts = Alert::whereIn('id', $this->alertIds)
            ->with(['patient', 'vitalRecord.admission', 'alertRule'])
            ->get();

        if ($alerts->isEmpty()) {
            return;
        }

        $vitalRecord = $this->vitalRecordId ? VitalRecord::find($this->vitalRecordId) : $alerts->first()->vitalRecord;
        $primaryAlert = $alerts->first();
        $patient = $primaryAlert->patient;
        $patientName = $patient?->name ?? 'Patient';
        $patientCode = $patient?->patient_code ?? 'MRN';

        $hasUrgent = $alerts->contains(fn ($a) => $a->priority === 'urgent');
        $highestPriority = $hasUrgent ? 'URGENT' : 'REVIEW';

        if ($alerts->count() > 1) {
            $subject = "[VitalWatch {$highestPriority}] Emergency Alert: {$alerts->count()} Clinical Alarms for {$patientName} ({$patientCode})";
        } else {
            $ruleName = $primaryAlert->alertRule?->name ?? 'Clinical Alarm';
            $subject = "[VitalWatch {$highestPriority}] Emergency Alert for {$patientName} ({$patientCode}) - {$ruleName}";
        }

        $mailer = config('mail.default');
        $smtpHost = config('mail.mailers.smtp.host');
        $isLocalHost = in_array($smtpHost, ['127.0.0.1', 'localhost', null], true);
        $canSendLive = ($mailer === 'smtp' && !$isLocalHost) || ($mailer !== 'smtp');

        foreach ($this->recipientEmails as $recipientEmail) {
            $emailLog = EmailLog::create([
                'alert_id' => $primaryAlert->id,
                'recipient_email' => $recipientEmail,
                'subject' => $subject,
                'status' => 'pending',
                'created_at' => now(),
            ]);

            try {
                if ($canSendLive) {
                    Mail::to($recipientEmail)->send(new PatientAlertMail($primaryAlert, $alerts, $vitalRecord));
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'error_message' => null,
                    ]);
                } else {
                    $emailLog->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'error_message' => 'Simulated delivery logged (SMTP in local simulation mode).',
                    ]);
                }
            } catch (Throwable $e) {
                Log::warning("Alert email notification failed for {$recipientEmail}: " . $e->getMessage());
                $emailLog->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }
        }
    }
}
