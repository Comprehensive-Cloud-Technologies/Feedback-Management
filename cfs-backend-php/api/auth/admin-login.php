<?php
/**
 * Admin Login Endpoint
 * POST /api/auth/admin-login
 */

require_once __DIR__ . '/../init.php';

if (Response::getMethod() !== 'POST') {
    Response::error('Method not allowed', 405);
}

$data = Response::getBody();

// Validate required fields
Response::validateRequired($data, ['password']);

$password = $data['password'];

// Verify admin password
if ($password !== ADMIN_PASSWORD) {
    Response::error(ERROR_MESSAGES['INVALID_CREDENTIALS'], 401);
}

// Generate JWT token for admin
$token = JWT::generate([
    'role' => 'admin'
]);

Response::success([
    'success' => true,
    'token' => $token
]);
