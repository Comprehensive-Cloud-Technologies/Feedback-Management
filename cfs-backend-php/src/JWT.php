<?php
/**
 * JWT Utility Class
 * Handles token generation and verification
 */

if (defined('JWT_LOADED'))
    return;
define('JWT_LOADED', true);

require_once __DIR__ . '/Response.php';

if (!class_exists('JWT')) {
    class JWT
    {
        /**
         * Generate JWT token
         * @param array $payload
         * @return string
         */
        public static function generate($payload)
        {
            $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
            $payload['exp'] = time() + JWT_EXPIRATION;
            $payload['iat'] = time();

            $base64UrlHeader = self::base64UrlEncode($header);
            $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

            $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
            $base64UrlSignature = self::base64UrlEncode($signature);

            return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
        }

        /**
         * Verify JWT token
         * @param string $token
         * @return array|null Payload if valid
         */
        public static function verify($token)
        {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return null;
            }

            list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

            $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
            $base64UrlSignatureCheck = self::base64UrlEncode($signature);

            if ($base64UrlSignature !== $base64UrlSignatureCheck) {
                return null;
            }

            $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return null;
            }

            return $payload;
        }

        /**
         * Extract token from Authorization header or cookie or query
         * @return string|null
         */
        public static function extractToken()
        {
            // 1. Authorization Header
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? null));

            if ($authHeader) {
                if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                    return $matches[1];
                }
                return $authHeader; // Could be direct token
            }

            // 2. Query param (for images/downloads)
            if (isset($_GET['token'])) {
                return $_GET['token'];
            }

            // 3. X-Token header
            $xToken = $headers['X-Token'] ?? ($headers['x-token'] ?? ($_SERVER['HTTP_X_TOKEN'] ?? null));
            if ($xToken)
                return $xToken;

            return null;
        }

        private static function base64UrlEncode($data)
        {
            return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
        }

        private static function base64UrlDecode($data)
        {
            $remainder = strlen($data) % 4;
            if ($remainder) {
                $padlen = 4 - $remainder;
                $data .= str_repeat('=', $padlen);
            }
            return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
        }
    }
}