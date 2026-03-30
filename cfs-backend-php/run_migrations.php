<?php
/**
 * Migration Runner Script
 * Applies all pending database migrations
 */

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

echo "🔄 Starting database migrations...\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        die("❌ Failed to connect to database\n");
    }

    echo "✅ Connected to database\n\n";

    // Check and create logo column in branch_admins
    echo "Checking branch_admins table...\n";
    $result = $conn->query("DESCRIBE branch_admins");
    $columns = $result->fetchAll(PDO::FETCH_COLUMN, 0);
    
    if (in_array('logo', $columns)) {
        echo "✅ Logo column already exists\n\n";
    } else {
        echo "⏳ Adding logo column...\n";
        $conn->exec("ALTER TABLE branch_admins ADD COLUMN logo LONGTEXT NULL AFTER password");
        echo "✅ Logo column added successfully\n\n";
    }

    // Check schema version table exists
    $schemaCheckSql = "
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'branch_admins' 
        AND COLUMN_NAME = 'logo'
    ";
    
    $checkResult = $conn->query($schemaCheckSql);
    $logoExists = $checkResult->rowCount() > 0;
    
    if ($logoExists) {
        echo "✅ Verification: Logo column is properly configured\n\n";
    } else {
        echo "⚠️  Logo column verification failed\n\n";
    }

    // Display current branch_admins structure
    echo "Current branch_admins structure:\n";
    $describe = $conn->query("DESCRIBE branch_admins");
    while ($row = $describe->fetch(PDO::FETCH_ASSOC)) {
        echo "  - {$row['Field']}: {$row['Type']}\n";
    }

    echo "\n✅ All migrations completed successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
