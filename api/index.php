<?php
declare(strict_types=1);

/**
 * API front controller.
 *
 * All requests to /api/* are rewritten here. Routes are grouped into public
 * (unauthenticated) and admin (session-authenticated) sets.
 */

require_once __DIR__ . '/core/bootstrap.php';

$router = new Router('/api');

require __DIR__ . '/routes/public.php';
require __DIR__ . '/routes/admin.php';

$router->dispatch();
