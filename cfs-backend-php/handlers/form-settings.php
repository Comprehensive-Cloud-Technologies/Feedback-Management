<?php
/**
 * Form Settings API - Per-canteen feedback form configuration
 * GET    /api/form-settings?canteen_id=X  — Get settings (public, used by feedback form)
 * PUT    /api/form-settings               — Update settings (admin/branch_admin only)
 */

try {
    ensureFormSettingsSchema();

    $method = Response::getMethod();

    switch ($method) {
        case 'GET':
            handleGet();
            break;
        case 'PUT':
        case 'POST':
            handlePut();
            break;
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Throwable $e) {
    error_log("Form Settings API fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit(0);
}

function ensureFormSettingsSchema()
{
    try {
        $tableExists = Database::fetchOne("SHOW TABLES LIKE 'form_settings'");
        if (!$tableExists) {
            Database::execute("
                CREATE TABLE form_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    canteen_id INT NOT NULL,
                    enable_fullscreen TINYINT(1) DEFAULT 0,
                    collect_user_info TINYINT(1) DEFAULT 0,
                    field_name TINYINT(1) DEFAULT 0,
                    field_department TINYINT(1) DEFAULT 0,
                    field_suggestion TINYINT(1) DEFAULT 0,
                    field_meal_slot TINYINT(1) DEFAULT 0,
                    field_employee_id TINYINT(1) DEFAULT 0,
                    custom_fields JSON NULL DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_canteen (canteen_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        } else {
            // Migrate: add field_employee_id if missing
            $cols = Database::fetchAll("SHOW COLUMNS FROM form_settings LIKE 'field_employee_id'");
            if (empty($cols)) {
                Database::execute("ALTER TABLE form_settings ADD COLUMN field_employee_id TINYINT(1) DEFAULT 0 AFTER field_meal_slot");
            }
            // Migrate: add custom_fields if missing
            $cfCols = Database::fetchAll("SHOW COLUMNS FROM form_settings LIKE 'custom_fields'");
            if (empty($cfCols)) {
                Database::execute("ALTER TABLE form_settings ADD COLUMN custom_fields JSON NULL DEFAULT NULL AFTER field_employee_id");
            }
        }
    } catch (Throwable $e) {
        error_log('Form settings schema check failed: ' . $e->getMessage());
    }
}

/**
 * GET /api/form-settings?canteen_id=X
 * Public endpoint — feedback form reads this to know what to show
 */
function handleGet()
{
    $query = Response::getQuery();

    if (!isset($query['canteen_id'])) {
        Response::error('Missing canteen_id parameter', 400);
    }

    $canteenId = intval($query['canteen_id']);

    $hasCustomFields = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'custom_fields'");
    $selectCols = 'enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id';
    if ($hasCustomFields) {
        $selectCols .= ', custom_fields';
    }

    $settings = Database::fetchOne(
        "SELECT $selectCols FROM form_settings WHERE canteen_id = ?",
        [$canteenId]
    );

    $customFields = [];
    if ($settings) {
        if (!empty($settings['custom_fields'])) {
            $decoded = is_string($settings['custom_fields']) ? json_decode($settings['custom_fields'], true) : $settings['custom_fields'];
            if (is_array($decoded)) {
                $customFields = $decoded;
            }
        }
    } else {
        // Return defaults — all disabled
        $settings = [
            'enable_fullscreen' => 0,
            'collect_user_info' => 0,
            'field_name' => 0,
            'field_department' => 0,
            'field_suggestion' => 0,
            'field_meal_slot' => 0,
            'field_employee_id' => 0,
        ];
    }

    $resultSettings = [
        'enable_fullscreen' => intval($settings['enable_fullscreen'] ?? 0),
        'collect_user_info' => intval($settings['collect_user_info'] ?? 0),
        'field_name' => intval($settings['field_name'] ?? 0),
        'field_department' => intval($settings['field_department'] ?? 0),
        'field_suggestion' => intval($settings['field_suggestion'] ?? 0),
        'field_meal_slot' => intval($settings['field_meal_slot'] ?? 0),
        'field_employee_id' => intval($settings['field_employee_id'] ?? 0),
        'custom_fields' => $customFields,
    ];

    Response::success(['settings' => $resultSettings]);
}

/**
 * PUT /api/form-settings
 * Body: { canteen_id, enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id, custom_fields }
 */
function handlePut()
{
    Auth::requireAdminOrBranch();

    $data = Response::getBody();
    if (!isset($data['canteen_id'])) {
        Response::error('Missing canteen_id', 400);
    }

    $canteenId = intval($data['canteen_id']);

    // Verify canteen exists
    $canteen = Database::fetchOne('SELECT id FROM canteens WHERE id = ?', [$canteenId]);
    if (!$canteen) {
        Response::error('Canteen not found', 404);
    }

    $enableFullscreen = isset($data['enable_fullscreen']) ? intval($data['enable_fullscreen']) : 0;
    $collectUserInfo  = isset($data['collect_user_info']) ? intval($data['collect_user_info']) : 0;
    $fieldName        = isset($data['field_name']) ? intval($data['field_name']) : 0;
    $fieldDepartment  = isset($data['field_department']) ? intval($data['field_department']) : 0;
    $fieldSuggestion  = isset($data['field_suggestion']) ? intval($data['field_suggestion']) : 0;
    $fieldMealSlot    = isset($data['field_meal_slot']) ? intval($data['field_meal_slot']) : 0;
    $fieldEmployeeId  = isset($data['field_employee_id']) ? intval($data['field_employee_id']) : 0;

    // Validate and sanitize custom_fields
    $customFields = [];
    if (isset($data['custom_fields']) && is_array($data['custom_fields'])) {
        foreach ($data['custom_fields'] as $cf) {
            if (!is_array($cf)) continue;
            $id = isset($cf['id']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', strval($cf['id'])) : uniqid('cf_');
            if (empty($id)) $id = uniqid('cf_');

            $label = isset($cf['label']) ? trim(strip_tags(strval($cf['label']))) : '';
            if ($label === '') continue; // Skip empty label
            if (mb_strlen($label) > 100) $label = mb_substr($label, 0, 100);

            $type = isset($cf['type']) ? strval($cf['type']) : 'text';
            if (!in_array($type, ['text', 'dropdown_single', 'dropdown_multi'])) {
                $type = 'text';
            }

            $options = [];
            if (in_array($type, ['dropdown_single', 'dropdown_multi']) && isset($cf['options']) && is_array($cf['options'])) {
                $seen = [];
                foreach ($cf['options'] as $opt) {
                    $optStr = trim(strip_tags(strval($opt)));
                    if ($optStr !== '' && !isset($seen[$optStr])) {
                        $seen[$optStr] = true;
                        if (mb_strlen($optStr) > 150) $optStr = mb_substr($optStr, 0, 150);
                        $options[] = $optStr;
                    }
                }
            }

            $placeholder = isset($cf['placeholder']) ? trim(strip_tags(strval($cf['placeholder']))) : '';
            if (mb_strlen($placeholder) > 100) $placeholder = mb_substr($placeholder, 0, 100);

            $required = !empty($cf['required']);
            $enabled = isset($cf['enabled']) ? !empty($cf['enabled']) : true;
            $order = isset($cf['order']) ? intval($cf['order']) : count($customFields);

            $customFields[] = [
                'id' => $id,
                'label' => $label,
                'type' => $type,
                'options' => $options,
                'placeholder' => $placeholder,
                'required' => $required,
                'enabled' => $enabled,
                'order' => $order
            ];
        }
    }
    $customFieldsJson = !empty($customFields) ? json_encode($customFields, JSON_UNESCAPED_UNICODE) : null;

    // Check if custom_fields column exists
    $hasCustomFieldsCol = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'custom_fields'");

    // Upsert
    $existing = Database::fetchOne('SELECT id FROM form_settings WHERE canteen_id = ?', [$canteenId]);

    if ($existing) {
        if ($hasCustomFieldsCol) {
            Database::execute(
                'UPDATE form_settings SET enable_fullscreen = ?, collect_user_info = ?, field_name = ?, field_department = ?, field_suggestion = ?, field_meal_slot = ?, field_employee_id = ?, custom_fields = ? WHERE canteen_id = ?',
                [$enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId, $customFieldsJson, $canteenId]
            );
        } else {
            Database::execute(
                'UPDATE form_settings SET enable_fullscreen = ?, collect_user_info = ?, field_name = ?, field_department = ?, field_suggestion = ?, field_meal_slot = ?, field_employee_id = ? WHERE canteen_id = ?',
                [$enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId, $canteenId]
            );
        }
    } else {
        if ($hasCustomFieldsCol) {
            Database::execute(
                'INSERT INTO form_settings (canteen_id, enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id, custom_fields) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$canteenId, $enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId, $customFieldsJson]
            );
        } else {
            Database::execute(
                'INSERT INTO form_settings (canteen_id, enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [$canteenId, $enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId]
            );
        }
    }

    Response::success(['success' => true]);
}
