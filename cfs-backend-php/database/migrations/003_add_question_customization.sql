-- Migration: Add Question Customization
-- Date: January 30, 2026
-- Description: Adds comprehensive customization for question response types

-- Step 1: Add response_type and customization columns to questions table
ALTER TABLE questions ADD COLUMN response_type VARCHAR(50) DEFAULT 'smiley_faces' AFTER emoji;
ALTER TABLE questions ADD COLUMN customization JSON NULL AFTER response_type;

-- Step 2: Create index for response_type
ALTER TABLE questions ADD INDEX idx_response_type (response_type);

-- Step 3: Set default customization based on response_type
-- For existing questions, set default customization
UPDATE questions 
SET customization = JSON_OBJECT(
    'type', 'smiley_faces',
    'options', JSON_ARRAY(
        JSON_OBJECT('value', 1, 'label', 'Poor', 'emoji', '😞'),
        JSON_OBJECT('value', 2, 'label', 'Fair', 'emoji', '😐'),
        JSON_OBJECT('value', 3, 'label', 'Average', 'emoji', '🙂'),
        JSON_OBJECT('value', 4, 'label', 'Good', 'emoji', '😊'),
        JSON_OBJECT('value', 5, 'label', 'Excellent', 'emoji', '😍')
    )
) 
WHERE response_type = 'smiley_faces' AND customization IS NULL;

-- Verification queries:
-- SELECT id, question_text, response_type, customization FROM questions LIMIT 5;
-- SELECT COUNT(*) as total_with_customization FROM questions WHERE customization IS NOT NULL;

