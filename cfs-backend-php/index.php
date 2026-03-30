<?php
/**
 * Main API Router - Senior Architect Version
 * Routes requests to specialized handlers in the /handlers directory
 */

// 1. Environment Loading (Rock-Solid Implementation)
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (empty($line) || strpos($line, '#') === 0 || strpos($line, '=') === false)
            continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        putenv("$name=$value");
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

// 2. Global Error Handling
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// 3. Core Logic Injection (The 'Engine' of the API)
// Using internal guards in files for absolute safety
require_once __DIR__ . '/src/Cors.php';
require_once __DIR__ . '/src/Constants.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Response.php';
require_once __DIR__ . '/src/JWT.php';
require_once __DIR__ . '/src/Auth.php';

// 4. Path Detection & Routing logic
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);

// Flatten the path relative to the script location
if ($basePath !== '/' && strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}
$path = trim($path, '/');
$segments = explode('/', $path);

try {
    // API Root Landing
    if (empty($path)) {
        Response::success([
            'message' => 'Canteen Feedback API v2 (Elite Architecture)',
            'status' => 'online',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    $endpoint = $segments[0];

    // Normalize target name
    $target = str_replace('.php', '', $endpoint);
    $target = str_replace('_', '-', $target); // Handle 'admin_login' -> 'admin-login'

    // Handle 'admin/...' sub-routing (e.g., /admin/users -> handlers/users.php)
    $is_admin_path = ($target === 'admin' && isset($segments[1]));
    if ($is_admin_path) {
        $target = str_replace('.php', '', $segments[1]);
        $target = str_replace('_', '-', $target);
    }

    // Route Mapping Special Cases (Authentication)
    $auth_endpoints = ['login', 'signup', 'admin-login', 'branch-admin-login'];
    $handler_path = '';

    if (in_array($target, $auth_endpoints)) {
        $handler_path = __DIR__ . "/handlers/auth/$target.php";
    } else {
        $handler_path = __DIR__ . "/handlers/$target.php";
    }

    // 5. Execution
    if (file_exists($handler_path)) {
        require_once $handler_path;
        exit; // Ensure no double output
    } else {
        Response::error("Endpoint '$endpoint' mapped to '$target' was not found at expected location: /handlers/" . (in_array($target, $auth_endpoints) ? "auth/" : "") . "$target.php", 404);
    }

} catch (Throwable $e) {
    // Catch-all for fatal system errors
    error_log("Global Router Dispatch Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());

    if (!class_exists('Response')) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Critical System Failure', 'message' => $e->getMessage()]);
    } else {
        Response::error("System Stability Exception: " . $e->getMessage(), 500);
    }
}
