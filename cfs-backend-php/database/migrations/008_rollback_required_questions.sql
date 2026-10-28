-- Migration 008 Rollback: Remove is_required from questions
-- Note: This does NOT undo the feedback.segment_id backfill (data is safe to keep)
ALTER TABLE questions DROP COLUMN IF EXISTS is_required;
