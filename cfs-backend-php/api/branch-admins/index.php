<?php
/**
 * Branch Admins API - Simple CRUD
 * NO AUTHENTICATION - Full public access for testing
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once __DIR__ . '/../init.php';
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            $query = $_GET;
            $site = isset($query['site']) ? trim($query['site']) : null;
            
            $selectFields = 'id, site, username, created_at';
            if (hasColumnSoft('branch_admins', 'logo')) {
                $selectFields .= ', logo';
            }
            
            if ($site) {
                $admins = Database::fetchAll(
                    "SELECT $selectFields FROM branch_admins WHERE site = ? ORDER BY username",
                    [$site]
                );
            } else {
                $admins = Database::fetchAll(
                    "SELECT $selectFields FROM branch_admins ORDER BY site, username"
                );
            }
            http_response_code(200);
            echo json_encode(['branch_admins' => $admins ?: []]);
            break;
        
        case 'PUT':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['site']) || !isset($data['logo'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing fields']);
                exit;
            }
            
            $site = trim($data['site']);
            $logo = $data['logo'];
            
            // Ensure logo column exists - auto-migrate if needed
            try {
                if (!hasColumnSoft('branch_admins', 'logo')) {
                    // Try to add the column dynamically
                    try {
                        $db = Database::getInstance();
                        $conn = $db->getConnection();
                        $conn->exec("ALTER TABLE branch_admins ADD COLUMN logo LONGTEXT NULL AFTER password");
                        error_log("Logo column added automatically");
                    } catch (Exception $e) {
                        error_log("Could not auto-add logo column: " . $e->getMessage());
                    }
                }
                
                // Check again after potential auto-migration
                if (hasColumnSoft('branch_admins', 'logo')) {
                    if (hasColumnSoft('branch_admins', 'branch_name')) {
                        Database::execute(
                            'UPDATE branch_admins SET logo = ? WHERE site = ? OR branch_name = ?',
                            [$logo, $site, $site]
                        );
                    } else {
                        Database::execute(
                            'UPDATE branch_admins SET logo = ? WHERE site = ?',
                            [$logo, $site]
                        );
                    }
                    http_response_code(200);
                    echo json_encode(['success' => true]);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Logo feature not available - please contact administrator']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error updating logo: ' . $e->getMessage()]);
            }
            break;
            
        case 'POST':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['site']) || !isset($data['username']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing fields']);
                exit;
            }
            
            $site = trim($data['site']);
            $username = trim($data['username']);
            $password = $data['password'];
            
            if (strlen($site) < 1 || strlen($username) < 1 || strlen($password) < 1) {
                http_response_code(400);
                echo json_encode(['error' => 'Empty fields']);
                exit;
            }
            
            $hashed = password_hash($password, PASSWORD_BCRYPT);
            $cols = ['site', 'username', 'password'];
            $vals = [$site, $username, $hashed];
            if (hasColumnSoft('branch_admins', 'branch_name')) {
                $cols[] = 'branch_name';
                $vals[] = $site;
            }
            $ph = implode(',', array_fill(0, count($cols), '?'));
            $success = Database::execute(
                'INSERT INTO branch_admins (' . implode(',', $cols) . ') VALUES (' . $ph . ')',
                $vals
            );
            
            if (!$success) {
                http_response_code(500);
                echo json_encode(['error' => 'Insert failed']);
                exit;
            }
            
            $id = Database::lastInsertId();
            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $id]);
            break;
            
        case 'PUT':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing id']);
                exit;
            }
            
            $id = $data['id'];
            $site = $data['site'] ?? null;
            $username = $data['username'] ?? null;
            $password = $data['password'] ?? null;
            
            if (!$site && !$username && !$password) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit;
            }
            
            $updates = [];
            $params = [];
            
            if ($site) {
                $updates[] = 'site = ?';
                $params[] = trim($site);
                if (hasColumnSoft('branch_admins', 'branch_name')) {
                    $updates[] = 'branch_name = ?';
                    $params[] = trim($site);
                }
            }
            if ($username) {
                $updates[] = 'username = ?';
                $params[] = trim($username);
            }
            if ($password) {
                $updates[] = 'password = ?';
                $params[] = password_hash($password, PASSWORD_BCRYPT);
            }
            
            $params[] = $id;
            $sql = 'UPDATE branch_admins SET ' . implode(', ', $updates) . ' WHERE id = ?';
            Database::execute($sql, $params);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing id']);
                exit;
            }
            
            Database::execute('DELETE FROM branch_admins WHERE id = ?', [$id]);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
}

function hasColumnSoft($table, $column)
{
    try {
        $row = Database::fetchOne("SHOW COLUMNS FROM {$table} LIKE '{$column}'");
        return $row ? true : false;
    } catch (Throwable $e) {
        return false;
    }
}
?>


