<?php
/**
 * Database Setup Script
 * Run this once to create tables and seed initial data
 */

// Load .env file manually
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0)
            continue;
        if (strpos($line, '=') === false)
            continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/auth.php';

echo "Starting database setup...\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();

    if (!$conn) {
        die("Failed to connect to database\n");
    }

    echo "Connected to database successfully\n";

    // Read and execute schema
    echo "Creating tables...\n";
    $schema = file_get_contents(__DIR__ . '/schema.sql');

    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $schema)));

    foreach ($statements as $statement) {
        if (!empty($statement) && !preg_match('/^(--|CREATE DATABASE|USE)/i', $statement)) {
            try {
                $conn->exec($statement);
            } catch (PDOException $e) {
                echo "Warning: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "Tables created successfully\n\n";

    // Seed sample sites
    echo "Seeding sample sites...\n";
    $sites = [
        ['Mumbai Central', 'Mumbai Central Location'],
        ['Delhi NCR', 'Delhi NCR Location'],
        ['Bangalore Tech Park', 'Bangalore Tech Park Location'],
        ['Pune Office', 'Pune Office Location'],
        ['Chennai Branch', 'Chennai Branch Location'],
    ];

    foreach ($sites as $site) {
        try {
            Database::execute(
                'INSERT INTO sites (location, branch_location) VALUES (?, ?) ON DUPLICATE KEY UPDATE location=location',
                $site
            );
            echo "  - Created site: {$site[0]}\n";
        } catch (Exception $e) {
            echo "  - Site already exists: {$site[0]}\n";
        }
    }

    // Seed branch admins
    echo "\nSeeding branch admins...\n";
    foreach (SAMPLE_BRANCH_ADMINS as $admin) {
        try {
            $hashedPassword = Auth::hashPassword($admin['password']);
            Database::execute(
                'INSERT INTO branch_admins (site, username, password) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE username=username',
                [$admin['site'], $admin['username'], $hashedPassword]
            );
            echo "  - Created admin: {$admin['username']} for {$admin['site']}\n";
        } catch (Exception $e) {
            echo "  - Admin already exists: {$admin['username']}\n";
        }
    }

    // Seed default questions for each site
    echo "\nSeeding default questions...\n";
    $allSites = Database::fetchAll('SELECT location FROM sites');

    foreach ($allSites as $siteRow) {
        $siteName = $siteRow['location'];

        foreach (DEFAULT_QUESTIONS as $question) {
            try {
                Database::execute(
                    'INSERT INTO questions (site, question_text, emoji) VALUES (?, ?, ?)',
                    [$siteName, $question['text'], $question['emoji']]
                );
            } catch (Exception $e) {
                // Question might already exist, skip
            }
        }
        echo "  - Created questions for: {$siteName}\n";
    }

    // Seed sample canteens
    echo "\nSeeding sample canteens...\n";
    $canteens = [
        ['Mumbai Central', 'Main Cafeteria'],
        ['Mumbai Central', 'Quick Bites'],
        ['Delhi NCR', 'North Wing Canteen'],
        ['Delhi NCR', 'South Wing Canteen'],
        ['Bangalore Tech Park', 'Tech Cafe'],
        ['Pune Office', 'Pune Canteen'],
        ['Chennai Branch', 'Chennai Mess'],
    ];

    foreach ($canteens as $canteen) {
        try {
            Database::execute(
                'INSERT INTO canteens (site, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
                $canteen
            );
            echo "  - Created canteen: {$canteen[1]} at {$canteen[0]}\n";
        } catch (Exception $e) {
            echo "  - Canteen already exists: {$canteen[1]}\n";
        }
    }

    echo "\n✅ Database setup completed successfully!\n";
    echo "\nSample Branch Admin Credentials:\n";
    echo "================================\n";
    foreach (SAMPLE_BRANCH_ADMINS as $admin) {
        echo "Site: {$admin['site']}\n";
        echo "Username: {$admin['username']}\n";
        echo "Password: {$admin['password']}\n\n";
    }

} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
