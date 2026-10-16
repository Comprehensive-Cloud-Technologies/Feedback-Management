-- Migration 006: Add Dynamic Fields and Response Types
-- Description: Additive migration for per-canteen custom user info fields and custom field values.
-- Idempotent and safe to run multiple times.

-- 1. Ensure form_settings table exists
CREATE TABLE IF NOT EXISTS form_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    canteen_id INT NOT NULL,
    enable_fullscreen TINYINT(1) DEFAULT 0,
    collect_user_info TINYINT(1) DEFAULT 0,
    field_name TINYINT(1) DEFAULT 0,
    field_department TINYINT(1) DEFAULT 0,
    field_suggestion TINYINT(1) DEFAULT 0,
    field_meal_slot TINYINT(1) DEFAULT 0,
    field_employee_id TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_canteen (canteen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add custom_fields JSON column to form_settings (if not exists)
SET @dbname = DATABASE();
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
  'SELECT 1',
  'ALTER TABLE form_settings ADD COLUMN custom_fields JSON NULL DEFAULT NULL COMMENT "Array of CustomFieldDefinition objects" AFTER field_employee_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Add custom_field_values JSON column to feedback (if not exists)
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
  'SELECT 1',
  'ALTER TABLE feedback ADD COLUMN custom_field_values JSON NULL DEFAULT NULL COMMENT "Submitted custom user-info field values"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
