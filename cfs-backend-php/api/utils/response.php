<?php
/**
 * Response Utilities
 * Standard JSON response helpers
 */

if (!class_exists('Response')) {
    class Response
    {
        /**
         * Send JSON response
         * @param mixed $data
         * @param int $statusCode
         */
        public static function json($data, $statusCode = 200)
        {
            http_response_code($statusCode);
            header('Content-Type: application/json');
            echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit();
        }

        /**
         * Send success response
         * @param mixed $data
         * @param int $statusCode
         */
        public static function success($data = [], $statusCode = 200)
        {
            if (is_array($data) && !isset($data['success'])) {
                $data['success'] = true;
            }
            self::json($data, $statusCode);
        }

        /**
         * Send error response
         * @param string $message
         * @param int $statusCode
         * @param array $details
         */
        public static function error($message, $statusCode = 400, $details = [])
        {
            $response = ['error' => $message];
            if (!empty($details)) {
                $response['details'] = $details;
            }
            self::json($response, $statusCode);
        }

        /**
         * Validate required fields
         * @param array $data
         * @param array $required
         * @return bool
         */
        public static function validateRequired($data, $required)
        {
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    self::error("Missing required field: $field", 400);
                    return false;
                }
            }
            return true;
        }

        /**
         * Get request body as array
         * @return array
         */
        public static function getBody()
        {
            $body = file_get_contents('php://input');

            // Primary: parse JSON
            $data = json_decode($body, true);
            if (is_array($data)) {
                return $data;
            }

            // Fallback: handle URL-encoded or form-data bodies (some servers strip JSON)
            $alt = [];
            if (is_string($body) && strlen(trim($body)) > 0) {
                parse_str($body, $alt);
            }
            if (!empty($alt)) {
                return $alt;
            }

            return [];
        }

        /**
         * Get query parameters
         * @return array
         */
        public static function getQuery()
        {
            return $_GET;
        }

        /**
         * Get request method
         * @return string
         */
        public static function getMethod()
        {
            return $_SERVER['REQUEST_METHOD'];
        }

        /**
         * Get path from request URI
         * @return string
         */
        public static function getPath()
        {
            $uri = $_SERVER['REQUEST_URI'];
            $path = parse_url($uri, PHP_URL_PATH);

            // Remove base path if exists
            $basePath = dirname($_SERVER['SCRIPT_NAME']);
            if ($basePath !== '/') {
                $path = str_replace($basePath, '', $path);
            }

            return $path;
        }
    }
}
?>