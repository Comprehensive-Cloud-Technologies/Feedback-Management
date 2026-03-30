#!/usr/bin/env php
<?php
/**
 * Simple PHP Server Bootstrap
 * This runs the PHP built-in server for local development
 * Run: php run-server.php
 */

$port = 8000;
$host = '127.0.0.1';

echo "\n╔════════════════════════════════════════════════════════╗\n";
echo "║  Canteen Feedback System - Development Server         ║\n";
echo "╚════════════════════════════════════════════════════════╝\n\n";

// Change to backend directory
chdir(__DIR__ . '/cfs-backend-php');

echo "Starting PHP Development Server...\n";
echo "Server: http://localhost:$port\n";
echo "Press Ctrl+C to stop\n\n";

// Start built-in server with dev config
passthru("php -c php-dev.ini -S $host:$port");
?>
