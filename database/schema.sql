-- GTC Holdings Int (Pvt) Ltd — Database schema
-- MySQL 5.7+ / MariaDB 10.2+ compatible.
-- Charset: utf8mb4. Engine: InnoDB.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username        VARCHAR(60)  NOT NULL,
  email           VARCHAR(190) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20)  NOT NULL DEFAULT 'admin',
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at   DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_username (username),
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Login throttling
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier    VARCHAR(190) NOT NULL,
  ip_hash       CHAR(64)     NOT NULL,
  success       TINYINT(1)   NOT NULL DEFAULT 0,
  attempted_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attempt_identifier (identifier, attempted_at),
  KEY idx_attempt_ip (ip_hash, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(150) NOT NULL,
  slug            VARCHAR(160) NOT NULL,
  description     TEXT         NULL,
  image           VARCHAR(255) NULL,
  is_published    TINYINT(1)   NOT NULL DEFAULT 1,
  display_order   INT          NOT NULL DEFAULT 0,
  seo_title       VARCHAR(190) NULL,
  seo_description VARCHAR(300) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_slug (slug),
  KEY idx_cat_pub_order (is_published, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name              VARCHAR(190) NOT NULL,
  slug              VARCHAR(200) NOT NULL,
  category_id       INT UNSIGNED NULL,
  short_description VARCHAR(500) NULL,
  description       MEDIUMTEXT   NULL,
  features          TEXT         NULL,  -- JSON array of {title, text}
  specifications    TEXT         NULL,  -- JSON array of {label, value}
  price             DECIMAL(12,2) NULL,
  show_price        TINYINT(1)   NOT NULL DEFAULT 0,
  main_image        VARCHAR(255) NULL,
  is_featured       TINYINT(1)   NOT NULL DEFAULT 0,
  is_published      TINYINT(1)   NOT NULL DEFAULT 1,
  is_demo           TINYINT(1)   NOT NULL DEFAULT 0,
  seo_title         VARCHAR(190) NULL,
  seo_description   VARCHAR(300) NULL,
  display_order     INT          NOT NULL DEFAULT 0,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_prod_slug (slug),
  KEY idx_prod_cat (category_id),
  KEY idx_prod_pub (is_published, display_order),
  KEY idx_prod_featured (is_featured, is_published),
  CONSTRAINT fk_prod_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Additional product images
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id    INT UNSIGNED NOT NULL,
  image         VARCHAR(255) NOT NULL,
  display_order INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pimg_product (product_id, display_order),
  CONSTRAINT fk_pimg_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Editable pages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(100) NOT NULL,
  title           VARCHAR(190) NOT NULL,
  seo_title       VARCHAR(190) NULL,
  seo_description VARCHAR(300) NULL,
  is_published    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_page_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Editable page sections (structured content blocks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_sections (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_slug     VARCHAR(100) NOT NULL,
  section_key   VARCHAR(100) NOT NULL,
  heading       VARCHAR(255) NULL,
  subheading    VARCHAR(500) NULL,
  body          MEDIUMTEXT   NULL,
  image         VARCHAR(255) NULL,
  cta_label     VARCHAR(100) NULL,
  cta_url       VARCHAR(255) NULL,
  is_visible    TINYINT(1)   NOT NULL DEFAULT 1,
  display_order INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_section (page_slug, section_key),
  KEY idx_section_page (page_slug, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Global site settings (key/value)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key   VARCHAR(100) NOT NULL,
  setting_value MEDIUMTEXT   NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Editable navigation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS navigation_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  label         VARCHAR(100) NOT NULL,
  url           VARCHAR(255) NOT NULL,
  location      VARCHAR(30)  NOT NULL DEFAULT 'header',
  is_visible    TINYINT(1)   NOT NULL DEFAULT 1,
  display_order INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nav (location, label),
  KEY idx_nav_location (location, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename    VARCHAR(255) NOT NULL,
  path        VARCHAR(255) NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  width       INT UNSIGNED NULL,
  height      INT UNSIGNED NULL,
  size_bytes  INT UNSIGNED NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_path (path),
  KEY idx_media_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Inquiries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type            VARCHAR(20)  NOT NULL DEFAULT 'contact',
  name            VARCHAR(150) NOT NULL,
  business_name   VARCHAR(190) NULL,
  email           VARCHAR(190) NULL,
  phone           VARCHAR(60)  NULL,
  subject         VARCHAR(190) NULL,
  message         MEDIUMTEXT   NULL,
  requirements    MEDIUMTEXT   NULL,
  quantity        VARCHAR(100) NULL,
  shipping_method VARCHAR(60)  NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'new',
  ip_hash         CHAR(64)     NULL,
  user_agent      VARCHAR(255) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inq_status (status, created_at),
  KEY idx_inq_type (type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Internal inquiry notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiry_notes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  inquiry_id  INT UNSIGNED NOT NULL,
  note        TEXT         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_note_inquiry (inquiry_id),
  CONSTRAINT fk_note_inquiry FOREIGN KEY (inquiry_id)
    REFERENCES inquiries (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
