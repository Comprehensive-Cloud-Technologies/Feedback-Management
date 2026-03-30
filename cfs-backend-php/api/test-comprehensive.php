<?php
/**
 * COMPREHENSIVE TEST - Log everything
 * Test: https://feedback.catalystsolutions.eco/api/test-comprehensive.php
 */

header('Content-Type: application/json');

$log = [
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'headers_received' => [],
    'body_received' => '',
    'test_steps' => []
];

// Log all headers
foreach (getallheaders() as $name => $value) {
    $log['headers_received'][$name] = substr($value, 0, 50);
}

try {
    require_once __DIR__ . '/init.php';
    
    $log['test_steps'][] = 'init.php loaded';
    
    $method = $_SERVER['REQUEST_METHOD'];
    $log['test_steps'][] = "Method: $method";
    
    if ($method === 'POST') {
        $input = file_get_contents('php://input');
        $log['body_received'] = substr($input, 0, 200);
        $log['test_steps'][] = 'Got input from php://input';
        
        $data = json_decode($input, true);
        $log['test_steps'][] = 'Decoded JSON: ' . json_encode($data);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'No JSON data', 'log' => $log], JSON_PRETTY_PRINT);
            exit;
        }
        
        $site = $data['site'] ?? null;
        $username = $data['username'] ?? null;
        $password = $data['password'] ?? null;
        
        $log['test_steps'][] = "Site: $site, Username: $username, Password: " . (strlen($password ?? '') > 0 ? 'YES' : 'NO');
        
        if (!$site || !$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing fields', 'log' => $log], JSON_PRETTY_PRINT);
            exit;
        }
        
        $site = trim($site);
        $username = trim($username);
        
        $log['test_steps'][] = "Trimmed: Site=$site, Username=$username";
        
        // Try insert
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $log['test_steps'][] = 'Password hashed, length: ' . strlen($hashed);
        
        $sql = 'INSERT INTO branch_admins (site, username, password) VALUES (?, ?, ?)';
        $log['test_steps'][] = 'SQL: ' . $sql;
        
        $result = Database::execute($sql, [$site, $username, $hashed]);
        $log['test_steps'][] = 'Execute result: ' . ($result ? 'TRUE' : 'FALSE');
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Execute failed', 'log' => $log], JSON_PRETTY_PRINT);
            exit;
        }
        
        $id = Database::lastInsertId();
        $log['test_steps'][] = "New ID: $id";
        
        // Verify
        $verify = Database::fetchOne('SELECT * FROM branch_admins WHERE id = ?', [$id]);
        $log['test_steps'][] = 'Verify: ' . ($verify ? 'FOUND' : 'NOT FOUND');
        
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $id, 'log' => $log, 'verify' => $verify], JSON_PRETTY_PRINT);
        exit;
    }
    
    if ($method === 'GET') {
        $log['test_steps'][] = 'GET request received';
        $admins = Database::fetchAll('SELECT id, site, username, created_at FROM branch_admins ORDER BY id DESC LIMIT 5');
        $log['test_steps'][] = 'Fetched ' . count($admins) . ' records';
        
        http_response_code(200);
        echo json_encode(['success' => true, 'count' => count($admins), 'data' => $admins, 'log' => $log], JSON_PRETTY_PRINT);
        exit;
    }
    
} catch (Throwable $e) {
    $log['test_steps'][] = 'EXCEPTION: ' . $e->getMessage();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'log' => $log], JSON_PRETTY_PRINT);
}
?>
