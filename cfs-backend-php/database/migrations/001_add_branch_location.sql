-- Migration: Add branch_location column to sites table
-- This fixes the schema mismatch where branch_location column is missing

ALTER TABLE sites ADD COLUMN branch_location VARCHAR(150) NOT NULL DEFAULT 'Main Branch' AFTER location;
