<?php
/**
 * Authentication Middleware
 * Handles role-based access control
 */

if (defined('AUTH_LOADED'))
    return;
define('AUTH_LOADED', true);

require_once __DIR__ . '/JWT.php';
require_once __DIR__ . '/Response.php';

if (!class_exists('Auth')) {
    class Auth
    {
        /**
         * Optional authentication - attaches user if token present
         * @return array|null User payload or null
         */
        public static function optional()
        {
            $token = JWT::extractToken();
            if ($token) {
                return JWT::verify($token);
            }
            return null;
        }

        /**
         * Require authentication
         * @return array User payload
         */
        public static function required()
        {
            $token = JWT::extractToken();

            if (!$token) {
                Response::error(ERROR_MESSAGES['MISSING_TOKEN'], 401);
            }

            $payload = JWT::verify($token);

            if (!$payload) {
                Response::error(ERROR_MESSAGES['INVALID_TOKEN'], 401);
            }

            return $payload;
        }

        /**
         * Require specific role
         * @param string $role Required role
         * @return array User payload
         */
        public static function requireRole($role)
        {
            $user = self::required();

            if (!isset($user['role']) || $user['role'] !== $role) {
                Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
            }

            return $user;
        }

        /**
         * Require admin or branch admin role
         * @return array User payload
         */
        public static function requireAdminOrBranch()
        {
            $user = self::required();

            if (
                !isset($user['role']) ||
                ($user['role'] !== 'admin' && $user['role'] !== 'branch_admin')
            ) {
                Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
            }

            return $user;
        }

        /**
         * Check if user has access to site
         * @param array $user User payload
         * @param string $site Site to check
         * @return bool
         */
        public static function canAccessSite($user, $site)
        {
            // Admin can access all sites
            if (isset($user['role']) && $user['role'] === 'admin') {
                return true;
            }

            // Branch admin can only access their site
            if (isset($user['role']) && $user['role'] === 'branch_admin') {
                return isset($user['site']) && $user['site'] === $site;
            }

            // Regular users can access their site
            if (isset($user['site'])) {
                return $user['site'] === $site;
            }

            return false;
        }

        /**
         * Hash password
         * @param string $password
         * @return string
         */
        public static function hashPassword($password)
        {
            return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        }

        /**
         * Verify password
         * @param string $password
         * @param string $hash
         * @return bool
         */
        public static function verifyPassword($password, $hash)
        {
            return password_verify($password, $hash);
        }
    }
}