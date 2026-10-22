<?php
/**
 * Form Settings API - Per-canteen feedback form configuration
 * GET    /api/form-settings?canteen_id=X  — Get settings (public, used by feedback form)
 * PUT    /api/form-settings               — Update settings (admin/branch_admin only)
 */

try {
    require_once __DIR__ . '/../init.php';
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
                    theme_id VARCHAR(50) NOT NULL DEFAULT 'default',
                    theme_custom_texts JSON NULL DEFAULT NULL,
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
            // Migrate: add theme_id if missing
            $tCols = Database::fetchAll("SHOW COLUMNS FROM form_settings LIKE 'theme_id'");
            if (empty($tCols)) {
                Database::execute("ALTER TABLE form_settings ADD COLUMN theme_id VARCHAR(50) NOT NULL DEFAULT 'default' AFTER custom_fields");
            }
            // Migrate: add theme_custom_texts if missing
            $tcCols = Database::fetchAll("SHOW COLUMNS FROM form_settings LIKE 'theme_custom_texts'");
            if (empty($tcCols)) {
                Database::execute("ALTER TABLE form_settings ADD COLUMN theme_custom_texts JSON NULL DEFAULT NULL AFTER theme_id");
            }
            // Migrate: add bg_image_enabled if missing
            $bgCols = Database::fetchAll("SHOW COLUMNS FROM form_settings LIKE 'bg_image_enabled'");
            if (empty($bgCols)) {
                Database::execute("ALTER TABLE form_settings ADD COLUMN bg_image_enabled TINYINT(1) DEFAULT 0 AFTER theme_custom_texts");
            }
            // Migrate: add bg_image_data if missing
            $bgDataCols = Database::fetchAll("SHOW COLUMNS FROM form_settings LIKE 'bg_image_data'");
            if (empty($bgDataCols)) {
                Database::execute("ALTER TABLE form_settings ADD COLUMN bg_image_data LONGTEXT NULL DEFAULT NULL AFTER bg_image_enabled");
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
    $hasThemeCols = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'theme_id'");
    $hasBgCols = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'bg_image_enabled'");

    $selectCols = 'enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id';
    if ($hasCustomFields) {
        $selectCols .= ', custom_fields';
    }
    if ($hasThemeCols) {
        $selectCols .= ', theme_id, theme_custom_texts';
    }
    if ($hasBgCols) {
        $selectCols .= ', bg_image_enabled, bg_image_data';
    }

    $settings = Database::fetchOne(
        "SELECT $selectCols FROM form_settings WHERE canteen_id = ?",
        [$canteenId]
    );

    $customFields = [];
    $themeId = 'default';
    $themeCustomTexts = null;

    if ($settings) {
        if (!empty($settings['custom_fields'])) {
            $decoded = is_string($settings['custom_fields']) ? json_decode($settings['custom_fields'], true) : $settings['custom_fields'];
            if (is_array($decoded)) {
                $customFields = $decoded;
            }
        }
        if (!empty($settings['theme_id'])) {
            $themeId = $settings['theme_id'];
        }
        if (!empty($settings['theme_custom_texts'])) {
            $decodedTexts = is_string($settings['theme_custom_texts']) ? json_decode($settings['theme_custom_texts'], true) : $settings['theme_custom_texts'];
            if (is_array($decodedTexts)) {
                $themeCustomTexts = $decodedTexts;
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
            'theme_id' => 'default',
            'theme_custom_texts' => null,
            'bg_image_enabled' => 0,
            'bg_image_data' => null,
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
        'theme_id' => $themeId,
        'theme_custom_texts' => $themeCustomTexts,
        'bg_image_enabled' => intval($settings['bg_image_enabled'] ?? 0),
        'bg_image_data' => $settings['bg_image_data'] ?? null,
    ];

    Response::success(['settings' => $resultSettings]);
}

/**
 * PUT /api/form-settings
 * Body: { canteen_id, enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id, custom_fields, theme_id, theme_custom_texts }
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

    // Fetch existing settings first to safely support partial updates
    $existing = Database::fetchOne('SELECT * FROM form_settings WHERE canteen_id = ?', [$canteenId]);

    $enableFullscreen = isset($data['enable_fullscreen']) ? intval($data['enable_fullscreen']) : ($existing ? intval($existing['enable_fullscreen']) : 0);
    $collectUserInfo  = isset($data['collect_user_info']) ? intval($data['collect_user_info']) : ($existing ? intval($existing['collect_user_info']) : 0);
    $fieldName        = isset($data['field_name']) ? intval($data['field_name']) : ($existing ? intval($existing['field_name']) : 0);
    $fieldDepartment  = isset($data['field_department']) ? intval($data['field_department']) : ($existing ? intval($existing['field_department']) : 0);
    $fieldSuggestion  = isset($data['field_suggestion']) ? intval($data['field_suggestion']) : ($existing ? intval($existing['field_suggestion']) : 0);
    $fieldMealSlot    = isset($data['field_meal_slot']) ? intval($data['field_meal_slot']) : ($existing ? intval($existing['field_meal_slot']) : 0);
    $fieldEmployeeId  = isset($data['field_employee_id']) ? intval($data['field_employee_id']) : ($existing ? intval($existing['field_employee_id']) : 0);

    // Validate and sanitize custom_fields if provided
    if (isset($data['custom_fields'])) {
        $customFields = [];
        if (is_array($data['custom_fields'])) {
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
    } else {
        $customFieldsJson = $existing['custom_fields'] ?? null;
    }

    // Validate theme_id against whitelist
    $allowedThemes = ['default', 'sunny_split', 'navy_split', 'midnight_dark', 'chalkboard_menu', 'white_theme'];
    if (isset($data['theme_id'])) {
        $themeId = in_array(strval($data['theme_id']), $allowedThemes, true) ? strval($data['theme_id']) : 'default';
    } else {
        $themeId = $existing['theme_id'] ?? 'default';
    }

    // Sanitize theme_custom_texts
    if (array_key_exists('theme_custom_texts', $data)) {
        $themeCustomTextsJson = null;
        if (is_array($data['theme_custom_texts'])) {
            $raw = $data['theme_custom_texts'];
            $cleanTexts = [];
            if (isset($raw['title'])) {
                $cleanTexts['title'] = mb_substr(trim(strip_tags(strval($raw['title']))), 0, 120);
            }
            if (isset($raw['subtitle'])) {
                $cleanTexts['subtitle'] = mb_substr(trim(strip_tags(strval($raw['subtitle']))), 0, 180);
            }
            if (isset($raw['badge_text'])) {
                $cleanTexts['badge_text'] = mb_substr(trim(strip_tags(strval($raw['badge_text']))), 0, 60);
            }
            if (isset($raw['submit_text'])) {
                $cleanTexts['submit_text'] = mb_substr(trim(strip_tags(strval($raw['submit_text']))), 0, 50);
            }
            if (isset($raw['heading'])) {
                $cleanTexts['heading'] = mb_substr(trim(strip_tags(strval($raw['heading']))), 0, 120);
            }
            if (isset($raw['subheading'])) {
                $cleanTexts['subheading'] = mb_substr(trim(strip_tags(strval($raw['subheading']))), 0, 250);
            }
            if (!empty($cleanTexts)) {
                $themeCustomTextsJson = json_encode($cleanTexts, JSON_UNESCAPED_UNICODE);
            }
        }
    } else {
        $themeCustomTextsJson = $existing['theme_custom_texts'] ?? null;
    }

    // Validate bg_image_enabled
    $bgImageEnabled = isset($data['bg_image_enabled']) ? (empty($data['bg_image_enabled']) ? 0 : 1) : ($existing ? intval($existing['bg_image_enabled'] ?? 0) : 0);

    // Validate bg_image_data
    $bgImageData = $existing['bg_image_data'] ?? null;
    if (array_key_exists('bg_image_data', $data)) {
        if ($data['bg_image_data'] === null || $data['bg_image_data'] === '') {
            $bgImageData = null;
        } else {
            $rawImg = strval($data['bg_image_data']);
            // Base64 size validation (~3MB base64 is ~2MB binary)
            if (strlen($rawImg) > 3145728) {
                Response::error('Background image exceeds maximum allowed size of 2MB', 400);
                return;
            }

            // Verify MIME header prefix: jpeg, png, webp
            if (preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+\/=\s]+)$/', $rawImg, $matches)) {
                $base64Content = $matches[2];
                $decoded = base64_decode($base64Content, true);
                if ($decoded === false || strlen($decoded) > 2097152) {
                    Response::error('Invalid image data or image exceeds 2MB', 400);
                    return;
                }

                // Deep image check using getimagesizefromstring if available
                if (function_exists('getimagesizefromstring')) {
                    $imgInfo = @getimagesizefromstring($decoded);
                    if ($imgInfo === false) {
                        Response::error('Uploaded file is not a valid image file', 400);
                        return;
                    }
                    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!isset($imgInfo['mime']) || !in_array($imgInfo['mime'], $allowedMimes, true)) {
                        Response::error('Unsupported image format. Allowed formats: JPG, PNG, WEBP', 400);
                        return;
                    }
                }
                $bgImageData = $rawImg;
            } else {
                Response::error('Invalid image format. Allowed formats: JPG, PNG, WEBP', 400);
                return;
            }
        }
    }

    // Check if columns exist
    $hasCustomFieldsCol = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'custom_fields'");
    $hasThemeCol = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'theme_id'");
    $hasBgCol = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'bg_image_enabled'");

    // Upsert
    if ($existing) {
        if ($hasBgCol && $hasCustomFieldsCol && $hasThemeCol) {
            Database::execute(
                'UPDATE form_settings SET enable_fullscreen = ?, collect_user_info = ?, field_name = ?, field_department = ?, field_suggestion = ?, field_meal_slot = ?, field_employee_id = ?, custom_fields = ?, theme_id = ?, theme_custom_texts = ?, bg_image_enabled = ?, bg_image_data = ? WHERE canteen_id = ?',
                [$enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId, $customFieldsJson, $themeId, $themeCustomTextsJson, $bgImageEnabled, $bgImageData, $canteenId]
            );
        } elseif ($hasCustomFieldsCol && $hasThemeCol) {
            Database::execute(
                'UPDATE form_settings SET enable_fullscreen = ?, collect_user_info = ?, field_name = ?, field_department = ?, field_suggestion = ?, field_meal_slot = ?, field_employee_id = ?, custom_fields = ?, theme_id = ?, theme_custom_texts = ? WHERE canteen_id = ?',
                [$enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId, $customFieldsJson, $themeId, $themeCustomTextsJson, $canteenId]
            );
        } elseif ($hasCustomFieldsCol) {
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
        if ($hasBgCol && $hasCustomFieldsCol && $hasThemeCol) {
            Database::execute(
                'INSERT INTO form_settings (canteen_id, enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id, custom_fields, theme_id, theme_custom_texts, bg_image_enabled, bg_image_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$canteenId, $enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId, $customFieldsJson, $themeId, $themeCustomTextsJson, $bgImageEnabled, $bgImageData]
            );
        } elseif ($hasCustomFieldsCol && $hasThemeCol) {
            Database::execute(
                'INSERT INTO form_settings (canteen_id, enable_fullscreen, collect_user_info, field_name, field_department, field_suggestion, field_meal_slot, field_employee_id, custom_fields, theme_id, theme_custom_texts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$canteenId, $enableFullscreen, $collectUserInfo, $fieldName, $fieldDepartment, $fieldSuggestion, $fieldMealSlot, $fieldEmployeeId, $customFieldsJson, $themeId, $themeCustomTextsJson]
            );
        } elseif ($hasCustomFieldsCol) {
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
