<?php
/**
 * Branch Admin Login Endpoint
 * Uses init.php to ensure proper JWT_SECRET consistency
 */

try {
    // Load init first
    require_once __DIR__ . '/init.php';
    
    // Only accept POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }

    $body = file_get_contents('php://input');
    $data = json_decode($body, true) ?: [];

    $site = $data['site'] ?? null;
    $username = $data['username'] ?? null;
    $password = $data['password'] ?? null;

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing username or password']);
        exit();
    }

    try {
        // Fetch branch admin from database (site is optional)
        if ($site) {
            $admin = Database::fetchOne(
                'SELECT id, site, password FROM branch_admins WHERE site = ? AND username = ?',
                [$site, $username]
            );
        } else {
            $admin = Database::fetchOne(
                'SELECT id, site, password FROM branch_admins WHERE username = ?',
                [$username]
            );
        }
        if (!$site && $admin) {
            $site = $admin['site'];
        }

        if (!$admin) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            exit();
        }

        // Verify password
        if (!Auth::verifyPassword($password, $admin['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            exit();
        }

        // Generate JWT using SAME SECRET as handlers
        $payload = [
            'id' => $admin['id'],
            'username' => $username,
            'role' => 'branch_admin',
            'site' => $site
        ];

        $token = JWT::generate($payload);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $admin['id'],
                'username' => $username,
                'role' => 'branch_admin',
                'site' => $site
            ]
        ]);
        exit();

    } catch (Exception $e) {
        error_log("Branch admin login DB error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        exit();
    }

} catch (Throwable $e) {
    error_log("Branch admin login fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit();
}
?>

        getenv('DB_PASSWORD'),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    // Query branch admins table
    $stmt = $pdo->prepare('SELECT id, username, password FROM branch_admins WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit();
    }

    // For plain text password comparison (no hashing)
    if ($password === $user['password']) {
        $token = base64_encode(json_encode([
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => 'branch_admin',
            'iat' => time(),
            'exp' => time() + 86400
        ]));
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => 'branch_admin'
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
