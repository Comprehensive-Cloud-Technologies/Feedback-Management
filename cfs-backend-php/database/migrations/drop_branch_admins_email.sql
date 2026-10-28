-- Drop branch_admins.email (Idempotent for production and local)
-- Safe: Checks if column exists before dropping.
-- Note: On local, column is 100% NULL and unused by any application code.

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
  ) > 0,
  'ALTER TABLE branch_admins DROP COLUMN email;',
  'SELECT "Column email does not exist in branch_admins, skipping drop" AS status;'
));
PREPARE dropIfExists FROM @preparedStatement;
EXECUTE dropIfExists;
DEALLOCATE PREPARE dropIfExists;
