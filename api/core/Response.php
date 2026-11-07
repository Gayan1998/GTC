<?php
declare(strict_types=1);

/**
 * JSON response helpers. All API output goes through here so the shape stays
 * consistent: success responses have { success, data, meta } and errors have
 * { success, error: { message, status, details } }.
 */
class Response
{
    /** @param mixed $data */
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    /**
     * @param mixed $data
     * @param array<string,mixed> $meta
     */
    public static function ok($data = null, array $meta = []): void
    {
        $body = ['success' => true];
        if ($data !== null) {
            $body['data'] = $data;
        }
        if ($meta !== []) {
            $body['meta'] = $meta;
        }
        self::json($body, 200);
    }

    public static function created($data = null): void
    {
        $body = ['success' => true];
        if ($data !== null) {
            $body['data'] = $data;
        }
        self::json($body, 201);
    }

    /** @param mixed $details */
    public static function error(string $message, int $status = 400, $details = null): void
    {
        $body = [
            'success' => false,
            'error'   => ['message' => $message, 'status' => $status],
        ];
        if ($details !== null) {
            $body['error']['details'] = $details;
        }
        self::json($body, $status);
    }
}
