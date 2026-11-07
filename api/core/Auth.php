<?php
declare(strict_types=1);

/**
 * Session authentication and login throttling.
 */
class Auth
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        session_name((string) Config::get('app.session_name', 'gtc_admin'));
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    /** @return array<string,mixed>|null */
    public static function user(): ?array
    {
        self::start();
        $user = $_SESSION['admin'] ?? null;
        return is_array($user) ? $user : null;
    }

    /** @return array<string,mixed> */
    public static function requireUser(): array
    {
        $user = self::user();
        if ($user === null) {
            Response::error('Authentication required.', 401);
        }
        return $user;
    }

    /**
     * Establish an authenticated session for the given admin row.
     *
     * @param array<string,mixed> $admin
     */
    public static function login(array $admin): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['admin'] = [
            'id'       => (int) $admin['id'],
            'username' => (string) $admin['username'],
            'email'    => (string) $admin['email'],
            'role'     => (string) ($admin['role'] ?? 'admin'),
        ];
        $_SESSION['login_time'] = time();
        Csrf::rotate();

        Database::query(
            'UPDATE admin_users SET last_login_at = NOW() WHERE id = ?',
            [(int) $admin['id']]
        );
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'],
                'domain'   => $params['domain'],
                'secure'   => (bool) $params['secure'],
                'httponly' => (bool) $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
    }

    // -- Login throttling -----------------------------------------------------

    public static function isThrottled(string $identifier): bool
    {
        $window = (int) Config::get('app.login_window_seconds', 900);
        $max    = (int) Config::get('app.login_max_attempts', 5);
        $ipHash = hash('sha256', Request::ip());

        $row = Database::fetch(
            'SELECT COUNT(*) AS attempts FROM login_attempts
             WHERE success = 0 AND attempted_at > (NOW() - INTERVAL ? SECOND)
               AND (identifier = ? OR ip_hash = ?)',
            [$window, mb_strtolower($identifier), $ipHash]
        );
        return $row !== null && (int) $row['attempts'] >= $max;
    }

    public static function recordAttempt(string $identifier, bool $success): void
    {
        Database::query(
            'INSERT INTO login_attempts (identifier, ip_hash, success) VALUES (?, ?, ?)',
            [mb_strtolower($identifier), hash('sha256', Request::ip()), $success ? 1 : 0]
        );
        // Keep the table small.
        Database::query('DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 2 DAY)');
    }

    public static function clearAttempts(string $identifier): void
    {
        Database::query(
            'DELETE FROM login_attempts WHERE identifier = ? OR ip_hash = ?',
            [mb_strtolower($identifier), hash('sha256', Request::ip())]
        );
    }
}
