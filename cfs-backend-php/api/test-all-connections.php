<?php
header('Content-Type: application/json');

$results = [];

// Test various connection methods on Windows
$tests = [
    '127.0.0.1:3306' => ['host' => '127.0.0.1', 'port' => 3306],
    'localhost:3306' => ['host' => 'localhost', 'port' => 3306],
    'localhost (socket)' => ['host' => 'localhost', 'port' => null],
    '.:3306 (named pipe)' => ['host' => '.', 'port' => 3306],
];

foreach ($tests as $name => $config) {
    try {
        if ($config['port']) {
            $mysqli = new mysqli($config['host'], 'feedback_user', 'feedback123', 'canteen_feedback', $config['port']);
        } else {
            $mysqli = new mysqli($config['host'], 'feedback_user', 'feedback123', 'canteen_feedback');
        }
        
        if ($mysqli->connect_error) {
            $results[$name] = 'FAILED: ' . $mysqli->connect_error;
        } else {
            $res = $mysqli->query("SELECT COUNT(*) as cnt FROM sites");
            $row = $res->fetch_assoc();
            $results[$name] = 'SUCCESS - ' . $row['cnt'] . ' sites';
            $mysqli->close();
        }
    } catch (Exception $e) {
        $results[$name] = 'ERROR: ' . $e->getMessage();
    }
}

// Also test PDO with DSN format for Windows named pipe
try {
    $pdo = new PDO('mysql:host=.;port=3306;dbname=canteen_feedback', 'feedback_user', 'feedback123');
    $res = $pdo->query("SELECT COUNT(*) as cnt FROM sites");
    $row = $res->fetch();
    $results['PDO . (named pipe)'] = 'SUCCESS - ' . $row['cnt'] . ' sites';
} catch (Exception $e) {
    $results['PDO . (named pipe)'] = 'FAILED: ' . $e->getMessage();
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
