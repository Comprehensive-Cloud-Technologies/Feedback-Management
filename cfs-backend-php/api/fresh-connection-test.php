<?php
header('Content-Type: application/json');

$test_results = [];

// Test 1: Simple MySQLi connection
$test_results['test_1_mysqli'] = null;
try {
    $mysqli = new mysqli('127.0.0.1', 'feedback_user', 'feedback123', 'canteen_feedback', 3306);
    if ($mysqli->connect_error) {
        $test_results['test_1_mysqli'] = 'FAILED: ' . $mysqli->connect_error;
    } else {
        $result = $mysqli->query("SELECT COUNT(*) as count FROM sites");
        $row = $result->fetch_assoc();
        $test_results['test_1_mysqli'] = 'SUCCESS - Sites count: ' . $row['count'];
        $mysqli->close();
    }
} catch (Exception $e) {
    $test_results['test_1_mysqli'] = 'ERROR: ' . $e->getMessage();
}

// Test 2: Simple PDO connection with 127.0.0.1
$test_results['test_2_pdo_127'] = null;
try {
    $pdo = new PDO(
        'mysql:host=127.0.0.1;port=3306;dbname=canteen_feedback;charset=utf8mb4',
        'feedback_user',
        'feedback123',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sites");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $test_results['test_2_pdo_127'] = 'SUCCESS - Sites count: ' . $row['count'];
} catch (PDOException $e) {
    $test_results['test_2_pdo_127'] = 'FAILED: ' . $e->getMessage();
}

// Test 3: Load env and test with env values
$test_results['test_3_with_env'] = null;
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

try {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $db = getenv('DB_NAME') ?: 'canteen_feedback';
    $user = getenv('DB_USER') ?: 'feedback_user';
    $pass = getenv('DB_PASSWORD') ?: 'feedback123';
    
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sites");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $test_results['test_3_with_env'] = 'SUCCESS - Sites count: ' . $row['count'];
    $test_results['env_values'] = [
        'host' => $host,
        'port' => $port,
        'database' => $db
    ];
} catch (PDOException $e) {
    $test_results['test_3_with_env'] = 'FAILED: ' . $e->getMessage();
}

echo json_encode($test_results, JSON_PRETTY_PRINT);
?>
