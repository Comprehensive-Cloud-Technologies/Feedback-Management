<?php
/**
 * Branch Admin Login Endpoint
 * POST /api/auth/branch-admin-login
 */

require_once __DIR__ . '/../init.php';

if (Response::getMethod() !== 'POST') {
    Response::error('Method not allowed', 405);
}

$data = Response::getBody();

// Validate required fields
Response::validateRequired($data, ['site', 'username', 'password']);

$site = $data['site'];
$username = $data['username'];
$password = $data['password'];

try {
    // Get branch admin from database
    $admin = Database::fetchOne(
        'SELECT id, site, password FROM branch_admins WHERE site = ? AND username = ?',
        [$site, $username]
    );

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
