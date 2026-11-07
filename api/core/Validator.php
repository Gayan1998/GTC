<?php
declare(strict_types=1);

/**
 * Small input validation/normalisation helpers.
 */
class Validator
{
    public static function str($value, int $max = 0): string
    {
        if (is_array($value) || is_object($value)) {
            return '';
        }
        $text = trim((string) ($value ?? ''));
        // Strip control characters except normal whitespace.
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? $text;
        if ($max > 0 && mb_strlen($text) > $max) {
            $text = mb_substr($text, 0, $max);
        }
        return $text;
    }

    /** Long text fields: keep newlines, cap length. */
    public static function text($value, int $max = 20000): string
    {
        if (is_array($value) || is_object($value)) {
            return '';
        }
        $text = trim((string) ($value ?? ''));
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? $text;
        if (mb_strlen($text) > $max) {
            $text = mb_substr($text, 0, $max);
        }
        return $text;
    }

    public static function slug($value, string $fallback = 'item'): string
    {
        $text = strtolower(self::str($value, 200));
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
        $text = trim($text, '-');
        return $text === '' ? $fallback : $text;
    }

    public static function email($value): string
    {
        $email = self::str($value, 190);
        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
    }

    public static function bool($value): int
    {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }
        $v = strtolower(self::str($value));
        return in_array($v, ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
    }

    public static function int($value, int $default = 0): int
    {
        if (is_int($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (int) $value;
        }
        return $default;
    }

    /** Positive integer or null. */
    public static function nullableInt($value): ?int
    {
        if ($value === null || $value === '' || $value === 'null') {
            return null;
        }
        return is_numeric($value) ? (int) $value : null;
    }

    /** Decimal or null. */
    public static function nullableDecimal($value): ?string
    {
        if ($value === null || $value === '' || $value === 'null') {
            return null;
        }
        return is_numeric($value) ? number_format((float) $value, 2, '.', '') : null;
    }

    /**
     * Accept an array of objects, or a JSON string containing one, and return
     * a clean array. Used for product features and specifications.
     *
     * @param mixed $value
     * @return array<int,array<string,string>>
     */
    public static function objectList($value, array $allowedKeys, int $maxItems = 40): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($value)) {
            return [];
        }
        $out = [];
        foreach ($value as $item) {
            if (!is_array($item)) {
                continue;
            }
            $row = [];
            $empty = true;
            foreach ($allowedKeys as $key) {
                $text = self::str($item[$key] ?? '', 500);
                $row[$key] = $text;
                if ($text !== '') {
                    $empty = false;
                }
            }
            if (!$empty) {
                $out[] = $row;
            }
            if (count($out) >= $maxItems) {
                break;
            }
        }
        return $out;
    }

    /** Encode a normalised object list back to JSON for storage. */
    public static function encodeList(array $list): ?string
    {
        return $list === [] ? null : json_encode($list, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Decode a stored JSON list, tolerating legacy/corrupt values.
     *
     * @return array<int,array<string,string>>
     */
    public static function decodeList($value): array
    {
        if (!is_string($value) || $value === '') {
            return [];
        }
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }
}
