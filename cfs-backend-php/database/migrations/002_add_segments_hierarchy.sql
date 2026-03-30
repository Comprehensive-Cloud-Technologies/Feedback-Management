-- Migration: Add Segments Hierarchy (Segments → Branches → Canteens)
-- Date: January 29, 2026
-- Description: Introduces organizational segments as top-level hierarchy with branches and canteens

-- Step 1: Create segments table (top level of hierarchy)
CREATE TABLE IF NOT EXISTS segments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Rename existing sites table to branches for clarity
-- (Keep sites table for backward compatibility, add segment reference)
ALTER TABLE sites ADD COLUMN segment_id INT NULL AFTER id;
ALTER TABLE sites ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE;
ALTER TABLE sites ADD INDEX idx_segment_id (segment_id);

-- Step 3: Update canteens table to reference branch_id instead of just site name
ALTER TABLE canteens ADD COLUMN branch_id INT NULL AFTER id;
ALTER TABLE canteens ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE canteens ADD INDEX idx_branch_id (branch_id);

-- Step 4: Update branch_admins table to reference segment_id
ALTER TABLE branch_admins ADD COLUMN segment_id INT NULL AFTER id;
ALTER TABLE branch_admins ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE;
ALTER TABLE branch_admins ADD INDEX idx_segment_id (segment_id);

-- Step 5: Update questions table to reference segment_id and branch_id
ALTER TABLE questions ADD COLUMN segment_id INT NULL AFTER id;
ALTER TABLE questions ADD COLUMN branch_id INT NULL AFTER segment_id;
ALTER TABLE questions ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE;
ALTER TABLE questions ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE questions ADD INDEX idx_segment_id (segment_id);
ALTER TABLE questions ADD INDEX idx_branch_id (branch_id);

-- Step 6: Update feedback table to reference segment_id and branch_id
ALTER TABLE feedback ADD COLUMN segment_id INT NULL AFTER id;
ALTER TABLE feedback ADD COLUMN branch_id INT NULL AFTER segment_id;
ALTER TABLE feedback ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE;
ALTER TABLE feedback ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE feedback ADD INDEX idx_segment_id (segment_id);
ALTER TABLE feedback ADD INDEX idx_branch_id (branch_id);

-- Step 7: Update users table to reference segment_id and branch_id
ALTER TABLE users ADD COLUMN segment_id INT NULL AFTER id;
ALTER TABLE users ADD COLUMN branch_id INT NULL AFTER segment_id;
ALTER TABLE users ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE;
ALTER TABLE users ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE users ADD INDEX idx_segment_id (segment_id);
ALTER TABLE users ADD INDEX idx_branch_id (branch_id);

-- Step 8: Insert initial test data for segments
INSERT INTO segments (name, description) VALUES
    ('FM', 'Facility Management'),
    ('FS', 'Facilities Support'),
    ('INFRA', 'Infrastructure')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Step 9: Update existing sites records to have default segment (FM)
UPDATE sites SET segment_id = (SELECT id FROM segments WHERE name = 'FM' LIMIT 1) WHERE segment_id IS NULL;

-- Step 10: Update existing canteens records to link to their sites
UPDATE canteens c 
JOIN sites s ON c.site = s.location 
SET c.branch_id = s.id 
WHERE c.branch_id IS NULL;

-- Verification queries:
-- SELECT 'Segments created' as status, COUNT(*) as count FROM segments;
-- SELECT 'Sites with segment_id' as status, COUNT(*) as count FROM sites WHERE segment_id IS NOT NULL;
-- SELECT 'Canteens with branch_id' as status, COUNT(*) as count FROM canteens WHERE branch_id IS NOT NULL;
