<?php
/**
 * Branch Admins Handler - DEBUG VERSION (no auth required)
 * For testing purposes only
 */

try {
    require_once __DIR__ . '/../init.php';
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        handleGet();
    } elseif ($method === 'POST') {
        handlePost();
    } else {
        Response::error('Method not allowed', 405);
    }
    
} catch (Throwable $e) {
    error_log("Branch-admins debug error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
    exit(0);
}

function handleGet() {
    try {
        $admins = Database::fetchAll(
            'SELECT id, site, username, created_at FROM branch_admins ORDER BY site, username'
        );

        if (!is_array($admins)) {
            $admins = [];
        }

        Response::success(['branch_admins' => $admins]);
    } catch (Throwable $e) {
        error_log("GET error: " . $e->getMessage());
        Response::error('Failed to fetch: ' . $e->getMessage(), 500);
    }
}

function handlePost() {
    try {
        $data = Response::getBody();

        if (!isset($data['site']) || !isset($data['username']) || !isset($data['password'])) {
            Response::error('Missing: site, username, password', 400);
        }

        $site = trim($data['site']);
        $username = trim($data['username']);
        $password = $data['password'];

        if (strlen($site) < 2 || strlen($username) < 2 || strlen($password) < 5) {
            Response::error('Fields too short', 400);
        }

        // Check duplicate
        $existing = Database::fetchOne(
            'SELECT id FROM branch_admins WHERE site = ? AND username = ?',
            [$site, $username]
        );

        if ($existing) {
            Response::error('Already exists', 409);
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        // Insert
        $sql = 'INSERT INTO branch_admins (site, username, password, created_at) VALUES (?, ?, ?, NOW())';
        $success = Database::execute($sql, [$site, $username, $hashedPassword]);

        if (!$success) {
            Response::error('Insert failed', 500);
        }

        $id = Database::lastInsertId();
        Response::success(['id' => $id, 'message' => 'Created'], 201);

    } catch (Throwable $e) {
        error_log("POST error: " . $e->getMessage());
        Response::error('Failed to create: ' . $e->getMessage(), 500);
    }
}
?>
