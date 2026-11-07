<?php
declare(strict_types=1);

/**
 * Inquiry submission: validation, spam protection, persistence and optional
 * email notification. Persistence is the source of truth; email failure never
 * blocks or falsifies a saved inquiry.
 */
class Inquiry
{
    /**
     * @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public static function create(array $input, string $type): array
    {
        $type = $type === 'import' ? 'import' : 'contact';

        // Honeypot: a hidden field real users never fill in.
        if (Validator::str($input['website'] ?? '', 100) !== '') {
            Response::error('Your submission could not be processed.', 422);
        }

        $name  = Validator::str($input['name'] ?? '', 150);
        $email = Validator::email($input['email'] ?? '');
        $phone = Validator::str($input['phone'] ?? '', 60);

        $errors = [];
        if ($name === '') {
            $errors['name'] = 'Please enter your name.';
        }
        if ($email === '' && $phone === '') {
            $errors['email'] = 'Please provide an email address or telephone number.';
        }
        if (($input['email'] ?? '') !== '' && $email === '') {
            $errors['email'] = 'Please enter a valid email address.';
        }

        $message = Validator::text($input['message'] ?? '', 5000);
        $requirements = Validator::text($input['requirements'] ?? '', 5000);

        if ($type === 'contact' && $message === '') {
            $errors['message'] = 'Please enter your message.';
        }
        if ($type === 'import' && $requirements === '' && $message === '') {
            $errors['requirements'] = 'Please describe what you would like to source.';
        }

        if ($errors !== []) {
            Response::error('Please check the highlighted fields.', 422, $errors);
        }

        if (self::isRateLimited()) {
            Response::error('Too many submissions from this address. Please try again later.', 429);
        }

        $params = [
            $type,
            $name,
            Validator::str($input['business_name'] ?? '', 190) ?: null,
            $email ?: null,
            $phone ?: null,
            Validator::str($input['subject'] ?? '', 190) ?: null,
            $message ?: null,
            $requirements ?: null,
            Validator::str($input['quantity'] ?? '', 100) ?: null,
            Validator::str($input['shipping_method'] ?? '', 60) ?: null,
            hash('sha256', Request::ip()),
            Request::userAgent(),
        ];

        Database::query(
            'INSERT INTO inquiries
                (type, name, business_name, email, phone, subject, message, requirements,
                 quantity, shipping_method, ip_hash, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            $params
        );
        $id = Database::lastInsertId();

        self::notify($id, $type, $name, $email, $phone, $message, $requirements);

        return ['id' => $id, 'message' => 'Thank you. Your inquiry has been received and our team will respond shortly.'];
    }

    private static function isRateLimited(): bool
    {
        $row = Database::fetch(
            'SELECT COUNT(*) AS c FROM inquiries WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL 1 HOUR)',
            [hash('sha256', Request::ip())]
        );
        return $row !== null && (int) $row['c'] >= 8;
    }

    private static function notify(int $id, string $type, string $name, string $email, string $phone, string $message, string $requirements): void
    {
        $to = trim((string) Config::get('app.admin_notification_email', ''));
        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return; // Notifications disabled; the inquiry is already saved.
        }

        $subject = '[' . ($type === 'import' ? 'Import' : 'Contact') . ' enquiry] ' . $name . ' (#' . $id . ')';
        $lines = [
            'New enquiry received on the GTC Holdings website.',
            '',
            'Type: ' . $type,
            'Name: ' . $name,
            'Email: ' . ($email ?: '-'),
            'Phone: ' . ($phone ?: '-'),
        ];
        if ($requirements !== '') {
            $lines[] = 'Requirements: ' . $requirements;
        }
        if ($message !== '') {
            $lines[] = 'Message: ' . $message;
        }
        $body = implode("\n", $lines);
        $headers = 'From: ' . (string) Config::get('app.mail_from', 'no-reply@localhost') . "\r\n"
            . 'Reply-To: ' . ($email ?: $to) . "\r\n"
            . 'Content-Type: text/plain; charset=UTF-8';

        try {
            if (!@mail($to, $subject, $body, $headers)) {
                error_log('[GTC] Inquiry notification email failed for inquiry #' . $id);
            }
        } catch (Throwable $e) {
            error_log('[GTC] Inquiry notification error for #' . $id . ': ' . $e->getMessage());
        }
    }
}
