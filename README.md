# GTC Holdings Int (Pvt) Ltd — Corporate Website & CMS

A professional corporate showcase website with a lightweight content management
panel for **GTC Holdings Int (Pvt) Ltd**, a Sri Lankan importer, wholesaler and
retailer of solar lighting, electrical products, automotive accessories and
general merchandise, with China sourcing and cargo services.

The site presents the company, its product catalogue and services, and lets
customers make contact by telephone, email, WhatsApp and inquiry forms. It is a
**corporate showcase, not an online store** — there is no cart, checkout,
payment or inventory functionality.

---

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Database setup](#database-setup)
- [Backend configuration](#backend-configuration)
- [Creating an administrator](#creating-an-administrator)
- [Frontend build](#frontend-build)
- [Production deployment (cPanel)](#production-deployment-cpanel)
- [Image management](#image-management)
- [API overview](#api-overview)
- [Security](#security)
- [Testing performed](#testing-performed)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Features

**Public website**

- Homepage with hero, company introduction, product categories, featured
  products, solar lighting showcase, why-choose-us, China import, retail and
  wholesale, and final call-to-action sections.
- Database-backed product catalogue with search, category filter and
  pagination.
- Product detail pages with image gallery, features, optional specifications,
  related products, breadcrumbs and WhatsApp inquiry.
- Category listing pages.
- Dedicated solar lighting landing page.
- China sourcing and cargo services page with a dedicated import enquiry form.
- About Us and Contact pages.
- WhatsApp click-to-chat links generated from configurable site settings.
- Contact and import inquiry forms with client-side and server-side validation,
  honeypot spam protection and rate limiting.
- Responsive layout, accessible controls, SEO metadata, Open Graph tags,
  structured data, `robots.txt` and a dynamic `sitemap.xml`.

**Admin panel (`/admin`)**

- Session-based login with password hashing, login throttling and CSRF
  protection.
- Dashboard with published product, category and inquiry counts.
- Product management: create, edit, publish/unpublish, feature, reorder,
  delete, manage features/specifications and SEO fields.
- Category management: create, edit, image, order, publish/hide, delete.
- Website content editor for every public page section (headings, text, images,
  buttons, visibility).
- Inquiry management with status tracking and internal notes.
- Media library with upload, reuse, preview and safe deletion.
- Site settings (company details, contact numbers, WhatsApp, branding, social
  links, SEO defaults) and change-password.
- Editable navigation links for the header and footer.

---

## Technology stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 18, Vite 5, Tailwind CSS 3, React Router 6, Phosphor Icons |
| Backend    | PHP 7.4+ (tested on 8.2), PDO, sessions, JSON REST API        |
| Database   | MySQL 5.7+ / MariaDB 10.2+                                    |
| Hosting    | cPanel shared hosting with Apache + `mod_rewrite` and HTTPS   |

No Node.js process is required in production. The frontend is built to static
files and the PHP API runs on the hosting PHP runtime. The application is
same-origin: the React app and the API share one domain.

The frontend is written in JavaScript (`.jsx`) rather than TypeScript to keep
the build and maintenance overhead low for a project of this size.

---

## Repository layout

```
web/
├── api/                       PHP JSON API
│   ├── .htaccess              API routing + internal directory protection
│   ├── index.php              Front controller
│   ├── config/                config.sample.php and (git-ignored) config.php
│   ├── core/                  Config, Database, Router, Auth, Csrf, Upload, ...
│   ├── routes/                public.php and admin.php route definitions
│   ├── services/              Data access and Inquiry handling
│   ├── cli/                   create_admin.php
│   └── logs/                  Error log (protected)
├── frontend/                  React + Vite source
│   ├── src/
│   │   ├── components/        Shared public components
│   │   ├── layouts/           PublicLayout
│   │   ├── pages/             Public pages
│   │   ├── admin/             Admin panel (code-split)
│   │   ├── hooks/             useFetch, useSeo, useReveal
│   │   ├── services/          api.js, SiteContext
│   │   ├── utils/             helpers.js
│   │   └── styles/            Tailwind entry
│   ├── public/                favicon.png, robots.txt
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── database/
│   ├── schema.sql             Tables, indexes, foreign keys
│   └── seed.sql               Categories, demo products, content, settings
├── deployment/
│   ├── README.md              cPanel deployment guide
│   └── dev-server-router.php  Optional local production preview helper
├── docs/
│   └── architecture.md        Architecture, API routes, data model
├── uploads/                   Public media (writable)
├── index.html                 Built frontend (generated by `npm run build`)
├── assets/                    Built assets (generated)
├── favicon.png                Built copy
├── robots.txt                 Built copy
├── sitemap.php                Dynamic XML sitemap
├── .htaccess                  Apache routing for the whole site
└── README.md
```

---

## Prerequisites

- PHP **7.4 or newer** with the `pdo_mysql`, `fileinfo`, `mbstring`, `json`,
  `openssl` and `gd` extensions.
- MySQL 5.7+ or MariaDB 10.2+.
- Apache with `mod_rewrite` and `AllowOverride All` (standard on cPanel).
- Node.js 18+ **for local development and building the frontend only**.

---

## Local development

The project was developed against XAMPP. The repository root is the Apache
document root (`htdocs/GTC holdings/web`).

1. **Create the database** (see [Database setup](#database-setup)).
2. **Configure the backend**: copy `api/config/config.sample.php` to
   `api/config/config.php` and set your credentials. A working local
   `config.php` is already provided for XAMPP (`root` with no password).
3. **Create an administrator** (see below).
4. **Install frontend dependencies and start the dev server:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The app runs at <http://localhost:5173>. Vite proxies `/api` and `/uploads`
   to the Apache document root so the app is same-origin. If your Apache base
   path differs, set `VITE_DEV_APACHE_BASE` in a `.env` file.

5. **Production-style preview without the dev server** (optional). Build the
   frontend, then serve the project root with PHP:

   ```bash
   cd frontend && npm run build && cd ..
   php -S 127.0.0.1:8080 deployment/dev-server-router.php
   ```

   Open <http://127.0.0.1:8080>.

---

## Database setup

The schema and seed scripts are in `database/`.

```bash
mysql -u root -p -e "CREATE DATABASE gtc_holdings CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p gtc_holdings < database/schema.sql
mysql -u root -p gtc_holdings < database/seed.sql
```

- `schema.sql` creates all tables and is safe to run on a fresh database.
- `seed.sql` is **repeatable** — every row has a deterministic key, so it can be
  re-run without creating duplicates.
- Demo products are marked `is_demo = 1` in the database. Replace them with
  real products through the admin panel; no code changes are required.

Tables: `admin_users`, `login_attempts`, `categories`, `products`,
`product_images`, `pages`, `page_sections`, `site_settings`,
`navigation_items`, `media`, `inquiries`, `inquiry_notes`.

---

## Backend configuration

`api/config/config.sample.php` documents every option. Copy it to
`api/config/config.php` and edit:

```php
'db' => [ 'host' => '127.0.0.1', 'name' => 'gtc_holdings', 'user' => '...', 'pass' => '...' ],
'app' => [
    'debug' => false,                 // true only while developing
    'upload_dir' => dirname(__DIR__, 2) . '/uploads',
    'admin_notification_email' => '', // optional
],
```

In production, keep `config.php` outside the public web root where possible and
point to it with the `GTC_CONFIG` environment variable:

```
GTC_CONFIG=/home/USERNAME/gtc-config.php
```

Set `debug` to `false` in production so errors are logged, not displayed.

---

## Creating an administrator

Administrators are created from the command line. No public sign-up endpoint
exists.

```bash
php api/cli/create_admin.php \
  --username=admin \
  --email=admin@example.com \
  --password="a-long-password"
```

- Passwords must be at least 10 characters and are hashed with
  `password_hash()`.
- To reset an existing account's password, add `--update`.
- Omit any option and you will be prompted for it.

On shared hosting without shell access, run the script locally against the
production database, or use your host's PHP CLI / cron facility once, then
delete the script's access. Do not leave an unrestricted admin-creation
endpoint enabled — none is provided.

---

## Frontend build

```bash
cd frontend
npm install
npm run build
```

The build writes `index.html` and `assets/` to the project root, which is the
web root. Environment options (see `frontend/.env.example`):

| Variable            | Default | Purpose                                            |
| ------------------- | ------- | -------------------------------------------------- |
| `VITE_BASE_PATH`    | `/`     | Base path when deploying into a sub-directory      |
| `VITE_API_BASE`     | `/api`  | API path                                            |
| `VITE_MEDIA_BASE`   | ``      | Prefix for uploaded media                          |

For a **domain-root** deployment, no changes are needed. For a sub-directory
deployment (e.g. `https://example.com/gtc/`), set all three to that path.

---

## Production deployment (cPanel)

See **[deployment/README.md](deployment/README.md)** for the full step-by-step
guide. In summary:

1. Create the database and user in cPanel, then import `schema.sql` and
   `seed.sql`.
2. Upload the project to `public_html` (or a sub-directory).
3. Copy `api/config/config.sample.php` to `config.php` and set credentials.
4. Create the first administrator.
5. Build and upload the frontend (`index.html`, `assets/`).
6. Ensure the root `.htaccess`, `api/.htaccess` and `uploads/.htaccess` are in
   place and `mod_rewrite` is enabled.
7. Make `uploads/` writable (`755`).
8. Enable HTTPS.
9. Test the site, the API and the admin panel.

---

## Image management

- Uploaded images are stored under `uploads/YYYY/MM/` with random filenames.
- The server validates the upload error code, size, real MIME type (via
  `finfo`) and image structure (`getimagesize`). Only JPEG, PNG and WebP are
  accepted (default 5 MB limit).
- `uploads/.htaccess` disables script execution and directory listing.
- Images still referenced by a product, category, content section or setting
  cannot be deleted from the media library until the reference is removed.
- Seed images are free-to-use photographs from Unsplash, downloaded locally to
  `uploads/seed/`. Replace them with the company's own photographs through the
  admin panel.

---

## API overview

Public endpoints (only published content):

```
GET  /api/health
GET  /api/site-settings
GET  /api/navigation
GET  /api/categories
GET  /api/categories/{slug}
GET  /api/products?search=&category=&featured=&page=&per_page=
GET  /api/products/{slug}
GET  /api/pages/{slug}
POST /api/inquiries
```

Admin endpoints (session-authenticated; state changes require the
`X-CSRF-Token` header):

```
POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/me
POST   /api/admin/change-password
GET    /api/admin/dashboard
GET    /api/admin/products              POST   /api/admin/products
GET    /api/admin/products/{id}         PUT    /api/admin/products/{id}
PATCH  /api/admin/products/{id}         DELETE /api/admin/products/{id}
POST   /api/admin/products/{id}/images  DELETE /api/admin/products/{id}/images/{imageId}
GET    /api/admin/categories            POST   /api/admin/categories
GET    /api/admin/categories/{id}       PUT    /api/admin/categories/{id}
PATCH  /api/admin/categories/{id}       DELETE /api/admin/categories/{id}
GET    /api/admin/pages                 PUT    /api/admin/pages/{id}
GET    /api/admin/sections              POST   /api/admin/sections
PUT    /api/admin/sections/{id}         DELETE /api/admin/sections/{id}
GET    /api/admin/inquiries             GET    /api/admin/inquiries/{id}
PUT    /api/admin/inquiries/{id}        DELETE /api/admin/inquiries/{id}
POST   /api/admin/inquiries/{id}/notes
GET    /api/admin/media                 POST   /api/admin/media
DELETE /api/admin/media/{id}
GET    /api/admin/settings              PUT    /api/admin/settings
GET    /api/admin/navigation            POST   /api/admin/navigation
PUT    /api/admin/navigation/{id}       DELETE /api/admin/navigation/{id}
```

Responses are JSON. Success responses use `{ "success": true, "data": ... }`;
errors use `{ "success": false, "error": { "message", "status", "details?" } }`.
See [docs/architecture.md](docs/architecture.md) for details.

---

## Security

Implemented controls:

- Passwords hashed with `password_hash()`; sessions regenerated on login.
- HTTP-only, `SameSite=Lax` session cookies; `Secure` flag when HTTPS is active.
- Server-side authorization on every admin route.
- Login throttling (5 failures per 15 minutes per user/IP).
- CSRF tokens required for all state-changing admin requests.
- PDO prepared statements everywhere; validated and normalised inputs.
- Upload validation (error code, size, real MIME type, image structure) with
  random filenames and a non-executable uploads directory.
- Public endpoints never expose drafts, unpublished content, inquiries or
  administrator data.
- Security headers; verbose errors disabled in production; errors logged to
  `api/logs/error.log`.
- Credentials kept out of the repository via `config.php` (git-ignored) and the
  optional `GTC_CONFIG` path.

This is a reasonable security baseline, not a guarantee. Review your hosting
configuration (PHP version, HTTPS, file permissions, backups) as part of going
live.

---

## Testing performed

Executed locally against XAMPP (PHP 8.2, MariaDB 10.4) and headless Chrome:

- Frontend production build completes.
- All public routes render and refresh directly, including deep product and
  category URLs.
- Product search, category filters and pagination return database data.
- WhatsApp links use the configured number (`wa.me/94764099495`) and the
  product name.
- Contact and import inquiry forms validate, persist to MySQL and appear in the
  admin panel; honeypot and invalid submissions are rejected.
- Admin login, logout, session protection and CSRF enforcement verified;
  unauthenticated admin requests return `401`/`403`.
- Product create, edit, publish toggle, feature toggle, delete, image upload and
  gallery management verified through the API.
- Category, content-section, settings, navigation, media and inquiry
  management endpoints verified.
- Homepage content edits saved in the admin appear on the public site.
- Upload of a non-image file is rejected.
- Missing static assets return `404` (no SPA fallback).
- Deployment routing verified both at the domain root and in a sub-directory.

---

## Known limitations

- The site is a static single-page app, so page titles/descriptions are applied
  client-side at runtime. Search engines that execute JavaScript will index the
  content; social sharing tags are present in the served `index.html` defaults
  and updated at runtime. Server-side rendering is intentionally not used
  because shared hosting cannot run a Node process.
- Email notification of new inquiries is optional. If `admin_notification_email`
  is blank or mail fails, the inquiry is still saved and the failure is logged.
- Sourcing centres, services and process steps are descriptive and do not
  promise specific transit times, rates or customs outcomes.
- Demo products and images are placeholders marked `is_demo = 1`; no real GTC
  product photographs or specifications have been fabricated.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| API returns HTML or `404` | `mod_rewrite` disabled or `.htaccess` missing. Confirm `AllowOverride All`. |
| `500` on API requests | Check `api/logs/error.log`; verify database credentials in `config.php`. |
| Images not loading | Check `uploads/` permissions (`755`) and that the stored path matches. |
| Admin login loops back | Cookies blocked, or `config.php` session name changed. Ensure HTTPS and same-origin. |
| Direct page refresh shows 404 | Root `.htaccess` not applied; confirm the SPA fallback rule is present. |
| Uploads rejected | File must be JPEG/PNG/WebP under the size limit. Check `upload_max_filesize` in PHP. |
