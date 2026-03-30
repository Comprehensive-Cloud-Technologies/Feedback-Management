<?php
/**
 * User Signup Endpoint
 * POST /api/auth/signup
 */



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
    // Check if user already exists
    $existing = Database::fetchOne(
        'SELECT id FROM users WHERE site = ? AND username = ?',
        [$site, $username]
    );

    if ($existing) {
        Response::error('Username already exists for this site', 409);
    }

    // Hash password and create user
    $hashedPassword = Auth::hashPassword($password);

    Database::execute(
        'INSERT INTO users (site, username, password) VALUES (?, ?, ?)',
        [$site, $username, $hashedPassword]
    );

    Response::success(['success' => true]);

} catch (Exception $e) {
    error_log("Signup error: " . $e->getMessage());
    Response::error(ERROR_MESSAGES['SERVER_ERROR'], 500);
}
