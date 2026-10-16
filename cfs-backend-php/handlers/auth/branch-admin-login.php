<?php
/**
 * Branch Admin Login Endpoint
 * POST /api/auth/branch-admin-login
 */



if (Response::getMethod() !== 'POST') {
    Response::error('Method not allowed', 405);
}

$data = Response::getBody();

// Validate required fields - site is now optional
Response::validateRequired($data, ['username', 'password']);

$site = isset($data['site']) ? $data['site'] : null;
$username = $data['username'];
$password = $data['password'];

try {
    // Look up by username (and optionally site)
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

    if (!$admin) {
        Response::error(ERROR_MESSAGES['INVALID_CREDENTIALS'], 401);
    }

    // Verify password
    if (!Auth::verifyPassword($password, $admin['password'])) {
        Response::error(ERROR_MESSAGES['INVALID_CREDENTIALS'], 401);
    }

    // Generate JWT token
    $token = JWT::generate([
        'role' => 'branch_admin',
        'site' => $admin['site'],
        'username' => $username
    ]);

    Response::success([
        'success' => true,
        'token' => $token
    ]);

} catch (Exception $e) {
    error_log("Branch admin login error: " . $e->getMessage());
    Response::error(ERROR_MESSAGES['SERVER_ERROR'], 500);
}
