#!/usr/bin/env php
<?php
/**
 * Database Setup Script - Cross-Platform (Windows & WSL)
 */

echo "\n╔════════════════════════════════════════════════════════╗\n";
echo "║  Canteen Feedback System - Database Setup             ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";

// Configuration
$db_host = 'localhost';
$db_name = 'canteen_feedback';
$db_user = 'feedback_user';
$db_password = 'feedback123';
$db_root_user = 'root';
$db_root_password = ''; // Try empty first

// Try different connection methods
$pdo = null;
$connection_methods = [
    ['host' => '127.0.0.1', 'password' => ''],
    ['host' => 'localhost', 'password' => ''],
];

echo "Step 1: Attempting to connect to MySQL Server...\n";

foreach ($connection_methods as $method) {
    try {
        echo "  - Trying {$method['host']}...\n";
        $pdo = new PDO(
            "mysql:host={$method['host']}",
            $db_root_user,
            $method['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        echo "✓ Connected successfully!\n\n";
        break;
    } catch (PDOException $e) {
        // Try next method
        continue;
    }
}

if (!$pdo) {
    echo "\n✗ Could not connect to MySQL\n";
    echo "\nℹ️  MySQL root password is set or MySQL is not running.\n";
    echo "\nPlease do one of the following:\n";
    echo "  1. Reset MySQL root password (google: 'reset mysql root password windows')\n";
    echo "  2. Use phpMyAdmin to manually run the setup-db.sql file\n";
    echo "  3. Provide the MySQL root password below:\n\n";
    
    // Try interactive mode
    fwrite(STDOUT, "Enter MySQL root password (press Enter for blank): ");
    $password = trim(fgets(STDIN));
    
    try {
        $pdo = new PDO(
            "mysql:host=localhost",
            'root',
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        echo "✓ Connected successfully!\n\n";
    } catch (PDOException $e) {
        echo "\n✗ Connection failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}

// Create database
echo "Step 2: Creating database '$db_name'...\n";
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database created/verified\n\n";
} catch (PDOException $e) {
    echo "✗ Failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Create user
echo "Step 3: Creating database user...\n";
try {
    $pdo->exec("CREATE USER IF NOT EXISTS '$db_user'@'localhost' IDENTIFIED BY '$db_password'");
    $pdo->exec("GRANT ALL PRIVILEGES ON `$db_name`.* TO '$db_user'@'localhost'");
    $pdo->exec("FLUSH PRIVILEGES");
    echo "✓ User created/verified\n\n";
} catch (PDOException $e) {
    // User might exist, that's OK
    echo "ⓘ User check completed\n\n";
}

// Create tables
echo "Step 4: Creating database tables...\n";
try {
    $pdo->exec("USE `$db_name`");
    
    $tables = [
        'users' => "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            username VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_site_username (site, username),
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'sites' => "CREATE TABLE IF NOT EXISTS sites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            location VARCHAR(100) NOT NULL,
            branch_location VARCHAR(150) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_location (location),
            INDEX idx_location (location)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'canteens' => "CREATE TABLE IF NOT EXISTS canteens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_site_canteen (site, name),
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'questions' => "CREATE TABLE IF NOT EXISTS questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            question_text VARCHAR(500) NOT NULL,
            emoji VARCHAR(10) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'branch_admins' => "CREATE TABLE IF NOT EXISTS branch_admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            username VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_site_branch_admin (site, username),
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'feedback' => "CREATE TABLE IF NOT EXISTS feedback (
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
    
    foreach ($tables as $name => $sql) {
        $pdo->exec($sql);
        echo "  ✓ $name table\n";
    }
    
    echo "\n✓ All tables created successfully\n\n";
} catch (PDOException $e) {
    echo "✗ Failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "╔════════════════════════════════════════════════════════╗\n";
echo "║  ✓ Database Setup Complete!                          ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";
echo "Database Configuration:\n";
echo "  Database: $db_name\n";
echo "  User: $db_user\n";
echo "  Password: $db_password\n";
echo "  Host: $db_host\n\n";
?>
