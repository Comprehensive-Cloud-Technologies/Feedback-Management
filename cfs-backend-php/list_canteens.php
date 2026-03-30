<?php
require_once __DIR__ . '/config/database.php';

$outputFile = __DIR__ . '/all_canteens.txt';
$fp = fopen($outputFile, 'w');

try {
    $rows = Database::fetchAll('SELECT site, name, id FROM canteens');
    foreach ($rows as $r) {
        fwrite($fp, "[" . $r['site'] . "]|[" . $r['name'] . "]|ID:" . $r['id'] . "\n");
    }
} catch (Exception $e) {
    fwrite($fp, "ERROR: " . $e->getMessage());
}
fclose($fp);
echo "Done. See all_canteens.txt\n";
