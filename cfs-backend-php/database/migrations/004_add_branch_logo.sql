-- Migration: Add logo support to branch_admins
-- Date: February 2, 2026
-- Description: Adds logo column to branch_admins for branch-specific branding

-- Add logo column to branch_admins table
ALTER TABLE branch_admins ADD COLUMN logo LONGTEXT NULL AFTER password;

-- Verification query:
-- SELECT id, site, username, logo FROM branch_admins LIMIT 5;
