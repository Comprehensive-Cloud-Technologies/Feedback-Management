<?php
/**
 * Debug Test - Shows actual errors
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json');

// Try to load .env from api folder
$envPath = __DIR__ . '/.env';

if (!file_exists($envPath)) {
    echo json_encode(['error' => '.env file not found at: ' . $envPath]);
    exit();
}

$lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$env = [];
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0) continue;
    if (strpos($line, '=') === false) continue;
    list($name, $value) = explode('=', $line, 2);
    $env[trim($name)] = trim($value);
}

// Test database connection
try {
    $host = $env['DB_HOST'] ?? 'localhost';
    $db = $env['DB_NAME'] ?? '';
    $user = $env['DB_USER'] ?? '';
    $pass = $env['DB_PASSWORD'] ?? '';
    
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Try to get sites
    $stmt = $pdo->query('SELECT * FROM sites LIMIT 1');
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connected successfully',
        'sites_count' => count($result),
        'sample' => $result
    ]);
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
}
?>
