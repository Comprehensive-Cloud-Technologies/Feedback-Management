<?php
/**
 * Resolve Feedback Link - converts slug-based URLs to site + canteen info
 * GET /api/resolve-link?site_slug=xxx&canteen_slug=yyy
 */

try {
    require_once __DIR__ . '/../init.php';

    ensureSlugColumns();

    $method = Response::getMethod();

    if ($method !== 'GET') {
        Response::error('Method not allowed', 405);
    }

    $query = Response::getQuery();

    if (!isset($query['site_slug']) || !isset($query['canteen_slug'])) {
        Response::error('Missing site_slug or canteen_slug parameter', 400);
    }

    $siteSlug = trim($query['site_slug']);
    $canteenSlug = trim($query['canteen_slug']);

    if (empty($siteSlug) || empty($canteenSlug)) {
        Response::error('Empty slug parameters', 400);
    }

    $row = Database::fetchOne(
        'SELECT c.id AS canteen_id, c.name AS canteen, c.is_active, c.slug AS canteen_slug, s.location AS site, s.slug AS site_slug
         FROM canteens c
         JOIN sites s ON c.site_id = s.id
         WHERE s.slug = ? AND c.slug = ?',
        [$siteSlug, $canteenSlug]
    );

    if (!$row) {
        Response::error('Feedback link not found', 404);
    }

    if (!$row['is_active']) {
        Response::error('This canteen is currently inactive', 403);
    }

    Response::success([
        'site' => $row['site'],
        'canteen' => $row['canteen'],
        'canteen_id' => (int)$row['canteen_id'],
        'site_slug' => $row['site_slug'],
        'canteen_slug' => $row['canteen_slug']
    ]);
} catch (Throwable $e) {
    error_log("Resolve-link API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit(0);
}

function ensureSlugColumns()
{
    try {
        $hasCanteenSlug = Database::fetchOne("SHOW COLUMNS FROM canteens LIKE 'slug'");
        if (!$hasCanteenSlug) {
            Database::execute("ALTER TABLE canteens ADD COLUMN slug VARCHAR(200) NULL AFTER name");
        }
        $allCanteens = Database::fetchAll("SELECT id, name, slug FROM canteens");
        foreach ($allCanteens as $c) {
            $correct = generateSlug($c['name']);
            if ($c['slug'] !== $correct) {
                Database::execute("UPDATE canteens SET slug = ? WHERE id = ?", [$correct, $c['id']]);
            }
        }
        $hasSiteSlug = Database::fetchOne("SHOW COLUMNS FROM sites LIKE 'slug'");
        if (!$hasSiteSlug) {
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
        error_log('resolve-link slug check: ' . $e->getMessage());
    }
}

function generateSlug($name)
{
    $slug = mb_strtolower(trim($name));
    $slug = preg_replace('/[&]+/', 'and', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}
