<?php
header('Content-Type: application/json');

$extensions = get_loaded_extensions();
$pdo_drivers = PDO::getAvailableDrivers();

echo json_encode([
    'pdo_extension_loaded' => extension_loaded('pdo'),
    'pdo_mysql_loaded' => extension_loaded('pdo_mysql'),
    'mysqli_loaded' => extension_loaded('mysqli'),
    'mysql_loaded' => extension_loaded('mysql'),
    'available_pdo_drivers' => $pdo_drivers
]);
?>
