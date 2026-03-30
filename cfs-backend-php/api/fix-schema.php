<?php
/**
 * FIX DATABASE SCHEMA - Recreate branch_admins table with correct columns
 * Run: https://feedback.catalystsolutions.eco/api/fix-schema.php
 */

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/init.php';
    
    $result = [
        'status' => 'STARTING',
        'steps' => []
    ];
    
    // Step 1: Check current table structure
    $result['steps'][] = 'Step 1: Checking current table structure...';
    try {
        $columns = Database::fetchAll("DESC branch_admins");
        $columnNames = array_map(fn($col) => $col['Field'], $columns);
        $result['steps'][] = 'Current columns: ' . implode(', ', $columnNames);
    } catch (Throwable $e) {
        $result['steps'][] = 'Table check failed: ' . $e->getMessage();
    }
    
    // Step 2: Drop and recreate the table
    $result['steps'][] = 'Step 2: Dropping old table...';
    try {
        Database::query("DROP TABLE IF EXISTS branch_admins");
        $result['steps'][] = 'Old table dropped (if existed)';
    } catch (Throwable $e) {
        $result['steps'][] = 'Drop failed: ' . $e->getMessage();
    }
    
    // Step 3: Create correct table
    $result['steps'][] = 'Step 3: Creating new branch_admins table...';
    try {
        $sql = "CREATE TABLE branch_admins (
            id INT PRIMARY KEY AUTO_INCREMENT,
            site VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_site_username (site, username),
            INDEX idx_site (site),
            INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        Database::query($sql);
        $result['steps'][] = 'Table created successfully';
    } catch (Throwable $e) {
        $result['steps'][] = 'CREATE TABLE failed: ' . $e->getMessage();
        $result['status'] = 'FAILED';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit(0);
    }
    
    // Step 4: Verify table exists and has correct columns
    $result['steps'][] = 'Step 4: Verifying table structure...';
    try {
        $columns = Database::fetchAll("DESC branch_admins");
        $columnNames = array_map(fn($col) => $col['Field'], $columns);
        $result['steps'][] = 'New columns: ' . implode(', ', $columnNames);
        
        $requiredColumns = ['id', 'site', 'username', 'password', 'created_at'];
        $missing = array_diff($requiredColumns, $columnNames);
        
        if (empty($missing)) {
            $result['steps'][] = 'All required columns present ✓';
        } else {
            $result['steps'][] = 'Missing columns: ' . implode(', ', $missing);
            $result['status'] = 'FAILED';
            echo json_encode($result, JSON_PRETTY_PRINT);
            exit(0);
        }
    } catch (Throwable $e) {
        $result['steps'][] = 'Verification failed: ' . $e->getMessage();
        $result['status'] = 'FAILED';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit(0);
    }
    
    // Step 5: Test insert
    $result['steps'][] = 'Step 5: Testing INSERT...';
    try {
        $testSite = 'TEST_SITE_' . time();
        $testUsername = 'test_user_' . time();
        $testPassword = password_hash('testpass123', PASSWORD_BCRYPT);
        
        $sql = "INSERT INTO branch_admins (site, username, password) VALUES (?, ?, ?)";
        $success = Database::execute($sql, [$testSite, $testUsername, $testPassword]);
        
        if ($success) {
            $id = Database::lastInsertId();
            $result['steps'][] = "INSERT successful! Created ID: $id";
        } else {
            $result['steps'][] = 'INSERT returned false';
            $result['status'] = 'FAILED';
            echo json_encode($result, JSON_PRETTY_PRINT);
            exit(0);
        }
    } catch (Throwable $e) {
        $result['steps'][] = 'INSERT test failed: ' . $e->getMessage();
        $result['status'] = 'FAILED';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit(0);
    }
    
    // Step 6: Verify data exists
    $result['steps'][] = 'Step 6: Verifying data was saved...';
    try {
        $count = Database::fetchOne("SELECT COUNT(*) as cnt FROM branch_admins");
        $result['steps'][] = 'Total records in table: ' . $count['cnt'];
        
        $record = Database::fetchOne("SELECT id, site, username FROM branch_admins ORDER BY id DESC LIMIT 1");
        $result['steps'][] = 'Last record: ' . json_encode($record);
    } catch (Throwable $e) {
        $result['steps'][] = 'Verification query failed: ' . $e->getMessage();
    }
    
    $result['status'] = 'SUCCESS';
    $result['message'] = 'Database schema fixed! Table is ready for use.';
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Throwable $e) {
    echo json_encode([
        'status' => 'FATAL',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}
?>
