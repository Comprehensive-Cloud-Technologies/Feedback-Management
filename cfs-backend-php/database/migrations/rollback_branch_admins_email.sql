-- Rollback: Re-add branch_admins.email
-- Safe: Re-adds column if missing (VARCHAR(255) NULL)
-- Note: Original data was 100% NULL across all rows prior to dropping.

SET @dbname = DATABASE();
SET @tablename = 'branch_admins';
SET @columnname = 'email';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) = 0,
  'ALTER TABLE branch_admins ADD COLUMN email VARCHAR(255) NULL AFTER password;',
  'SELECT "Column email already exists in branch_admins, skipping add" AS status;'
));
PREPARE addIfMissing FROM @preparedStatement;
EXECUTE addIfMissing;
DEALLOCATE PREPARE addIfMissing;
