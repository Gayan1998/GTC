# Deployment guide — cPanel shared hosting

This guide deploys the GTC Holdings website to ordinary cPanel hosting with
Apache, PHP and MySQL/MariaDB. The target layout is a **single domain, one
origin**: the React app at `/`, the PHP API at `/api`.

Replace `example.com` with your domain throughout.

---

## 0. Requirements

- PHP 7.4+ (8.x recommended) with `pdo_mysql`, `fileinfo`, `mbstring`, `json`,
  `openssl`, `gd`.
- MySQL 5.7+ / MariaDB 10.2+.
- Apache with `mod_rewrite` enabled and `AllowOverride All` (default on cPanel).
- HTTPS (Let's Encrypt via cPanel AutoSSL is fine).
- Node.js 18+ **on your computer** to build the frontend. The server does not
  need Node.

---

## 1. Build the frontend locally

```bash
cd frontend
npm install
npm run build
```

This writes `index.html` and `assets/` into the project root.

- **Domain root deployment:** no environment changes needed.
- **Sub-directory deployment** (e.g. `https://example.com/gtc/`): create
  `frontend/.env.production` before building:

  ```
  VITE_BASE_PATH=/gtc/
  VITE_API_BASE=/gtc/api
  VITE_MEDIA_BASE=/gtc
  ```

---

## 2. Create the database

In cPanel → **MySQL® Databases**:

1. Create a database, e.g. `myaccount_gtc`.
2. Create a user with a strong password, e.g. `myaccount_gtcuser`.
3. Add the user to the database with **All Privileges**.

Import the schema and seed data. In cPanel → **phpMyAdmin**, select the
database, open the **Import** tab, and import:

1. `database/schema.sql`
2. `database/seed.sql`

Or from a shell:

```bash
mysql -u myaccount_gtcuser -p myaccount_gtc < database/schema.sql
mysql -u myaccount_gtcuser -p myaccount_gtc < database/seed.sql
```

---

## 3. Upload the application

Upload the project contents into `public_html` (or `public_html/gtc/` for a
sub-directory). You can use cPanel **File Manager**, FTP, or a zip archive.

Files that must be present:

```
public_html/
├── index.html
├── assets/
├── favicon.png
├── robots.txt
├── sitemap.php
├── .htaccess
├── uploads/            (writable, may be empty except .htaccess)
└── api/
    ├── index.php
    ├── .htaccess
    ├── config/
    ├── core/
    ├── routes/
    ├── services/
    ├── cli/
    └── logs/
```

You do **not** need to upload `frontend/`, `database/`, `docs/` or
`deployment/` to production. If you do upload them, the root `.htaccess` blocks
web access, but omitting them is cleaner and smaller.

> **File Manager tip:** hidden files such as `.htaccess` are not shown by
> default. Enable *Settings → Show Hidden Files (dotfiles)*.

---

## 4. Configure the backend

1. Copy `api/config/config.sample.php` to `api/config/config.php`.
2. Edit it:

```php
'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'myaccount_gtc',
    'user' => 'myaccount_gtcuser',
    'pass' => 'YOUR-STRONG-PASSWORD',
    'charset' => 'utf8mb4',
],
'app' => [
    'debug' => false,
    'upload_dir' => __DIR__ . '/../../uploads',
    // ...
],
```

For extra safety, place the config outside the web root (for example
`/home/myaccount/gtc-config.php`) and set an environment variable, or edit
`api/config/config.php` to `require` that file.

---

## 5. Create the first administrator

From the cPanel **Terminal** (or SSH):

```bash
cd public_html
php api/cli/create_admin.php \
  --username=admin \
  --email=you@example.com \
  --password="a-long-password"
```

If the Terminal is unavailable, run the script against the production database
from your local machine (temporarily pointing `config.php` at the remote host),
or ask your host to enable PHP CLI. There is intentionally no web-based admin
sign-up.

---

## 6. Permissions

- Directories: `755`.
- Files: `644`.
- `uploads/` must be writable by PHP: `755` is usually correct; use `775` if
  the host runs PHP as a different user.
- `api/logs/` must be writable so errors can be logged.

```bash
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod -R 755 uploads api/logs
```

---

## 7. Apache configuration

Confirm the three `.htaccess` files are present:

- **Root `.htaccess`** — routes `/api` to PHP, protects source directories,
  serves the SPA, 404s missing assets, sets caching and security headers.
- **`api/.htaccess`** — routes API requests to `api/index.php` and blocks
  access to `config/`, `core/`, `services/`, `routes/`, `cli/` and `logs/`.
- **`uploads/.htaccess`** — disables script execution and directory listing.

If direct page refreshes return `404`, `mod_rewrite` or `AllowOverride` is
disabled. Ask your host to enable them.

---

## 8. Enable HTTPS

In cPanel → **SSL/TLS Status**, run AutoSSL for the domain. Then force HTTPS
with either the cPanel toggle or by adding to the root `.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

Session cookies automatically receive the `Secure` flag when the request is
HTTPS.

---

## 9. Optional email notifications

To receive an email for each new inquiry, set in `config.php`:

```php
'admin_notification_email' => 'you@example.com',
'mail_from' => 'no-reply@example.com',
```

Email delivery is best-effort. If it fails, the inquiry is still saved and the
failure is written to `api/logs/error.log`.

---

## 10. Post-deployment checklist

1. Open `https://example.com/` — the homepage loads.
2. Open `https://example.com/products/solar-street-light` directly — it loads
   (SPA fallback works).
3. Open `https://example.com/api/products` — JSON is returned.
4. Open `https://example.com/sitemap.xml` — XML is returned.
5. Sign in at `https://example.com/admin/login`.
6. Add a product, publish it, and confirm it appears in the catalogue.
7. Upload a product image and confirm it displays.
8. Edit the homepage hero text and confirm the public page updates.
9. Submit a contact inquiry and confirm it appears under **Inquiries**.
10. Sign out and confirm `/admin` redirects to the login page.

---

## 11. Backups

Back up regularly:

- The MySQL database (cPanel → **phpMyAdmin → Export**, or the cPanel backup
  tool).
- The `uploads/` directory.
- `api/config/config.php` (keep a secure copy).

---

## 12. Updating the application

1. Back up the database and `uploads/`.
2. Rebuild the frontend locally (`npm run build`).
3. Upload the new `index.html` and `assets/`. Old hashed assets can be deleted.
4. Upload changed PHP files.
5. If the schema changed, apply the new statements from `database/schema.sql`.
6. Re-run the post-deployment checklist.

---

## 13. Local production preview (optional)

To preview the production build on your own machine without Apache:

```bash
cd frontend && npm run build && cd ..
php -S 127.0.0.1:8080 deployment/dev-server-router.php
```

Then open <http://127.0.0.1:8080>. This helper is only for local testing and is
never used on the production server.
