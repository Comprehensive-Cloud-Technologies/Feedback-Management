-- Migration 006: Add Theme Configuration to form_settings
-- Safe, additive migration for Canteen Feedback System

SET @dbname = DATABASE();
SET @tablename = 'form_settings';

-- Add theme_id column if not exists
SET @colname = 'theme_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @colname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @colname, ' VARCHAR(50) NOT NULL DEFAULT \'default\' AFTER custom_fields')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add theme_custom_texts column if not exists
SET @colname = 'theme_custom_texts';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @colname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @colname, ' JSON NULL DEFAULT NULL AFTER theme_id')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
