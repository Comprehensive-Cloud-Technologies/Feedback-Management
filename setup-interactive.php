#!/usr/bin/env php
<?php
/**
 * Interactive Database Setup Script
 * Run: php setup-db-interactive.php
 */

echo "\n╔════════════════════════════════════════════════════════╗\n";
echo "║  Canteen Feedback System - Database Setup             ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";

// Get MySQL root password from user
echo "Please enter your MySQL root password: ";
$password = trim(fgets(STDIN));

// Configuration
$db_name = 'canteen_feedback';
$db_user = 'feedback_user';
$db_password = 'feedback123';
$db_host = 'localhost';

// Try to connect as root with provided password
try {
    echo "\n➤ Connecting to MySQL...\n";
    $pdo = new PDO(
        "mysql:host=$db_host",
        'root',
        $password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✓ Connected!\n\n";
} catch (Exception $e) {
    echo "\n✗ Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Create database
echo "➤ Creating database '$db_name'...\n";
try {
    $pdo->exec("DROP DATABASE IF EXISTS `$db_name`");
    $pdo->exec("CREATE DATABASE `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database created!\n\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Create user
echo "➤ Creating user '$db_user'...\n";
try {
    $pdo->exec("DROP USER IF EXISTS '$db_user'@'$db_host'");
    $pdo->exec("CREATE USER '$db_user'@'$db_host' IDENTIFIED BY '$db_password'");
    $pdo->exec("GRANT ALL PRIVILEGES ON `$db_name`.* TO '$db_user'@'$db_host'");
    $pdo->exec("FLUSH PRIVILEGES");
    echo "✓ User created!\n\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Create tables
echo "➤ Creating tables...\n";
try {
    $pdo->exec("USE `$db_name`");
    
    $tables = [
        'users' => "CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            username VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_site_username (site, username),
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'sites' => "CREATE TABLE sites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            location VARCHAR(100) NOT NULL,
            branch_location VARCHAR(150) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_location (location),
            INDEX idx_location (location)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'canteens' => "CREATE TABLE canteens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_site_canteen (site, name),
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'questions' => "CREATE TABLE questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            question_text VARCHAR(500) NOT NULL,
            emoji VARCHAR(10) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'branch_admins' => "CREATE TABLE branch_admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            site VARCHAR(100) NOT NULL,
            username VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_site_branch_admin (site, username),
            INDEX idx_site (site)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        
        'feedback' => "CREATE TABLE feedback (
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
        echo "  ✓ $name\n";
    }
    
    echo "\n✓ All tables created!\n\n";
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
