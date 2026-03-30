<?php
/**
 * DEBUG HEADERS - See exactly what headers are being sent
 */

header('Content-Type: application/json');

$debug = [
    'function_exists_getallheaders' => function_exists('getallheaders'),
    'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
    'HTTP_AUTHORIZATION_EMPTY' => empty($_SERVER['HTTP_AUTHORIZATION']),
    'all_server_keys' => array_keys($_SERVER),
    'all_http_headers' => []
];

// Try getallheaders()
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    $debug['getallheaders_result'] = $headers;
    $debug['all_http_headers'] = array_keys($headers);
} else {
    $debug['getallheaders_result'] = 'NOT AVAILABLE';
}

// Check all HTTP_ vars in $_SERVER
$httpVars = [];
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $httpVars[$key] = $value;
    }
}
$debug['http_server_vars'] = $httpVars;

// Request method
$debug['request_method'] = $_SERVER['REQUEST_METHOD'] ?? 'NOT SET';

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
