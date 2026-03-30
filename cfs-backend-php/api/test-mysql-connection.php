<?php
header('Content-Type: application/json');

$tests = [];

// Test 1: localhost
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=canteen_feedback;charset=utf8mb4',
        'feedback_user',
        'feedback123',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $tests['localhost'] = 'SUCCESS';
} catch (PDOException $e) {
    $tests['localhost'] = 'FAILED: ' . $e->getMessage();
}

// Test 2: 127.0.0.1
try {
    $pdo = new PDO(
        'mysql:host=127.0.0.1;dbname=canteen_feedback;charset=utf8mb4',
        'feedback_user',
        'feedback123',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $tests['127.0.0.1'] = 'SUCCESS';
} catch (PDOException $e) {
    $tests['127.0.0.1'] = 'FAILED: ' . $e->getMessage();
}

// Test 3: with port
try {
    $pdo = new PDO(
        'mysql:host=localhost;port=3306;dbname=canteen_feedback;charset=utf8mb4',
        'feedback_user',
        'feedback123',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $tests['localhost:3306'] = 'SUCCESS';
} catch (PDOException $e) {
    $tests['localhost:3306'] = 'FAILED: ' . $e->getMessage();
}

echo json_encode($tests);
?>
