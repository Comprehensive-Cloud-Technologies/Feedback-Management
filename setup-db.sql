-- Create new canteen_feedback database
CREATE DATABASE IF NOT EXISTS canteen_feedback CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE canteen_feedback;

-- Create MySQL user for app (if not exists)
CREATE USER IF NOT EXISTS 'feedback_user'@'localhost' IDENTIFIED BY 'feedback123';

-- Grant all permissions
GRANT ALL PRIVILEGES ON canteen_feedback.* TO 'feedback_user'@'localhost';
FLUSH PRIVILEGES;

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_site_username (site, username),
    INDEX idx_site (site)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Sites table
CREATE TABLE IF NOT EXISTS sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    branch_location VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_location (location),
    INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Canteens table
CREATE TABLE IF NOT EXISTS canteens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_site_canteen (site, name),
    INDEX idx_site (site)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Questions table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site VARCHAR(100) NOT NULL,
    question_text VARCHAR(500) NOT NULL,
    emoji VARCHAR(10) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_site (site)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Branch Admins table
CREATE TABLE IF NOT EXISTS branch_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_site_branch_admin (site, username),
    INDEX idx_site (site)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    site VARCHAR(100) NOT NULL,
    canteen_id INT NOT NULL,
    rating DECIMAL(4,2) NOT NULL,
    username VARCHAR(100) DEFAULT NULL,
    responses JSON NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE,
    INDEX idx_site (site),
    INDEX idx_canteen (canteen_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Database canteen_feedback created successfully!' AS status;
