-- Rollback 006: Revert Dynamic Fields and Response Types
-- Safely drops only the new nullable columns added in migration 006.

SET @dbname = DATABASE();

-- 1. Remove custom_field_values from feedback if present
SET @tablename = 'feedback';
SET @columnname = 'custom_field_values';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'ALTER TABLE feedback DROP COLUMN custom_field_values',
  'SELECT 1'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- 2. Remove custom_fields from form_settings if present
SET @tablename = 'form_settings';
SET @columnname = 'custom_fields';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'ALTER TABLE form_settings DROP COLUMN custom_fields',
  'SELECT 1'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;
