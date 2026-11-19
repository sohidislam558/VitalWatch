<?php

namespace App\Mail;

use App\Models\Alert;
use App\Models\VitalRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PatientAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $alerts;

    public function __construct(
        public Alert $alert,
        $alerts = null,
        public ?VitalRecord $vitalRecord = null
    ) {
        $this->alerts = $alerts ?: collect([$alert]);
        if (!$this->vitalRecord && $alert->vitalRecord) {
            $this->vitalRecord = $alert->vitalRecord;
        }
    }

    public function envelope(): Envelope
    {
        $hasUrgent = $this->alerts->contains(fn ($a) => $a->priority === 'urgent');
        $priority = $hasUrgent ? 'URGENT' : strtoupper($this->alert->priority);
        $code = $this->alert->patient?->patient_code ?? 'MRN';
        $name = $this->alert->patient?->name ?? 'Patient';

        if ($this->alerts->count() > 1) {
            $subject = "[VitalWatch {$priority}] Emergency Alert: {$this->alerts->count()} Clinical Alarms for {$name} ({$code})";
        } else {
            $subject = "[VitalWatch {$priority}] Emergency Alert for {$name} ({$code})";
        }

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.patient-alert',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
