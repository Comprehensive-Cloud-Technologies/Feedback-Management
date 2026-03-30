<?php
/**
 * Database Setup Script
 * This script creates the canteen_feedback database and all required tables
 */

// Load environment variables from .env
$envFile = __DIR__ . '/.env';
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

echo "╔════════════════════════════════════════════════════════╗\n";
echo "║  Canteen Feedback System - Database Setup             ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";

// Step 1: Connect to MySQL (without specifying database)
echo "Step 1: Connecting to MySQL Server...\n";
try {
    $pdo = new PDO(
        "mysql:host=$db_host",
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    echo "✓ Connected to MySQL\n\n";
} catch (PDOException $e) {
    echo "✗ Failed to connect: " . $e->getMessage() . "\n";
    echo "\nℹ️  Please ensure MySQL is running and no password is set for root user.\n";
    echo "If root has a password, please edit this script or use phpmyadmin to run setup-db.sql\n";
    exit(1);
}

// Step 2: Create database
echo "Step 2: Creating database '$db_name'...\n";
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database created/verified\n\n";
} catch (PDOException $e) {
    echo "✗ Failed to create database: " . $e->getMessage() . "\n";
    exit(1);
}

// Step 3: Create user
echo "Step 3: Creating database user...\n";
try {
    $pdo->exec("CREATE USER IF NOT EXISTS '$db_user'@'$db_host' IDENTIFIED BY '$db_password'");
    $pdo->exec("GRANT ALL PRIVILEGES ON `$db_name`.* TO '$db_user'@'$db_host'");
    $pdo->exec("FLUSH PRIVILEGES");
    echo "✓ User created/verified\n\n";
} catch (PDOException $e) {
    // User might already exist, continue
    echo "ⓘ User check completed\n\n";
}

// Step 4: Switch to new database and create tables
echo "Step 4: Creating database tables...\n";
try {
    $pdo->exec("USE `$db_name`");
    
    // Users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_site_username (site, username),
        INDEX idx_site (site)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "  ✓ users table\n";
    
    // Sites table
    $pdo->exec("CREATE TABLE IF NOT EXISTS sites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location VARCHAR(100) NOT NULL,
        branch_location VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_location (location),
        INDEX idx_location (location)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "  ✓ sites table\n";
    
    // Canteens table
    $pdo->exec("CREATE TABLE IF NOT EXISTS canteens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_site_canteen (site, name),
        INDEX idx_site (site)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "  ✓ canteens table\n";
    
    // Questions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site VARCHAR(100) NOT NULL,
        question_text VARCHAR(500) NOT NULL,
        emoji VARCHAR(10) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_site (site)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "  ✓ questions table\n";
    
    // Branch Admins table
    $pdo->exec("CREATE TABLE IF NOT EXISTS branch_admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_site_branch_admin (site, username),
        INDEX idx_site (site)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "  ✓ branch_admins table\n";
    
    // Feedback table
    $pdo->exec("CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        site VARCHAR(100) NOT NULL,
        canteen_id INT NOT NULL,
        rating DECIMAL(4,2) NOT NULL,
        username VARCHAR(100) DEFAULT NULL,
        responses JSON NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE,
        INDEX idx_site (site),
        INDEX idx_canteen (canteen_id),
        INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "  ✓ feedback table\n\n";
    
    echo "✓ All tables created successfully\n\n";
} catch (PDOException $e) {
    echo "✗ Failed to create tables: " . $e->getMessage() . "\n";
    exit(1);
}

// Step 5: Verify database
echo "Step 5: Verifying setup...\n";
try {
    $pdo->exec("USE `$db_name`");
    $result = $pdo->query("SHOW TABLES")->fetchAll();
    echo "✓ Database verification successful\n";
    echo "  Found " . count($result) . " tables\n\n";
} catch (PDOException $e) {
    echo "✗ Verification failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "╔════════════════════════════════════════════════════════╗\n";
echo "║  ✓ Database Setup Complete!                          ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";
echo "Database: $db_name\n";
echo "User: $db_user\n";
echo "Host: $db_host\n\n";
echo "You can now start the application:\n";
echo "  1. Backend: php -S localhost:8000\n";
echo "  2. Frontend: npm run dev\n";
?>
