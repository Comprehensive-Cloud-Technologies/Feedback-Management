<?php
/**
 * BYPASS AUTH TEST - Add branch without authentication
 * This bypasses all auth to test if database saving works
 */

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/init.php';
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    // GET: List all
    if ($method === 'GET') {
        $admins = Database::fetchAll(
            'SELECT id, site, username, created_at FROM branch_admins ORDER BY id DESC'
        );
        http_response_code(200);
        echo json_encode(['success' => true, 'count' => count($admins), 'data' => $admins]);
        exit;
    }
    
    // POST: Add new
    if ($method === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        // Validate
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON']);
            exit;
        }
        
        $site = $data['site'] ?? null;
        $username = $data['username'] ?? null;
        $password = $data['password'] ?? null;
        
        if (!$site || !$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing fields']);
            exit;
        }
        
        // Trim
        $site = trim($site);
        $username = trim($username);
        
        // Check empty
        if (strlen($site) < 1 || strlen($username) < 1 || strlen($password) < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Fields too short']);
            exit;
        }
        
        // Hash password
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert
        $result = Database::execute(
            'INSERT INTO branch_admins (site, username, password) VALUES (?, ?, ?)',
            [$site, $username, $hashed]
        );
        
        if (!$result) {
            http_response_code(500);
            echo json_encode(['error' => 'Insert failed']);
            exit;
        }
        
        $id = Database::lastInsertId();
        
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $id, 'site' => $site, 'username' => $username]);
        exit;
    }
    
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'class' => get_class($e),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}
?>
