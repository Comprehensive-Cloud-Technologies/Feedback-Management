<?php
/**
 * Canteens Management
 */

try {
    ensureCanteenSchema();

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
    error_log("Canteens API fatal error: " . $e->getMessage() . " | " . $e->getFile() . ":" . $e->getLine());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit(0);
}

/**
 * GET /api/canteens?site=xxx - List canteens for a site
 * GET /api/canteens - List all canteens (admin only)
 */
function handleGet()
{
    $user = Auth::optional();
    $query = Response::getQuery();
    $hasSiteId = hasColumn('canteens', 'site_id');
    $hasBranchId = hasColumn('canteens', 'branch_id');
    $hasSegmentId = hasColumn('canteens', 'segment_id');

    // If no site specified, return all canteens (for admin dashboard)
    if (!isset($query['site'])) {
        // Allow admins to see all canteens, or return empty array for non-admins
        if ($user && isset($user['role']) && $user['role'] === 'admin') {
            $selectFields = 'c.id, c.name, c.slug, c.is_active, c.meal_slots, c.site_id, s.location AS site, s.slug AS site_slug';
            if ($hasBranchId)
                $selectFields .= ', c.branch_id';
            if ($hasSegmentId)
                $selectFields .= ', c.segment_id';

            $allCanteens = Database::fetchAll("SELECT $selectFields FROM canteens c LEFT JOIN sites s ON c.site_id = s.id");
            $canteenNames = array_map(function ($row) {
                return $row['name'];
            }, $allCanteens);

            // Process slots
            foreach ($allCanteens as &$c) {
                $c['meal_slots'] = (!empty($c['meal_slots'])) ? json_decode($c['meal_slots'], true) : [];
            }
        } else {
            $canteenNames = [];
            $allCanteens = [];
        }
        Response::success(['canteens' => $canteenNames, 'details' => $allCanteens]);
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
        $selectFields = 'c.name, c.id, c.slug, c.is_active, c.site_id, c.meal_slots, s.location AS site, s.slug AS site_slug';
        if ($hasBranchId)
            $selectFields .= ', c.branch_id';
        if ($hasSegmentId)
            $selectFields .= ', c.segment_id';

        $canteens = Database::fetchAll(
            "SELECT $selectFields FROM canteens c LEFT JOIN sites s ON c.site_id = s.id WHERE c.site_id = ?",
            [$siteId]
        );
    } else {
        $canteens = Database::fetchAll(
            'SELECT name, id, site, meal_slots, is_active FROM canteens WHERE site = ?',
            [$site]
        );
    }

    $canteenNames = array_map(function ($row) {
        return $row['name'];
    }, $canteens);

    foreach ($canteens as &$c) {
        $c['meal_slots'] = (!empty($c['meal_slots'])) ? json_decode($c['meal_slots'], true) : [];
    }

    Response::success(['canteens' => $canteenNames, 'details' => $canteens]);
}

// Ensure DB has expected columns/keys even if existing table was created without them
function ensureCanteenSchema()
{
    try {
        $hasSiteId = hasColumn('canteens', 'site_id');
        $hasSite = hasColumn('canteens', 'site');

        // Add site column if missing
        if (!$hasSite) {
            Database::execute("ALTER TABLE canteens ADD COLUMN site VARCHAR(100) NOT NULL DEFAULT '' AFTER id");
            // If legacy data exists with only name, backfill site with empty string
            Database::execute("UPDATE canteens SET site = '' WHERE site = ''");
            $hasSite = true;
        }

        // Add meal_slots column if missing
        if (!hasColumn('canteens', 'meal_slots')) {
            Database::execute("ALTER TABLE canteens ADD COLUMN meal_slots JSON NULL AFTER name");
        }

        // Add site_id column if the DB uses FK to sites(id)
        if (!$hasSiteId) {
            $sitePk = hasColumn('sites', 'id');
            if ($sitePk) {
                Database::execute("ALTER TABLE canteens ADD COLUMN site_id INT NULL AFTER site");
                // Try to backfill site_id from sites.location when possible
                Database::execute("UPDATE canteens c JOIN sites s ON c.site = s.location SET c.site_id = s.id WHERE c.site_id IS NULL");
                // Add FK if not present
                $fk = Database::fetchOne("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME='canteens' AND COLUMN_NAME='site_id' AND REFERENCED_TABLE_NAME='sites'");
                if (!$fk) {
                    Database::execute("ALTER TABLE canteens ADD CONSTRAINT canteens_site_fk FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE");
                }
                $hasSiteId = true;
            }
        }

        // Drop obsolete legacy foreign key referencing `branches` table if present
        $legacyBranchFk = Database::fetchOne("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'canteens' 
              AND COLUMN_NAME = 'branch_id' 
              AND REFERENCED_TABLE_NAME = 'branches'
        ");
        if ($legacyBranchFk && !empty($legacyBranchFk['CONSTRAINT_NAME'])) {
            $fkName = $legacyBranchFk['CONSTRAINT_NAME'];
            Database::execute("ALTER TABLE canteens DROP FOREIGN KEY `{$fkName}`");
        }

        // Ensure branch_id FK references sites(id)
        if (hasColumn('canteens', 'branch_id') && hasColumn('sites', 'id')) {
            $branchFk = Database::fetchOne("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'canteens' 
                  AND COLUMN_NAME = 'branch_id' 
                  AND REFERENCED_TABLE_NAME = 'sites'
            ");
            if (!$branchFk) {
                try {
                    Database::execute("ALTER TABLE canteens ADD CONSTRAINT canteens_branch_fk FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE");
                } catch (Throwable $e) {
                    // Non-fatal if index or constraint cannot be created
                }
            }
        }

        // Ensure unique key on (site, name)
        $unique = Database::fetchOne("SHOW INDEX FROM canteens WHERE Key_name = 'unique_site_canteen'");
        if (!$unique) {
            // Drop any existing duplicate key on name only to avoid conflict
            $nameIdx = Database::fetchOne("SHOW INDEX FROM canteens WHERE Key_name = 'name'");
            if ($nameIdx) {
                Database::execute("ALTER TABLE canteens DROP INDEX name");
            }
            if ($hasSiteId) {
                Database::execute("ALTER TABLE canteens ADD UNIQUE KEY unique_site_canteen (site_id, name)");
            } else {
                Database::execute("ALTER TABLE canteens ADD UNIQUE KEY unique_site_canteen (site, name)");
            }
        }

        // Ensure site index exists
        $idx = Database::fetchOne("SHOW INDEX FROM canteens WHERE Key_name = 'idx_site'");
        if (!$idx) {
            if ($hasSiteId) {
                Database::execute("ALTER TABLE canteens ADD INDEX idx_site (site_id)");
            } else {
                Database::execute("ALTER TABLE canteens ADD INDEX idx_site (site)");
            }
        }

        // Add is_active column if missing (default 1 = active)
        if (!hasColumn('canteens', 'is_active')) {
            Database::execute("ALTER TABLE canteens ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
        }

        // Add slug column if missing
        if (!hasColumn('canteens', 'slug')) {
            Database::execute("ALTER TABLE canteens ADD COLUMN slug VARCHAR(200) NULL AFTER name");
        }
        // Re-sync all slugs using PHP generateSlug for consistency with frontend toSlug()
        $allCanteens = Database::fetchAll("SELECT id, name, slug FROM canteens");
        foreach ($allCanteens as $c) {
            $correct = generateSlug($c['name']);
            if ($c['slug'] !== $correct) {
                Database::execute("UPDATE canteens SET slug = ? WHERE id = ?", [$correct, $c['id']]);
            }
        }

        // Add slug to sites table if missing
        if (!hasColumn('sites', 'slug')) {
            Database::execute("ALTER TABLE sites ADD COLUMN slug VARCHAR(200) NULL");
        }
        $allSites = Database::fetchAll("SELECT id, location, slug FROM sites");
        foreach ($allSites as $s) {
            $correct = generateSlug($s['location']);
            if ($s['slug'] !== $correct) {
                Database::execute("UPDATE sites SET slug = ? WHERE id = ?", [$correct, $s['id']]);
            }
        }
    } catch (Throwable $e) {
        // Log but do not block requests; better to return clear error
        error_log('Canteen schema check failed: ' . $e->getMessage());
        // Surface a clear error so caller can fix DB quickly
        Response::error('Database schema error for canteens: ' . $e->getMessage(), 500);
    }
}

function hasColumn($table, $column)
{
    $row = Database::fetchOne("SHOW COLUMNS FROM {$table} LIKE '{$column}'");
    return $row ? true : false;
}

function getSiteIdByName($siteName)
{
    $row = Database::fetchOne('SELECT id FROM sites WHERE location = ?', [$siteName]);
    return $row ? (int) $row['id'] : null;
}

function generateSlug($name)
{
    $slug = mb_strtolower(trim($name));
    $slug = preg_replace('/[&]+/', 'and', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

/**
 * POST /api/canteens - Create canteen
 */
function handlePost()
{
    $user = Auth::requireAdminOrBranch();

    $hasSiteId = hasColumn('canteens', 'site_id');
    $hasSite = hasColumn('canteens', 'site');
    $hasBranchId = hasColumn('canteens', 'branch_id');
    $hasSegmentId = hasColumn('canteens', 'segment_id');

    $data = Response::getBody();
    Response::validateRequired($data, ['site', 'name']);

    $site = $data['site'];
    $name = $data['name'];
    $siteId = null;
    $branchId = isset($data['branch_id']) ? $data['branch_id'] : null;
    $segmentId = isset($data['segment_id']) ? $data['segment_id'] : null;

    if ($hasSiteId) {
        $siteId = getSiteIdByName($site);
        if (!$siteId) {
            Response::error('Site not found', 404);
            return;
        }
    }

    if ($hasBranchId) {
        if ($siteId) {
            $branchId = $siteId;
        } elseif ($branchId) {
            $validSite = Database::fetchOne('SELECT id FROM sites WHERE id = ?', [$branchId]);
            if (!$validSite) {
                $branchId = null;
            }
        }
    }

    try {
        // If branch admin, verify site
        if ($user['role'] === 'branch_admin' && $user['site'] !== $site) {
            Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
            return;
        }

        // Check if canteen already exists
        if ($hasSiteId) {
            $existing = Database::fetchOne(
                'SELECT id FROM canteens WHERE site_id = ? AND name = ?',
                [$siteId, $name]
            );
        } else {
            $existing = Database::fetchOne(
                'SELECT id FROM canteens WHERE site = ? AND name = ?',
                [$site, $name]
            );
        }

        if ($existing) {
            Response::error('Canteen already exists for this site', 409);
            return;
        }

        // Build insert dynamically depending on available columns
        $cols = [];
        $vals = [];
        if ($hasBranchId && $branchId) {
            $cols[] = 'branch_id';
            $vals[] = $branchId;
        }
        if ($hasSegmentId && $segmentId) {
            $cols[] = 'segment_id';
            $vals[] = $segmentId;
        }
        if ($hasSiteId) {
            $cols[] = 'site_id';
            $vals[] = $siteId;
        }
        if ($hasSite) {
            $cols[] = 'site';
            $vals[] = $site;
        }
        $cols[] = 'name';
        $vals[] = $name;

        // Auto-generate slug
        if (hasColumn('canteens', 'slug')) {
            $cols[] = 'slug';
            $vals[] = generateSlug($name);
        }

        $placeholders = implode(',', array_fill(0, count($cols), '?'));
        $sql = 'INSERT INTO canteens (' . implode(',', $cols) . ') VALUES (' . $placeholders . ')';
        Database::execute($sql, $vals);

        Response::success(['success' => true]);
    } catch (Exception $e) {
        error_log("Canteens POST error: " . $e->getMessage());
        Response::error('Failed to create canteen: ' . $e->getMessage(), 500);
    }
}

/**
 * DELETE /api/canteens?site=xxx&name=xxx - Delete canteen
 */
function handleDelete()
{
    $user = Auth::requireAdminOrBranch();

    $hasSiteId = hasColumn('canteens', 'site_id');

    $query = Response::getQuery();

    if (!isset($query['site']) || !isset($query['name'])) {
        Response::error('Missing site or name parameter', 400);
    }

    $site = $query['site'];
    $name = $query['name'];
    $siteId = null;
    if ($hasSiteId) {
        $siteId = getSiteIdByName($site);
        if (!$siteId) {
            Response::error('Site not found', 404);
        }
    }

    // If branch admin, verify site
    if ($user['role'] === 'branch_admin' && $user['site'] !== $site) {
        Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
    }

    if ($hasSiteId) {
        $result = Database::execute(
            'DELETE FROM canteens WHERE site_id = ? AND name = ?',
            [$siteId, $name]
        );
    } else {
        $result = Database::execute(
            'DELETE FROM canteens WHERE site = ? AND name = ?',
            [$site, $name]
        );
    }

    if ($result === 0) {
        Response::error('Canteen not found', 404);
    }

    Response::success(['success' => true]);
}

/**
 * PUT /api/canteens - Update canteen details (meal slots)
 */
function handlePut()
{
    $user = Auth::requireAdminOrBranch();

    $hasSiteId = hasColumn('canteens', 'site_id');
    $hasBranchId = hasColumn('canteens', 'branch_id');
    $hasSegmentId = hasColumn('canteens', 'segment_id');

    $data = Response::getBody();
    Response::validateRequired($data, ['site', 'name']);

    $site = $data['site'];
    $name = $data['name'];
    $siteId = null;
    if ($hasSiteId) {
        $siteId = getSiteIdByName($site);
        if (!$siteId) {
            Response::error('Site not found', 404);
        }
    }

    // If branch admin, verify site
    if ($user['role'] === 'branch_admin' && $user['site'] !== $site) {
        Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
    }

    // Build update query dynamically
    $setClauses = [];
    $params = [];

    // Check if meal_slots is provided
    if (isset($data['meal_slots'])) {
        $meal_slots = $data['meal_slots'];
        if (!is_array($meal_slots)) {
            $meal_slots = [];
        }
        $setClauses[] = 'meal_slots = ?';
        $params[] = json_encode($meal_slots);
    }

    // Add branch_id if provided
    if ($hasBranchId && isset($data['branch_id'])) {
        $setClauses[] = 'branch_id = ?';
        $params[] = $data['branch_id'];
    }

    // Add segment_id if provided
    if ($hasSegmentId && isset($data['segment_id'])) {
        $setClauses[] = 'segment_id = ?';
        $params[] = $data['segment_id'];
    }

    // Add new_name for renaming
    if (isset($data['new_name']) && trim($data['new_name']) !== '') {
        $setClauses[] = 'name = ?';
        $params[] = trim($data['new_name']);
        // Update slug when renaming
        if (hasColumn('canteens', 'slug')) {
            $setClauses[] = 'slug = ?';
            $params[] = generateSlug(trim($data['new_name']));
        }
    }

    // Toggle is_active
    if (isset($data['is_active'])) {
        $setClauses[] = 'is_active = ?';
        $params[] = intval($data['is_active']) ? 1 : 0;
    }

    // Only update if there are fields to update
    if (!empty($setClauses)) {
        $setClause = implode(', ', $setClauses);
        if ($hasSiteId) {
            $params[] = $siteId;
            $params[] = $name;
            Database::execute("UPDATE canteens SET $setClause WHERE site_id = ? AND name = ?", $params);
        } else {
            $params[] = $site;
            $params[] = $name;
            Database::execute("UPDATE canteens SET $setClause WHERE site = ? AND name = ?", $params);
        }
    }

    Response::success(['success' => true]);
}
