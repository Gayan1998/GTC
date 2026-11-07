<?php
declare(strict_types=1);

/**
 * Configuration loader. Reads api/config/config.php, or the file named by the
 * GTC_CONFIG environment variable, and falls back to the sample file.
 */
class Config
{
    /** @var array<string,mixed>|null */
    private static ?array $data = null;

    public static function load(): void
    {
        if (self::$data !== null) {
            return;
        }
        $envPath = getenv('GTC_CONFIG');
        $candidates = [];
        if (is_string($envPath) && $envPath !== '') {
            $candidates[] = $envPath;
        }
        $candidates[] = __DIR__ . '/../config/config.php';
        $candidates[] = __DIR__ . '/../config/config.sample.php';

        foreach ($candidates as $path) {
            if (is_file($path)) {
                $loaded = require $path;
                if (is_array($loaded)) {
                    self::$data = $loaded;
                    return;
                }
            }
        }
        throw new RuntimeException('No configuration file found. Copy config.sample.php to config.php.');
    }

    /**
     * Read a configuration value using dot notation, e.g. Config::get('db.host').
     *
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        self::load();
        $segments = explode('.', $key);
        $value = self::$data;
        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }
        return $value;
    }
}
