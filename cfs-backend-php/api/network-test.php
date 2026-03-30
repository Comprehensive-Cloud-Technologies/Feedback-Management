<?php
header('Content-Type: application/json');

$results = [];

// Test 1: Can we connect to ourselves (PHP dev server)?
try {
    $fp = fsockopen('127.0.0.1', 8000, $errno, $errstr, 2);
    if ($fp) {
        $results['self_connection_8000'] = 'SUCCESS';
        fclose($fp);
    } else {
        $results['self_connection_8000'] = 'FAILED: ' . $errstr;
    }
} catch (Exception $e) {
    $results['self_connection_8000'] = 'ERROR: ' . $e->getMessage();
}

// Test 2: Can we connect to MySQL on 3306?
try {
    $fp = fsockopen('127.0.0.1', 3306, $errno, $errstr, 2);
    if ($fp) {
        $results['mysql_connection_3306'] = 'Socket connected, reading greeting...';
        $greeting = fread($fp, 1024);
        $results['mysql_greeting'] = substr($greeting, 0, 50);
        fclose($fp);
    } else {
        $results['mysql_connection_3306'] = 'FAILED: ' . $errstr . ' (errno: ' . $errno . ')';
    }
} catch (Exception $e) {
    $results['mysql_connection_3306'] = 'ERROR: ' . $e->getMessage();
}

// Test 3: Check localhost
try {
    $fp = fsockopen('localhost', 3306, $errno, $errstr, 2);
    if ($fp) {
        $results['localhost_3306'] = 'Connected';
        fclose($fp);
    } else {
        $results['localhost_3306'] = 'FAILED: ' . $errstr;
    }
} catch (Exception $e) {
    $results['localhost_3306'] = 'ERROR: ' . $e->getMessage();
}

// Test 4: Check if MySQL is on different port
for ($port = 3305; $port <= 3307; $port++) {
    try {
        $fp = fsockopen('127.0.0.1', $port, $errno, $errstr, 1);
        if ($fp) {
            $results["port_$port"] = 'OPEN';
            fclose($fp);
        }
    } catch (Exception $e) {
        // port closed
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
