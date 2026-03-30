<?php
header('Content-Type: application/json');

$results = [];

// Test 1: Direct connection with 127.0.0.1:3306
try {
    $conn1 = new PDO(
        "mysql:host=127.0.0.1;port=3306;dbname=canteen_feedback;charset=utf8mb4",
        "feedback_user",
        "feedback123",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $results['127.0.0.1_with_port'] = 'SUCCESS';
} catch (PDOException $e) {
    $results['127.0.0.1_with_port'] = 'FAILED: ' . $e->getMessage();
}

// Test 2: Try with localhost (might use socket)
try {
    $conn2 = new PDO(
        "mysql:host=localhost;port=3306;dbname=canteen_feedback;charset=utf8mb4",
        "feedback_user",
        "feedback123",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $results['localhost_with_port'] = 'SUCCESS';
} catch (PDOException $e) {
    $results['localhost_with_port'] = 'FAILED: ' . $e->getMessage();
}

// Test 3: Check if socket path exists
$socket_path = '/var/run/mysqld/mysqld.sock';
$results['socket_exists'] = file_exists($socket_path) ? 'YES' : 'NO';

// Test 4: Try connecting with unix_socket param (if on socket system)
try {
    $conn3 = new PDO(
        "mysql:host=localhost;dbname=canteen_feedback;charset=utf8mb4",
        "feedback_user",
        "feedback123",
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $results['localhost_default'] = 'SUCCESS';
} catch (PDOException $e) {
    $results['localhost_default'] = 'FAILED: ' . $e->getMessage();
}

// Test 5: Check MySQL connection ports
$results['php_version'] = phpversion();
$results['pdo_drivers'] = PDO::getAvailableDrivers();
$results['function_shell_exec'] = function_exists('shell_exec') ? 'available' : 'disabled';

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
