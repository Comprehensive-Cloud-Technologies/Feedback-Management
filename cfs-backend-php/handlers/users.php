<?php
/**
 * Users Management (Admin only)
 */



$method = Response::getMethod();

try {
    switch ($method) {
        case 'GET':
            handleGet();
            break;
        case 'POST':
            handlePost();
            break;
        case 'PUT':
            handlePut();
            break;
        case 'DELETE':
            handleDelete();
            break;
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Users API error: " . $e->getMessage());
    Response::error(ERROR_MESSAGES['SERVER_ERROR'], 500);
}

/**
 * GET /api/users - List all users
 */
function handleGet()
{
    Auth::requireRole('admin');

    $users = Database::fetchAll(
        'SELECT id, site, username FROM users ORDER BY site, username'
    );

    Response::success(['users' => $users]);
}

/**
 * POST /api/users - Create user
 */
function handlePost()
{
    Auth::requireRole('admin');

    $data = Response::getBody();
    Response::validateRequired($data, ['site', 'username', 'password']);

    $site = $data['site'];
    $username = $data['username'];
    $password = $data['password'];

    // Check if user already exists
    $existing = Database::fetchOne(
        'SELECT id FROM users WHERE site = ? AND username = ?',
        [$site, $username]
    );

    if ($existing) {
        Response::error('User already exists', 409);
    }

    $hashedPassword = Auth::hashPassword($password);

    Database::execute(
        'INSERT INTO users (site, username, password) VALUES (?, ?, ?)',
        [$site, $username, $hashedPassword]
    );

    Response::success(['success' => true]);
}

/**
 * PUT /api/users/:id - Update user
 */
function handlePut()
{
    Auth::requireRole('admin');

    $data = Response::getBody();
    Response::validateRequired($data, ['id', 'site', 'username']);

    $id = $data['id'];
    $site = $data['site'];
    $username = $data['username'];
    $password = $data['password'] ?? null;

    if ($password) {
        $hashedPassword = Auth::hashPassword($password);
        Database::execute(
            'UPDATE users SET site = ?, username = ?, password = ? WHERE id = ?',
            [$site, $username, $hashedPassword, $id]
        );
    } else {
        Database::execute(
            'UPDATE users SET site = ?, username = ? WHERE id = ?',
            [$site, $username, $id]
        );
    }

    Response::success(['success' => true]);
}

/**
 * DELETE /api/users/:id - Delete user
 */
function handleDelete()
{
    Auth::requireRole('admin');

    $query = Response::getQuery();

    if (!isset($query['id'])) {
        Response::error('Missing user ID', 400);
    }

    $id = $query['id'];

    Database::execute('DELETE FROM users WHERE id = ?', [$id]);

    Response::success(['success' => true]);
}
