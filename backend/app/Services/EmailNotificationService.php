<?php

namespace App\Services;

use App\Jobs\SendAlertNotificationJob;
use App\Jobs\SendIcuTransferNotificationJob;
use App\Models\Admission;
use App\Models\Alert;
use App\Models\User;
use App\Models\VitalRecord;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

class EmailNotificationService
{
    /**
     * Dispatch consolidated alert notification for a set of triggered alerts.
     * Guaranteed non-blocking: never hangs HTTP requests, never aborts DB transactions.
     */
    public function sendBatchAlertNotification($alerts, ?VitalRecord $vitalRecord = null): void
    {
        $alertCollection = $alerts instanceof Collection ? $alerts : collect($alerts);
        if ($alertCollection->isEmpty()) {
            return;
        }

        $allRecipients = User::where('status', 'active')
            ->whereIn('role', ['admin', 'doctor'])
            ->pluck('email')
            ->filter()
            ->unique();

        if ($allRecipients->isEmpty()) {
            return;
        }

        // Filter out dummy/unresolvable test domains for live SMTP delivery
        $liveRecipients = $allRecipients->filter(function ($email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
            $domain = strtolower(substr(strrchr($email, "@"), 1));
            return !in_array($domain, ['vitalwatch.hospital', 'hospital.local', 'example.com', 'test.com'], true);
        });

        $recipients = $liveRecipients->isNotEmpty() ? $liveRecipients : $allRecipients;
        $recipientEmails = $recipients->values()->toArray();
        $alertIds = $alertCollection->pluck('id')->toArray();
        $vitalRecordId = $vitalRecord?->id;

        // If running in unit tests, execute directly without background process
        if (app()->runningUnitTests()) {
            (new SendAlertNotificationJob($alertIds, $vitalRecordId, $recipientEmails))->handle();
            return;
        }

        // Dispatch queued job
        SendAlertNotificationJob::dispatch($alertIds, $vitalRecordId, $recipientEmails);

        // Ensure background worker process runs to execute the job immediately
        static::triggerBackgroundQueueWorker();
    }

    /**
     * Dispatch alert notification for a single alert.
     */
    public function sendAlertNotification(Alert $alert): void
    {
        $this->sendBatchAlertNotification(collect([$alert]), $alert->vitalRecord);
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

        $liveRecipients = $allRecipients->filter(function ($email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
            $domain = strtolower(substr(strrchr($email, "@"), 1));
            return !in_array($domain, ['vitalwatch.hospital', 'hospital.local', 'example.com', 'test.com'], true);
        });

        $recipients = $liveRecipients->isNotEmpty() ? $liveRecipients : $allRecipients;
        $recipientEmails = $recipients->values()->toArray();

        // If running in unit tests, execute directly
        if (app()->runningUnitTests()) {
            (new SendIcuTransferNotificationJob($admission->id, $requester->id, $recipientEmails))->handle();
            return;
        }

        SendIcuTransferNotificationJob::dispatch($admission->id, $requester->id, $recipientEmails);
        static::triggerBackgroundQueueWorker();
    }

    /**
     * Spawns a background PHP queue worker to consume queued jobs immediately
     * without blocking the HTTP request or current execution.
     */
    public static function triggerBackgroundQueueWorker(): void
    {
        try {
            $php = escapeshellarg(PHP_BINARY);
            $artisan = escapeshellarg(base_path('artisan'));

            if (str_starts_with(strtoupper(PHP_OS), 'WIN')) {
                pclose(popen("start /B \"\" {$php} {$artisan} queue:work --once --stop-when-empty", "r"));
            } else {
                exec("{$php} {$artisan} queue:work --once --stop-when-empty > /dev/null 2>&1 &");
            }
        } catch (Throwable $e) {
            Log::warning("Could not spawn background queue worker: " . $e->getMessage());
        }
    }
}
