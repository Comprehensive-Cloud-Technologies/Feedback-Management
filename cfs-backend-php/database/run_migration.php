<?php
// Quick migration script
require_once __DIR__ . '/../config/database.php';

echo "=== SEGMENTS HIERARCHY MIGRATION ===\n\n";

// Create segments table
$connection->query("CREATE TABLE IF NOT EXISTS segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
echo "✓ Segments table created\n";

// Add columns to existing tables
$queries = [
    "ALTER TABLE sites ADD COLUMN IF NOT EXISTS segment_id INT NULL",
    "ALTER TABLE canteens ADD COLUMN IF NOT EXISTS branch_id INT NULL",
    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS segment_id INT NULL",
    "ALTER TABLE questions ADD COLUMN IF NOT EXISTS branch_id INT NULL",
    "ALTER TABLE feedback ADD COLUMN IF NOT EXISTS segment_id INT NULL",
    "ALTER TABLE feedback ADD COLUMN IF NOT EXISTS branch_id INT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS segment_id INT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INT NULL",
    "ALTER TABLE branch_admins ADD COLUMN IF NOT EXISTS segment_id INT NULL"
];

foreach ($queries as $query) {
    @$connection->query($query);
}
echo "✓ Columns added to tables\n";

// Insert segments
$connection->query("INSERT IGNORE INTO segments (name, description) VALUES ('FM', 'Facility Management')");
$connection->query("INSERT IGNORE INTO segments (name, description) VALUES ('FS', 'Facilities Support')");
$connection->query("INSERT IGNORE INTO segments (name, description) VALUES ('INFRA', 'Infrastructure')");
echo "✓ Initial segments created (FM, FS, INFRA)\n";

// Update existing data
$connection->query("UPDATE sites SET segment_id = (SELECT id FROM segments WHERE name = 'FM' LIMIT 1) WHERE segment_id IS NULL");
echo "✓ Updated existing sites\n";

$connection->query("UPDATE canteens c JOIN sites s ON c.site = s.location SET c.branch_id = s.id WHERE c.branch_id IS NULL");
echo "✓ Linked canteens to branches\n";

// Verify
$result = $connection->query("SELECT COUNT(*) as cnt FROM segments");
$row = $result->fetch_assoc();
echo "\nSegments: " . $row['cnt'] . "\n";

$result = $connection->query("SELECT id, name, description FROM segments ORDER BY name");
while ($row = $result->fetch_assoc()) {
    echo "  [{$row['id']}] {$row['name']}: {$row['description']}\n";
}

echo "\n✅ MIGRATION COMPLETED!\n";
?>
