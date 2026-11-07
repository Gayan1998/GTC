<?php
declare(strict_types=1);

/**
 * Create or update an administrator account.
 *
 * Usage:
 *   php api/cli/create_admin.php --username=admin --email=admin@example.com --password="a-long-password"
 *   php api/cli/create_admin.php --username=admin --password="new-password" --update
 *
 * If a value is omitted you will be prompted for it. Passwords are hashed with
 * PHP's password_hash(); no plaintext credentials are stored.
 */

require_once __DIR__ . '/../core/Config.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Validator.php';

Config::load();

$options = [];
foreach ($argv as $arg) {
    if (preg_match('/^--([a-z_]+)(?:=(.*))?$/i', $arg, $m)) {
        $options[strtolower($m[1])] = $m[2] ?? true;
    }
}

function prompt(string $label, bool $hidden = false): string
{
    fwrite(STDOUT, $label);
    if ($hidden && DIRECTORY_SEPARATOR !== '\\') {
        shell_exec('stty -echo 2>/dev/null');
    }
    $value = trim((string) fgets(STDIN));
    if ($hidden && DIRECTORY_SEPARATOR !== '\\') {
        shell_exec('stty echo 2>/dev/null');
        fwrite(STDOUT, PHP_EOL);
    }
    return $value;
}

$username = trim((string) ($options['username'] ?? ''));
if ($username === '') {
    $username = prompt('Username: ');
}
$email = trim((string) ($options['email'] ?? ''));
if ($email === '') {
    $email = prompt('Email: ');
}
$password = (string) ($options['password'] ?? '');
if ($password === '') {
    $password = prompt('Password (min 10 chars): ', true);
}
$update = array_key_exists('update', $options);

$errors = [];
if (preg_match('/^[a-zA-Z0-9._-]{3,60}$/', $username) !== 1) {
    $errors[] = 'Username must be 3-60 characters (letters, numbers, dot, dash, underscore).';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}
if (strlen($password) < 10) {
    $errors[] = 'Password must be at least 10 characters.';
}
if ($errors !== []) {
    fwrite(STDERR, "Cannot create administrator:\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}

$existing = Database::fetch('SELECT id FROM admin_users WHERE username = ? OR email = ?', [$username, $email]);
$hash = password_hash($password, PASSWORD_DEFAULT);

if ($existing !== null) {
    if (!$update) {
        fwrite(STDERR, "An administrator with that username or email already exists. Re-run with --update to reset the password.\n");
        exit(1);
    }
    Database::query(
        'UPDATE admin_users SET username = ?, email = ?, password_hash = ?, is_active = 1 WHERE id = ?',
        [$username, $email, $hash, (int) $existing['id']]
    );
    fwrite(STDOUT, "Administrator '{$username}' updated.\n");
} else {
    Database::query(
        'INSERT INTO admin_users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
        [$username, $email, $hash, 'admin']
    );
    fwrite(STDOUT, "Administrator '{$username}' created.\n");
}
