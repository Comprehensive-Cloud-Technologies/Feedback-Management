<?php
/**
 * Database Migration Script for Segments Hierarchy
 * Adds segments table and relationships to existing tables
 */

require_once __DIR__ . '/../config/database.php';

function runMigration() {
    global $connection;
    
    $success = true;
    $operations = [];
    
    try {
        echo "Starting migration...\n";
        echo "====================\n\n";
        
        // 1. Create segments table
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
            echo "✓ Segments table created/verified\n";
            $operations[] = "✓ Created segments table";
        } else {
            throw new Exception("Failed to create segments table: " . $connection->error);
        }
        
        // 2. Add segment_id to sites
        echo "\n2. Updating sites table...\n";
        $alterQueries = [
            "ALTER TABLE sites ADD COLUMN IF NOT EXISTS segment_id INT NULL" => "Added segment_id column",
            "ALTER TABLE sites ADD INDEX IF NOT EXISTS idx_segment_id (segment_id)" => "Added index"
        ];
        
        foreach ($alterQueries as $query => $desc) {
            if ($connection->query($query)) {
                echo "  ✓ $desc\n";
            } else {
                // Silently fail if column/index already exists
                if (strpos($connection->error, "Duplicate") === false && strpos($connection->error, "already exists") === false) {
                    throw new Exception("Error in sites: " . $connection->error);
                }
            }
        }
        
        // Add foreign key
        if (!$connection->query("ALTER TABLE sites ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add FK: " . $connection->error . "\n";
            }
        } else {
            echo "  ✓ Added foreign key\n";
        }
        $operations[] = "✓ Updated sites table";
        
        // 3. Add branch_id to canteens
        echo "\n3. Updating canteens table...\n";
        if ($connection->query("ALTER TABLE canteens ADD COLUMN IF NOT EXISTS branch_id INT NULL")) {
            echo "  ✓ Added branch_id column\n";
        }
        
        if ($connection->query("ALTER TABLE canteens ADD INDEX IF NOT EXISTS idx_branch_id (branch_id)")) {
            echo "  ✓ Added index\n";
        }
        
        if (!$connection->query("ALTER TABLE canteens ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add FK: " . $connection->error . "\n";
            }
        } else {
            echo "  ✓ Added foreign key\n";
        }
        $operations[] = "✓ Updated canteens table";
        
        // 4. Add segment_id to branch_admins
        echo "\n4. Updating branch_admins table...\n";
        if ($connection->query("ALTER TABLE branch_admins ADD COLUMN IF NOT EXISTS segment_id INT NULL")) {
            echo "  ✓ Added segment_id column\n";
        }
        
        if ($connection->query("ALTER TABLE branch_admins ADD INDEX IF NOT EXISTS idx_segment_id (segment_id)")) {
            echo "  ✓ Added index\n";
        }
        
        if (!$connection->query("ALTER TABLE branch_admins ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add FK: " . $connection->error . "\n";
            }
        }
        $operations[] = "✓ Updated branch_admins table";
        
        // 5. Add segment_id and branch_id to questions
        echo "\n5. Updating questions table...\n";
        $questionUpdates = [
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS segment_id INT NULL",
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS branch_id INT NULL",
            "ALTER TABLE questions ADD INDEX IF NOT EXISTS idx_segment_id (segment_id)",
            "ALTER TABLE questions ADD INDEX IF NOT EXISTS idx_branch_id (branch_id)"
        ];
        
        foreach ($questionUpdates as $query) {
            if (!$connection->query($query)) {
                if (strpos($connection->error, "Duplicate") === false) {
                    echo "  ! Warning: " . $connection->error . "\n";
                }
            }
        }
        
        if (!$connection->query("ALTER TABLE questions ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add segment FK\n";
            }
        }
        
        if (!$connection->query("ALTER TABLE questions ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add branch FK\n";
            }
        }
        echo "  ✓ Updated questions table\n";
        $operations[] = "✓ Updated questions table";
        
        // 6. Add segment_id and branch_id to feedback
        echo "\n6. Updating feedback table...\n";
        $feedbackUpdates = [
            "ALTER TABLE feedback ADD COLUMN IF NOT EXISTS segment_id INT NULL",
            "ALTER TABLE feedback ADD COLUMN IF NOT EXISTS branch_id INT NULL",
            "ALTER TABLE feedback ADD INDEX IF NOT EXISTS idx_segment_id (segment_id)",
            "ALTER TABLE feedback ADD INDEX IF NOT EXISTS idx_branch_id (branch_id)"
        ];
        
        foreach ($feedbackUpdates as $query) {
            if (!$connection->query($query)) {
                if (strpos($connection->error, "Duplicate") === false) {
                    echo "  ! Warning: " . $connection->error . "\n";
                }
            }
        }
        
        if (!$connection->query("ALTER TABLE feedback ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add segment FK\n";
            }
        }
        
        if (!$connection->query("ALTER TABLE feedback ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add branch FK\n";
            }
        }
        echo "  ✓ Updated feedback table\n";
        $operations[] = "✓ Updated feedback table";
        
        // 7. Add segment_id and branch_id to users
        echo "\n7. Updating users table...\n";
        $userUpdates = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS segment_id INT NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INT NULL",
            "ALTER TABLE users ADD INDEX IF NOT EXISTS idx_segment_id (segment_id)",
            "ALTER TABLE users ADD INDEX IF NOT EXISTS idx_branch_id (branch_id)"
        ];
        
        foreach ($userUpdates as $query) {
            if (!$connection->query($query)) {
                if (strpos($connection->error, "Duplicate") === false) {
                    echo "  ! Warning: " . $connection->error . "\n";
                }
            }
        }
        
        if (!$connection->query("ALTER TABLE users ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add segment FK\n";
            }
        }
        
        if (!$connection->query("ALTER TABLE users ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE")) {
            if (strpos($connection->error, "Duplicate") === false) {
                echo "  ! Warning: Could not add branch FK\n";
            }
        }
        echo "  ✓ Updated users table\n";
        $operations[] = "✓ Updated users table";
        
        // 8. Insert initial segments
        echo "\n8. Inserting initial segments...\n";
        $segments = [
            ['FM', 'Facility Management'],
            ['FS', 'Facilities Support'],
            ['INFRA', 'Infrastructure']
        ];
        
        foreach ($segments as [$name, $desc]) {
            $connection->query("INSERT IGNORE INTO segments (name, description) VALUES ('$name', '$desc')");
        }
        echo "  ✓ Inserted segments (FM, FS, INFRA)\n";
        $operations[] = "✓ Inserted initial segments";
        
        // 9. Update existing sites with default segment
        echo "\n9. Updating existing data...\n";
        $connection->query("UPDATE sites SET segment_id = (SELECT id FROM segments WHERE name = 'FM' LIMIT 1) WHERE segment_id IS NULL");
        $siteUpdated = $connection->affected_rows;
        if ($siteUpdated > 0) {
            echo "  ✓ Updated $siteUpdated sites with default segment (FM)\n";
        }
        
        // Update canteens to link to their sites
        $connection->query("UPDATE canteens c JOIN sites s ON c.site = s.location SET c.branch_id = s.id WHERE c.branch_id IS NULL");
        $canteenUpdated = $connection->affected_rows;
        if ($canteenUpdated > 0) {
            echo "  ✓ Updated $canteenUpdated canteens with branch references\n";
        }
        
        $operations[] = "✓ Updated existing data";
        
        // 10. Verify
        echo "\n10. Verifying migration...\n";
        
        $result = $connection->query("SELECT COUNT(*) as cnt FROM segments");
        $segmentCount = $result->fetch_assoc()['cnt'];
        echo "  Segments: $segmentCount\n";
        
        $result = $connection->query("SELECT COUNT(*) as cnt FROM sites WHERE segment_id IS NOT NULL");
        $siteCount = $result->fetch_assoc()['cnt'];
        echo "  Sites with segment: $siteCount\n";
        
        $result = $connection->query("SELECT COUNT(*) as cnt FROM canteens WHERE branch_id IS NOT NULL");
        $canteenCount = $result->fetch_assoc()['cnt'];
        echo "  Canteens with branch: $canteenCount\n";
        
        // Show segments
        $result = $connection->query("SELECT id, name, description FROM segments ORDER BY name");
        echo "\n  Segments in database:\n";
        while ($row = $result->fetch_assoc()) {
            echo "    [{$row['id']}] {$row['name']}: {$row['description']}\n";
        }
        
        echo "\n====================\n";
        echo "✅ Migration completed successfully!\n";
        echo "====================\n";
        
    } catch (Exception $e) {
        echo "\n❌ Error: " . $e->getMessage() . "\n";
        $success = false;
    }
    
    return $success;
}

// Run migration
$result = runMigration();
exit($result ? 0 : 1);
?>
