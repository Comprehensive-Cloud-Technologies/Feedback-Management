<?php
header('Content-Type: application/json');

// Load environment variables from .env
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

$result = [
    'host' => getenv('DB_HOST'),
    'port' => getenv('DB_PORT'),
    'database' => getenv('DB_NAME'),
    'user' => getenv('DB_USER'),
    'message' => 'Testing PDO connection with port...'
];

try {
    $dsn = "mysql:host=" . getenv('DB_HOST') . ";port=" . getenv('DB_PORT') . ";dbname=" . getenv('DB_NAME') . ";charset=utf8mb4";
    $conn = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASSWORD'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    $stmt = $conn->query("SELECT COUNT(*) as count FROM sites");
    $sites_count = $stmt->fetch()['count'];
    
    $result['status'] = 'SUCCESS';
    $result['sites_count'] = $sites_count;
    $result['dsn_used'] = $dsn;
    
} catch (PDOException $e) {
    $result['status'] = 'FAILED';
    $result['error'] = $e->getMessage();
    $result['dsn_attempted'] = "mysql:host=" . getenv('DB_HOST') . ";port=" . getenv('DB_PORT') . ";dbname=" . getenv('DB_NAME') . ";charset=utf8mb4";
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>
