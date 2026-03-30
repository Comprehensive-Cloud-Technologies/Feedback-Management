<?php
/**
 * DATABASE DIAGNOSTIC - Find the EXACT error
 */

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/init.php';
    
    $diag = ['status' => 'CHECKING'];
    
    // Check 1: Database class
    $diag['database_class_exists'] = class_exists('Database') ? 'YES' : 'NO';
    
    // Check 2: Try connection
    $diag['connection_test'] = 'TESTING...';
    try {
        $result = Database::fetchOne('SELECT 1 as test');
        $diag['connection_test'] = $result ? 'SUCCESS' : 'FAILED - returned null';
    } catch (Exception $e) {
        $diag['connection_test'] = 'ERROR: ' . $e->getMessage();
    }
    
    // Check 3: Count current rows
    $diag['current_row_count'] = 'TESTING...';
    try {
        $count = Database::fetchOne('SELECT COUNT(*) as cnt FROM branch_admins');
        $diag['current_row_count'] = $count['cnt'] ?? 'NULL';
    } catch (Exception $e) {
        $diag['current_row_count'] = 'ERROR: ' . $e->getMessage();
    }
    
    // Check 4: Try INSERT with full error details
    $diag['insert_test'] = 'TESTING...';
    $diag['insert_details'] = [];
    
    try {
        $testSite = 'DIAG_' . time();
        $testUser = 'user_' . time();
        $testPass = password_hash('test123', PASSWORD_BCRYPT);
        
        $diag['insert_details']['site'] = $testSite;
        $diag['insert_details']['username'] = $testUser;
        $diag['insert_details']['password_hash_length'] = strlen($testPass);
        
        $sql = 'INSERT INTO branch_admins (site, username, password) VALUES (?, ?, ?)';
        $diag['insert_details']['sql'] = $sql;
        
        $result = Database::execute($sql, [$testSite, $testUser, $testPass]);
        
        $diag['insert_details']['execute_returned'] = $result ? 'TRUE' : 'FALSE';
        
        if ($result) {
            $id = Database::lastInsertId();
            $diag['insert_details']['last_insert_id'] = $id;
            $diag['insert_test'] = 'SUCCESS - ID: ' . $id;
            
            // Verify it exists
            $verify = Database::fetchOne('SELECT * FROM branch_admins WHERE id = ?', [$id]);
            $diag['insert_details']['verify_query'] = $verify ? 'FOUND' : 'NOT FOUND';
            
        } else {
            $diag['insert_test'] = 'FAILED - execute returned false';
        }
        
    } catch (Exception $e) {
        $diag['insert_test'] = 'ERROR: ' . $e->getMessage();
        $diag['insert_details']['error_class'] = get_class($e);
        $diag['insert_details']['error_code'] = $e->getCode();
    }
    
    // Check 5: Try raw PDO
    $diag['raw_pdo_test'] = 'TESTING...';
    try {
        // This is a hack to test if we can access PDO directly
        $diag['raw_pdo_test'] = 'Skipped - Database class is abstracted';
    } catch (Exception $e) {
        $diag['raw_pdo_test'] = 'ERROR: ' . $e->getMessage();
    }
    
    // Check 6: Check if table structure is correct
    $diag['table_structure'] = 'CHECKING...';
    try {
        $columns = Database::fetchAll('DESC branch_admins');
        $columnNames = array_map(fn($col) => $col['Field'], $columns);
        $diag['table_structure'] = implode(', ', $columnNames);
    } catch (Exception $e) {
        $diag['table_structure'] = 'ERROR: ' . $e->getMessage();
    }
    
    $diag['status'] = 'COMPLETE';
    http_response_code(200);
    echo json_encode($diag, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
