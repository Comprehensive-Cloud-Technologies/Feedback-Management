<?php
/**
 * DIAGNOSTIC SCRIPT - Troubleshoot all errors
 * Run: https://feedback.catalystsolutions.eco/api/diagnose.php
 */

header('Content-Type: application/json');

$errors = [];
$warnings = [];
$success = [];

// Check 1: .env exists
if (!file_exists(__DIR__ . '/.env')) {
    $errors[] = ".env file missing at: " . __DIR__ . '/.env';
} else {
    $success[] = ".env file found";
    
    // Check 2: .env is readable
    if (!is_readable(__DIR__ . '/.env')) {
        $errors[] = ".env file is not readable";
    } else {
        $success[] = ".env file is readable";
    }
}

// Check 3: config/database.php exists
if (!file_exists(__DIR__ . '/config/database.php')) {
    $errors[] = "config/database.php missing";
} else {
    $success[] = "config/database.php found";
}

// Check 4: config/constants.php exists
if (!file_exists(__DIR__ . '/config/constants.php')) {
    $errors[] = "config/constants.php missing";
} else {
    $success[] = "config/constants.php found";
}

// Check 5: utils/jwt.php exists
if (!file_exists(__DIR__ . '/utils/jwt.php')) {
    $errors[] = "utils/jwt.php missing";
} else {
    $success[] = "utils/jwt.php found";
}

// Check 6: utils/auth.php exists
if (!file_exists(__DIR__ . '/utils/auth.php')) {
    $errors[] = "utils/auth.php missing";
} else {
    $success[] = "utils/auth.php found";
}

// Check 7: utils/response.php exists
if (!file_exists(__DIR__ . '/utils/response.php')) {
    $errors[] = "utils/response.php missing";
} else {
    $success[] = "utils/response.php found";
}

// Check 8: branch-admins/index.php exists
if (!file_exists(__DIR__ . '/branch-admins/index.php')) {
    $errors[] = "branch-admins/index.php missing";
} else {
    $success[] = "branch-admins/index.php found";
}

// Check 9: Try loading .env
if (empty($errors)) {
    $envFile = __DIR__ . '/.env';
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $envVars = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $envVars[$name] = true;
    }
    
    if (isset($envVars['DB_HOST'])) {
        $success[] = "DB_HOST found in .env";
    } else {
        $errors[] = "DB_HOST NOT in .env";
    }
    
    if (isset($envVars['DB_NAME'])) {
        $success[] = "DB_NAME found in .env";
    } else {
        $errors[] = "DB_NAME NOT in .env";
    }
    
    if (isset($envVars['DB_USER'])) {
        $success[] = "DB_USER found in .env";
    } else {
        $errors[] = "DB_USER NOT in .env";
    }
    
    if (isset($envVars['JWT_SECRET'])) {
        $success[] = "JWT_SECRET found in .env";
    } else {
        $warnings[] = "JWT_SECRET NOT in .env (will use fallback)";
    }
    
    if (isset($envVars['ADMIN_PASSWORD'])) {
        $success[] = "ADMIN_PASSWORD found in .env";
    } else {
        $warnings[] = "ADMIN_PASSWORD NOT in .env (will use fallback)";
    }
}

// Check 10: Try loading init.php
if (empty($errors)) {
    try {
        require_once __DIR__ . '/init.php';
        $success[] = "init.php loaded successfully";
        
        // Check if classes are defined
        if (class_exists('Database')) {
            $success[] = "Database class found";
        } else {
            $errors[] = "Database class NOT found after loading init.php";
        }
        
        if (class_exists('JWT')) {
            $success[] = "JWT class found";
        } else {
            $errors[] = "JWT class NOT found after loading init.php";
        }
        
        if (class_exists('Auth')) {
            $success[] = "Auth class found";
        } else {
            $errors[] = "Auth class NOT found after loading init.php";
        }
        
        if (class_exists('Response')) {
            $success[] = "Response class found";
        } else {
            $errors[] = "Response class NOT found after loading init.php";
        }
        
        // Check if constants are defined
        if (defined('JWT_SECRET')) {
            $success[] = "JWT_SECRET constant defined: " . substr(JWT_SECRET, 0, 10) . "...";
        } else {
            $errors[] = "JWT_SECRET constant NOT defined";
        }
        
    } catch (Throwable $e) {
        $errors[] = "FAILED to load init.php: " . $e->getMessage();
    }
}

// Check 11: Try database connection
if (empty($errors) && class_exists('Database')) {
    try {
        $result = Database::fetchOne('SELECT 1');
        $success[] = "Database connection successful";
        
        // Check if branch_admins table exists
        $tables = Database::fetchAll("SHOW TABLES");
        $tableNames = [];
        foreach ($tables as $table) {
            $tableNames[] = array_values($table)[0];
        }
        
        if (in_array('branch_admins', $tableNames)) {
            $success[] = "branch_admins table exists";
        } else {
            $errors[] = "branch_admins table does NOT exist";
        }
        
        if (in_array('sites', $tableNames)) {
            $success[] = "sites table exists";
        } else {
            $errors[] = "sites table does NOT exist";
        }
        
    } catch (Throwable $e) {
        $errors[] = "FAILED to connect to database: " . $e->getMessage();
    }
}

echo json_encode([
    'success' => count($errors) === 0,
    'files_ok' => count($errors) === 0,
    'success_checks' => $success,
    'warnings' => $warnings,
    'errors' => $errors,
    'timestamp' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
?>
