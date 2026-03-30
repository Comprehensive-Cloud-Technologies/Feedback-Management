<?php
/**
 * Database Migration Endpoint
 * Run migrations through the web interface
 * Access: http://localhost:8000/migrate.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load .env file
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

require_once __DIR__ . '/config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to connect to database']);
        exit;
    }

    $migrations = [];

    // Migration 1: Add logo column to branch_admins
    try {
        $result = $conn->query("DESCRIBE branch_admins");
        $columns = $result->fetchAll(PDO::FETCH_COLUMN, 0);
        
        if (!in_array('logo', $columns)) {
            $conn->exec("ALTER TABLE branch_admins ADD COLUMN logo LONGTEXT NULL AFTER password");
            $migrations[] = ['name' => 'add_logo_to_branch_admins', 'status' => 'success'];
        } else {
            $migrations[] = ['name' => 'add_logo_to_branch_admins', 'status' => 'skipped', 'reason' => 'Column already exists'];
        }
    } catch (Exception $e) {
        $migrations[] = ['name' => 'add_logo_to_branch_admins', 'status' => 'error', 'error' => $e->getMessage()];
    }

    // Verify all migrations
    $result = $conn->query("DESCRIBE branch_admins");
    $columns = $result->fetchAll(PDO::FETCH_COLUMN, 0);

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'All migrations completed',
        'migrations' => $migrations,
        'branch_admins_columns' => $columns
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
