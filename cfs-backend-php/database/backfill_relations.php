<?php
/**
 * Idempotent Relation Backfill Script
 * 
 * Safely backfills NULL branch_id, branch_name, site_id, and segment_id relations
 * on branch_admins, canteens, and feedback from authoritative sites data.
 * 
 * Usage:
 *   php database/backfill_relations.php --dry-run   (Reports candidate rows without modifying data)
 *   php database/backfill_relations.php --apply     (Executes idempotent UPDATE statements)
 */

require_once __DIR__ . '/../src/Database.php';

$apply = in_array('--apply', $argv, true);
$dryRun = in_array('--dry-run', $argv, true) || !$apply;

echo "=======================================================\n";
echo "Feedback Management System - Relation Backfill Script\n";
echo "Mode: " . ($dryRun ? "DRY RUN (Read-Only - No changes will be written)" : "APPLY (Writing changes to database)") . "\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "=======================================================\n\n";

function columnExists($table, $col) {
    try {
        $res = Database::fetchOne("SHOW COLUMNS FROM `{$table}` LIKE '{$col}'");
        return !empty($res);
    } catch (Throwable $e) {
        return false;
    }
}

// ----------------------------------------------------
// 1. branch_admins: Backfill branch_id & branch_name
// ----------------------------------------------------
echo "[1/3] Checking branch_admins...\n";
if (columnExists('branch_admins', 'branch_id') && columnExists('sites', 'id')) {
    $candAdmins = Database::fetchAll("
        SELECT ba.id, ba.site, ba.branch_id, s.id as new_branch_id, s.location as new_branch_name
        FROM branch_admins ba
        JOIN sites s ON TRIM(ba.site) = TRIM(s.location)
        WHERE ba.branch_id IS NULL
    ");
    echo "  - Candidate rows with NULL branch_id matching a site: " . count($candAdmins) . "\n";
    foreach ($candAdmins as $c) {
        echo "    * Admin ID {$c['id']} ('{$c['site']}'): will link to branch_id = {$c['new_branch_id']} ('{$c['new_branch_name']}')\n";
    }

    if (!$dryRun && count($candAdmins) > 0) {
        Database::execute("
            UPDATE branch_admins ba
            JOIN sites s ON TRIM(ba.site) = TRIM(s.location)
            SET ba.branch_id = s.id,
                ba.branch_name = COALESCE(ba.branch_name, s.location)
            WHERE ba.branch_id IS NULL
        ");
        echo "  -> Successfully updated branch_admins rows.\n";
    }
} else {
    echo "  - branch_id column not present in branch_admins. Skipping.\n";
}
echo "\n";

// ----------------------------------------------------
// 2. canteens: Backfill site_id, branch_id, branch_name, segment_id
// ----------------------------------------------------
echo "[2/3] Checking canteens...\n";
$hasSiteId = columnExists('canteens', 'site_id');
$hasBranchId = columnExists('canteens', 'branch_id');
$hasBranchName = columnExists('canteens', 'branch_name');
$hasSegmentId = columnExists('canteens', 'segment_id');

// 2a. site_id from branch_id (only if branch_id actually exists in sites)
if ($hasSiteId && $hasBranchId && columnExists('sites', 'id')) {
    $candCanteensSiteId = Database::fetchAll("
        SELECT c.id, c.name, c.branch_id FROM canteens c
        JOIN sites s ON c.branch_id = s.id
        WHERE c.site_id IS NULL
    ");
    echo "  - Canteens with NULL site_id matching a valid site: " . count($candCanteensSiteId) . "\n";
    if (!$dryRun && count($candCanteensSiteId) > 0) {
        Database::execute("
            UPDATE canteens c
            JOIN sites s ON c.branch_id = s.id
            SET c.site_id = s.id
            WHERE c.site_id IS NULL
        ");
        echo "  -> Synchronized site_id = branch_id for valid sites.\n";
    }

    // Vice versa: branch_id from site_id
    $candCanteensBranchId = Database::fetchAll("
        SELECT c.id, c.name, c.site_id FROM canteens c
        JOIN sites s ON c.site_id = s.id
        WHERE c.branch_id IS NULL
    ");
    echo "  - Canteens with NULL branch_id matching a valid site: " . count($candCanteensBranchId) . "\n";
    if (!$dryRun && count($candCanteensBranchId) > 0) {
        Database::execute("
            UPDATE canteens c
            JOIN sites s ON c.site_id = s.id
            SET c.branch_id = s.id
            WHERE c.branch_id IS NULL
        ");
        echo "  -> Synchronized branch_id = site_id for valid sites.\n";
    }

    // Backfill both if string site matches sites.location
    if (columnExists('canteens', 'site') && columnExists('sites', 'location')) {
        $candBySiteName = Database::fetchAll("
            SELECT c.id, c.name, s.id as site_id FROM canteens c
            JOIN sites s ON TRIM(c.site) = TRIM(s.location)
            WHERE c.site_id IS NULL OR c.branch_id IS NULL
        ");
        echo "  - Canteens resolvable via site location string: " . count($candBySiteName) . "\n";
        if (!$dryRun && count($candBySiteName) > 0) {
            Database::execute("
                UPDATE canteens c
                JOIN sites s ON TRIM(c.site) = TRIM(s.location)
                SET c.site_id = COALESCE(c.site_id, s.id),
                    c.branch_id = COALESCE(c.branch_id, s.id)
                WHERE c.site_id IS NULL OR c.branch_id IS NULL
            ");
            echo "  -> Synchronized site_id and branch_id via site location string.\n";
        }
    }
}

// 2b. branch_name from sites
if ($hasBranchName && $hasBranchId && columnExists('sites', 'location')) {
    $candBranchNames = Database::fetchAll("
        SELECT c.id, c.name, s.location FROM canteens c
        JOIN sites s ON c.branch_id = s.id
        WHERE (c.branch_name IS NULL OR c.branch_name = '')
    ");
    echo "  - Canteens with NULL/empty branch_name: " . count($candBranchNames) . "\n";
    if (!$dryRun && count($candBranchNames) > 0) {
        Database::execute("
            UPDATE canteens c
            JOIN sites s ON c.branch_id = s.id
            SET c.branch_name = s.location
            WHERE (c.branch_name IS NULL OR c.branch_name = '') AND s.location IS NOT NULL
        ");
        echo "  -> Backfilled canteens.branch_name from sites.location.\n";
    }
}

// 2c. segment_id from sites
if ($hasSegmentId && $hasBranchId && columnExists('sites', 'segment_id')) {
    $candCanteenSegments = Database::fetchAll("
        SELECT c.id, c.name, s.segment_id FROM canteens c
        JOIN sites s ON c.branch_id = s.id
        WHERE c.segment_id IS NULL AND s.segment_id IS NOT NULL
    ");
    echo "  - Canteens with NULL segment_id: " . count($candCanteenSegments) . "\n";
    if (!$dryRun && count($candCanteenSegments) > 0) {
        Database::execute("
            UPDATE canteens c
            JOIN sites s ON c.branch_id = s.id
            SET c.segment_id = s.segment_id
            WHERE c.segment_id IS NULL AND s.segment_id IS NOT NULL
        ");
        echo "  -> Backfilled canteens.segment_id from sites.segment_id.\n";
    }
}
echo "\n";

// ----------------------------------------------------
// 3. feedback: Backfill branch_id, branch_name, segment_id
// ----------------------------------------------------
echo "[3/3] Checking feedback...\n";
$hasFbBranchId = columnExists('feedback', 'branch_id');
$hasFbBranchName = columnExists('feedback', 'branch_name');
$hasFbSegmentId = columnExists('feedback', 'segment_id');

// 3a. feedback.branch_id from canteens.branch_id
if ($hasFbBranchId && columnExists('feedback', 'canteen_id') && columnExists('canteens', 'branch_id')) {
    $candFbBranch = Database::fetchAll("
        SELECT f.id, f.canteen_id, c.branch_id FROM feedback f
        JOIN canteens c ON f.canteen_id = c.id
        WHERE f.branch_id IS NULL AND c.branch_id IS NOT NULL
    ");
    echo "  - Feedback rows with NULL branch_id (resolvable via canteen): " . count($candFbBranch) . "\n";
    if (!$dryRun && count($candFbBranch) > 0) {
        Database::execute("
            UPDATE feedback f
            JOIN canteens c ON f.canteen_id = c.id
            SET f.branch_id = c.branch_id
            WHERE f.branch_id IS NULL AND c.branch_id IS NOT NULL
        ");
        echo "  -> Backfilled feedback.branch_id from canteens.branch_id.\n";
    }
}

// 3b. feedback.branch_name from sites.location
if ($hasFbBranchName && $hasFbBranchId && columnExists('sites', 'location')) {
    $candFbBranchName = Database::fetchAll("
        SELECT f.id, s.location FROM feedback f
        JOIN sites s ON f.branch_id = s.id
        WHERE (f.branch_name IS NULL OR f.branch_name = '') AND s.location IS NOT NULL
    ");
    echo "  - Feedback rows with NULL/empty branch_name: " . count($candFbBranchName) . "\n";
    if (!$dryRun && count($candFbBranchName) > 0) {
        Database::execute("
            UPDATE feedback f
            JOIN sites s ON f.branch_id = s.id
            SET f.branch_name = s.location
            WHERE (f.branch_name IS NULL OR f.branch_name = '') AND s.location IS NOT NULL
        ");
        echo "  -> Backfilled feedback.branch_name from sites.location.\n";
    }
}

// 3c. feedback.segment_id from canteen -> site -> segment_id
if ($hasFbSegmentId && columnExists('feedback', 'canteen_id') && columnExists('canteens', 'branch_id') && columnExists('sites', 'segment_id')) {
    $candFbSegViaCanteen = Database::fetchAll("
        SELECT f.id, s.segment_id FROM feedback f
        JOIN canteens c ON f.canteen_id = c.id
        JOIN sites s ON c.branch_id = s.id
        WHERE f.segment_id IS NULL AND s.segment_id IS NOT NULL
    ");
    echo "  - Feedback rows with NULL segment_id (resolvable via canteen -> site): " . count($candFbSegViaCanteen) . "\n";
    if (!$dryRun && count($candFbSegViaCanteen) > 0) {
        Database::execute("
            UPDATE feedback f
            JOIN canteens c ON f.canteen_id = c.id
            JOIN sites s ON c.branch_id = s.id
            SET f.segment_id = s.segment_id
            WHERE f.segment_id IS NULL AND s.segment_id IS NOT NULL
        ");
        echo "  -> Backfilled feedback.segment_id from sites.segment_id.\n";
    }
}

// Fallback: feedback.segment_id via site location string match
if ($hasFbSegmentId && columnExists('feedback', 'site') && columnExists('sites', 'segment_id')) {
    $candFbSegViaSite = Database::fetchAll("
        SELECT f.id, s.segment_id FROM feedback f
        JOIN sites s ON TRIM(f.site) = TRIM(s.location)
        WHERE f.segment_id IS NULL AND s.segment_id IS NOT NULL
    ");
    echo "  - Feedback rows with NULL segment_id (resolvable via site name match): " . count($candFbSegViaSite) . "\n";
    if (!$dryRun && count($candFbSegViaSite) > 0) {
        Database::execute("
            UPDATE feedback f
            JOIN sites s ON TRIM(f.site) = TRIM(s.location)
            SET f.segment_id = s.segment_id
            WHERE f.segment_id IS NULL AND s.segment_id IS NOT NULL
        ");
        echo "  -> Backfilled feedback.segment_id via site name match.\n";
    }
}

echo "\n=======================================================\n";
if ($dryRun) {
    echo "DRY RUN COMPLETE. No data was modified.\n";
    echo "To execute these updates, run:\n";
    echo "  php database/backfill_relations.php --apply\n";
} else {
    echo "BACKFILL APPLIED SUCCESSFULLY.\n";
}
echo "=======================================================\n";
