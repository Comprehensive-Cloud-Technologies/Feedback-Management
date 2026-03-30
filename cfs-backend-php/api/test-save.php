<?php
/**
 * COMPLETE DATABASE TEST - Bypass auth to test save functionality
 * Run: https://feedback.catalystsolutions.eco/api/test-save.php
 */

header('Content-Type: application/json');

try {
    // Load init.php
    require_once __DIR__ . '/init.php';
    
    $test = [
        'init_loaded' => true,
        'database_class' => class_exists('Database') ? 'OK' : 'MISSING',
        'jwt_class' => class_exists('JWT') ? 'OK' : 'MISSING',
    ];
    
    // Test 1: Connect to database
    $test['db_connection'] = 'TESTING...';
    try {
        $result = Database::fetchOne('SELECT 1 as test');
        $test['db_connection'] = 'SUCCESS';
    } catch (Throwable $e) {
        $test['db_connection'] = 'FAILED: ' . $e->getMessage();
    }
    
    // Test 2: Check branch_admins table
    $test['branch_admins_check'] = 'TESTING...';
    try {
        $count = Database::fetchOne('SELECT COUNT(*) as cnt FROM branch_admins');
        $test['branch_admins_check'] = 'TABLE EXISTS, rows: ' . ($count['cnt'] ?? '0');
    } catch (Throwable $e) {
        $test['branch_admins_check'] = 'FAILED: ' . $e->getMessage();
    }
    
    // Test 3: Try to INSERT a test record (BYPASS AUTH)
    $test['insert_test'] = 'TESTING...';
    try {
        $testSite = 'TEST_SITE_' . time();
        $testUsername = 'test_user_' . time();
        $testPassword = password_hash('testpass123', PASSWORD_BCRYPT);
        
        $sql = "INSERT INTO branch_admins (site, username, password, created_at) VALUES (?, ?, ?, NOW())";
        $result = Database::execute($sql, [$testSite, $testUsername, $testPassword]);
        
        if ($result) {
            $lastId = Database::lastInsertId();
            $test['insert_test'] = "SUCCESS - Inserted ID: $lastId";
            $test['inserted_site'] = $testSite;
            $test['inserted_username'] = $testUsername;
        } else {
            $test['insert_test'] = 'FAILED: No result returned';
        }
    } catch (Throwable $e) {
        $test['insert_test'] = 'FAILED: ' . $e->getMessage();
    }
    
    // Test 4: Verify the record was inserted
    $test['verify_insert'] = 'TESTING...';
    try {
        $records = Database::fetchAll('SELECT * FROM branch_admins ORDER BY id DESC LIMIT 1');
        if (count($records) > 0) {
            $test['verify_insert'] = 'SUCCESS - Last record: ' . json_encode($records[0]);
        } else {
            $test['verify_insert'] = 'FAILED: No records found';
        }
    } catch (Throwable $e) {
        $test['verify_insert'] = 'FAILED: ' . $e->getMessage();
    }
    
    // Test 5: List all branch admins
    $test['list_all'] = 'TESTING...';
    try {
        $records = Database::fetchAll('SELECT id, site, username, created_at FROM branch_admins ORDER BY created_at DESC LIMIT 10');
        $test['list_all'] = 'SUCCESS - ' . count($records) . ' records found';
        $test['records'] = $records;
    } catch (Throwable $e) {
        $test['list_all'] = 'FAILED: ' . $e->getMessage();
    }
    
    echo json_encode($test, JSON_PRETTY_PRINT);
    
} catch (Throwable $e) {
    echo json_encode([
        'error' => 'FATAL: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}
?>
