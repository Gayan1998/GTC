<?php
declare(strict_types=1);

/**
 * Admin API routes. Every route here requires an authenticated session; all
 * state-changing routes also require a valid CSRF token (enforced by Router).
 *
 * @var Router $router
 */

/** Build a slug that is unique within a table. */
function gtc_unique_slug(string $table, string $base, ?int $excludeId = null): string
{
    $slug = Validator::slug($base);
    $candidate = $slug;
    $i = 2;
    while (true) {
        $sql = "SELECT id FROM {$table} WHERE slug = ?";
        $params = [$candidate];
        if ($excludeId !== null) {
            $sql .= ' AND id <> ?';
            $params[] = $excludeId;
        }
        $existing = Database::fetch($sql, $params);
        if ($existing === null) {
            return $candidate;
        }
        $candidate = $slug . '-' . $i;
        $i++;
    }
}

/** Validate a stored media path supplied by the client. */
function gtc_clean_media_path($value): ?string
{
    $path = Validator::str($value, 255);
    if ($path === '') {
        return null;
    }
    if (strpos($path, 'uploads/') !== 0 || strpos($path, '..') !== false) {
        Response::error('Invalid image reference.', 422);
    }
    return $path;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

$router->post('/admin/login', static function () {
    $body = Request::body();
    $identifier = Validator::str($body['username'] ?? $body['email'] ?? '', 190);
    $password = (string) ($body['password'] ?? '');

    if ($identifier === '' || $password === '') {
        Response::error('Please enter your username and password.', 422);
    }
    if (Auth::isThrottled($identifier)) {
        Response::error('Too many failed sign-in attempts. Please try again later.', 429);
    }

    $admin = Database::fetch(
        'SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = 1',
        [$identifier, $identifier]
    );
    $ok = $admin !== null && password_verify($password, (string) $admin['password_hash']);
    Auth::recordAttempt($identifier, $ok);

    if (!$ok) {
        Response::error('Invalid username or password.', 401);
    }

    Auth::clearAttempts($identifier);
    Auth::login($admin);
    return ['user' => Auth::user(), 'csrf_token' => Csrf::token()];
});

$router->post('/admin/logout', static function () {
    Auth::logout();
    return ['message' => 'Signed out.'];
}, ['auth' => true]);

$router->get('/admin/me', static function () {
    return ['user' => Auth::user(), 'csrf_token' => Csrf::token()];
}, ['auth' => true]);

$router->post('/admin/change-password', static function () {
    $user = Auth::requireUser();
    $body = Request::body();
    $current = (string) ($body['current_password'] ?? '');
    $next = (string) ($body['new_password'] ?? '');

    if (strlen($next) < 10) {
        Response::error('The new password must be at least 10 characters long.', 422, [
            'new_password' => 'Use at least 10 characters.',
        ]);
    }
    $admin = Database::fetch('SELECT * FROM admin_users WHERE id = ?', [(int) $user['id']]);
    if ($admin === null || !password_verify($current, (string) $admin['password_hash'])) {
        Response::error('The current password is incorrect.', 422, [
            'current_password' => 'Incorrect password.',
        ]);
    }
    Database::query(
        'UPDATE admin_users SET password_hash = ? WHERE id = ?',
        [password_hash($next, PASSWORD_DEFAULT), (int) $user['id']]
    );
    Csrf::rotate();
    return ['message' => 'Password updated.', 'csrf_token' => Csrf::token()];
}, ['auth' => true, 'csrf' => true]);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

$router->get('/admin/dashboard', static function () {
    return Data::dashboardSummary();
}, ['auth' => true]);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

$router->get('/admin/products', static function () {
    $status = Validator::str(Request::query('status', ''), 20);
    $filters = [
        'search'      => Validator::str(Request::query('search', ''), 120) ?: null,
        'category_id' => Validator::nullableInt(Request::query('category_id', null)),
        'page'        => max(1, Validator::int(Request::query('page', 1), 1)),
        'per_page'    => min(100, max(1, Validator::int(Request::query('per_page', 20), 20))),
    ];
    if ($status === 'published') {
        $filters['is_published'] = 1;
    } elseif ($status === 'draft') {
        $filters['is_published'] = 0;
    }
    $result = Data::products($filters);
    return [
        'products' => $result['items'],
        'meta'     => [
            'total'     => $result['total'],
            'page'      => $filters['page'],
            'per_page'  => $filters['per_page'],
            'last_page' => (int) max(1, ceil($result['total'] / $filters['per_page'])),
        ],
    ];
}, ['auth' => true]);

$router->get('/admin/products/{id}', static function (array $args) {
    $product = Data::productById((int) $args['id']);
    if ($product === null) {
        Response::error('Product not found.', 404);
    }
    return $product;
}, ['auth' => true]);

/** Shared create/update field parsing. */
$saveProduct = static function (int $id, bool $isNew): array {
    $body = Request::body();
    $name = Validator::str($body['name'] ?? '', 190);
    if ($name === '') {
        Response::error('A product name is required.', 422, ['name' => 'Required.']);
    }

    $slugInput = Validator::str($body['slug'] ?? '', 200);
    $slug = gtc_unique_slug('products', $slugInput !== '' ? $slugInput : $name, $isNew ? null : $id);

    $categoryId = Validator::nullableInt($body['category_id'] ?? null);
    if ($categoryId !== null && Database::fetch('SELECT id FROM categories WHERE id = ?', [$categoryId]) === null) {
        $categoryId = null;
    }

    $features = Validator::objectList($body['features'] ?? [], ['title', 'text']);
    $specs = Validator::objectList($body['specifications'] ?? [], ['label', 'value']);

    $params = [
        $name,
        $slug,
        $categoryId,
        Validator::str($body['short_description'] ?? '', 500) ?: null,
        Validator::text($body['description'] ?? '', 20000) ?: null,
        Validator::encodeList($features),
        Validator::encodeList($specs),
        Validator::nullableDecimal($body['price'] ?? null),
        Validator::bool($body['show_price'] ?? 0),
        gtc_clean_media_path($body['main_image'] ?? null),
        Validator::bool($body['is_featured'] ?? 0),
        Validator::bool($body['is_published'] ?? 1),
        Validator::bool($body['is_demo'] ?? 0),
        Validator::str($body['seo_title'] ?? '', 190) ?: null,
        Validator::str($body['seo_description'] ?? '', 300) ?: null,
        Validator::int($body['display_order'] ?? 0, 0),
    ];

    // Validate gallery paths before touching the database so an invalid path
    // cannot leave a half-saved product.
    $cleanImages = null;
    if (array_key_exists('images', $body)) {
        $cleanImages = [];
        foreach ((is_array($body['images']) ? $body['images'] : []) as $path) {
            $clean = gtc_clean_media_path($path);
            if ($clean !== null) {
                $cleanImages[] = $clean;
            }
        }
    }

    $pdo = Database::pdo();
    $pdo->beginTransaction();
    try {
        if ($isNew) {
            Database::query(
                'INSERT INTO products
                    (name, slug, category_id, short_description, description, features, specifications,
                     price, show_price, main_image, is_featured, is_published, is_demo, seo_title, seo_description, display_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                $params
            );
            $id = Database::lastInsertId();
        } else {
            $params[] = $id;
            Database::query(
                'UPDATE products SET
                    name = ?, slug = ?, category_id = ?, short_description = ?, description = ?,
                    features = ?, specifications = ?, price = ?, show_price = ?, main_image = ?,
                    is_featured = ?, is_published = ?, is_demo = ?, seo_title = ?, seo_description = ?,
                    display_order = ?
                 WHERE id = ?',
                $params
            );
        }

        if ($cleanImages !== null) {
            Database::query('DELETE FROM product_images WHERE product_id = ?', [$id]);
            $order = 1;
            foreach ($cleanImages as $image) {
                Database::query(
                    'INSERT INTO product_images (product_id, image, display_order) VALUES (?, ?, ?)',
                    [$id, $image, $order++]
                );
            }
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return Data::productById($id) ?? [];
};

$router->post('/admin/products', static function () use ($saveProduct) {
    $product = $saveProduct(0, true);
    Response::created($product);
}, ['auth' => true, 'csrf' => true]);

$router->put('/admin/products/{id}', static function (array $args) use ($saveProduct) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM products WHERE id = ?', [$id]) === null) {
        Response::error('Product not found.', 404);
    }
    return $saveProduct($id, false);
}, ['auth' => true, 'csrf' => true]);

$router->delete('/admin/products/{id}', static function (array $args) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM products WHERE id = ?', [$id]) === null) {
        Response::error('Product not found.', 404);
    }
    Database::query('DELETE FROM products WHERE id = ?', [$id]);
    return ['message' => 'Product deleted.', 'id' => $id];
}, ['auth' => true, 'csrf' => true]);

/** Toggle a single boolean flag without replacing the whole record. */
$router->patch('/admin/products/{id}', static function (array $args) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM products WHERE id = ?', [$id]) === null) {
        Response::error('Product not found.', 404);
    }
    $field = Validator::str(Request::input('field', ''), 20);
    if (!in_array($field, ['is_published', 'is_featured', 'is_demo', 'show_price'], true)) {
        Response::error('Invalid field.', 422);
    }
    $value = Validator::bool(Request::input('value', 0));
    Database::query("UPDATE products SET {$field} = ? WHERE id = ?", [$value, $id]);
    return ['id' => $id, $field => $value];
}, ['auth' => true, 'csrf' => true]);

$router->post('/admin/products/{id}/images', static function (array $args) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM products WHERE id = ?', [$id]) === null) {
        Response::error('Product not found.', 404);
    }
    if (!isset($_FILES['file'])) {
        Response::error('No image was uploaded.', 422);
    }
    $path = Upload::image($_FILES['file']);
    $row = Database::fetch('SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM product_images WHERE product_id = ?', [$id]);
    $order = (int) ($row['next'] ?? 1);
    Database::query('INSERT INTO product_images (product_id, image, display_order) VALUES (?, ?, ?)', [$id, $path, $order]);
    return ['image' => $path, 'id' => Database::lastInsertId(), 'display_order' => $order];
}, ['auth' => true, 'csrf' => true]);

$router->delete('/admin/products/{id}/images/{imageId}', static function (array $args) {
    Database::query(
        'DELETE FROM product_images WHERE id = ? AND product_id = ?',
        [(int) $args['imageId'], (int) $args['id']]
    );
    return ['message' => 'Image removed.'];
}, ['auth' => true, 'csrf' => true]);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

$router->get('/admin/categories', static function () {
    return Data::categories(false);
}, ['auth' => true]);

$router->get('/admin/categories/{id}', static function (array $args) {
    $category = Data::categoryById((int) $args['id']);
    if ($category === null) {
        Response::error('Category not found.', 404);
    }
    return $category;
}, ['auth' => true]);

$saveCategory = static function (int $id, bool $isNew): array {
    $body = Request::body();
    $name = Validator::str($body['name'] ?? '', 150);
    if ($name === '') {
        Response::error('A category name is required.', 422, ['name' => 'Required.']);
    }
    $slugInput = Validator::str($body['slug'] ?? '', 160);
    $slug = gtc_unique_slug('categories', $slugInput !== '' ? $slugInput : $name, $isNew ? null : $id);

    $params = [
        $name,
        $slug,
        Validator::text($body['description'] ?? '', 5000) ?: null,
        gtc_clean_media_path($body['image'] ?? null),
        Validator::bool($body['is_published'] ?? 1),
        Validator::int($body['display_order'] ?? 0, 0),
        Validator::str($body['seo_title'] ?? '', 190) ?: null,
        Validator::str($body['seo_description'] ?? '', 300) ?: null,
    ];

    if ($isNew) {
        Database::query(
            'INSERT INTO categories (name, slug, description, image, is_published, display_order, seo_title, seo_description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            $params
        );
        $id = Database::lastInsertId();
    } else {
        $params[] = $id;
        Database::query(
            'UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, is_published = ?,
                display_order = ?, seo_title = ?, seo_description = ? WHERE id = ?',
            $params
        );
    }
    return Data::categoryById($id) ?? [];
};

$router->post('/admin/categories', static function () use ($saveCategory) {
    Response::created($saveCategory(0, true));
}, ['auth' => true, 'csrf' => true]);

$router->put('/admin/categories/{id}', static function (array $args) use ($saveCategory) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM categories WHERE id = ?', [$id]) === null) {
        Response::error('Category not found.', 404);
    }
    return $saveCategory($id, false);
}, ['auth' => true, 'csrf' => true]);

$router->delete('/admin/categories/{id}', static function (array $args) {
    $id = (int) $args['id'];
    $count = Database::fetch('SELECT COUNT(*) AS c FROM products WHERE category_id = ?', [$id]);
    if ($count !== null && (int) $count['c'] > 0) {
        Response::error('This category still has products. Move or delete them first.', 409);
    }
    Database::query('DELETE FROM categories WHERE id = ?', [$id]);
    return ['message' => 'Category deleted.', 'id' => $id];
}, ['auth' => true, 'csrf' => true]);

$router->patch('/admin/categories/{id}', static function (array $args) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM categories WHERE id = ?', [$id]) === null) {
        Response::error('Category not found.', 404);
    }
    $value = Validator::bool(Request::input('value', 0));
    Database::query('UPDATE categories SET is_published = ? WHERE id = ?', [$value, $id]);
    return ['id' => $id, 'is_published' => $value];
}, ['auth' => true, 'csrf' => true]);

// ---------------------------------------------------------------------------
// Page sections (website content)
// ---------------------------------------------------------------------------

$router->get('/admin/pages', static function () {
    return Data::pageList();
}, ['auth' => true]);

$router->put('/admin/pages/{id}', static function (array $args) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM pages WHERE id = ?', [$id]) === null) {
        Response::error('Page not found.', 404);
    }
    $body = Request::body();
    Database::query(
        'UPDATE pages SET title = ?, seo_title = ?, seo_description = ?, is_published = ? WHERE id = ?',
        [
            Validator::str($body['title'] ?? '', 190),
            Validator::str($body['seo_title'] ?? '', 190) ?: null,
            Validator::str($body['seo_description'] ?? '', 300) ?: null,
            Validator::bool($body['is_published'] ?? 1),
            $id,
        ]
    );
    return ['message' => 'Page updated.'];
}, ['auth' => true, 'csrf' => true]);

$router->get('/admin/sections', static function () {
    $page = Validator::str(Request::query('page', ''), 100);
    if ($page !== '') {
        return array_values(Data::sections($page, false));
    }
    $rows = Database::fetchAll('SELECT * FROM page_sections ORDER BY page_slug ASC, display_order ASC, id ASC');
    return array_map([Data::class, 'serializeSection'], $rows);
}, ['auth' => true]);

$sectionParams = static function () {
    $body = Request::body();
    return [
        Validator::str($body['page_slug'] ?? '', 100),
        Validator::str($body['section_key'] ?? '', 100),
        Validator::str($body['heading'] ?? '', 255) ?: null,
        Validator::str($body['subheading'] ?? '', 500) ?: null,
        Validator::text($body['body'] ?? '', 20000) ?: null,
        gtc_clean_media_path($body['image'] ?? null),
        Validator::str($body['cta_label'] ?? '', 100) ?: null,
        Validator::str($body['cta_url'] ?? '', 255) ?: null,
        Validator::bool($body['is_visible'] ?? 1),
        Validator::int($body['display_order'] ?? 0, 0),
    ];
};

$router->post('/admin/sections', static function () use ($sectionParams) {
    $params = $sectionParams();
    if ($params[0] === '' || $params[1] === '') {
        Response::error('A page and section key are required.', 422);
    }
    if (Database::fetch('SELECT id FROM page_sections WHERE page_slug = ? AND section_key = ?', [$params[0], $params[1]]) !== null) {
        Response::error('A section with that key already exists on this page.', 409);
    }
    Database::query(
        'INSERT INTO page_sections
            (page_slug, section_key, heading, subheading, body, image, cta_label, cta_url, is_visible, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        $params
    );
    $row = Database::fetch('SELECT * FROM page_sections WHERE id = ?', [Database::lastInsertId()]);
    Response::created(Data::serializeSection($row));
}, ['auth' => true, 'csrf' => true]);

$router->put('/admin/sections/{id}', static function (array $args) use ($sectionParams) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM page_sections WHERE id = ?', [$id]) === null) {
        Response::error('Section not found.', 404);
    }
    $params = $sectionParams();
    $params[] = $id;
    Database::query(
        'UPDATE page_sections SET page_slug = ?, section_key = ?, heading = ?, subheading = ?, body = ?,
            image = ?, cta_label = ?, cta_url = ?, is_visible = ?, display_order = ? WHERE id = ?',
        $params
    );
    $row = Database::fetch('SELECT * FROM page_sections WHERE id = ?', [$id]);
    return Data::serializeSection($row);
}, ['auth' => true, 'csrf' => true]);

$router->delete('/admin/sections/{id}', static function (array $args) {
    Database::query('DELETE FROM page_sections WHERE id = ?', [(int) $args['id']]);
    return ['message' => 'Section deleted.'];
}, ['auth' => true, 'csrf' => true]);

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------

$router->get('/admin/inquiries', static function () {
    $status = Validator::str(Request::query('status', ''), 20);
    $type = Validator::str(Request::query('type', ''), 20);
    $page = max(1, Validator::int(Request::query('page', 1), 1));
    $perPage = min(100, max(1, Validator::int(Request::query('per_page', 20), 20)));
    $offset = ($page - 1) * $perPage;

    $where = [];
    $params = [];
    if (in_array($status, ['new', 'contacted', 'in_progress', 'completed'], true)) {
        $where[] = 'status = ?';
        $params[] = $status;
    }
    if (in_array($type, ['contact', 'import'], true)) {
        $where[] = 'type = ?';
        $params[] = $type;
    }
    $whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

    $count = Database::fetch('SELECT COUNT(*) AS c FROM inquiries' . $whereSql, $params);
    $total = (int) ($count['c'] ?? 0);

    $rows = Database::fetchAll(
        'SELECT id, type, name, business_name, email, phone, subject, status, created_at
         FROM inquiries' . $whereSql . " ORDER BY created_at DESC, id DESC LIMIT {$perPage} OFFSET {$offset}",
        $params
    );

    return [
        'inquiries' => $rows,
        'meta' => [
            'total'     => $total,
            'page'      => $page,
            'per_page'  => $perPage,
            'last_page' => (int) max(1, ceil($total / $perPage)),
        ],
    ];
}, ['auth' => true]);

$router->get('/admin/inquiries/{id}', static function (array $args) {
    $id = (int) $args['id'];
    $inquiry = Database::fetch('SELECT * FROM inquiries WHERE id = ?', [$id]);
    if ($inquiry === null) {
        Response::error('Inquiry not found.', 404);
    }
    $inquiry['notes'] = Database::fetchAll(
        'SELECT id, note, created_at FROM inquiry_notes WHERE inquiry_id = ? ORDER BY created_at DESC, id DESC',
        [$id]
    );
    return $inquiry;
}, ['auth' => true]);

$router->put('/admin/inquiries/{id}', static function (array $args) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM inquiries WHERE id = ?', [$id]) === null) {
        Response::error('Inquiry not found.', 404);
    }
    $status = Validator::str(Request::input('status', 'new'), 20);
    if (!in_array($status, ['new', 'contacted', 'in_progress', 'completed'], true)) {
        Response::error('Invalid status.', 422);
    }
    Database::query('UPDATE inquiries SET status = ? WHERE id = ?', [$status, $id]);
    return ['message' => 'Inquiry updated.', 'status' => $status];
}, ['auth' => true, 'csrf' => true]);

$router->delete('/admin/inquiries/{id}', static function (array $args) {
    Database::query('DELETE FROM inquiries WHERE id = ?', [(int) $args['id']]);
    return ['message' => 'Inquiry deleted.'];
}, ['auth' => true, 'csrf' => true]);

$router->post('/admin/inquiries/{id}/notes', static function (array $args) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM inquiries WHERE id = ?', [$id]) === null) {
        Response::error('Inquiry not found.', 404);
    }
    $note = Validator::text(Request::input('note', ''), 2000);
    if ($note === '') {
        Response::error('Please enter a note.', 422);
    }
    Database::query('INSERT INTO inquiry_notes (inquiry_id, note) VALUES (?, ?)', [$id, $note]);
    return ['id' => Database::lastInsertId(), 'note' => $note];
}, ['auth' => true, 'csrf' => true]);

// ---------------------------------------------------------------------------
// Media library
// ---------------------------------------------------------------------------

$router->get('/admin/media', static function () {
    $page = max(1, Validator::int(Request::query('page', 1), 1));
    $perPage = min(120, max(1, Validator::int(Request::query('per_page', 40), 40)));
    $offset = ($page - 1) * $perPage;

    $count = Database::fetch('SELECT COUNT(*) AS c FROM media');
    $total = (int) ($count['c'] ?? 0);
    $rows = Database::fetchAll(
        "SELECT id, filename, path, mime_type, width, height, size_bytes, created_at
         FROM media ORDER BY created_at DESC, id DESC LIMIT {$perPage} OFFSET {$offset}"
    );
    return [
        'media' => $rows,
        'meta'  => [
            'total'     => $total,
            'page'      => $page,
            'per_page'  => $perPage,
            'last_page' => (int) max(1, ceil($total / $perPage)),
        ],
    ];
}, ['auth' => true]);

$router->post('/admin/media', static function () {
    if (!isset($_FILES['file'])) {
        Response::error('No file was uploaded.', 422);
    }
    $path = Upload::image($_FILES['file']);
    $row = Database::fetch('SELECT * FROM media WHERE path = ?', [$path]);
    return [
        'id'         => (int) ($row['id'] ?? 0),
        'path'       => $path,
        'mime_type'  => (string) ($row['mime_type'] ?? ''),
        'width'      => (int) ($row['width'] ?? 0),
        'height'     => (int) ($row['height'] ?? 0),
    ];
}, ['auth' => true, 'csrf' => true]);

$router->delete('/admin/media/{id}', static function (array $args) {
    $id = (int) $args['id'];
    $row = Database::fetch('SELECT * FROM media WHERE id = ?', [$id]);
    if ($row === null) {
        Response::error('Media item not found.', 404);
    }
    $path = (string) $row['path'];

    $refs = 0;
    $refs += (int) (Database::fetch('SELECT COUNT(*) AS c FROM products WHERE main_image = ?', [$path])['c'] ?? 0);
    $refs += (int) (Database::fetch('SELECT COUNT(*) AS c FROM product_images WHERE image = ?', [$path])['c'] ?? 0);
    $refs += (int) (Database::fetch('SELECT COUNT(*) AS c FROM categories WHERE image = ?', [$path])['c'] ?? 0);
    $refs += (int) (Database::fetch('SELECT COUNT(*) AS c FROM page_sections WHERE image = ?', [$path])['c'] ?? 0);
    $refs += (int) (Database::fetch('SELECT COUNT(*) AS c FROM site_settings WHERE setting_value = ?', [$path])['c'] ?? 0);

    if ($refs > 0) {
        Response::error('This image is still used on the website. Replace it first.', 409);
    }

    Upload::deleteFile($path);
    Database::query('DELETE FROM media WHERE id = ?', [$id]);
    return ['message' => 'Media deleted.'];
}, ['auth' => true, 'csrf' => true]);

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

$router->get('/admin/settings', static function () {
    return Data::settings();
}, ['auth' => true]);

$router->put('/admin/settings', static function () {
    $body = Request::body();
    $allowed = [
        'company_name', 'company_short_name', 'company_tagline',
        'phone_mobile', 'phone_office', 'email', 'address',
        'whatsapp_number', 'whatsapp_greeting', 'contact_strip_message',
        'logo', 'logo_mark', 'favicon', 'footer_description', 'footer_copyright',
        'social_facebook', 'social_instagram', 'social_linkedin', 'social_youtube',
        'seo_default_title', 'seo_default_description', 'og_image',
    ];
    $imageKeys = ['logo', 'logo_mark', 'favicon', 'og_image'];

    Database::pdo()->beginTransaction();
    try {
        foreach ($allowed as $key) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $value = in_array($key, $imageKeys, true)
                ? (gtc_clean_media_path($body[$key]) ?? '')
                : Validator::text($body[$key], 5000);
            Database::query(
                'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                [$key, $value]
            );
        }
        Database::pdo()->commit();
    } catch (Throwable $e) {
        Database::pdo()->rollBack();
        throw $e;
    }
    Data::clearSettingsCache();
    return Data::settings();
}, ['auth' => true, 'csrf' => true]);

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

$router->get('/admin/navigation', static function () {
    $location = Validator::str(Request::query('location', ''), 30);
    if ($location !== '') {
        return Data::navigation($location, false);
    }
    $rows = Database::fetchAll('SELECT * FROM navigation_items ORDER BY location ASC, display_order ASC, id ASC');
    return $rows;
}, ['auth' => true]);

$navParams = static function () {
    $body = Request::body();
    $location = Validator::str($body['location'] ?? 'header', 30);
    if (!in_array($location, ['header', 'footer_quick', 'footer_categories'], true)) {
        $location = 'header';
    }
    return [
        Validator::str($body['label'] ?? '', 100),
        Validator::str($body['url'] ?? '', 255),
        $location,
        Validator::bool($body['is_visible'] ?? 1),
        Validator::int($body['display_order'] ?? 0, 0),
    ];
};

$router->post('/admin/navigation', static function () use ($navParams) {
    $params = $navParams();
    if ($params[0] === '' || $params[1] === '') {
        Response::error('A label and link are required.', 422);
    }
    Database::query(
        'INSERT INTO navigation_items (label, url, location, is_visible, display_order) VALUES (?, ?, ?, ?, ?)',
        $params
    );
    Response::created(Database::fetch('SELECT * FROM navigation_items WHERE id = ?', [Database::lastInsertId()]));
}, ['auth' => true, 'csrf' => true]);

$router->put('/admin/navigation/{id}', static function (array $args) use ($navParams) {
    $id = (int) $args['id'];
    if (Database::fetch('SELECT id FROM navigation_items WHERE id = ?', [$id]) === null) {
        Response::error('Navigation item not found.', 404);
    }
    $params = $navParams();
    $params[] = $id;
    Database::query(
        'UPDATE navigation_items SET label = ?, url = ?, location = ?, is_visible = ?, display_order = ? WHERE id = ?',
        $params
    );
    return Database::fetch('SELECT * FROM navigation_items WHERE id = ?', [$id]);
}, ['auth' => true, 'csrf' => true]);

$router->delete('/admin/navigation/{id}', static function (array $args) {
    Database::query('DELETE FROM navigation_items WHERE id = ?', [(int) $args['id']]);
    return ['message' => 'Navigation item deleted.'];
}, ['auth' => true, 'csrf' => true]);
