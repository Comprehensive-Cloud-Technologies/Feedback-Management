<?php
/**
 * Sites Management - List/Create/Update/Delete
 * Handles all site operations
 */

try {
    // Initialize first - must be in try block
    require_once __DIR__ . '/../init.php';

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
    error_log("Sites API fatal error: " . $e->getMessage() . " | " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit(0);
}

/**
 * GET /api/sites - List all sites with segment information
 */
function handleGet()
{
    try {
        $user = Auth::optional();

        // If branch admin, filter by their site
        if ($user && isset($user['role']) && $user['role'] === 'branch_admin' && isset($user['site'])) {
            $sites = Database::fetchAll(
                'SELECT s.id, s.location, s.branch_location, s.segment_id, seg.name as segment_name, s.created_at 
                 FROM sites s
                 LEFT JOIN segments seg ON s.segment_id = seg.id
                 WHERE s.location = ?
                 ORDER BY s.created_at DESC',
                [$user['site']]
            );
        } else {
            $sites = Database::fetchAll(
                'SELECT s.id, s.location, s.branch_location, s.segment_id, seg.name as segment_name, s.created_at 
                 FROM sites s
                 LEFT JOIN segments seg ON s.segment_id = seg.id
                 ORDER BY s.created_at DESC'
            );
        }

        Response::success(['sites' => $sites]);
    } catch (Exception $e) {
        error_log("Sites GET error: " . $e->getMessage());
        Response::error('Failed to fetch sites: ' . $e->getMessage(), 500);
    } catch (Throwable $t) {
        error_log("Sites GET fatal error: " . $t->getMessage());
        Response::error('Fatal error fetching sites: ' . $t->getMessage(), 500);
    }
}

/**
 * POST /api/sites - Create new site
 */
function handlePost()
{
    $data = Response::getBody();
    Response::validateRequired($data, ['location']);

    $location = $data['location'];
    $branchLocation = isset($data['branch_location']) ? $data['branch_location'] : '';
    $segmentId = isset($data['segment_id']) ? intval($data['segment_id']) : null;

    // Check if site already exists
    try {
        $existing = Database::fetchOne(
            'SELECT id FROM sites WHERE location = ?',
            [$location]
        );

        if ($existing) {
            Response::error('Site already exists', 409);
            return;
        }

        // Validate segment_id if provided
        if ($segmentId) {
            $segment = Database::fetchOne(
                'SELECT id FROM segments WHERE id = ?',
                [$segmentId]
            );
            if (!$segment) {
                Response::error('Invalid segment_id', 400);
                return;
            }
        }

        // Start transaction
        Database::beginTransaction();

        // Insert site with segment_id
        Database::execute(
            'INSERT INTO sites (location, branch_location, segment_id, created_at) VALUES (?, ?, ?, NOW())',
            [$location, $branchLocation, $segmentId]
        );
        $newSiteId = Database::lastInsertId();

        try {
            $hasBranches = Database::fetchOne("SHOW TABLES LIKE 'branches'");
            if ($hasBranches) {
                Database::execute(
                    'INSERT INTO branches (id, segment_id, branch_name, branch_location) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name), branch_location = VALUES(branch_location), segment_id = VALUES(segment_id)',
                    [$newSiteId, $segmentId, $location, $branchLocation]
                );
            }
        } catch (Throwable $e) {}

        Database::commit();
        Response::success(['success' => true]);

    } catch (Exception $e) {
        Database::rollback();
        error_log("Sites POST error: " . $e->getMessage());
        Response::error('Failed to create site: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT /api/sites/:id - Update site
 */
function handlePut()
{
    $data = Response::getBody();
    Response::validateRequired($data, ['id', 'location']);

    $id = $data['id'];
    $location = $data['location'];
    $branchLocation = isset($data['branch_location']) ? $data['branch_location'] : '';
    $segmentId = isset($data['segment_id']) ? intval($data['segment_id']) : null;

    // Validate segment_id if provided
    if ($segmentId) {
        $segment = Database::fetchOne(
            'SELECT id FROM segments WHERE id = ?',
            [$segmentId]
        );
        if (!$segment) {
            Response::error('Invalid segment_id', 400);
            return;
        }
    }

    Database::execute(
        'UPDATE sites SET location = ?, branch_location = ?, segment_id = ? WHERE id = ?',
        [$location, $branchLocation, $segmentId, $id]
    );

    try {
        $hasBranches = Database::fetchOne("SHOW TABLES LIKE 'branches'");
        if ($hasBranches) {
            Database::execute(
                'UPDATE branches SET branch_name = ?, branch_location = ?, segment_id = ? WHERE id = ?',
                [$location, $branchLocation, $segmentId, $id]
            );
        }
    } catch (Throwable $e) {}

    Response::success(['success' => true]);
}

function handleDelete()
{
    $query = Response::getQuery();

    if (!isset($query['id'])) {
        Response::error('Missing site ID', 400);
    }

    $id = $query['id'];

    try {
        Database::beginTransaction();

        // 1. Get Site Location (Name)
        $site = Database::fetchOne('SELECT location FROM sites WHERE id = ?', [$id]);
        if (!$site) {
            Response::error('Site not found', 404);
        }
        $location = $site['location'];
        $siteId = null;
        if (hasColumnSoft('sites', 'id')) {
            $siteRow = Database::fetchOne('SELECT id FROM sites WHERE id = ?', [$id]);
            if ($siteRow) {
                $siteId = (int) $siteRow['id'];
            }
        }

        // Temporarily relax FK checks to avoid hard failures on legacy schemas
        try {
            Database::execute('SET FOREIGN_KEY_CHECKS=0');
        } catch (Throwable $e) {
            error_log('FK off failed: ' . $e->getMessage());
        }

        // 2. Delete Dependent Records (best effort with logging)
        try {
            if (hasColumnSoft('questions', 'site_id') && $siteId !== null) {
                Database::execute('DELETE FROM questions WHERE site_id = ?', [$siteId]);
            } else {
                Database::execute('DELETE FROM questions WHERE site = ?', [$location]);
            }
        } catch (Throwable $e) {
            error_log('Delete questions skipped: ' . $e->getMessage());
        }

        try {
            Database::execute('DELETE FROM users WHERE site = ?', [$location]);
        } catch (Throwable $e) {
            error_log('Delete users skipped: ' . $e->getMessage());
        }

        try {
            Database::execute('DELETE FROM branch_admins WHERE site = ?', [$location]);
        } catch (Throwable $e) {
            error_log('Delete branch_admins skipped: ' . $e->getMessage());
        }

        try {
            if (hasColumnSoft('canteens', 'site_id') && $siteId !== null) {
                Database::execute('DELETE FROM canteens WHERE site_id = ?', [$siteId]);
            } else {
                Database::execute('DELETE FROM canteens WHERE site = ?', [$location]);
            }
        } catch (Throwable $e) {
            error_log('Delete canteens skipped: ' . $e->getMessage());
        }

        try {
            if (hasColumnSoft('feedback', 'site_id') && $siteId !== null) {
                Database::execute('DELETE FROM feedback WHERE site_id = ?', [$siteId]);
            } else if (hasColumnSoft('feedback', 'site')) {
                Database::execute('DELETE FROM feedback WHERE site = ?', [$location]);
            }
        } catch (Throwable $e) {
            error_log('Delete feedback skipped: ' . $e->getMessage());
        }

        // 3. Delete Site (if this fails, bubble up)
        Database::execute('DELETE FROM sites WHERE id = ?', [$id]);

        try {
            $hasBranches = Database::fetchOne("SHOW TABLES LIKE 'branches'");
            if ($hasBranches) {
                Database::execute('DELETE FROM branches WHERE id = ?', [$id]);
            }
        } catch (Throwable $e) {}

        try {
            Database::execute('SET FOREIGN_KEY_CHECKS=1');
        } catch (Throwable $e) {
            error_log('FK on failed: ' . $e->getMessage());
        }

        Database::commit();
        Response::success(['success' => true]);

    } catch (Exception $e) {
        try {
            Database::execute('SET FOREIGN_KEY_CHECKS=1');
        } catch (Throwable $_) {
        }
        Database::rollback();
        error_log("Delete Site Error: " . $e->getMessage());
        Response::error('Failed to delete site: ' . $e->getMessage(), 500);
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
