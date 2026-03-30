<?php
/**
 * Initialization wrapper for all API handlers
 * Ensures proper .env loading and constants definition before any handler logic
 */

try {
    // 1. Load .env first (CRITICAL - search current and parent directory)
    $envFile = file_exists(__DIR__ . '/.env') ? __DIR__ . '/.env' : (file_exists(__DIR__ . '/../.env') ? __DIR__ . '/../.env' : null);

    if ($envFile) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0)
                continue;
            if (strpos($line, '=') === false)
                continue;

            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // Priority: putenv and matching $_ENV/$_SERVER
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }

    // 2. Set CORS headers immediately
    // Only process CORS if HTTP server (has REQUEST_METHOD defined)
    if (isset($_SERVER['REQUEST_METHOD'])) {
        if (isset($_SERVER['HTTP_ORIGIN'])) {
            header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
            header('Access-Control-Allow-Credentials: true');
        } else {
            header('Access-Control-Allow-Origin: *');
        }
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 86400');
    }
    header('Content-Type: application/json; charset=utf-8');

    // 3. Handle OPTIONS preflight
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        // For preflight, echo back the requested headers
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        } else {
            // Fallback: provide comprehensive list
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, x-token, X-Token, Cache-Control');
        }
        http_response_code(200);
        exit(0);
    }
    // For non-preflight requests, also set the headers (only if HTTP server)
    if (isset($_SERVER['REQUEST_METHOD']) && isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    } elseif (isset($_SERVER['REQUEST_METHOD'])) {
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, x-token, X-Token, Cache-Control');
    }

    // 4. Load required files in correct order
    // NOTE: On server, config/ and utils/ are INSIDE api/ folder
    // On local, they're outside - this file must work with SERVER structure

    // Class redefinition protection for nested uploads
    if (!class_exists('Database')) {
        require_once __DIR__ . '/config/database.php';
    }
    if (!defined('RATINGS')) {
        require_once __DIR__ . '/config/constants.php';
    }
    if (!class_exists('JWT')) {
        require_once __DIR__ . '/utils/jwt.php';
    }
    if (!class_exists('Auth')) {
        require_once __DIR__ . '/utils/auth.php';
    }
    if (!class_exists('Response')) {
        require_once __DIR__ . '/utils/response.php';
    }

    // 5. Verify critical constants are defined
    if (!defined('JWT_SECRET')) {
        http_response_code(500);
        echo json_encode(['error' => 'Server configuration error: JWT_SECRET not set']);
        exit(0);
    }

    if (!defined('ERROR_MESSAGES')) {
        http_response_code(500);
        echo json_encode(['error' => 'Server configuration error: ERROR_MESSAGES not defined']);
        exit(0);
    }

} catch (Throwable $e) {
    http_response_code(500);
    error_log("Init error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    echo json_encode(['error' => 'Server initialization error: ' . $e->getMessage()]);
    exit(0);
}
?>