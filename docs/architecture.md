# Architecture

This document describes how the GTC Holdings website is built, how a request
flows through it, and how it is deployed on shared hosting.

---

## 1. Overview

The application is a **same-origin** website made of two parts:

1. A **static React single-page application** (SPA) built with Vite and served
   by Apache.
2. A **PHP JSON API** under `/api` backed by MySQL/MariaDB.

```
Browser
  │
  ├── GET /                → index.html + /assets/*  (React app)
  ├── GET /products/xyz    → index.html              (SPA fallback, client router)
  ├── GET /uploads/...     → static image files
  └── GET/POST /api/...    → api/index.php (PHP) → MySQL
```

There is no Node.js process in production, no server-side rendering, no Docker
and no background worker. The frontend is compiled to static files; the API is
plain PHP served by Apache.

---

## 2. Frontend architecture

- **Build tool:** Vite 5. `frontend/` is the source; `npm run build` outputs
  `index.html` and `assets/` into the project root (the web root).
- **Routing:** React Router with `basename` taken from Vite's `BASE_URL`, so the
  app works at the domain root or in a sub-directory. Direct URL access and
  refresh are handled by the Apache SPA fallback.
- **Styling:** Tailwind CSS with a small design-token set (see §8).
- **State:** a single `SiteProvider` context loads public site settings and
  navigation once. Page data is fetched per route with the `useFetch` hook.
- **Admin:** the admin panel lives in `src/admin/` and is **lazy-loaded** as a
  separate chunk, so public visitors do not download it.
- **API client:** `src/services/api.js` centralises fetch calls, JSON parsing,
  error shapes, credentials and the CSRF header. The base path is `/api` by
  default.

Component groups:

| Folder / file | Responsibility |
| --- | --- |
| `components/` | Header, footer, cards, forms, states, pagination, WhatsApp |
| `layouts/PublicLayout.jsx` | Shared public shell + floating WhatsApp button |
| `pages/` | Home, catalogue, product, category, solar, import, about, contact |
| `admin/` | Login, dashboard, product/category/content/inquiry/media/settings |
| `hooks/` | `useFetch`, `useSeo`, `useReveal` |
| `services/` | `api.js`, `SiteContext.jsx` |
| `utils/helpers.js` | Media URLs, WhatsApp links, formatting |

Data that must persist is always loaded from the API. There are no hardcoded
product or category arrays in the production flow.

---

## 3. Backend architecture

```
api/
├── index.php            Front controller: builds the Router, loads routes
├── core/
│   ├── bootstrap.php    Config, error handling, security headers
│   ├── Config.php       Dot-notation config loader
│   ├── Database.php     PDO singleton + query helpers
│   ├── Router.php       Method + {param} pattern matching, auth/CSRF hooks
│   ├── Request.php      Method, JSON body, query, headers, IP
│   ├── Response.php     Consistent JSON envelopes
│   ├── Validator.php    Input normalisation and JSON list handling
│   ├── Auth.php         Sessions, login, logout, throttling
│   ├── Csrf.php         Token issue/verify
│   └── Upload.php       Safe image upload + file deletion
├── routes/
│   ├── public.php       Unauthenticated read + inquiry endpoints
│   └── admin.php        Authenticated management endpoints
├── services/
│   ├── Data.php         Read queries and public/admin serialisation
│   └── Inquiry.php      Inquiry validation, persistence, notification
└── cli/create_admin.php Administrator creation
```

Key decisions:

- **Explicit serialisation.** `Data::serializeProduct()` and friends define
  exactly which fields leave the server, so public responses never include
  drafts, hashes or private inquiry data.
- **Router-level auth/CSRF.** Routes declare `['auth' => true]` and
  `['csrf' => true]`; the router enforces both before the handler runs, so a
  handler cannot accidentally skip protection.
- **Consistent envelopes.** All output goes through `Response`, producing
  `{success, data}` or `{success, error}`.

### Request path resolution

`Router::currentPath()` takes `REQUEST_URI`, strips the API directory derived
from `SCRIPT_NAME`, and URL-decodes the remainder. This works both at the domain
root (`/api/products`) and in a sub-directory
(`/sub/api/products`).

---

## 4. API routes

Public (published content only):

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness check |
| GET | `/api/site-settings` | Settings + header/footer navigation |
| GET | `/api/navigation` | Navigation groups |
| GET | `/api/categories` | Published categories with published product counts |
| GET | `/api/categories/{slug}` | Category + its products (paged) |
| GET | `/api/products` | Search / category / featured / paged list |
| GET | `/api/products/{slug}` | Product detail + related products |
| GET | `/api/pages/{slug}` | Editable page + sections |
| POST | `/api/inquiries` | Contact or import inquiry |

Admin (all require a session; non-GET require `X-CSRF-Token`):

| Area | Routes |
| --- | --- |
| Auth | `POST /admin/login`, `POST /admin/logout`, `GET /admin/me`, `POST /admin/change-password` |
| Dashboard | `GET /admin/dashboard` |
| Products | `GET/POST /admin/products`, `GET/PUT/PATCH/DELETE /admin/products/{id}`, image sub-routes |
| Categories | `GET/POST /admin/categories`, `GET/PUT/PATCH/DELETE /admin/categories/{id}` |
| Pages | `GET /admin/pages`, `PUT /admin/pages/{id}` |
| Sections | `GET/POST /admin/sections`, `PUT/DELETE /admin/sections/{id}` |
| Inquiries | `GET /admin/inquiries`, `GET/PUT/DELETE /admin/inquiries/{id}`, `POST /admin/inquiries/{id}/notes` |
| Media | `GET/POST /admin/media`, `DELETE /admin/media/{id}` |
| Settings | `GET/PUT /admin/settings` |
| Navigation | `GET/POST /admin/navigation`, `PUT/DELETE /admin/navigation/{id}` |

`PATCH /admin/products/{id}` toggles a single boolean flag
(`is_published`, `is_featured`, `is_demo`, `show_price`).
`PATCH /admin/categories/{id}` toggles `is_published`.

---

## 5. Database structure

```
categories ──< products ──< product_images
     │              │
     │              └── main_image → media.path
     │
pages ──< page_sections
site_settings (key/value)
navigation_items
media
inquiries ──< inquiry_notes
admin_users
login_attempts
```

| Table | Notes |
| --- | --- |
| `categories` | Unique slug, image, publish flag, order, SEO fields |
| `products` | Unique slug, FK to category (`ON DELETE SET NULL`), JSON `features`/`specifications`, optional price + `show_price`, `is_featured`, `is_published`, `is_demo`, order, SEO |
| `product_images` | Extra gallery images, FK `ON DELETE CASCADE` |
| `pages` | One row per editable page (slug, SEO, publish) |
| `page_sections` | Content blocks keyed by `(page_slug, section_key)`, unique, with image/CTA/visibility/order |
| `site_settings` | Global key/value settings |
| `navigation_items` | Header/footer links, unique `(location, label)` |
| `media` | Uploaded file metadata, unique path |
| `inquiries` | Contact/import submissions with status, type, IP hash |
| `inquiry_notes` | Internal notes, FK `ON DELETE CASCADE` |
| `admin_users` | Hashed passwords, unique username/email, active flag |
| `login_attempts` | Throttling window |

Indexes cover common lookups (`is_published + display_order`, category, featured,
status/type, media path). Flexible product attributes use validated JSON arrays
of `{title,text}` / `{label,value}` objects.

---

## 6. Authentication flow

1. `POST /api/admin/login` with username/email and password.
2. The server checks throttling, looks up the active admin, and verifies the
   password with `password_verify()`.
3. On success it regenerates the session ID, stores a minimal admin record in
   the session, rotates the CSRF token and updates `last_login_at`.
4. The client stores the returned CSRF token in memory and sends it as
   `X-CSRF-Token` on every non-GET admin request.
5. `GET /api/admin/me` restores the session on page load.
6. `POST /api/admin/logout` clears and destroys the session.

Cookies are HTTP-only and `SameSite=Lax`, with `Secure` set automatically when
the request is HTTPS. Passwords are never exposed to the React app.

---

## 7. Media storage

- Uploads are written to `uploads/YYYY/MM/<random>.<ext>` and recorded in
  `media`.
- Validation: upload error code, size limit, real MIME type via `finfo`, and
  `getimagesize`; allowed types are JPEG, PNG and WebP.
- Filenames are random and never derived from client input; path traversal is
  rejected.
- `uploads/.htaccess` disables script execution and directory listing.
- Deleting a media item is refused while any product, category, section or
  setting still references it.

---

## 8. Design system

Defined in `frontend/tailwind.config.js` and `src/styles/index.css`:

| Token | Value |
| --- | --- |
| Navy (primary) | `#123A63` |
| Corporate blue | `#1F5FAF` |
| Action blue | `#1769D2` |
| Ink (text) | `#182536` |
| Muted text | `#64748B` |
| Border | `#E2E8F0` |
| Light background | `#F3F7FC` |
| Display font | Sora |
| Body font | Manrope |

The palette follows the company logo (navy and bright blue with a sun motif).
Layouts use generous spacing, restrained borders and shadows, consistent image
ratios, and subtle scroll-entry animation that respects
`prefers-reduced-motion`.

---

## 9. Deployment layout

Recommended cPanel layout (domain root):

```
public_html/
├── index.html            React build
├── assets/               React build (content-hashed)
├── favicon.png
├── robots.txt
├── sitemap.php
├── .htaccess             SPA + API routing, source-dir protection
├── uploads/              writable media (no script execution)
└── api/                  PHP API
    ├── index.php
    ├── .htaccess
    ├── config/config.php (credentials — keep private)
    ├── core/ routes/ services/ cli/ logs/
```

For a sub-directory deployment, set `VITE_BASE_PATH`, `VITE_API_BASE` and
`VITE_MEDIA_BASE` before building.

`.htaccess` responsibilities (root):

1. Rewrite `/api/...` to `api/index.php`.
2. Rewrite `/sitemap.xml` to `sitemap.php`.
3. Deny web access to `frontend/`, `database/`, `docs/`, `deployment/`,
   `node_modules/` and dotfiles.
4. Serve existing files/directories directly.
5. Return `404` for missing static assets (never the SPA document).
6. Fall back to `index.html` for React Router paths.
7. Cache hashed assets and set security headers.
