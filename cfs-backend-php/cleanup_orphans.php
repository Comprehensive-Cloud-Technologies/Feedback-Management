<?php
require_once __DIR__ . '/config/database.php';

try {
    echo "Starting cleanup...\n";

    // Delete feedback where site does not exist in sites table
    $sql = "DELETE FROM feedback WHERE site NOT IN (SELECT location FROM sites)";
    $count = Database::execute($sql);
    echo "Deleted $count orphaned feedback records.\n";

    // Delete canteens where site does not exist
    $sql = "DELETE FROM canteens WHERE site NOT IN (SELECT location FROM sites)";
    $count = Database::execute($sql);
    echo "Deleted $count orphaned canteens.\n";

    // Delete questions where site does not exist
    $sql = "DELETE FROM questions WHERE site NOT IN (SELECT location FROM sites)";
    $count = Database::execute($sql);
    echo "Deleted $count orphaned questions.\n";

    echo "Cleanup complete.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
