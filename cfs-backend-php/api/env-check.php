<?php
header('Content-Type: application/json');

$result = [
    'php_os' => PHP_OS,
    'php_os_family' => PHP_OS_FAMILY,
    'uname' => php_uname(),
    'shell_info' => getenv('SHELL'),
    'path' => getenv('PATH'),
    'is_windows' => strtoupper(substr(PHP_OS, 0, 3)) === 'WIN',
];

echo json_encode($result, JSON_PRETTY_PRINT);
?>
