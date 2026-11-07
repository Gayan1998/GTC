<?php
declare(strict_types=1);

/**
 * Dynamic XML sitemap. Lists static pages plus published products and
 * categories so search engines can discover content.
 *
 * URL: /sitemap.xml (rewritten to this file by the root .htaccess).
 */

require_once __DIR__ . '/api/core/Config.php';
require_once __DIR__ . '/api/core/Database.php';

Config::load();

$base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http')
    . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
$scriptDir = str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/')));
$basePath = $scriptDir === '/' || $scriptDir === '.' ? '' : rtrim($scriptDir, '/');
$base .= $basePath;

header('Content-Type: application/xml; charset=utf-8');

$staticPages = ['/', '/products', '/solar-lighting', '/china-import', '/about', '/contact'];

$urls = [];
foreach ($staticPages as $path) {
    $urls[] = ['loc' => $base . $path, 'lastmod' => null, 'priority' => $path === '/' ? '1.0' : '0.8'];
}

try {
    $categories = Database::fetchAll('SELECT slug, updated_at FROM categories WHERE is_published = 1 ORDER BY id ASC');
    foreach ($categories as $category) {
        $urls[] = [
            'loc' => $base . '/categories/' . rawurlencode((string) $category['slug']),
            'lastmod' => substr((string) $category['updated_at'], 0, 10),
            'priority' => '0.7',
        ];
    }

    $products = Database::fetchAll('SELECT slug, updated_at FROM products WHERE is_published = 1 ORDER BY id ASC');
    foreach ($products as $product) {
        $urls[] = [
            'loc' => $base . '/products/' . rawurlencode((string) $product['slug']),
            'lastmod' => substr((string) $product['updated_at'], 0, 10),
            'priority' => '0.6',
        ];
    }
} catch (Throwable $e) {
    // If the database is unavailable, still return the static pages.
    error_log('[GTC] Sitemap database error: ' . $e->getMessage());
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $url) {
    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($url['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</loc>\n";
    if (!empty($url['lastmod'])) {
        echo '    <lastmod>' . htmlspecialchars($url['lastmod'], ENT_XML1, 'UTF-8') . "</lastmod>\n";
    }
    echo '    <priority>' . $url['priority'] . "</priority>\n";
    echo "  </url>\n";
}
echo "</urlset>\n";
