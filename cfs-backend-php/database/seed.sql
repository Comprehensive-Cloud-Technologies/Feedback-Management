-- Seed Data for Canteen Feedback System
USE canteen_feedback_system;

-- Sample Sites
INSERT INTO sites (location, branch_location) VALUES
('Mumbai Central', 'Mumbai Central Location'),
('Delhi NCR', 'Delhi NCR Location'),
('Bangalore Tech Park', 'Bangalore Tech Park Location'),
('Pune Office', 'Pune Office Location'),
('Chennai Branch', 'Chennai Branch Location')
ON DUPLICATE KEY UPDATE location=location;

-- Sample Branch Admins (passwords are hashed versions of the plain text passwords)
-- mumbai123, delhi123, bangalore123, pune123, chennai123
INSERT INTO branch_admins (site, username, password) VALUES
('Mumbai Central', 'mumbai_admin', '$2y$10$YourHashedPasswordHere1'),
('Delhi NCR', 'delhi_admin', '$2y$10$YourHashedPasswordHere2'),
('Bangalore Tech Park', 'blr_admin', '$2y$10$YourHashedPasswordHere3'),
('Pune Office', 'pune_admin', '$2y$10$YourHashedPasswordHere4'),
('Chennai Branch', 'chennai_admin', '$2y$10$YourHashedPasswordHere5')
ON DUPLICATE KEY UPDATE username=username;

-- Default Questions for each site
INSERT INTO questions (site, question_text, emoji) 
SELECT s.location, q.question_text, q.emoji
FROM sites s
CROSS JOIN (
    SELECT 'How was the taste of the food?' as question_text, '😀' as emoji
    UNION ALL SELECT 'Was the food served hot and fresh?', '🙂'
    UNION ALL SELECT 'How was the cleanliness of the dining area?', '😐'
    UNION ALL SELECT 'Was the staff polite and helpful?', '😞'
    UNION ALL SELECT 'Would you recommend our canteen to others?', '👍'
) q
ON DUPLICATE KEY UPDATE question_text=question_text;

-- Sample Canteens
INSERT INTO canteens (site, name) VALUES
('Mumbai Central', 'Main Cafeteria'),
('Mumbai Central', 'Quick Bites'),
('Delhi NCR', 'North Wing Canteen'),
('Delhi NCR', 'South Wing Canteen'),
('Bangalore Tech Park', 'Tech Cafe'),
('Pune Office', 'Pune Canteen'),
('Chennai Branch', 'Chennai Mess')
ON DUPLICATE KEY UPDATE name=name;
