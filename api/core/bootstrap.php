<?php
declare(strict_types=1);

/**
 * Bootstraps the API: loads configuration and core classes, sets error
 * handling and security headers, and registers the JSON error handler.
 */

require_once __DIR__ . '/Config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Request.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Csrf.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Upload.php';
require_once __DIR__ . '/Router.php';
require_once __DIR__ . '/../services/Data.php';
require_once __DIR__ . '/../services/Inquiry.php';

Config::load();

$debug = (bool) Config::get('app.debug', false);

error_reporting(E_ALL);
ini_set('display_errors', $debug ? '1' : '0');
ini_set('log_errors', '1');
$logFile = (string) Config::get('app.log_file', '');
if ($logFile !== '') {
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    ini_set('error_log', $logFile);
}

// Security headers suitable for a JSON API on shared hosting.
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');

set_exception_handler(static function (Throwable $e) use ($debug): void {
    error_log('[GTC] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    $message = $debug ? $e->getMessage() : 'An unexpected server error occurred.';
    Response::error($message, 500);
});

// Turn PHP warnings/notices into log entries rather than output that would
// corrupt the JSON response.
set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    error_log("[GTC] PHP {$severity}: {$message} in {$file}:{$line}");
    return true;
});
