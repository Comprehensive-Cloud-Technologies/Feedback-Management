<?php
/**
 * API Router - Main Entry Point for all /api/* requests
 * This file handles routing and CORS for all API endpoints
 */

require_once __DIR__ . '/init.php';

// Get the request path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Remove the base path for both /api and legacy /feedback/api
$path = preg_replace('#^/(feedback/)?api/?#', '', $path);
$path = trim($path, '/');

// Extract endpoint from path
$parts = explode('/', $path);
$endpoint = isset($parts[0]) && !empty($parts[0]) ? $parts[0] : '';

// If the request used a .php filename (e.g. admin-login.php) remove the extension
if (substr($endpoint, -4) === '.php') {
    $endpoint = substr($endpoint, 0, -4);
}

// If no endpoint, return API info
if (empty($endpoint)) {
    http_response_code(200);
    echo json_encode([
        'message' => 'Canteen Feedback System API',
        'version' => '1.0.0',
        'status' => 'running'
    ]);
    exit(0);
}

// Resolve handler: prefer direct php file (e.g. admin-login.php),
// otherwise load directory index (e.g. sites/index.php) if present.

$directFile = __DIR__ . '/' . $endpoint . '.php';
$dirIndex = __DIR__ . '/' . $endpoint . '/index.php';

// Prefer folder index (newer CRUD handlers) over legacy single-file endpoints
if (file_exists($dirIndex)) {
    require_once $dirIndex;
    exit(0);
}

// Fallback to legacy single-file handler if present
if (file_exists($directFile)) {
    require_once $directFile;
    exit(0);
}

// Not found
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found or handler missing: ' . $endpoint]);
exit(0);
exit(0);
?>

