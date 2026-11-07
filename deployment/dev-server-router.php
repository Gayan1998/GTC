<?php
/**
 * Router for PHP's built-in server, used only for local production-style
 * testing. It is not used on Apache.
 *
 * From the project root run:
 *   php -S 127.0.0.1:8080 deployment/dev-server-router.php
 */
$root = dirname(__DIR__);
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (preg_match('#^/api(/.*)?$#', $uri)) {
    require $root . '/api/index.php';
    return true;
}
if ($uri === '/sitemap.xml') {
    require $root . '/sitemap.php';
    return true;
}

$file = $root . $uri;
if ($uri !== '/' && is_file($file)) {
    return false; // let the built-in server serve the static file
}

if (preg_match('#\.(js|mjs|css|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|json|xml|txt|webmanifest)$#i', $uri)) {
    http_response_code(404);
    echo 'Not found';
    return true;
}

header('Content-Type: text/html; charset=utf-8');
readfile($root . '/index.html');
return true;
