<?php
/**
 * JWT Utilities
 * Handles token generation and verification
 */

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

            // Add expiration
            $payload['exp'] = time() + JWT_EXPIRATION;
            $payload['iat'] = time();

            $base64UrlHeader = self::base64UrlEncode($header);
            $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

            $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
            $base64UrlSignature = self::base64UrlEncode($signature);

            return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
        }

        /**
         * Verify and decode JWT token
         * @param string $token
         * @return array|null
         */
        public static function verify($token)
        {
            if (empty($token)) {
                return null;
            }

            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return null;
            }

            list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

            // Verify signature
            $signature = self::base64UrlDecode($base64UrlSignature);
            $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);

            if (!hash_equals($signature, $expectedSignature)) {
                return null;
            }

            // Decode payload
            $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);

            // Check expiration
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                return null;
            }

            return $payload;
        }

        /**
         * Extract token from Authorization header
         * Checks multiple sources for maximum compatibility
         * @return string|null
         */
        public static function extractFromHeader()
        {
            $authHeader = '';

            // Method 1: Try getallheaders()
            if (function_exists('getallheaders')) {
                $headers = getallheaders();
                $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            }

            // Method 2: $_SERVER['HTTP_AUTHORIZATION']
            if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
            }

            // Method 3: $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            if (empty($authHeader) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }

            // Method 4: Check X-Token header (alternative header)
            if (empty($authHeader)) {
                if (function_exists('getallheaders')) {
                    $headers = getallheaders();
                    $authHeader = $headers['X-Token'] ?? $headers['x-token'] ?? '';
                }
                if (empty($authHeader) && isset($_SERVER['HTTP_X_TOKEN'])) {
                    $authHeader = $_SERVER['HTTP_X_TOKEN'];
                }
            }

            // Method 5: Check all $_SERVER keys for Authorization or Token
            if (empty($authHeader)) {
                foreach ($_SERVER as $key => $value) {
                    if ((stripos($key, 'authorization') !== false || stripos($key, 'x_token') !== false) && !empty($value)) {
                        $authHeader = $value;
                        break;
                    }
                }
            }

            if (empty($authHeader)) {
                return null;
            }

            // Extract Bearer token from various formats
            $authHeader = trim($authHeader);

            if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
                return trim($matches[1]);
            }

            // If it looks like a JWT token directly (3 parts separated by dots), return it
            if (preg_match('/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/', $authHeader)) {
                return $authHeader;
            }

            return null;
        }

        /**
         * Extract token from multiple sources (for maximum compatibility)
         * @return string|null
         */
        public static function extractToken()
        {
            $token = self::extractFromHeader();
            if ($token) {
                return $token;
            }

            // Try query parameter ?token=...
            if (isset($_GET['token']) && !empty($_GET['token'])) {
                return $_GET['token'];
            }

            // Try POST body {token: "..."}
            if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
                $input = file_get_contents('php://input');
                if (!empty($input)) {
                    $data = json_decode($input, true);
                    if (is_array($data) && isset($data['token']) && !empty($data['token'])) {
                        return $data['token'];
                    }
                }
            }

            return null;
        }

        /**
         * Base64 URL encode
         */
        private static function base64UrlEncode($data)
        {
            return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
        }

        /**
         * Base64 URL decode
         */
        private static function base64UrlDecode($data)
        {
            return base64_decode(strtr($data, '-_', '+/'));
        }
    }
}
?>