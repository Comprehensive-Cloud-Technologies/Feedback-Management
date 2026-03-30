<?php
/**
 * TEST: Add branch admin WITHOUT authentication
 * Run: https://feedback.catalystsolutions.eco/api/test-add-branch.php
 * 
 * POST with JSON:
 * {
 *   "site": "Mumbai Central",
 *   "username": "admin_mumbai", 
 *   "password": "testpass123"
 * }
 */

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/init.php';
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // List all
        $admins = Database::fetchAll('SELECT id, site, username, created_at FROM branch_admins ORDER BY id DESC');
        http_response_code(200);
        echo json_encode(['count' => count($admins), 'admins' => $admins]);
        exit(0);
    }
    
    if ($method === 'POST') {
        // Add new
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data || !isset($data['site']) || !isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Need: site, username, password']);
            exit(0);
        }
        
        $site = trim($data['site']);
        $username = trim($data['username']);
        $password = $data['password'];
        
        if (strlen($site) < 1 || strlen($username) < 1 || strlen($password) < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Fields cannot be empty']);
            exit(0);
        }
        
        // Check duplicate
        $existing = Database::fetchOne(
            'SELECT id FROM branch_admins WHERE site = ? AND username = ?',
            [$site, $username]
        );
        
        if ($existing) {
            http_response_code(409);
            echo json_encode(['error' => 'Already exists']);
            exit(0);
        }
        
        // Insert
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $success = Database::execute(
            'INSERT INTO branch_admins (site, username, password) VALUES (?, ?, ?)',
            [$site, $username, $hashed]
        );
        
        if (!$success) {
            http_response_code(500);
            echo json_encode(['error' => 'Insert failed']);
            exit(0);
        }
        
        $id = Database::lastInsertId();
        
        // Verify it was inserted
        $record = Database::fetchOne('SELECT * FROM branch_admins WHERE id = ?', [$id]);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'id' => $id,
            'record' => $record
        ]);
        exit(0);
    }
    
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}
?>
