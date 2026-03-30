<?php
/**
 * Admin Login Test - Direct POST test
 */

// Load environment
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

header('Content-Type: application/json');

// Test 1: Check if password in .env is correct
$adminPass = getenv('ADMIN_PASSWORD');

// Test 2: Simulate the login request
$testPassword = 'SuperAdmin@2835';

// Test 3: Check database connection
try {
    $pdo = new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME'),
        getenv('DB_USER'),
        getenv('DB_PASSWORD')
    );
    $dbStatus = 'Connected';
} catch (Exception $e) {
    $dbStatus = 'Failed: ' . $e->getMessage();
}

// Test 4: Check branch admins exist
try {
    $stmt = $pdo->query('SELECT id, username FROM branch_admins LIMIT 5');
    $branchAdmins = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $branchAdmins = [];
}

echo json_encode([
    'tests' => [
        'env_file' => file_exists(__DIR__ . '/.env') ? 'Found' : 'Not found',
        'admin_password_loaded' => !empty($adminPass) ? 'Yes' : 'No',
        'admin_password_matches' => $adminPass === $testPassword ? 'YES - CORRECT' : 'NO - MISMATCH',
        'database_connection' => $dbStatus,
        'branch_admins_found' => count($branchAdmins)
    ],
    'branch_admins' => $branchAdmins,
    'instructions' => 'To login as admin: use password: SuperAdmin@2835'
], JSON_PRETTY_PRINT);
?>
