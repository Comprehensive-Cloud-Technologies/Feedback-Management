#!/usr/bin/env php
<?php
/**
 * Database Connection Test
 * Run: php test-db-connection.php
 */

echo "\n╔════════════════════════════════════════════════════════╗\n";
echo "║  Testing Database Connection                         ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";

// Load .env
$envFile = __DIR__ . '/cfs-backend-php/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (empty($line) || strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!empty($name)) {
            putenv("$name=$value");
        }
    }
}

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'canteen_feedback';
$db_user = getenv('DB_USER') ?: 'feedback_user';
$db_password = getenv('DB_PASSWORD') ?: 'feedback123';

echo "Testing connection with:\n";
echo "  Host: $db_host\n";
echo "  Database: $db_name\n";
echo "  User: $db_user\n";
echo "  Password: " . (strlen($db_password) > 0 ? "***" : "(empty)") . "\n\n";

try {
    echo "Connecting to MySQL...\n";
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    echo "✅ Connected successfully!\n\n";
    
    // Test query
    echo "Testing query on branch_admins table...\n";
    $result = $pdo->query("SELECT COUNT(*) as count FROM branch_admins");
    $data = $result->fetch();
    echo "✅ Query successful! Found " . $data['count'] . " records\n\n";
    
    // List all tables
    echo "Available tables:\n";
    $result = $pdo->query("SHOW TABLES");
    $tables = $result->fetchAll();
    foreach ($tables as $table) {
        echo "  ✓ " . reset($table) . "\n";
    }
    
    echo "\n✅ All checks passed! Database is ready.\n\n";
    
} catch (PDOException $e) {
    echo "❌ Connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
