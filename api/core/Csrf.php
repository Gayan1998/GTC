<?php
declare(strict_types=1);

/**
 * CSRF token handling for session-authenticated, state-changing requests.
 */
class Csrf
{
    public static function token(): string
    {
        Auth::start();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return (string) $_SESSION['csrf_token'];
    }

    /** Rotate the token (used after login/logout). */
    public static function rotate(): string
    {
        Auth::start();
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        return (string) $_SESSION['csrf_token'];
    }

    public static function verify(): void
    {
        Auth::start();
        $sent = Request::header('X-CSRF-Token');
        if ($sent === null || $sent === '') {
            $body = Request::body();
            $sent = isset($body['csrf_token']) ? (string) $body['csrf_token'] : '';
        }
        $expected = (string) ($_SESSION['csrf_token'] ?? '');
        if ($expected === '' || !is_string($sent) || $sent === '' || !hash_equals($expected, $sent)) {
            Response::error('Invalid or missing CSRF token.', 403);
        }
    }
}
