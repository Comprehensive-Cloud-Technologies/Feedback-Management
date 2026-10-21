-- Migration 007: Add Background Image Support to form_settings
-- Safe, additive migration for Canteen Feedback System (Default Theme Background Image + Glassmorphism)

SET @dbname = DATABASE();
SET @tablename = 'form_settings';

-- Add bg_image_enabled column if not exists
SET @colname = 'bg_image_enabled';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @colname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @colname, ' TINYINT(1) DEFAULT 0 AFTER theme_custom_texts')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add bg_image_data column if not exists
SET @colname = 'bg_image_data';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @colname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @colname, ' LONGTEXT NULL DEFAULT NULL AFTER bg_image_enabled')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
