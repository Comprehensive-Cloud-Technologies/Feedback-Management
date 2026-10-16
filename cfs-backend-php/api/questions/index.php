<?php
/**
 * Questions Management
 */

try {
    // Initialize first - must be in try block
    require_once __DIR__ . '/../init.php';
    ensureQuestionSchema();

    $method = Response::getMethod();

    switch ($method) {
        case 'GET':
            handleGet();
            break;
        case 'POST':
            handlePost();
            break;
        case 'PUT':
            handlePut();
            break;
        case 'DELETE':
            handleDelete();
            break;
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Throwable $e) {
    error_log("Questions API fatal error: " . $e->getMessage() . " | " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit(0);
}

/**
 * GET /api/questions?site=xxx - List questions for a site
 * GET /api/questions - List all questions (admin only)
 */
function handleGet()
{
    $user = Auth::optional();
    $query = Response::getQuery();
    $hasSiteId = hasColumnSoft('questions', 'site_id');
    $hasSegmentId = hasColumnSoft('questions', 'segment_id');
    $hasBranchId = hasColumnSoft('questions', 'branch_id');
    $hasResponseType = hasColumnSoft('questions', 'response_type');
    $hasCustomization = hasColumnSoft('questions', 'customization');

    // Check for ID in path (e.g., /api/questions/123)
    $path = Response::getPath();
    $pathParts = explode('/', trim($path, '/'));
    $idFromPath = (count($pathParts) > 0 && is_numeric($pathParts[count($pathParts) - 1])) ? (int) $pathParts[count($pathParts) - 1] : null;

    if ($idFromPath) {
        $selectFields = 'q.*';
        if ($hasSiteId) {
            $selectFields = 'q.id, q.question_text, q.emoji, q.site_id, s.location AS site';
        }
        if ($hasResponseType)
            $selectFields .= ', q.response_type';
        if ($hasCustomization)
            $selectFields .= ', q.customization';

        $sql = "SELECT $selectFields FROM questions q";
        if ($hasSiteId)
            $sql .= " LEFT JOIN sites s ON q.site_id = s.id";
        $sql .= " WHERE q.id = ?";

        $question = Database::fetchOne($sql, [$idFromPath]);
        if (!$question) {
            Response::error('Question not found', 404);
        }

        if (isset($question['customization']) && $question['customization']) {
            $question['customization'] = json_decode($question['customization'], true);
        }

        Response::success(['question' => $question]);
        return;
    }

    // If no site specified, return all questions (for admin dashboard)
    if (!isset($query['site'])) {
        // Allow admins to see all questions, or return empty array for non-admins
        if ($user && isset($user['role']) && $user['role'] === 'admin') {
            $selectFields = 'q.id, q.question_text, q.emoji';
            if ($hasSegmentId)
                $selectFields .= ', q.segment_id';
            if ($hasBranchId)
                $selectFields .= ', q.branch_id';
            if ($hasResponseType)
                $selectFields .= ', q.response_type';
            if ($hasCustomization)
                $selectFields .= ', q.customization';
            if ($hasSiteId)
                $selectFields .= ', q.site_id, s.location AS site';
            else
                $selectFields .= ', q.site';

            if ($hasSiteId) {
                $questions = Database::fetchAll("SELECT $selectFields FROM questions q LEFT JOIN sites s ON q.site_id = s.id");
            } else {
                $questions = Database::fetchAll("SELECT $selectFields FROM questions");
            }

            // Decode customization JSON
            foreach ($questions as &$q) {
                if (isset($q['customization']) && $q['customization']) {
                    $q['customization'] = json_decode($q['customization'], true);
                }
            }
        } else {
            $questions = [];
        }
        Response::success(['questions' => $questions]);
        return;
    }

    $site = $query['site'];
    $siteId = null;
    if ($hasSiteId) {
        $siteId = getSiteIdByName($site);
        if (!$siteId) {
            Response::error('Site not found', 404);
        }
    }

    // If branch admin, enforce site scoping
    if ($user && isset($user['role']) && $user['role'] === 'branch_admin') {
        if (!isset($user['site']) || $user['site'] !== $site) {
            Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
        }
    }

    if ($hasSiteId) {
        $selectFields = 'q.id, q.question_text, q.emoji, q.site_id, s.location AS site';
        if ($hasSegmentId)
            $selectFields .= ', q.segment_id';
        if ($hasBranchId)
            $selectFields .= ', q.branch_id';
        if ($hasResponseType)
            $selectFields .= ', q.response_type';
        if ($hasCustomization)
            $selectFields .= ', q.customization';

        $sql = "SELECT $selectFields FROM questions q LEFT JOIN sites s ON q.site_id = s.id WHERE q.site_id = ?";
        $params = [$siteId];

        if (isset($query['branch_id']) && $hasBranchId) {
            $sql .= " AND q.branch_id = ?";
            $params[] = $query['branch_id'];
        }

        $questions = Database::fetchAll($sql, $params);
    } else {
        $selectFields = 'id, question_text, emoji';
        if ($hasResponseType)
            $selectFields .= ', response_type';
        if ($hasCustomization)
            $selectFields .= ', customization';

        $sql = "SELECT $selectFields FROM questions WHERE site = ?";
        $params = [$site];

        if (isset($query['branch_id']) && $hasBranchId) {
            $sql .= " AND branch_id = ?";
            $params[] = $query['branch_id'];
        }

        $questions = Database::fetchAll($sql, $params);
    }

    // Decode customization JSON
    foreach ($questions as &$q) {
        if (isset($q['customization']) && $q['customization']) {
            $q['customization'] = json_decode($q['customization'], true);
        }
    }

    Response::success(['questions' => $questions]);
}

/**
 * POST /api/questions - Create question
 */
function handlePost()
{
    $user = Auth::requireAdminOrBranch();

    $hasSiteId = hasColumn('questions', 'site_id');
    $hasSite = hasColumn('questions', 'site');
    $hasSegmentId = hasColumn('questions', 'segment_id');
    $hasBranchId = hasColumn('questions', 'branch_id');
    $hasBranchName = hasColumn('questions', 'branch_name');
    $hasResponseType = hasColumn('questions', 'response_type');
    $hasCustomization = hasColumn('questions', 'customization');

    $data = Response::getBody();
    Response::validateRequired($data, ['site', 'question_text']);

    $site = $data['site'];
    $siteId = null;
    $segmentId = isset($data['segment_id']) ? $data['segment_id'] : null;
    $branchId = isset($data['branch_id']) ? $data['branch_id'] : null;
    $branchName = isset($data['branch_name']) ? $data['branch_name'] : ($site ?: '');
    $questionText = $data['question_text'];
    $emoji = $data['emoji'] ?? null;
    $responseType = isset($data['response_type']) ? $data['response_type'] : 'smiley_faces';
    $customization = isset($data['customization']) ? json_encode($data['customization']) : null;

    if ($hasSiteId) {
        $siteId = getSiteIdByName($site);
        if (!$siteId) {
            Response::error('Site not found', 404);
            return;
        }
    }

    // If branchId is not set, default it to siteId so site queries find it
    if ($hasBranchId && $branchId === null && $siteId !== null) {
        $branchId = $siteId;
    }

    try {
        // Branch admin can only add to their site
        if ($user['role'] === 'branch_admin' && $user['site'] !== $site) {
            Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
            return;
        }

        $cols = [];
        $vals = [];
        if ($hasSegmentId && $segmentId) {
            $cols[] = 'segment_id';
            $vals[] = $segmentId;
        }
        if ($hasBranchId && $branchId !== null) {
            $cols[] = 'branch_id';
            $vals[] = $branchId;
        }
        if ($hasBranchName) {
            $cols[] = 'branch_name';
            $vals[] = $branchName;
        }
        if ($hasSiteId) {
            $cols[] = 'site_id';
            $vals[] = $siteId;
        }
        if ($hasSite) {
            $cols[] = 'site';
            $vals[] = $site;
        }
        $cols[] = 'question_text';
        $vals[] = $questionText;
        $cols[] = 'emoji';
        $vals[] = $emoji;
        if ($hasResponseType) {
            $cols[] = 'response_type';
            $vals[] = $responseType;
        }
        if ($hasCustomization) {
            $cols[] = 'customization';
            $vals[] = $customization;
        }

        $ph = implode(',', array_fill(0, count($cols), '?'));
        $sql = 'INSERT INTO questions (' . implode(',', $cols) . ') VALUES (' . $ph . ')';
        Database::execute($sql, $vals);

        $lastId = Database::lastInsertId();
        $question = Database::fetchOne('SELECT * FROM questions WHERE id = ?', [$lastId]);

        Response::success(['success' => true, 'question' => $question]);
    } catch (Exception $e) {
        error_log("Questions POST error: " . $e->getMessage());
        Response::error('Failed to create question: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT /api/questions/:id - Update question
 */
function handlePut()
{
    $user = Auth::requireAdminOrBranch();

    $hasSiteId = hasColumn('questions', 'site_id');
    $hasResponseType = hasColumn('questions', 'response_type');
    $hasCustomization = hasColumn('questions', 'customization');

    $data = Response::getBody();

    // Check for ID in path, query, or body
    $path = Response::getPath();
    $pathParts = explode('/', trim($path, '/'));
    $idFromPath = (count($pathParts) > 0 && is_numeric($pathParts[count($pathParts) - 1])) ? (int) $pathParts[count($pathParts) - 1] : null;
    $query = Response::getQuery();
    $id = $idFromPath ?? ($data['id'] ?? (isset($query['id']) && is_numeric($query['id']) ? (int)$query['id'] : null));

    if (!$id) {
        Response::error('Missing question ID', 400);
    }

    Response::validateRequired($data, ['question_text']);

    $questionText = $data['question_text'];
    $responseType = isset($data['response_type']) ? $data['response_type'] : null;
    $customization = isset($data['customization']) ? json_encode($data['customization']) : null;

    // If branch admin, verify question belongs to their site
    if ($user['role'] === 'branch_admin') {
        if ($hasSiteId) {
            $question = Database::fetchOne('SELECT s.location AS site FROM questions q LEFT JOIN sites s ON q.site_id = s.id WHERE q.id = ?', [$id]);
        } else {
            $question = Database::fetchOne('SELECT site FROM questions WHERE id = ?', [$id]);
        }
        if (!$question || $question['site'] !== $user['site']) {
            Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
        }
    }

    $setClauses = [];
    $params = [];

    $setClauses[] = 'question_text = ?';
    $params[] = $questionText;

    if ($hasResponseType && $responseType) {
        $setClauses[] = 'response_type = ?';
        $params[] = $responseType;
    }

    if ($hasCustomization && $customization) {
        $setClauses[] = 'customization = ?';
        $params[] = $customization;
    }

    $params[] = $id;
    $setClause = implode(', ', $setClauses);
    Database::execute("UPDATE questions SET $setClause WHERE id = ?", $params);

    Response::success(['success' => true]);
}

/**
 * DELETE /api/questions/:id - Delete question
 */
function handleDelete()
{
    $user = Auth::requireAdminOrBranch();

    $hasSiteId = hasColumn('questions', 'site_id');

    $query = Response::getQuery();

    // Check for ID in path or query
    $path = Response::getPath();
    $pathParts = explode('/', trim($path, '/'));
    $idFromPath = (count($pathParts) > 0 && is_numeric($pathParts[count($pathParts) - 1])) ? (int) $pathParts[count($pathParts) - 1] : null;
    $id = $idFromPath ?? ($query['id'] ?? null);

    if (!$id) {
        Response::error('Missing question ID', 400);
    }

    // If branch admin, verify question belongs to their site
    if ($user['role'] === 'branch_admin') {
        if ($hasSiteId) {
            $question = Database::fetchOne('SELECT s.location AS site FROM questions q LEFT JOIN sites s ON q.site_id = s.id WHERE q.id = ?', [$id]);
        } else {
            $question = Database::fetchOne('SELECT site FROM questions WHERE id = ?', [$id]);
        }
        if (!$question || $question['site'] !== $user['site']) {
            Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
        }
    }

    Database::execute('DELETE FROM questions WHERE id = ?', [$id]);

    Response::success(['success' => true]);
}

// --- Schema helpers ---
function ensureQuestionSchema()
{
    $hasSiteId = false;
    $hasSite = false;
    $hasResponseType = false;
    $hasCustomization = false;

    try {
        $hasSiteId = hasColumn('questions', 'site_id');
    } catch (Throwable $e) {
        error_log('questions hasColumn site_id: ' . $e->getMessage());
    }
    try {
        $hasSite = hasColumn('questions', 'site');
    } catch (Throwable $e) {
        error_log('questions hasColumn site: ' . $e->getMessage());
    }
    try {
        $hasResponseType = hasColumn('questions', 'response_type');
    } catch (Throwable $e) {
        error_log('questions hasColumn response_type: ' . $e->getMessage());
    }
    try {
        $hasCustomization = hasColumn('questions', 'customization');
    } catch (Throwable $e) {
        error_log('questions hasColumn customization: ' . $e->getMessage());
    }

    // Best-effort schema fixes; do not fail requests if ALTER is not allowed
    if (!$hasSite) {
        try {
            Database::execute("ALTER TABLE questions ADD COLUMN site VARCHAR(100) NOT NULL DEFAULT '' AFTER id");
            $hasSite = true;
        } catch (Throwable $e) {
            error_log('questions add site column failed: ' . $e->getMessage());
        }
    }

    if (!$hasSiteId && hasColumnSoft('sites', 'id')) {
        try {
            Database::execute("ALTER TABLE questions ADD COLUMN site_id INT NULL AFTER site");
            Database::execute("UPDATE questions q JOIN sites s ON q.site = s.location SET q.site_id = s.id WHERE q.site_id IS NULL");
            $fk = Database::fetchOne("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME='questions' AND COLUMN_NAME='site_id' AND REFERENCED_TABLE_NAME='sites'");
            if (!$fk) {
                Database::execute("ALTER TABLE questions ADD CONSTRAINT questions_site_fk FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE");
            }
            $hasSiteId = true;
        } catch (Throwable $e) {
            error_log('questions add site_id or FK failed: ' . $e->getMessage());
        }
    }

    // Add response_type column if missing
    if (!$hasResponseType) {
        try {
            Database::execute("ALTER TABLE questions ADD COLUMN response_type VARCHAR(50) DEFAULT 'smiley_faces' AFTER emoji");
            Database::execute("ALTER TABLE questions ADD INDEX idx_response_type (response_type)");
            $hasResponseType = true;
        } catch (Throwable $e) {
            error_log('questions add response_type column failed: ' . $e->getMessage());
        }
    }

    // Add customization column if missing
    if (!$hasCustomization) {
        try {
            Database::execute("ALTER TABLE questions ADD COLUMN customization JSON NULL AFTER response_type");
            $hasCustomization = true;
        } catch (Throwable $e) {
            error_log('questions add customization column failed: ' . $e->getMessage());
        }
    }

    try {
        $idx = Database::fetchOne("SHOW INDEX FROM questions WHERE Key_name = 'idx_site'");
        if (!$idx) {
            if ($hasSiteId) {
                Database::execute("ALTER TABLE questions ADD INDEX idx_site (site_id)");
            } else {
                Database::execute("ALTER TABLE questions ADD INDEX idx_site (site)");
            }
        }
    } catch (Throwable $e) {
        error_log('questions add idx_site failed: ' . $e->getMessage());
    }

    try {
        // Drop any foreign key constraint on questions.branch_id if present to allow canteen scoping
        $fk = Database::fetchOne("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'questions' 
              AND COLUMN_NAME = 'branch_id' 
              AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        if ($fk && !empty($fk['CONSTRAINT_NAME'])) {
            $fkName = $fk['CONSTRAINT_NAME'];
            Database::execute("ALTER TABLE questions DROP FOREIGN KEY `{$fkName}`");
        }

        if (hasColumn('questions', 'branch_name')) {
            Database::execute("ALTER TABLE questions MODIFY COLUMN branch_name VARCHAR(100) NULL DEFAULT ''");
        }
        if (hasColumn('questions', 'branch_id')) {
            Database::execute("ALTER TABLE questions MODIFY COLUMN branch_id INT NULL DEFAULT NULL");
        }
    } catch (Throwable $e) {
        error_log('questions branch columns fix failed: ' . $e->getMessage());
    }
}

function hasColumn($table, $column)
{
    $row = Database::fetchOne("SHOW COLUMNS FROM {$table} LIKE '{$column}'");
    return $row ? true : false;
}

function hasColumnSoft($table, $column)
{
    try {
        return hasColumn($table, $column);
    } catch (Throwable $e) {
        error_log("hasColumnSoft {$table}.{$column}: " . $e->getMessage());
        return false;
    }
}

function getSiteIdByName($siteName)
{
    $row = Database::fetchOne('SELECT id FROM sites WHERE location = ?', [$siteName]);
    return $row ? (int) $row['id'] : null;
}
