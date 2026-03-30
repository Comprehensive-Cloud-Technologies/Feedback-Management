<?php
/**
 * TEST BRANCH-ADMINS ENDPOINT
 * Run: https://feedback.catalystsolutions.eco/api/test-branch-admins.php
 */

header('Content-Type: application/json');

$log = [];
$errors = [];

try {
    $log[] = "Starting test...";
    
    // Load init.php
    require_once __DIR__ . '/init.php';
    $log[] = "init.php loaded successfully";
    
    // Check if classes are available
    if (!class_exists('Database')) {
        throw new Exception("Database class not found");
    }
    $log[] = "Database class available";
    
    if (!class_exists('Auth')) {
        throw new Exception("Auth class not found");
    }
    $log[] = "Auth class available";
    
    if (!class_exists('Response')) {
        throw new Exception("Response class not found");
    }
    $log[] = "Response class available";
    
    if (!defined('JWT_SECRET')) {
        throw new Exception("JWT_SECRET not defined");
    }
    $log[] = "JWT_SECRET defined: " . substr(JWT_SECRET, 0, 10) . "...";
    
    // Test 1: GET without token (should fail gracefully)
    $log[] = "Test 1: Testing GET /api/branch-admins without token...";
    
    // Simulate the GET request
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['HTTP_AUTHORIZATION'] = ''; // No token
    
    // Try to call Auth::required() like the handler does
    try {
        Auth::required();
        $log[] = "Auth::required() passed (shouldn't happen without token)";
    } catch (Throwable $e) {
        $log[] = "Auth::required() threw error (expected): " . $e->getMessage();
    }
    
    // Test 2: Try to fetch branch admins from DB directly
    $log[] = "Test 2: Fetching branch_admins from database directly...";
    try {
        $result = Database::fetchAll("SELECT * FROM branch_admins ORDER BY site ASC");
        $log[] = "Successfully fetched " . count($result) . " branch_admins";
    } catch (Throwable $e) {
        $errors[] = "Database query failed: " . $e->getMessage();
    }
    
    // Test 3: Check if branch-admins/index.php exists and can be read
    $log[] = "Test 3: Checking branch-admins/index.php...";
    $handlerPath = __DIR__ . '/branch-admins/index.php';
    if (!file_exists($handlerPath)) {
        $errors[] = "branch-admins/index.php does not exist at $handlerPath";
    } else {
        $log[] = "branch-admins/index.php exists";
        
        // Check if it has syntax errors
        $code = file_get_contents($handlerPath);
        if (strpos($code, 'Auth::required()') === false) {
            $errors[] = "Auth::required() not found in branch-admins/index.php";
        } else {
            $log[] = "Auth::required() found in handler";
        }
    }
    
    // Test 4: Check getallheaders() function
    $log[] = "Test 4: Checking getallheaders() availability...";
    if (function_exists('getallheaders')) {
        $log[] = "getallheaders() is available";
        $headers = getallheaders();
        $log[] = "Available headers: " . implode(', ', array_keys($headers));
    } else {
        $log[] = "getallheaders() NOT available, using $_SERVER fallback";
        $log[] = "HTTP_AUTHORIZATION: " . ($_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET');
    }
    
} catch (Throwable $e) {
    $errors[] = "FATAL ERROR: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine();
}

echo json_encode([
    'status' => empty($errors) ? 'OK' : 'ERROR',
    'log' => $log,
    'errors' => $errors,
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
?>
