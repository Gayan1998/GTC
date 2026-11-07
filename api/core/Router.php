<?php
declare(strict_types=1);

/**
 * Minimal router for the JSON API.
 *
 * Patterns use {name} placeholders, e.g. /products/{slug}. Routes can require
 * authentication and CSRF protection; the router enforces both before running
 * the handler.
 */
class Router
{
    private string $base;
    /** @var array<int,array{method:string,regex:string,params:array<int,string>,handler:callable,auth:bool,csrf:bool}> */
    private array $routes = [];

    public function __construct(string $base)
    {
        $this->base = rtrim($base, '/');
    }

    /** @param array{auth?:bool,csrf?:bool} $options */
    public function add(string $method, string $pattern, callable $handler, array $options = []): void
    {
        $params = [];
        $regex = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', function ($m) use (&$params) {
            $params[] = $m[1];
            return '([^/]+)';
        }, $pattern);
        $regex = '#^' . $regex . '$#';

        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => $regex,
            'params'  => $params,
            'handler' => $handler,
            'auth'    => (bool) ($options['auth'] ?? false),
            'csrf'    => (bool) ($options['csrf'] ?? false),
        ];
    }

    /** @param array{auth?:bool,csrf?:bool} $options */
    public function get(string $p, callable $h, array $options = []): void { $this->add('GET', $p, $h, $options); }
    public function post(string $p, callable $h, array $options = []): void { $this->add('POST', $p, $h, $options); }
    public function put(string $p, callable $h, array $options = []): void { $this->add('PUT', $p, $h, $options); }
    public function patch(string $p, callable $h, array $options = []): void { $this->add('PATCH', $p, $h, $options); }
    public function delete(string $p, callable $h, array $options = []): void { $this->add('DELETE', $p, $h, $options); }

    public function dispatch(): void
    {
        $path = $this->currentPath();
        $method = Request::method();
        $pathMatched = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }
            $pathMatched = true;
            if ($route['method'] !== $method) {
                continue;
            }

            array_shift($matches);
            $args = array_combine($route['params'], $matches) ?: [];

            if ($route['auth']) {
                Auth::requireUser();
            }
            if ($route['csrf'] && $method !== 'GET') {
                Csrf::verify();
            }

            $result = ($route['handler'])($args);
            if (is_array($result) || $result === null) {
                Response::ok($result);
            }
            return;
        }

        if ($pathMatched) {
            Response::error('Method not allowed for this endpoint.', 405);
        }
        Response::error('Endpoint not found.', 404);
    }

    /** Resolve the request path relative to the API base directory. */
    private function currentPath(): string
    {
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = parse_url($uri, PHP_URL_PATH);
        $path = is_string($path) ? $path : '/';
        $path = urldecode($path);

        $script = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
        $scriptDir = urldecode(str_replace('\\', '/', dirname($script)));
        if ($scriptDir !== '/' && $scriptDir !== '.' && strpos($path, $scriptDir) === 0) {
            $path = substr($path, strlen($scriptDir));
        }

        $path = '/' . ltrim($path, '/');
        return $path === '/' ? '/' : rtrim($path, '/');
    }
}
