<?php
header('Content-Type: application/json');

// Try connecting using mysqli with option to specify protocol
$results = [];

// Test 1: Try TCP protocol explicitly
try {
    $mysqli = @new mysqli(ini_get("mysqli.default_host") ?: "localhost", "feedback_user", "feedback123");
    mysqli_select_db($mysqli, "canteen_feedback");
    if ($mysqli->connect_error) {
        $results['default'] = 'FAILED: ' . $mysqli->connect_error;
    } else {
        $res = $mysqli->query("SELECT COUNT(*) as cnt FROM sites");
        $row = $res->fetch_assoc();
        $results['default'] = 'SUCCESS: ' . $row['cnt'] . ' sites';
        $mysqli->close();
    }
} catch (Exception $e) {
    $results['default'] = 'ERROR: ' . $e->getMessage();
}

// Test 2: Try shell_exec to run mysql command
if (function_exists('shell_exec')) {
    try {
        // Build command safely
        $cmd = 'mysql -h localhost -u feedback_user --password=feedback123 canteen_feedback -e "SELECT COUNT(*) as cnt FROM sites;"';
        $output = shell_exec($cmd . ' 2>&1');
        if (strpos($output, 'COUNT(*)') !== false) {
            $results['shell_exec'] = 'SUCCESS via shell: ' . trim($output);
        } else {
            $results['shell_exec'] = 'FAILED via shell: ' . substr($output, 0, 100);
        }
    } catch (Exception $e) {
        $results['shell_exec'] = 'ERROR: ' . $e->getMessage();
    }
}

// Test 3: Try TCP with explicit socket type
try {
    $link = mysqli_connect("localhost", "feedback_user", "feedback123", "canteen_feedback");
    if (!$link) {
        $results['mysqli_connect'] = 'FAILED: ' . mysqli_connect_error();
    } else {
        $res = mysqli_query($link, "SELECT COUNT(*) as cnt FROM sites");
        $row = mysqli_fetch_assoc($res);
        $results['mysqli_connect'] = 'SUCCESS: ' . $row['cnt'] . ' sites';
        mysqli_close($link);
    }
} catch (Exception $e) {
    $results['mysqli_connect'] = 'ERROR: ' . $e->getMessage();
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
