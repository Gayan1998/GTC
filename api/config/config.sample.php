<?php
/**
 * GTC Holdings — sample configuration.
 *
 * Copy this file to config.php and edit the values for your environment.
 * In production, keep config.php outside the public web root when possible
 * and point to it with the GTC_CONFIG environment variable.
 */
return [
    'db' => [
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'gtc_holdings',
        'user'    => 'gtc_user',
        'pass'    => 'change-this-password',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        // Turn OFF in production.
        'debug' => false,

        'session_name'     => 'gtc_admin',
        'session_lifetime' => 7200,

        // Absolute path to the writable uploads directory and its public URL path.
        'upload_dir' => dirname(__DIR__, 2) . '/uploads',
        'upload_url' => 'uploads',

        'max_upload_bytes' => 5242880, // 5 MB
        'allowed_mimes'    => [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ],

        'login_max_attempts'   => 5,
        'login_window_seconds' => 900,

        // Optional: email address to notify about new inquiries. Leave blank to disable.
        'admin_notification_email' => '',
        'mail_from'                => 'no-reply@localhost',

        'log_file' => dirname(__DIR__) . '/logs/error.log',
    ],
];
