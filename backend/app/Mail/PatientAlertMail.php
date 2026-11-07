<?php

namespace App\Mail;

use App\Models\Alert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PatientAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Alert $alert)
    {
    }

    public function envelope(): Envelope
    {
        $priority = strtoupper($this->alert->priority);
        $code = $this->alert->patient->patient_code ?? 'Patient';

        return new Envelope(
            subject: "[VitalWatch {$priority}] Clinical Review Notification for {$code}",
        );
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

