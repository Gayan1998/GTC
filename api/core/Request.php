<?php
declare(strict_types=1);

/**
 * Request parsing helpers.
 */
class Request
{
    private static ?array $body = null;

    public static function method(): string
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '';
        if ($method === 'POST' && $override !== '') {
            $method = strtoupper($override);
        }
        return $method;
    }

    /** @return array<string,mixed> */
    public static function body(): array
    {
        if (self::$body !== null) {
            return self::$body;
        }
        self::$body = [];
        $raw = file_get_contents('php://input');
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                self::$body = $decoded;
            } else {
                $parsed = [];
                parse_str($raw, $parsed);
                self::$body = $parsed;
            }
        }
        if (self::$body === [] && $_POST !== []) {
            self::$body = $_POST;
        }
        return self::$body;
    }

    /** @param mixed $default @return mixed */
    public static function input(string $key, $default = null)
    {
        $body = self::body();
        return array_key_exists($key, $body) ? $body[$key] : $default;
    }

    /** @param mixed $default @return mixed */
    public static function query(string $key, $default = null)
    {
        return array_key_exists($key, $_GET) ? $_GET[$key] : $default;
    }

    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        $value = $_SERVER[$key] ?? null;
        return is_string($value) ? $value : null;
    }

    public static function ip(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }

    public static function userAgent(): string
    {
        return substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);
    }
}
