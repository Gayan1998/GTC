<?php
declare(strict_types=1);

/**
 * Read-side data access and public/admin serialisation.
 *
 * Every API response is shaped here so public endpoints never leak internal
 * fields (drafts, password hashes, private inquiry data).
 */
class Data
{
    /** @var array<string,string>|null */
    private static ?array $settingsCache = null;

    // -- Settings -------------------------------------------------------------

    /** @return array<string,string> */
    public static function settings(): array
    {
        if (self::$settingsCache !== null) {
            return self::$settingsCache;
        }
        $rows = Database::fetchAll('SELECT setting_key, setting_value FROM site_settings');
        $out = [];
        foreach ($rows as $row) {
            $out[(string) $row['setting_key']] = (string) ($row['setting_value'] ?? '');
        }
        self::$settingsCache = $out;
        return $out;
    }

    public static function setting(string $key, string $default = ''): string
    {
        $settings = self::settings();
        return $settings[$key] ?? $default;
    }

    public static function clearSettingsCache(): void
    {
        self::$settingsCache = null;
    }

    // -- Categories -----------------------------------------------------------

    /** @return array<int,array<string,mixed>> */
    public static function categories(bool $publishedOnly = true): array
    {
        $sql = 'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_published = 1) AS product_count FROM categories c';
        if ($publishedOnly) {
            $sql .= ' WHERE c.is_published = 1';
        }
        $sql .= ' ORDER BY c.display_order ASC, c.name ASC';
        return array_map([self::class, 'serializeCategory'], Database::fetchAll($sql));
    }

    /** @return array<string,mixed>|null */
    public static function categoryBySlug(string $slug, bool $publishedOnly = true): ?array
    {
        $sql = 'SELECT * FROM categories WHERE slug = ?';
        if ($publishedOnly) {
            $sql .= ' AND is_published = 1';
        }
        $row = Database::fetch($sql, [$slug]);
        return $row === null ? null : self::serializeCategory($row);
    }

    /** @return array<string,mixed>|null */
    public static function categoryById(int $id): ?array
    {
        $row = Database::fetch('SELECT * FROM categories WHERE id = ?', [$id]);
        return $row === null ? null : self::serializeCategory($row);
    }

    /** @param array<string,mixed> $row @return array<string,mixed> */
    public static function serializeCategory(array $row): array
    {
        return [
            'id'              => (int) $row['id'],
            'name'            => (string) $row['name'],
            'slug'            => (string) $row['slug'],
            'description'     => (string) ($row['description'] ?? ''),
            'image'           => $row['image'] !== null ? (string) $row['image'] : null,
            'is_published'    => (int) $row['is_published'],
            'product_count'   => (int) ($row['product_count'] ?? 0),
            'display_order'   => (int) $row['display_order'],
            'seo_title'       => (string) ($row['seo_title'] ?? ''),
            'seo_description' => (string) ($row['seo_description'] ?? ''),
        ];
    }

    // -- Products -------------------------------------------------------------

    /**
     * @param array<string,mixed> $filters
     * @return array{items:array<int,array<string,mixed>>,total:int}
     */
    public static function products(array $filters): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['published_only'])) {
            $where[] = 'p.is_published = 1';
        }
        if (!empty($filters['category_id'])) {
            $where[] = 'p.category_id = ?';
            $params[] = (int) $filters['category_id'];
        }
        if (!empty($filters['category_slug'])) {
            $where[] = 'c.slug = ?';
            $params[] = (string) $filters['category_slug'];
        }
        if (!empty($filters['featured'])) {
            $where[] = 'p.is_featured = 1';
        }
        if (!empty($filters['search'])) {
            $where[] = '(p.name LIKE ? OR p.short_description LIKE ? OR p.description LIKE ?)';
            $term = '%' . $filters['search'] . '%';
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }
        if (isset($filters['is_published'])) {
            $where[] = 'p.is_published = ?';
            $params[] = (int) $filters['is_published'];
        }

        $whereSql = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $countRow = Database::fetch(
            'SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id' . $whereSql,
            $params
        );
        $total = $countRow !== null ? (int) $countRow['total'] : 0;

        $page    = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(60, max(1, (int) ($filters['per_page'] ?? 12)));
        $offset  = ($page - 1) * $perPage;

        $order = (string) ($filters['order'] ?? 'display_order');
        $allowedOrder = [
            'display_order' => 'p.display_order ASC, p.id ASC',
            'newest'        => 'p.created_at DESC, p.id DESC',
            'name'          => 'p.name ASC',
        ];
        $orderSql = $allowedOrder[$order] ?? $allowedOrder['display_order'];

        $rows = Database::fetchAll(
            'SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p LEFT JOIN categories c ON c.id = p.category_id'
            . $whereSql .
            " ORDER BY {$orderSql} LIMIT {$perPage} OFFSET {$offset}",
            $params
        );

        return [
            'items' => array_map([self::class, 'serializeProduct'], $rows),
            'total' => $total,
        ];
    }

    /** @return array<string,mixed>|null */
    public static function productBySlug(string $slug, bool $publishedOnly = true): ?array
    {
        $sql = 'SELECT p.*, c.name AS category_name, c.slug AS category_slug
                FROM products p LEFT JOIN categories c ON c.id = p.category_id
                WHERE p.slug = ?';
        if ($publishedOnly) {
            $sql .= ' AND p.is_published = 1';
        }
        $row = Database::fetch($sql, [$slug]);
        if ($row === null) {
            return null;
        }
        $product = self::serializeProduct($row);
        $product['images'] = self::productImages((int) $row['id']);
        return $product;
    }

    /** @return array<string,mixed>|null */
    public static function productById(int $id): ?array
    {
        $row = Database::fetch(
            'SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?',
            [$id]
        );
        if ($row === null) {
            return null;
        }
        $product = self::serializeProduct($row);
        $product['images'] = self::productImages($id);
        return $product;
    }

    /** @return array<int,array<string,mixed>> */
    public static function productImages(int $productId): array
    {
        $rows = Database::fetchAll(
            'SELECT id, image, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC',
            [$productId]
        );
        return array_map(static function (array $row): array {
            return [
                'id'            => (int) $row['id'],
                'image'         => (string) $row['image'],
                'display_order' => (int) $row['display_order'],
            ];
        }, $rows);
    }

    /** @return array<int,array<string,mixed>> */
    public static function relatedProducts(array $product, int $limit = 4): array
    {
        if (empty($product['category_id'])) {
            return [];
        }
        $rows = Database::fetchAll(
            'SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.is_published = 1 AND p.category_id = ? AND p.id <> ?
             ORDER BY p.display_order ASC, p.id ASC LIMIT ' . (int) $limit,
            [(int) $product['category_id'], (int) $product['id']]
        );
        return array_map([self::class, 'serializeProduct'], $rows);
    }

    /** @param array<string,mixed> $row @return array<string,mixed> */
    public static function serializeProduct(array $row): array
    {
        $showPrice = (int) ($row['show_price'] ?? 0) === 1 && $row['price'] !== null;
        return [
            'id'                => (int) $row['id'],
            'name'              => (string) $row['name'],
            'slug'              => (string) $row['slug'],
            'category_id'       => $row['category_id'] !== null ? (int) $row['category_id'] : null,
            'category'          => $row['category_id'] !== null ? [
                'id'   => (int) $row['category_id'],
                'name' => (string) ($row['category_name'] ?? ''),
                'slug' => (string) ($row['category_slug'] ?? ''),
            ] : null,
            'short_description' => (string) ($row['short_description'] ?? ''),
            'description'       => (string) ($row['description'] ?? ''),
            'features'          => Validator::decodeList($row['features'] ?? null),
            'specifications'    => Validator::decodeList($row['specifications'] ?? null),
            'price'             => $showPrice ? (string) $row['price'] : null,
            'show_price'        => (int) ($row['show_price'] ?? 0),
            'main_image'        => $row['main_image'] !== null ? (string) $row['main_image'] : null,
            'is_featured'       => (int) ($row['is_featured'] ?? 0),
            'is_published'      => (int) ($row['is_published'] ?? 0),
            'is_demo'           => (int) ($row['is_demo'] ?? 0),
            'seo_title'         => (string) ($row['seo_title'] ?? ''),
            'seo_description'   => (string) ($row['seo_description'] ?? ''),
            'display_order'     => (int) ($row['display_order'] ?? 0),
            'created_at'        => (string) ($row['created_at'] ?? ''),
            'updated_at'        => (string) ($row['updated_at'] ?? ''),
        ];
    }

    // -- Pages and sections ---------------------------------------------------

    /** @return array<string,mixed>|null */
    public static function page(string $slug): ?array
    {
        $row = Database::fetch('SELECT * FROM pages WHERE slug = ?', [$slug]);
        if ($row === null) {
            return null;
        }
        return [
            'id'              => (int) $row['id'],
            'slug'            => (string) $row['slug'],
            'title'           => (string) $row['title'],
            'seo_title'       => (string) ($row['seo_title'] ?? ''),
            'seo_description' => (string) ($row['seo_description'] ?? ''),
            'is_published'    => (int) $row['is_published'],
            'sections'        => self::sections($slug),
        ];
    }

    /** @return array<int,array<string,mixed>> */
    public static function pageList(): array
    {
        return Database::fetchAll('SELECT * FROM pages ORDER BY id ASC');
    }

    /**
     * Return visible sections for a page keyed by section_key.
     *
     * @return array<string,array<string,mixed>>
     */
    public static function sections(string $pageSlug, bool $visibleOnly = true): array
    {
        $sql = 'SELECT * FROM page_sections WHERE page_slug = ?';
        if ($visibleOnly) {
            $sql .= ' AND is_visible = 1';
        }
        $sql .= ' ORDER BY display_order ASC, id ASC';
        $rows = Database::fetchAll($sql, [$pageSlug]);
        $out = [];
        foreach ($rows as $row) {
            $out[(string) $row['section_key']] = self::serializeSection($row);
        }
        return $out;
    }

    /** @param array<string,mixed> $row @return array<string,mixed> */
    public static function serializeSection(array $row): array
    {
        return [
            'id'            => (int) $row['id'],
            'page_slug'     => (string) $row['page_slug'],
            'section_key'   => (string) $row['section_key'],
            'heading'       => (string) ($row['heading'] ?? ''),
            'subheading'    => (string) ($row['subheading'] ?? ''),
            'body'          => (string) ($row['body'] ?? ''),
            'image'         => $row['image'] !== null && $row['image'] !== '' ? (string) $row['image'] : null,
            'cta_label'     => (string) ($row['cta_label'] ?? ''),
            'cta_url'       => (string) ($row['cta_url'] ?? ''),
            'is_visible'    => (int) $row['is_visible'],
            'display_order' => (int) $row['display_order'],
        ];
    }

    // -- Navigation -----------------------------------------------------------

    /** @return array<int,array<string,mixed>> */
    public static function navigation(string $location, bool $visibleOnly = true): array
    {
        $sql = 'SELECT * FROM navigation_items WHERE location = ?';
        if ($visibleOnly) {
            $sql .= ' AND is_visible = 1';
        }
        $sql .= ' ORDER BY display_order ASC, id ASC';
        $rows = Database::fetchAll($sql, [$location]);
        return array_map(static function (array $row): array {
            return [
                'id'            => (int) $row['id'],
                'label'         => (string) $row['label'],
                'url'           => (string) $row['url'],
                'location'      => (string) $row['location'],
                'is_visible'    => (int) $row['is_visible'],
                'display_order' => (int) $row['display_order'],
            ];
        }, $rows);
    }

    // -- Dashboard ------------------------------------------------------------

    /** @return array<string,mixed> */
    public static function dashboardSummary(): array
    {
        $published = Database::fetch('SELECT COUNT(*) AS c FROM products WHERE is_published = 1');
        $categories = Database::fetch('SELECT COUNT(*) AS c FROM categories');
        $newInquiries = Database::fetch("SELECT COUNT(*) AS c FROM inquiries WHERE status = 'new'");
        $totalInquiries = Database::fetch('SELECT COUNT(*) AS c FROM inquiries');

        $recent = Database::fetchAll(
            'SELECT id, type, name, email, phone, subject, status, created_at
             FROM inquiries ORDER BY created_at DESC, id DESC LIMIT 5'
        );

        return [
            'published_products' => (int) ($published['c'] ?? 0),
            'categories'         => (int) ($categories['c'] ?? 0),
            'new_inquiries'      => (int) ($newInquiries['c'] ?? 0),
            'total_inquiries'    => (int) ($totalInquiries['c'] ?? 0),
            'recent_inquiries'   => array_map(static function (array $row): array {
                return [
                    'id'         => (int) $row['id'],
                    'type'       => (string) $row['type'],
                    'name'       => (string) $row['name'],
                    'email'      => (string) ($row['email'] ?? ''),
                    'phone'      => (string) ($row['phone'] ?? ''),
                    'subject'    => (string) ($row['subject'] ?? ''),
                    'status'     => (string) $row['status'],
                    'created_at' => (string) $row['created_at'],
                ];
            }, $recent),
        ];
    }

    // -- Helpers --------------------------------------------------------------
}
