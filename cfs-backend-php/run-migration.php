<?php
require_once 'api/init.php';

// Run the migration
echo "Applying migration: 003_add_question_customization.sql\n";

$migrationSQL = file_get_contents('database/migrations/003_add_question_customization.sql');

// Split by lines and execute non-comment, non-empty statements
$statements = preg_split('/;\s*\n/', $migrationSQL);

foreach ($statements as $statement) {
    $statement = trim($statement);
    // Skip comments and empty lines
    if (empty($statement) || strpos($statement, '--') === 0) {
        continue;
    }
    
    try {
        Database::execute($statement);
        echo "✓ Executed: " . substr($statement, 0, 60) . "...\n";
    } catch (Throwable $e) {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
}

echo "\nDone! Checking table structure:\n";
$columns = Database::fetchAll("SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'questions' AND TABLE_SCHEMA = DATABASE()");
foreach ($columns as $col) {
    echo "  - " . $col['COLUMN_NAME'] . " (" . $col['COLUMN_TYPE'] . ")\n";
}

echo "\nSampling questions:\n";
$questions = Database::fetchAll("SELECT id, question_text, response_type, customization FROM questions LIMIT 3");
echo json_encode($questions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
