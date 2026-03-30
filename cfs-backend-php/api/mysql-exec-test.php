<?php
header('Content-Type: application/json');

$result = [];

// Try with full mysql path
if (function_exists('exec')) {
    $output = [];
    $return_var = 0;
    exec('C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe -h 127.0.0.1 -u feedback_user --password=feedback123 canteen_feedback -e "SELECT COUNT(*) as cnt FROM sites;" 2>&1', $output, $return_var);
    $result['exec_test'] = [
        'return_code' => $return_var,
        'output' => implode("\n", $output)
    ];
} else {
    $result['exec_test'] = 'exec() disabled';
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>
