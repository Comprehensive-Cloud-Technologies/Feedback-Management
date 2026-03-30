<?php
// router.php

// 1. Handle CORS globally for the DB-less/Apache-less built-in server
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// 2. Handle Preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 3. Serve static files as is (images, css, etc.)
if (file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false;
}

// 4. Router Logic: Map clean URLs to actual files
// Note: api/auth/ folder contains the login/signup scripts
$routes = [
    // Auth Routes
    '/admin-login' => 'api/auth/admin-login.php',
    '/branch-admin-login' => 'api/auth/branch-admin-login.php',
    '/login' => 'api/auth/login.php',
    '/signup' => 'api/auth/signup.php',

    // Resource Routes
    '/sites' => 'api/sites/index.php',
    '/admin/users' => 'api/users/index.php',          // Check if api/users or api/admin/users
    '/admin/branch-admins' => 'api/branch-admins/index.php',
    '/feedback' => 'api/feedback/index.php',
    '/questions' => 'api/questions/index.php',
    '/canteens' => 'api/canteens/index.php',
    '/admin/canteens' => 'api/canteens/index.php',    // Admin uses same endpoint or specific? Usually same with privileges.
    '/admin/sites' => 'api/sites/index.php',          // Reusing sites endpoint
    '/admin/qr-codes' => 'api/qr-codes/index.php',    // Check if exists
];

// Special handling for admin routes or just map them to the same resource index
// I'll check if specific admin folders exist. 
// Based on file list: api/users exists. api/sites exists.
// So mapping /admin/users -> api/users/index.php is likely correct if that endpoint handles admin logic (which it usually does via Auth check).

if (array_key_exists($uri, $routes)) {
    require __DIR__ . '/' . $routes[$uri];
    return;
}

// Fallback: Check if file exists directly in api/ path
// e.g. /api/sites/index.php request
if (strpos($uri, '/api/') === 0 && file_exists(__DIR__ . $uri)) {
    require __DIR__ . $uri;
    return;
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Not Found', 'uri' => $uri]);
