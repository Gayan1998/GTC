<?php
declare(strict_types=1);

/**
 * Public API routes. Only published content is returned here.
 *
 * @var Router $router
 */

$router->get('/health', static function () {
    return ['status' => 'ok', 'time' => date('c')];
});

$router->get('/site-settings', static function () {
    $settings = Data::settings();
    $publicKeys = [
        'company_name', 'company_short_name', 'company_tagline',
        'phone_mobile', 'phone_office', 'email', 'address',
        'whatsapp_number', 'whatsapp_greeting', 'contact_strip_message',
        'logo', 'logo_mark', 'favicon',
        'footer_description', 'footer_copyright',
        'social_facebook', 'social_instagram', 'social_linkedin', 'social_youtube',
        'seo_default_title', 'seo_default_description', 'og_image',
    ];
    $out = [];
    foreach ($publicKeys as $key) {
        $out[$key] = $settings[$key] ?? '';
    }
    $out['navigation'] = [
        'header'       => Data::navigation('header'),
        'footer_quick' => Data::navigation('footer_quick'),
    ];
    return $out;
});

$router->get('/navigation', static function () {
    return [
        'header'       => Data::navigation('header'),
        'footer_quick' => Data::navigation('footer_quick'),
    ];
});

$router->get('/categories', static function () {
    return Data::categories(true);
});

$router->get('/categories/{slug}', static function (array $args) {
    $category = Data::categoryBySlug($args['slug'], true);
    if ($category === null) {
        Response::error('Category not found.', 404);
    }
    $page = max(1, Validator::int(Request::query('page', 1), 1));
    $perPage = min(48, max(1, Validator::int(Request::query('per_page', 12), 12)));
    $result = Data::products([
        'published_only' => true,
        'category_id'    => $category['id'],
        'page'           => $page,
        'per_page'       => $perPage,
    ]);
    return [
        'category' => $category,
        'products' => $result['items'],
    ] + ['meta' => [
        'total'     => $result['total'],
        'page'      => $page,
        'per_page'  => $perPage,
        'last_page' => (int) max(1, ceil($result['total'] / $perPage)),
    ]];
});

$router->get('/products', static function () {
    $search = Validator::str(Request::query('search', ''), 120);
    $categorySlug = Validator::str(Request::query('category', ''), 160);
    $featured = Validator::bool(Request::query('featured', ''));
    $page = max(1, Validator::int(Request::query('page', 1), 1));
    $perPage = min(48, max(1, Validator::int(Request::query('per_page', 12), 12)));

    $filters = [
        'published_only' => true,
        'search'         => $search !== '' ? $search : null,
        'category_slug'  => $categorySlug !== '' ? $categorySlug : null,
        'featured'       => $featured === 1 ? 1 : 0,
        'page'           => $page,
        'per_page'       => $perPage,
    ];
    $result = Data::products($filters);

    return [
        'products' => $result['items'],
        'meta'     => [
            'total'     => $result['total'],
            'page'      => $page,
            'per_page'  => $perPage,
            'last_page' => (int) max(1, ceil($result['total'] / $perPage)),
            'search'    => $search,
            'category'  => $categorySlug,
        ],
    ];
});

$router->get('/products/{slug}', static function (array $args) {
    $product = Data::productBySlug($args['slug'], true);
    if ($product === null) {
        Response::error('Product not found.', 404);
    }
    return [
        'product'  => $product,
        'related'  => Data::relatedProducts($product, 4),
    ];
});

$router->get('/pages/{slug}', static function (array $args) {
    $page = Data::page($args['slug']);
    if ($page === null || (int) $page['is_published'] !== 1) {
        Response::error('Page not found.', 404);
    }
    return $page;
});

$router->post('/inquiries', static function () {
    $type = Validator::str(Request::input('type', 'contact'), 20);
    return Inquiry::create(Request::body(), $type);
});
