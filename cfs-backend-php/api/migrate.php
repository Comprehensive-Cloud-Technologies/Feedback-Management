<?php
// Standalone migration script

echo "<h3>=== SEGMENTS HIERARCHY MIGRATION ===</h3><pre>";

try {
    // Connect directly
    $connection = new mysqli('127.0.0.1', 'feedback_user', 'feedback123', 'canteen_feedback');
    
    if ($connection->connect_error) {
        die("Connection failed: " . $connection->connect_error);
    }
    
    echo "✓ Connected to database\n\n";
    
    // Create segments table
    echo "1. Creating segments table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS segments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($connection->query($sql)) {
        echo "✓ Segments table created\n";
    } else {
        die("Error: " . $connection->error);
    }
    
    // Add columns
    echo "\n2. Adding columns to tables...\n";
    $queries = [
        "ALTER TABLE sites ADD segment_id INT NULL" => "sites.segment_id",
        "ALTER TABLE canteens ADD branch_id INT NULL" => "canteens.branch_id",
        "ALTER TABLE questions ADD segment_id INT NULL" => "questions.segment_id",
        "ALTER TABLE questions ADD branch_id INT NULL" => "questions.branch_id",
        "ALTER TABLE feedback ADD segment_id INT NULL" => "feedback.segment_id",
        "ALTER TABLE feedback ADD branch_id INT NULL" => "feedback.branch_id",
        "ALTER TABLE users ADD segment_id INT NULL" => "users.segment_id",
        "ALTER TABLE users ADD branch_id INT NULL" => "users.branch_id",
        "ALTER TABLE branch_admins ADD segment_id INT NULL" => "branch_admins.segment_id"
    ];
    
    foreach ($queries as $sql => $name) {
        if (@$connection->query($sql)) {
            echo "  ✓ Added $name\n";
        } else {
            // Column might already exist, check if it's an ignorable error
            if (strpos($connection->error, "Duplicate") === false && strpos($connection->error, "Error") === false) {
                echo "  ! Already exists: $name\n";
            }
        }
    }
    
    // Insert segments
    echo "\n3. Inserting segments...\n";
    $segments = [
        ['FM', 'Facility Management'],
        ['FS', 'Facilities Support'],
        ['INFRA', 'Infrastructure']
    ];
    
    foreach ($segments as [$name, $desc]) {
        $n = $connection->real_escape_string($name);
        $d = $connection->real_escape_string($desc);
        $connection->query("INSERT IGNORE INTO segments (name, description) VALUES ('$n', '$d')");
    }
    echo "✓ Segments created\n";
    
    // Update existing data
    echo "\n4. Updating existing data...\n";
    $connection->query("UPDATE sites SET segment_id = (SELECT id FROM segments WHERE name = 'FM' LIMIT 1) WHERE segment_id IS NULL");
    $updated = $connection->affected_rows;
    if ($updated > 0) {
        echo "✓ Updated $updated sites\n";
    }
    
    $connection->query("UPDATE canteens c JOIN sites s ON c.site = s.location SET c.branch_id = s.id WHERE c.branch_id IS NULL");
    $updated = $connection->affected_rows;
    if ($updated > 0) {
        echo "✓ Updated $updated canteens\n";
    }
    
    // Verify
    echo "\n5. Verification:\n";
    
    $result = $connection->query("SELECT COUNT(*) as cnt FROM segments");
    $row = $result->fetch_assoc();
    echo "  Segments: " . $row['cnt'] . "\n";
    
    $result = $connection->query("SELECT id, name, description FROM segments ORDER BY name");
    while ($row = $result->fetch_assoc()) {
        echo "    [{$row['id']}] {$row['name']}: {$row['description']}\n";
    }
    
    $result = $connection->query("SELECT COUNT(*) as cnt FROM sites WHERE segment_id IS NOT NULL");
    $row = $result->fetch_assoc();
    echo "  Sites with segment: " . $row['cnt'] . "\n";
    
    $result = $connection->query("SELECT COUNT(*) as cnt FROM canteens WHERE branch_id IS NOT NULL");
    $row = $result->fetch_assoc();
    echo "  Canteens with branch: " . $row['cnt'] . "\n";
    
    echo "\n✅ MIGRATION COMPLETED!\n";
    
    $connection->close();
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}

echo "</pre>";
?>
