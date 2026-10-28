<?php
/**
 * Feedback Submission and Management
 */

try {
    // Initialize first - must be in try block
    require_once __DIR__ . '/../init.php';
    ensureFeedbackSchema();

    $method = Response::getMethod();

    switch ($method) {
        case 'GET':
            handleGet();
            break;
        case 'POST':
            handlePost();
            break;
        case 'DELETE':
            handleDelete();
            break;
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Throwable $e) {
    error_log("Feedback API fatal error: " . $e->getMessage() . " | " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit(0);
}

/**
 * GET /api/feedback - List feedback (admin only)
 * GET /api/feedback?site=xxx - List feedback for specific site
 */
function handleGet()
{
    $user = Auth::requireAdminOrBranch();
    $query = Response::getQuery();
    $requestedSite = isset($query['site']) ? $query['site'] : null;
    $hasSiteId = hasColumnSoft('feedback', 'site_id');

    // If branch admin, enforce site scoping
    if ($user['role'] === 'branch_admin' && isset($user['site'])) {
        if ($requestedSite && $requestedSite !== $user['site']) {
            Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
        }
        $siteFilter = $user['site'];
    } else {
        // Admin can see all or filter by site
        $siteFilter = $requestedSite;
    }

    if ($siteFilter) {
        if ($hasSiteId) {
            $siteId = getSiteIdByName($siteFilter);
            if (!$siteId) {
                Response::error('Site not found', 404);
            }
            $feedback = Database::fetchAll(
                'SELECT f.*, c.name as canteen, s.location AS site, s.segment_id
                 FROM feedback f
                 LEFT JOIN canteens c ON f.canteen_id = c.id
                 LEFT JOIN sites s ON f.site_id = s.id
                 WHERE f.site_id = ?
                 ORDER BY f.timestamp DESC',
                [$siteId]
            );
        } else {
            $feedback = Database::fetchAll(
                'SELECT f.*, c.name as canteen 
                 FROM feedback f 
                 LEFT JOIN canteens c ON f.canteen_id = c.id 
                 WHERE f.site = ? 
                 ORDER BY f.timestamp DESC',
                [$siteFilter]
            );
        }
    } else {
        if ($hasSiteId) {
            $feedback = Database::fetchAll(
                'SELECT f.*, c.name as canteen, s.location AS site, s.segment_id
                 FROM feedback f
                 LEFT JOIN canteens c ON f.canteen_id = c.id
                 LEFT JOIN sites s ON f.site_id = s.id
                 ORDER BY f.timestamp DESC'
            );
        } else {
            $feedback = Database::fetchAll(
                'SELECT f.*, c.name as canteen 
                 FROM feedback f 
                 LEFT JOIN canteens c ON f.canteen_id = c.id 
                 ORDER BY f.timestamp DESC'
            );
        }
    }

    // Fetch all custom field mappings across form_settings
    $fieldsMap = [];
    try {
        $hasCustomFieldsCol = Database::fetchOne("SHOW COLUMNS FROM form_settings LIKE 'custom_fields'");
        if ($hasCustomFieldsCol) {
            $settingsRows = Database::fetchAll("SELECT canteen_id, custom_fields FROM form_settings WHERE custom_fields IS NOT NULL");
            foreach ($settingsRows as $sRow) {
                if (!empty($sRow['custom_fields'])) {
                    $cfs = is_string($sRow['custom_fields']) ? json_decode($sRow['custom_fields'], true) : $sRow['custom_fields'];
                    if (is_array($cfs)) {
                        foreach ($cfs as $cf) {
                            if (!empty($cf['id']) && !empty($cf['label'])) {
                                $fieldsMap[$cf['id']] = $cf['label'];
                            }
                        }
                    }
                }
            }
        }
    } catch (Throwable $t) {
        // Fallback gracefully
    }

    // Decode JSON responses & custom_field_values
    foreach ($feedback as &$row) {
        if (isset($row['responses']) && is_string($row['responses'])) {
            $decoded = json_decode($row['responses'], true);
            $row['responses'] = is_array($decoded) ? $decoded : [];
        } elseif (!isset($row['responses']) || !is_array($row['responses'])) {
            $row['responses'] = [];
        }

        if (isset($row['custom_field_values']) && is_string($row['custom_field_values'])) {
            $decodedCf = json_decode($row['custom_field_values'], true);
            $row['custom_field_values'] = is_array($decodedCf) ? $decodedCf : [];
        } elseif (!isset($row['custom_field_values']) || !is_array($row['custom_field_values'])) {
            $row['custom_field_values'] = [];
        }

        // Attach human-readable labels for custom field keys
        $customLabels = [];
        if (!empty($row['custom_field_values']) && is_array($row['custom_field_values'])) {
            foreach ($row['custom_field_values'] as $cfk => $cfv) {
                if (isset($fieldsMap[$cfk])) {
                    $customLabels[$cfk] = $fieldsMap[$cfk];
                } elseif (preg_match('/^cf_\d+$/', $cfk)) {
                    $customLabels[$cfk] = $cfk;
                } else {
                    $customLabels[$cfk] = trim(preg_replace('/(?<!^)[A-Z]/', ' $0', $cfk));
                }
            }
        }
        $row['custom_field_labels'] = $customLabels;
    }
    unset($row);

    Response::success([
        'feedback' => $feedback,
        'fields_map' => $fieldsMap
    ]);
}

/**
 * POST /api/feedback - Submit feedback
 */
function handlePost()
{
    try {
        $data = Response::getBody();
        Response::validateRequired($data, ['site', 'canteen', 'responses']);

        $site = trim($data['site']);
        $canteen = trim($data['canteen']);
        $responses = $data['responses'];
        $userId = $data['userId'] ?? null;
        $username = $data['username'] ?? null;
        $userNameField = isset($data['user_name']) ? trim($data['user_name']) : null;
        $userDepartment = isset($data['user_department']) ? trim($data['user_department']) : null;
        $userSuggestion = isset($data['user_suggestion']) ? trim($data['user_suggestion']) : null;
        $userEmployeeId = isset($data['user_employee_id']) ? trim($data['user_employee_id']) : null;
        $selectedMealSlot = isset($data['selected_meal_slot']) ? trim($data['selected_meal_slot']) : null;

        error_log("Feedback submission: site=$site, canteen=$canteen, responses count=" . (is_array($responses) ? count($responses) : 'NOT_ARRAY'));

        $hasSiteId = hasColumnSoft('feedback', 'site_id');
        $hasSiteIdCanteen = hasColumnSoft('canteens', 'site_id');
        $siteId = null;

        if ($hasSiteId) {
            $siteId = getSiteIdByName($site);
            if (!$siteId) {
                error_log("Site not found: $site");
                Response::error('Site not found', 404);
                return;
            }
            error_log("Found site_id=$siteId for site=$site");
        }

        if (!is_array($responses) || empty($responses)) {
            error_log('Invalid responses format: ' . json_encode($responses));
            Response::error('Invalid responses format', 400);
            return;
        }



        // Calculate overall rating (average of numeric ratings only)
        $totalRating = 0;
        $ratingCount = 0;
        foreach ($responses as $response) {
            if (is_array($response) && isset($response['rating']) && is_numeric($response['rating'])) {
                $totalRating += floatval($response['rating']);
                $ratingCount++;
            }
        }
        $overallRating = $ratingCount > 0 ? round($totalRating / $ratingCount, 2) : 0;
        error_log("Calculated rating: $overallRating from $ratingCount numeric responses (out of " . count($responses) . " total responses)");

        // Get Canteen & Calculate Meal Category
        $mealCategory = 'Other';
        $canteenId = null;

        if ($hasSiteIdCanteen && $siteId) {
            $canteenRow = Database::fetchOne(
                'SELECT id, meal_slots FROM canteens WHERE site_id = ? AND name = ?',
                [$siteId, $canteen]
            );
        } else {
            $canteenRow = Database::fetchOne(
                'SELECT id, meal_slots FROM canteens WHERE site = ? AND name = ?',
                [$site, $canteen]
            );
        }

        if ($canteenRow) {
            $canteenId = $canteenRow['id'];
            error_log("Found canteen_id=$canteenId for $canteen");

            // Resolve segment_id from canteen -> site -> segment_id
            if (hasColumnSoft('feedback', 'segment_id')) {
                $siteSegRow = Database::fetchOne(
                    'SELECT seg.id as seg_id FROM canteens c JOIN sites s ON c.branch_id = s.id JOIN segments seg ON s.segment_id = seg.id WHERE c.id = ? LIMIT 1',
                    [$canteenId]
                );
                if (!$siteSegRow) {
                    // Fallback: try via site name
                    $siteSegRow = Database::fetchOne(
                        'SELECT segment_id as seg_id FROM sites WHERE location = ? LIMIT 1',
                        [$site]
                    );
                }
                $resolvedSegmentId = $siteSegRow ? $siteSegRow['seg_id'] : null;
            } else {
                $resolvedSegmentId = null;
            }

            // Auto-categorize based on time slots
            $slots = !empty($canteenRow['meal_slots']) ? json_decode($canteenRow['meal_slots'], true) : [];
            if (is_array($slots)) {
                date_default_timezone_set('Asia/Kolkata');
                $now = new DateTime();
                $currentTimeStr = $now->format('H:i');

                foreach ($slots as $slot) {
                    if (!empty($slot['startTime']) && !empty($slot['endTime'])) {
                        $startStr = trim($slot['startTime']);
                        $endStr = trim($slot['endTime']);

                        $start = DateTime::createFromFormat('H:i', $startStr);
                        $end = DateTime::createFromFormat('H:i', $endStr);
                        $current = DateTime::createFromFormat('H:i', $currentTimeStr);

                        if ($start && $end && $current) {
                            if ($start <= $end) {
                                if ($current >= $start && $current <= $end) {
                                    $mealCategory = $slot['category'];
                                    break;
                                }
                            } else {
                                if ($current >= $start || $current <= $end) {
                                    $mealCategory = $slot['category'];
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Create canteen if missing
            error_log("Canteen not found: $canteen, creating it");
            $cols = [];
            $vals = [];
            if ($hasSiteIdCanteen && $siteId) {
                $cols[] = 'site_id';
                $vals[] = $siteId;
            }
            if (hasColumnSoft('canteens', 'site')) {
                $cols[] = 'site';
                $vals[] = $site;
            }
            $cols[] = 'name';
            $vals[] = $canteen;
            $ph = implode(',', array_fill(0, count($cols), '?'));
            $sql = 'INSERT INTO canteens (' . implode(',', $cols) . ') VALUES (' . $ph . ')';
            error_log("Creating canteen with SQL: $sql");
            Database::execute($sql, $vals);
            $canteenId = Database::lastInsertId();
            error_log("Created canteen_id=$canteenId");
        }

        if (!$canteenId) {
            error_log("Failed to get/create canteen");
            Response::error('Failed to process canteen', 500);
            return;
        }

        // Server-side validation of required questions for this canteen/site
        try {
            $hasBranchCol = hasColumnSoft('questions', 'branch_id');
            $hasReqCol = hasColumnSoft('questions', 'is_required');
            $reqSelect = $hasReqCol ? ', is_required' : '';

            if ($canteenId && $hasBranchCol) {
                if ($siteId) {
                    $questionQuery = "SELECT id, question_text, response_type, customization$reqSelect FROM questions WHERE site_id = ? AND (branch_id = ? OR branch_id IS NULL)";
                    $siteQuestions = Database::fetchAll($questionQuery, [$siteId, $canteenId]);
                } else {
                    $questionQuery = "SELECT id, question_text, response_type, customization$reqSelect FROM questions WHERE site = ? AND (branch_id = ? OR branch_id IS NULL)";
                    $siteQuestions = Database::fetchAll($questionQuery, [$site, $canteenId]);
                }
            } else {
                if ($siteId) {
                    $questionQuery = "SELECT id, question_text, response_type, customization$reqSelect FROM questions WHERE site_id = ?";
                    $siteQuestions = Database::fetchAll($questionQuery, [$siteId]);
                } else {
                    $questionQuery = "SELECT id, question_text, response_type, customization$reqSelect FROM questions WHERE site = ?";
                    $siteQuestions = Database::fetchAll($questionQuery, [$site]);
                }
            }

            $responseMap = [];
            foreach ($responses as $r) {
                if (is_array($r) && isset($r['questionId'])) {
                    $responseMap[$r['questionId']] = $r;
                }
            }

            foreach ($siteQuestions as $sq) {
                $qId = $sq['id'];
                $cust = !empty($sq['customization']) ? (is_array($sq['customization']) ? $sq['customization'] : json_decode($sq['customization'], true)) : [];

                $isRequired = false;
                if (isset($sq['is_required']) && $sq['is_required'] !== null) {
                    $isRequired = (intval($sq['is_required']) === 1);
                } elseif (isset($cust['required']) && $cust['required'] !== null) {
                    $isRequired = (bool)$cust['required'];
                } else {
                    $type = $sq['response_type'] ?? 'smiley_faces';
                    $isRating = in_array($type, ['smiley_faces', 'star_rating', 'numeric_scale', 'thumbs', 'scale', 'yes_no']);
                    $isRemark = !empty($cust['is_remark']);
                    $isRequired = $isRating && !$isRemark;
                }

                if ($isRequired) {
                    $userResp = $responseMap[$qId] ?? null;
                    $isAnswered = false;
                    if ($userResp !== null) {
                        $ans = $userResp['answer'] ?? null;
                        $rat = $userResp['rating'] ?? null;
                        if ($rat !== null && $rat !== '' && is_numeric($rat)) {
                            $isAnswered = true;
                        } elseif ($ans !== null && $ans !== '' && $ans !== '-') {
                            if (is_string($ans) && trim($ans) !== '') {
                                $isAnswered = true;
                            } elseif (is_array($ans) && count($ans) > 0) {
                                $isAnswered = true;
                            }
                        }
                    }
                    if (!$isAnswered) {
                        Response::error("Required question '{$sq['question_text']}' was not answered.", 400);
                        return;
                    }
                }
            }
        } catch (Throwable $e) {
            error_log('Error checking required questions: ' . $e->getMessage());
        }

        // Insert feedback - build dynamic column list
        $cols = ['canteen_id', 'rating', 'username', 'responses', 'timestamp'];
        $vals = [$canteenId, $overallRating, $username, json_encode($responses), time() * 1000];

        if ($userId !== null) {
            $cols[] = 'user_id';
            $vals[] = $userId;
        }
        if (hasColumnSoft('feedback', 'meal_category')) {
            $cols[] = 'meal_category';
            $vals[] = $mealCategory;
        }
        if ($hasSiteId && $siteId) {
            $cols[] = 'site_id';
            $vals[] = $siteId;
        }
        if (hasColumnSoft('feedback', 'site')) {
            $cols[] = 'site';
            $vals[] = $site;
        }
        // Populate segment_id if the column exists and we resolved one
        if (hasColumnSoft('feedback', 'segment_id') && !empty($resolvedSegmentId)) {
            $cols[] = 'segment_id';
            $vals[] = $resolvedSegmentId;
        }
        // Populate branch_id and branch_name if available
        if (hasColumnSoft('feedback', 'branch_id') && !empty($siteId)) {
            $cols[] = 'branch_id';
            $vals[] = $siteId;
        }
        if (hasColumnSoft('feedback', 'branch_name') && !empty($site)) {
            $cols[] = 'branch_name';
            $vals[] = $site;
        }

        // User info fields (from form settings)
        if ($userNameField !== null && hasColumnSoft('feedback', 'user_name')) {
            $cols[] = 'user_name';
            $vals[] = $userNameField;
        }
        if ($userDepartment !== null && hasColumnSoft('feedback', 'user_department')) {
            $cols[] = 'user_department';
            $vals[] = $userDepartment;
        }
        if ($userSuggestion !== null && hasColumnSoft('feedback', 'user_suggestion')) {
            $cols[] = 'user_suggestion';
            $vals[] = $userSuggestion;
        }
        if ($userEmployeeId !== null && hasColumnSoft('feedback', 'user_employee_id')) {
            $cols[] = 'user_employee_id';
            $vals[] = $userEmployeeId;
        }
        if ($selectedMealSlot !== null && hasColumnSoft('feedback', 'selected_meal_slot')) {
            $cols[] = 'selected_meal_slot';
            $vals[] = $selectedMealSlot;
        }

        // Custom field values (from dynamic form settings)
        $customFieldValues = null;
        if (isset($data['custom_field_values'])) {
            $rawValues = $data['custom_field_values'];
            if (is_string($rawValues)) {
                $decodedValues = json_decode($rawValues, true);
                if (is_array($decodedValues)) {
                    $customFieldValues = $decodedValues;
                }
            } elseif (is_array($rawValues)) {
                $customFieldValues = $rawValues;
            }
        }

        if ($customFieldValues && hasColumnSoft('feedback', 'custom_field_values')) {
            $sanitizedCustomFields = [];
            foreach ($customFieldValues as $k => $v) {
                $sanitizedKey = preg_replace('/[^a-zA-Z0-9_\-]/', '', strval($k));
                if (empty($sanitizedKey))
                    continue;
                if (is_array($v)) {
                    $sanitizedCustomFields[$sanitizedKey] = array_map(function ($item) {
                        return trim(strip_tags(strval($item)));
                    }, $v);
                } else {
                    $sanitizedCustomFields[$sanitizedKey] = trim(strip_tags(strval($v)));
                }
            }
            if (!empty($sanitizedCustomFields)) {
                $cols[] = 'custom_field_values';
                $vals[] = json_encode($sanitizedCustomFields, JSON_UNESCAPED_UNICODE);
            }
        }

        $ph = implode(',', array_fill(0, count($cols), '?'));
        $sql = 'INSERT INTO feedback (' . implode(',', $cols) . ') VALUES (' . $ph . ')';

        error_log("Insert SQL: $sql with " . count($vals) . " values");
        Database::execute($sql, $vals);

        error_log("Feedback inserted successfully");
        Response::success(['success' => true]);

    } catch (Throwable $e) {
        error_log("handlePost error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
        Response::error('Server error: ' . $e->getMessage(), 500);
    }
}

/**
 * DELETE /api/feedback/:id - Delete feedback
 */
function handleDelete()
{
    $user = Auth::requireAdminOrBranch();
    $query = Response::getQuery();
    $hasSiteId = hasColumnSoft('feedback', 'site_id');

    if (!isset($query['id'])) {
        Response::error('Missing feedback ID', 400);
    }

    $id = $query['id'];

    // If branch admin, verify feedback belongs to their site
    if ($user['role'] === 'branch_admin' && isset($user['site'])) {
        if ($hasSiteId) {
            $feedback = Database::fetchOne(
                'SELECT s.location AS site FROM feedback f LEFT JOIN sites s ON f.site_id = s.id WHERE f.id = ?',
                [$id]
            );
        } else {
            $feedback = Database::fetchOne(
                'SELECT site FROM feedback WHERE id = ?',
                [$id]
            );
        }

        if (!$feedback) {
            Response::error(ERROR_MESSAGES['NOT_FOUND'], 404);
        }

        if ($feedback['site'] !== $user['site']) {
            Response::error('You can only delete feedback from your assigned site', 403);
        }
    }

    Database::execute('DELETE FROM feedback WHERE id = ?', [$id]);

    Response::success(['success' => true]);
}

// --- Schema helpers ---
function ensureFeedbackSchema()
{
    try {
        // Create table if missing
        Database::execute("CREATE TABLE IF NOT EXISTS feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            site VARCHAR(100) NOT NULL,
            site_id INT NULL,
            canteen_id INT NOT NULL,
            rating DECIMAL(4,2) NOT NULL,
            username VARCHAR(100) DEFAULT NULL,
            responses JSON NOT NULL,
            timestamp BIGINT NOT NULL,
            meal_category VARCHAR(100) DEFAULT 'Other',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_site (site),
            INDEX idx_site_id (site_id),
            INDEX idx_canteen (canteen_id),
            INDEX idx_timestamp (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

        // Add site_id column if table already existed without it
        if (!hasColumnSoft('feedback', 'site_id') && hasColumnSoft('sites', 'id')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN site_id INT NULL AFTER site");
        }

        // Backfill site_id when possible
        if (hasColumnSoft('feedback', 'site_id')) {
            Database::execute("UPDATE feedback f JOIN sites s ON f.site = s.location SET f.site_id = s.id WHERE f.site_id IS NULL");
        }

        // Ensure meal_category column exists
        if (!hasColumnSoft('feedback', 'meal_category')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN meal_category VARCHAR(100) DEFAULT 'Other' AFTER timestamp");
        }

        // Backfill feedback.segment_id and branch_id for existing rows that are NULL
        // Path: feedback.canteen_id -> canteens.branch_id -> sites.segment_id
        try {
            if (hasColumnSoft('feedback', 'segment_id') && hasColumnSoft('canteens', 'branch_id') && hasColumnSoft('sites', 'segment_id')) {
                Database::execute(
                    "UPDATE feedback f
                     JOIN canteens c ON f.canteen_id = c.id
                     JOIN sites s ON c.branch_id = s.id
                     SET f.segment_id = s.segment_id
                     WHERE f.segment_id IS NULL AND s.segment_id IS NOT NULL"
                );
            }
            if (hasColumnSoft('feedback', 'branch_id') && hasColumnSoft('canteens', 'branch_id')) {
                Database::execute(
                    "UPDATE feedback f
                     JOIN canteens c ON f.canteen_id = c.id
                     SET f.branch_id = c.branch_id
                     WHERE f.branch_id IS NULL AND c.branch_id IS NOT NULL"
                );
            }
            if (hasColumnSoft('feedback', 'branch_name') && hasColumnSoft('sites', 'location')) {
                Database::execute(
                    "UPDATE feedback f
                     JOIN sites s ON f.branch_id = s.id
                     SET f.branch_name = s.location
                     WHERE (f.branch_name IS NULL OR f.branch_name = '') AND s.location IS NOT NULL"
                );
            }
        } catch (Throwable $e) {
            error_log('feedback backfill relations: ' . $e->getMessage());
        }

        // Ensure FK on site_id if possible
        if (hasColumnSoft('feedback', 'site_id') && hasColumnSoft('sites', 'id')) {
            $fk = Database::fetchOne("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME='feedback' AND COLUMN_NAME='site_id' AND REFERENCED_TABLE_NAME='sites'");
            if (!$fk) {
                try {
                    Database::execute("ALTER TABLE feedback ADD CONSTRAINT feedback_site_fk FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL");
                } catch (Throwable $e) {
                    error_log('feedback add FK site_id failed: ' . $e->getMessage());
                }
            }
        }

        // Ensure user info columns exist
        if (!hasColumnSoft('feedback', 'user_name')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN user_name VARCHAR(100) DEFAULT NULL AFTER meal_category");
        }
        if (!hasColumnSoft('feedback', 'user_department')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN user_department VARCHAR(100) DEFAULT NULL AFTER user_name");
        }
        if (!hasColumnSoft('feedback', 'user_suggestion')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN user_suggestion TEXT DEFAULT NULL AFTER user_department");
        }
        if (!hasColumnSoft('feedback', 'user_employee_id')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN user_employee_id VARCHAR(100) DEFAULT NULL AFTER user_suggestion");
        }
        if (!hasColumnSoft('feedback', 'selected_meal_slot')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN selected_meal_slot VARCHAR(100) DEFAULT NULL AFTER user_suggestion");
        }
        if (!hasColumnSoft('feedback', 'custom_field_values')) {
            Database::execute("ALTER TABLE feedback ADD COLUMN custom_field_values JSON DEFAULT NULL");
        }

        // Ensure FK on canteen_id if possible
        if (hasColumnSoft('canteens', 'id')) {
            $fk2 = Database::fetchOne("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME='feedback' AND COLUMN_NAME='canteen_id' AND REFERENCED_TABLE_NAME='canteens'");
            if (!$fk2) {
                try {
                    Database::execute("ALTER TABLE feedback ADD CONSTRAINT feedback_canteen_fk FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE CASCADE");
                } catch (Throwable $e) {
                    error_log('feedback add FK canteen failed: ' . $e->getMessage());
                }
            }
        }
    } catch (Throwable $e) {
        // Log only; do not block requests
        error_log('ensureFeedbackSchema error: ' . $e->getMessage());
    }
}

function hasColumnSoft($table, $column)
{
    try {
        $row = Database::fetchOne("SHOW COLUMNS FROM {$table} LIKE '{$column}'");
        return $row ? true : false;
    } catch (Throwable $e) {
        error_log("hasColumnSoft {$table}.{$column}: " . $e->getMessage());
        return false;
    }
}

function getSiteIdByName($siteName)
{
    try {
        $row = Database::fetchOne('SELECT id FROM sites WHERE location = ?', [$siteName]);
        return $row ? (int) $row['id'] : null;
    } catch (Throwable $e) {
        error_log('getSiteIdByName failed: ' . $e->getMessage());
        return null;
    }
}
