-- Migration 008: Add is_required flag to questions
-- Safe, additive, idempotent migration.
-- Adds questions.is_required TINYINT(1) DEFAULT 0

SET @dbname = DATABASE();
SET @tablename = 'questions';
SET @columnname = 'is_required';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE questions ADD COLUMN is_required TINYINT(1) NOT NULL DEFAULT 0 COMMENT "1 = this question must be answered before form submit" AFTER customization'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Backfill legacy rating questions: default to 1 (mandatory) if not explicitly set in customization
UPDATE questions
SET is_required = 1
WHERE (response_type IS NULL OR response_type IN ('smiley_faces', 'star_rating', 'numeric_scale', 'thumbs', 'scale', 'yes_no'))
  AND (customization IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(customization, '$.required')) IS NULL);

-- Backfill any question where customization explicitly had required = true
UPDATE questions
SET is_required = 1
WHERE customization IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(customization, '$.required')) = 'true';

-- Also backfill feedback.segment_id from site via canteen (safe UPDATE)
-- Links: feedback.canteen_id -> canteens.branch_id -> sites.segment_id
UPDATE feedback f
JOIN canteens c ON f.canteen_id = c.id
JOIN sites s ON c.branch_id = s.id
SET f.segment_id = s.segment_id
WHERE f.segment_id IS NULL
  AND s.segment_id IS NOT NULL;

