<?php
/**
 * Admin Login Endpoint
 * Must use init.php to ensure same JWT_SECRET as handlers
 */

try {
    // Load init first - this ensures .env, constants, and JWT are all loaded correctly
    require_once __DIR__ . '/init.php';
    
    // Only accept POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit();
    }

    $body = file_get_contents('php://input');
    $data = json_decode($body, true) ?: [];

    // For System Admin login
    $username = $data['username'] ?? null;
    $password = $data['password'] ?? null;
    
    // For branch admin login
    $site = $data['site'] ?? null;

    // System Admin Login (username='admin' OR no site specified)
    if (($username === 'admin' || !$site) && $password && !$site) {
        $adminPassword = getenv('ADMIN_PASSWORD') ?: 'SuperAdmin@2835';
        
        if ($password !== $adminPassword) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid password']);
            exit();
        }

        // Generate JWT for admin with SAME SECRET
        $payload = [
            'id' => 1,
            'username' => 'admin',
            'role' => 'admin',
            'site' => null
        ];

        $token = JWT::generate($payload);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => 1,
                'username' => 'admin',
                'role' => 'admin'
            ]
        ]);
        exit();
    }

    // Branch Admin Login
    if ($site && $username && $password) {
        try {
            $admin = Database::fetchOne(
                'SELECT id, password FROM branch_admins WHERE site = ? AND username = ?',
                [$site, $username]
            );

            if (!$admin || !Auth::verifyPassword($password, $admin['password'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                exit();
            }

            // Generate JWT for branch admin with SAME SECRET
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
            error_log("Branch admin login error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
            exit();
        }
    }

    // Invalid request
    http_response_code(400);
    echo json_encode(['error' => 'Invalid login parameters. Provide password for admin, or site+username+password for branch admin']);
    exit();

} catch (Throwable $e) {
    error_log("Admin login fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit();
}
?>
