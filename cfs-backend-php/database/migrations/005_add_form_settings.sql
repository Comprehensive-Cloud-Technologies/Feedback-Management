-- Migration: Add form_settings table for per-canteen form configuration
-- Controls: fullscreen mode, user info fields, meal slot dropdown visibility

CREATE TABLE IF NOT EXISTS form_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    canteen_id INT NOT NULL,
    enable_fullscreen TINYINT(1) DEFAULT 0,
    collect_user_info TINYINT(1) DEFAULT 0,
    field_name TINYINT(1) DEFAULT 0,
    field_department TINYINT(1) DEFAULT 0,
    field_suggestion TINYINT(1) DEFAULT 0,
    field_meal_slot TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_canteen (canteen_id),
    FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
