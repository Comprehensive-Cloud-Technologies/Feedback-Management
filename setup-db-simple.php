#!/usr/bin/env php
<?php
/**
 * Simple Database Setup Script for Canteen Feedback System
 * Run: php setup-db-simple.php
 */

echo "\n╔════════════════════════════════════════════════════════╗\n";
echo "║  Canteen Feedback System - Database Setup             ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";

// Configuration
$db_name = 'canteen_feedback';
$db_user = 'feedback_user';
$db_password = 'feedback123';
$db_host = 'localhost';

// Try to connect as root (no password)
try {
    echo "Step 1: Connecting to MySQL...\n";
    $pdo = new PDO(
        "mysql:host=$db_host",
        'root',
        '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✓ Connected!\n\n";
} catch (Exception $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    echo "\nPlease try:\n";
    echo "  1. Use METHOD 1 (MySQL Command Line)\n";
    echo "  2. Use METHOD 2 (MySQL Workbench)\n";
    exit(1);
}

// Create database
echo "Step 2: Creating database '$db_name'...\n";
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database created!\n\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Create user
echo "Step 3: Creating user '$db_user'...\n";
try {
    $pdo->exec("CREATE USER IF NOT EXISTS '$db_user'@'$db_host' IDENTIFIED BY '$db_password'");
    $pdo->exec("GRANT ALL PRIVILEGES ON `$db_name`.* TO '$db_user'@'$db_host'");
    $pdo->exec("FLUSH PRIVILEGES");
    echo "✓ User created!\n\n";
} catch (Exception $e) {
    echo "ⓘ User might already exist (OK)\n\n";
}

// Create tables
echo "Step 4: Creating tables...\n";
try {
    $pdo->exec("USE `$db_name`");
    
    // Read and execute schema
    $schema_file = __DIR__ . '/setup-db.sql';
    if (file_exists($schema_file)) {
        $sql = file_get_contents($schema_file);
        // Split by semicolon and execute each statement
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $statement) {
            if (!empty($statement) && strpos($statement, '--') !== 0) {
                $pdo->exec($statement);
            }
        }
        echo "✓ All tables created!\n\n";
    } else {
        // Create tables manually
        $tables = [
            "CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                site VARCHAR(100) NOT NULL,
                username VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_site_username (site, username),
                INDEX idx_site (site)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS sites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                location VARCHAR(100) NOT NULL,
                branch_location VARCHAR(150) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_location (location),
                INDEX idx_location (location)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS canteens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                site VARCHAR(100) NOT NULL,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_site_canteen (site, name),
                INDEX idx_site (site)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                site VARCHAR(100) NOT NULL,
                question_text VARCHAR(500) NOT NULL,
                emoji VARCHAR(10) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_site (site)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS branch_admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                site VARCHAR(100) NOT NULL,
                username VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_site_branch_admin (site, username),
                INDEX idx_site (site)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS feedback (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        ];
        
        foreach ($tables as $sql) {
            $pdo->exec($sql);
        }
        echo "✓ All tables created!\n\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "╔════════════════════════════════════════════════════════╗\n";
echo "║  ✓ Setup Complete!                                   ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";
echo "Database: $db_name\n";
echo "User: $db_user\n";
echo "Password: $db_password\n";
echo "Host: $db_host\n\n";
echo "Your app is ready at: http://localhost:5173\n\n";
?>
