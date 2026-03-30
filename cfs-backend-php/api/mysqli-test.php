<?php
header('Content-Type: application/json');

$results = [];

// Check if MySQLi is available
$results['mysqli_loaded'] = extension_loaded('mysqli') ? 'YES' : 'NO';

// Test MySQLi connection
if (extension_loaded('mysqli')) {
    try {
        $mysqli = new mysqli('127.0.0.1', 'feedback_user', 'feedback123', 'canteen_feedback', 3306);
        
        if ($mysqli->connect_error) {
            $results['mysqli_connection'] = 'FAILED: ' . $mysqli->connect_error;
        } else {
            $result = $mysqli->query('SELECT COUNT(*) as count FROM sites');
            $row = $result->fetch_assoc();
            $results['mysqli_connection'] = 'SUCCESS';
            $results['sites_count'] = $row['count'];
            $results['mysqli_server_info'] = $mysqli->server_info;
            $mysqli->close();
        }
    } catch (Exception $e) {
        $results['mysqli_connection'] = 'FAILED: ' . $e->getMessage();
    }
}

// Also test PDO again but with more debug info
try {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=canteen_feedback", "feedback_user", "feedback123");
    $results['pdo_127_0_0_1'] = 'SUCCESS';
} catch (PDOException $e) {
    $results['pdo_127_0_0_1'] = 'FAILED: ' . $e->getMessage();
    $results['pdo_127_0_0_1_code'] = $e->getCode();
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
