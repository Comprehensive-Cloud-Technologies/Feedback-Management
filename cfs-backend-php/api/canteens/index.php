<?php
/**
 * Canteens Management
 */

try {
    require_once __DIR__ . '/../init.php';
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

function handleGet()
{
    $user = Auth::optional();
    $query = Response::getQuery();
    $hasSiteId = hasColumn('canteens', 'site_id');
    $hasBranchId = hasColumn('canteens', 'branch_id');
    $hasSegmentId = hasColumn('canteens', 'segment_id');

    if (!isset($query['site'])) {
        if ($user && isset($user['role']) && $user['role'] === 'admin') {
            $selectFields = 'c.id, c.name, c.slug, c.is_active, c.meal_slots, c.site_id, s.location AS site, s.slug AS site_slug';
            if ($hasBranchId) $selectFields .= ', c.branch_id';
            if ($hasSegmentId) $selectFields .= ', c.segment_id';
            
            $allCanteens = Database::fetchAll("SELECT $selectFields FROM canteens c LEFT JOIN sites s ON c.site_id = s.id");
            $canteenNames = array_map(function ($row) { return $row['name']; }, $allCanteens);
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

    // Slug-based lookup: GET /canteens?site_slug=xxx&canteen_slug=yyy
    if (isset($query['site_slug']) && isset($query['canteen_slug'])) {
        $siteSlug = $query['site_slug'];
        $canteenSlug = $query['canteen_slug'];
        $row = Database::fetchOne(
            'SELECT c.id, c.name, c.slug, c.is_active, c.meal_slots, s.location AS site, s.slug AS site_slug FROM canteens c JOIN sites s ON c.site_id = s.id WHERE s.slug = ? AND c.slug = ?',
            [$siteSlug, $canteenSlug]
        );
        if (!$row) {
            Response::error('Canteen not found', 404);
            return;
        }
        $row['meal_slots'] = (!empty($row['meal_slots'])) ? json_decode($row['meal_slots'], true) : [];
        Response::success(['canteen' => $row]);
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

    if ($user && isset($user['role']) && $user['role'] === 'branch_admin') {
        if (!isset($user['site']) || $user['site'] !== $site) {
            Response::error(ERROR_MESSAGES['FORBIDDEN'], 403);
        }
    }

    if ($hasSiteId) {
        $selectFields = 'c.name, c.id, c.slug, c.is_active, c.site_id, c.meal_slots, s.location AS site, s.slug AS site_slug';
        if ($hasBranchId) $selectFields .= ', c.branch_id';
        if ($hasSegmentId) $selectFields .= ', c.segment_id';
        
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

    $canteenNames = array_map(function ($row) { return $row['name']; }, $canteens);
    foreach ($canteens as &$c) {
        $c['meal_slots'] = (!empty($c['meal_slots'])) ? json_decode($c['meal_slots'], true) : [];
    }

    Response::success(['canteens' => $canteenNames, 'details' => $canteens]);
}

function ensureCanteenSchema()
{
    try {
        $hasSiteId = hasColumn('canteens', 'site_id');
        $hasSite = hasColumn('canteens', 'site');

        if (!$hasSite) {
            Database::execute("ALTER TABLE canteens ADD COLUMN site VARCHAR(100) NOT NULL DEFAULT '' AFTER id");
            Database::execute("UPDATE canteens SET site = '' WHERE site = ''");
            $hasSite = true;
        }

        if (!hasColumn('canteens', 'meal_slots')) {
            Database::execute("ALTER TABLE canteens ADD COLUMN meal_slots JSON NULL AFTER name");
        }

        if (!$hasSiteId) {
            $sitePk = hasColumn('sites', 'id');
            if ($sitePk) {
                Database::execute("ALTER TABLE canteens ADD COLUMN site_id INT NULL AFTER site");
                Database::execute("UPDATE canteens c JOIN sites s ON c.site = s.location SET c.site_id = s.id WHERE c.site_id IS NULL");
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

        $unique = Database::fetchOne("SHOW INDEX FROM canteens WHERE Key_name = 'unique_site_canteen'");
        if (!$unique) {
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

        $idx = Database::fetchOne("SHOW INDEX FROM canteens WHERE Key_name = 'idx_site'");
        if (!$idx) {
            if ($hasSiteId) {
                Database::execute("ALTER TABLE canteens ADD INDEX idx_site (site_id)");
            } else {
                Database::execute("ALTER TABLE canteens ADD INDEX idx_site (site)");
            }
        }

        if (!hasColumn('canteens', 'is_active')) {
            Database::execute("ALTER TABLE canteens ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
        }

        if (!hasColumn('canteens', 'slug')) {
            Database::execute("ALTER TABLE canteens ADD COLUMN slug VARCHAR(200) NULL AFTER name");
        }
        // Backfill canteens relations (site_id, branch_id, branch_name, segment_id)
        try {
            if (hasColumn('canteens', 'site_id') && hasColumn('canteens', 'branch_id') && hasColumn('sites', 'id')) {
                Database::execute("UPDATE canteens c JOIN sites s ON c.branch_id = s.id SET c.site_id = s.id WHERE c.site_id IS NULL");
                Database::execute("UPDATE canteens c JOIN sites s ON c.site_id = s.id SET c.branch_id = s.id WHERE c.branch_id IS NULL");
            }
            if (hasColumn('canteens', 'branch_name') && hasColumn('sites', 'location')) {
                Database::execute("UPDATE canteens c JOIN sites s ON c.branch_id = s.id SET c.branch_name = s.location WHERE (c.branch_name IS NULL OR c.branch_name = '') AND s.location IS NOT NULL");
            }
            if (hasColumn('canteens', 'segment_id') && hasColumn('sites', 'segment_id')) {
                Database::execute("UPDATE canteens c JOIN sites s ON c.branch_id = s.id SET c.segment_id = s.segment_id WHERE c.segment_id IS NULL AND s.segment_id IS NOT NULL");
            }
        } catch (Throwable $e) {
            error_log('canteens relation backfill failed: ' . $e->getMessage());
        }
        $allCanteens = Database::fetchAll("SELECT id, name, slug FROM canteens");
        foreach ($allCanteens as $c) {
            $correct = generateSlug($c['name']);
            if ($c['slug'] !== $correct) {
                Database::execute("UPDATE canteens SET slug = ? WHERE id = ?", [$correct, $c['id']]);
            }
        }

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
        error_log('Canteen schema check failed: ' . $e->getMessage());
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
    return $row ? (int)$row['id'] : null;
}

function generateSlug($name)
{
    $slug = mb_strtolower(trim($name));
    $slug = preg_replace('/[&]+/', 'and', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

function handlePost()
{
    $user = Auth::requireAdminOrBranch();
    $hasSiteId = hasColumn('canteens', 'site_id');
    $hasSite = hasColumn('canteens', 'site');
    $hasBranchId = hasColumn('canteens', 'branch_id');
    $hasBranchName = hasColumn('canteens', 'branch_name');
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
        if (!$siteId) { Response::error('Site not found', 404); return; }
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

    if ($hasSegmentId && !$segmentId && ($siteId || $branchId)) {
        $siteSeg = Database::fetchOne('SELECT segment_id FROM sites WHERE id = ?', [$siteId ?: $branchId]);
        if ($siteSeg && !empty($siteSeg['segment_id'])) {
            $segmentId = $siteSeg['segment_id'];
        }
    }

    try {
        if ($user['role'] === 'branch_admin' && $user['site'] !== $site) { Response::error(ERROR_MESSAGES['FORBIDDEN'], 403); return; }

        if ($hasSiteId) {
            $existing = Database::fetchOne('SELECT id FROM canteens WHERE site_id = ? AND name = ?', [$siteId, $name]);
        } else {
            $existing = Database::fetchOne('SELECT id FROM canteens WHERE site = ? AND name = ?', [$site, $name]);
        }
        if ($existing) { Response::error('Canteen already exists for this site', 409); return; }

        $cols = [];
        $vals = [];
        if ($hasBranchId && $branchId) { $cols[] = 'branch_id'; $vals[] = $branchId; }
        if ($hasBranchName) { $cols[] = 'branch_name'; $vals[] = $site; }
        if ($hasSegmentId && $segmentId) { $cols[] = 'segment_id'; $vals[] = $segmentId; }
        if ($hasSiteId) { $cols[] = 'site_id'; $vals[] = $siteId; }
        if ($hasSite)   { $cols[] = 'site';    $vals[] = $site; }
        $cols[] = 'name';
        $vals[] = $name;
        if (hasColumn('canteens', 'slug')) { $cols[] = 'slug'; $vals[] = generateSlug($name); }

        $placeholders = implode(',', array_fill(0, count($cols), '?'));
        Database::execute('INSERT INTO canteens (' . implode(',', $cols) . ') VALUES (' . $placeholders . ')', $vals);
        Response::success(['success' => true]);
    } catch (Exception $e) {
        error_log("Canteens POST error: " . $e->getMessage());
        Response::error('Failed to create canteen: ' . $e->getMessage(), 500);
    }
}

function handleDelete()
{
    $user = Auth::requireAdminOrBranch();
    $hasSiteId = hasColumn('canteens', 'site_id');
    $query = Response::getQuery();

    if (!isset($query['site']) || !isset($query['name'])) { Response::error('Missing site or name parameter', 400); }

    $site = $query['site'];
    $name = $query['name'];
    $siteId = null;
    if ($hasSiteId) { $siteId = getSiteIdByName($site); if (!$siteId) { Response::error('Site not found', 404); } }
    if ($user['role'] === 'branch_admin' && $user['site'] !== $site) { Response::error(ERROR_MESSAGES['FORBIDDEN'], 403); }

    if ($hasSiteId) {
        $result = Database::execute('DELETE FROM canteens WHERE site_id = ? AND name = ?', [$siteId, $name]);
    } else {
        $result = Database::execute('DELETE FROM canteens WHERE site = ? AND name = ?', [$site, $name]);
    }
    if ($result === 0) { Response::error('Canteen not found', 404); }
    Response::success(['success' => true]);
}

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
    if ($hasSiteId) { $siteId = getSiteIdByName($site); if (!$siteId) { Response::error('Site not found', 404); } }
    if ($user['role'] === 'branch_admin' && $user['site'] !== $site) { Response::error(ERROR_MESSAGES['FORBIDDEN'], 403); }

    $setClauses = [];
    $params = [];

    if (isset($data['meal_slots'])) {
        $meal_slots = is_array($data['meal_slots']) ? $data['meal_slots'] : [];
        $setClauses[] = 'meal_slots = ?';
        $params[] = json_encode($meal_slots);
    }
    if ($hasBranchId && isset($data['branch_id'])) { $setClauses[] = 'branch_id = ?'; $params[] = $data['branch_id']; }
    if ($hasSegmentId && isset($data['segment_id'])) { $setClauses[] = 'segment_id = ?'; $params[] = $data['segment_id']; }
    if (isset($data['new_name']) && trim($data['new_name']) !== '') {
        $setClauses[] = 'name = ?';
        $params[] = trim($data['new_name']);
        if (hasColumn('canteens', 'slug')) { $setClauses[] = 'slug = ?'; $params[] = generateSlug(trim($data['new_name'])); }
    }
    if (isset($data['is_active'])) {
        $setClauses[] = 'is_active = ?';
        $params[] = intval($data['is_active']) ? 1 : 0;
    }

    if (!empty($setClauses)) {
        $setClause = implode(', ', $setClauses);
        if ($hasSiteId) {
            $params[] = $siteId; $params[] = $name;
            Database::execute("UPDATE canteens SET $setClause WHERE site_id = ? AND name = ?", $params);
        } else {
            $params[] = $site; $params[] = $name;
            Database::execute("UPDATE canteens SET $setClause WHERE site = ? AND name = ?", $params);
        }
    }
    Response::success(['success' => true]);
}
