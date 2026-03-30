<?php
/**
 * Router Test - Verify index.php is being called
 */

header('Content-Type: application/json');

echo json_encode([
    'status' => 'success',
    'message' => 'Router is working correctly',
    'test' => 'If you see this JSON, the index.php router is active',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
