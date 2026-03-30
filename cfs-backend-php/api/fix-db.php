<?php
/**
 * Emergency Database Fix Script
 * Fixes missing branch_location column in sites table
 * Run this from browser: https://feedback.catalystsolutions.eco/api/fix-db.php
 */

try {
    // Load .env from parent directory
    $envFile = __DIR__ . '/.env';
    if (!file_exists($envFile)) {
        die(json_encode(['error' => '.env file not found at ' . $envFile]));
    }

    // Load environment variables
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

    // Connect to database
    $host = getenv('DB_HOST') ?: 'localhost';
    $db_name = getenv('DB_NAME') ?: 'u727010312_feedback';
    $username = getenv('DB_USER') ?: 'u727010312_radmin';
    $password = getenv('DB_PASSWORD') ?: '';

    $conn = new PDO(
        "mysql:host=$host;dbname=$db_name;charset=utf8mb4",
        $username,
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Check if branch_location column exists
    $result = $conn->query("SHOW COLUMNS FROM sites LIKE 'branch_location'");
    if ($result->rowCount() > 0) {
        die(json_encode(['success' => true, 'message' => 'Column branch_location already exists']));
    }

    // Add the missing column
    $conn->exec("ALTER TABLE sites ADD COLUMN branch_location VARCHAR(150) NOT NULL DEFAULT 'Main Branch' AFTER location");

    echo json_encode([
        'success' => true,
        'message' => 'Successfully added branch_location column to sites table'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
