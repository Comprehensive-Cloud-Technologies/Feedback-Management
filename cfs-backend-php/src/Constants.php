<?php
/**
 * Application Constants
 */

if (defined('CONSTANTS_LOADED'))
    return;
define('CONSTANTS_LOADED', true);

require_once __DIR__ . '/Cors.php'; // Global CORS handling

// Environment
define('ENVIRONMENT', getenv('ENVIRONMENT') ?: 'development');
define('DEBUG_MODE', ENVIRONMENT === 'development');

// JWT Configuration
define('JWT_SECRET', getenv('JWT_SECRET') ?: '8655427d420a0072bbb5c98e2c0fb5c5ddf4337a16b928f416488d7013a78d26');
define('JWT_EXPIRATION', 7200); // 2 hours in seconds

// Admin Password
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'admin123');

// Rating Levels
define('RATINGS', [
    ['level' => 4, 'label' => 'Excellent', 'emoji' => '😀'],
    ['level' => 3, 'label' => 'Good', 'emoji' => '🙂'],
    ['level' => 2, 'label' => 'Fair', 'emoji' => '😐'],
    ['level' => 1, 'label' => 'Poor', 'emoji' => '😞'],
]);

// Default Questions for new sites
define('DEFAULT_QUESTIONS', [
    ['text' => 'How was the taste of the food?', 'emoji' => '😀'],
    ['text' => 'Was the food served hot and fresh?', 'emoji' => '🙂'],
    ['text' => 'How was the cleanliness of the dining area?', 'emoji' => '😐'],
    ['text' => 'Was the staff polite and helpful?', 'emoji' => '😞'],
    ['text' => 'Would you recommend our canteen to others?', 'emoji' => '👍'],
]);

// Sample Branch Admin Accounts
define('SAMPLE_BRANCH_ADMINS', [
    ['site' => 'Mumbai Central', 'username' => 'mumbai_admin', 'password' => 'mumbai123'],
    ['site' => 'Delhi NCR', 'username' => 'delhi_admin', 'password' => 'delhi123'],
    ['site' => 'Bangalore Tech Park', 'username' => 'blr_admin', 'password' => 'bangalore123'],
    ['site' => 'Pune Office', 'username' => 'pune_admin', 'password' => 'pune123'],
    ['site' => 'Chennai Branch', 'username' => 'chennai_admin', 'password' => 'chennai123'],
]);

// Error Messages
define('ERROR_MESSAGES', [
    'MISSING_FIELDS' => 'Missing required fields',
    'INVALID_CREDENTIALS' => 'Invalid credentials',
    'UNAUTHORIZED' => 'Unauthorized access',
    'FORBIDDEN' => 'Forbidden',
    'NOT_FOUND' => 'Resource not found',
    'ALREADY_EXISTS' => 'Resource already exists',
    'SERVER_ERROR' => 'Internal server error',
    'INVALID_TOKEN' => 'Invalid or expired token',
    'MISSING_TOKEN' => 'Missing authentication token',
]);