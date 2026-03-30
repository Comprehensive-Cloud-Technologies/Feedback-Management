<?php
/**
 * User Login Endpoint
 * POST /api/auth/login
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
    // Get user from database
    $user = Database::fetchOne(
        'SELECT id, password FROM users WHERE site = ? AND username = ?',
        [$site, $username]
    );

    if (!$user) {
        Response::error(ERROR_MESSAGES['INVALID_CREDENTIALS'], 401);
    }

    // Verify password
    if (!Auth::verifyPassword($password, $user['password'])) {
        Response::error(ERROR_MESSAGES['INVALID_CREDENTIALS'], 401);
    }

    // Generate JWT token
    $token = JWT::generate([
        'userId' => $user['id'],
        'site' => $site,
        'username' => $username,
        'role' => 'user'
    ]);

    Response::success([
        'success' => true,
        'token' => $token
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::error(ERROR_MESSAGES['SERVER_ERROR'], 500);
}
