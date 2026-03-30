<?php
require_once __DIR__ . '/../config/database.php';

echo "Starting database schema update...\n";

try {
    // 1. Add meal_slots column to canteens table
    try {
        // Check if column exists first to avoid error on subsequent runs (optional, but robust)
        // Or just try specific ALTER command variant
        // MySQL 8.0 support 'ADD COLUMN IF NOT EXISTS' but older don't.
        // We will try and catch.

        $sql = "ALTER TABLE canteens ADD COLUMN meal_slots JSON DEFAULT NULL";
        Database::execute($sql);
        echo "[SUCCESS] Added 'meal_slots' (JSON) to 'canteens' table.\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "[INFO] 'meal_slots' column already exists in 'canteens'.\n";
        } else {
            // Fallback for older MySQL that might not support JSON type natively (rare now, but possible)
            // If JSON fails, try TEXT
            try {
                echo "[RETRY] JSON type might rely on version. Retrying with TEXT...\n";
                $sql = "ALTER TABLE canteens ADD COLUMN meal_slots TEXT DEFAULT NULL";
                Database::execute($sql);
                echo "[SUCCESS] Added 'meal_slots' (TEXT) to 'canteens' table.\n";
            } catch (Exception $ex) {
                if (strpos($ex->getMessage(), 'Duplicate column') !== false) {
                    echo "[INFO] 'meal_slots' column already exists in 'canteens'.\n";
                } else {
                    echo "[ERROR] Failed to add 'meal_slots': " . $e->getMessage() . "\n";
                }
            }
        }
    }

    // 2. Add meal_category column to feedback table
    try {
        $sql = "ALTER TABLE feedback ADD COLUMN meal_category VARCHAR(100) DEFAULT NULL";
        Database::execute($sql);
        echo "[SUCCESS] Added 'meal_category' to 'feedback' table.\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "[INFO] 'meal_category' column already exists in 'feedback'.\n";
        } else {
            echo "[ERROR] Failed to add 'meal_category': " . $e->getMessage() . "\n";
        }
    }

    echo "Schema update completed.\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
