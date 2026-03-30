<?php
header('Content-Type: application/json');

// Try localhost instead of 127.0.0.1
try {
    $mysqli = new mysqli('localhost', 'feedback_user', 'feedback123', 'canteen_feedback', 3306);
    if ($mysqli->connect_error) {
        $result = ['status' => 'FAILED', 'error' => $mysqli->connect_error, 'errno' => $mysqli->connect_errno];
    } else {
        $res = $mysqli->query("SELECT COUNT(*) as cnt FROM sites");
        $row = $res->fetch_assoc();
        $result = ['status' => 'SUCCESS', 'sites_count' => $row['cnt']];
        $mysqli->close();
    }
} catch (Exception $e) {
    $result = ['status' => 'ERROR', 'message' => $e->getMessage()];
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>
