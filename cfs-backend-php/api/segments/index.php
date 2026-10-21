<?php
/**
 * Segments Management API
 * Handles CRUD operations for organizational segments
 * Uses PDO Database class for all queries
 */

try {
    require_once __DIR__ . '/../init.php';
    
    $method = Response::getMethod();
    $action = $_GET['action'] ?? null;
    $id = $_GET['id'] ?? null;
    
    switch ($method) {
        case 'GET':
            handleGet($action, $id);
            break;
        case 'POST':
            if ($action === 'create') {
                handleCreate();
            } else {
                Response::error('Invalid action', 400);
            }
            break;
        case 'PUT':
            if ($action === 'update' && $id) {
                handleUpdate($id);
            } else {
                Response::error('Invalid action', 400);
            }
            break;
        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $deleteId = $id ?? $input['id'] ?? null;
            if ($deleteId) {
                handleDelete($deleteId);
            } else {
                Response::error('Invalid action or missing ID', 400);
            }
            break;
        default:
            Response::error('Method not allowed', 405);
    }
    
} catch (Throwable $e) {
    error_log('Segments API error: ' . $e->getMessage());
    Response::error('Server error: ' . $e->getMessage(), 500);
}

/**
 * Handle GET requests - list or get single segment
 */
function handleGet($action, $id)
{
    // Require admin authentication
    Auth::requireRole('admin');
    
    try {
        if ($action === 'list' || !$action) {
            // Get all segments with statistics
            // MySQL 5.7+ compliance: Include all selected non-aggregate columns in GROUP BY
            $sql = "SELECT 
                        s.id,
                        s.name,
                        s.description,
                        s.created_at,
                        s.updated_at,
                        COUNT(DISTINCT sites.id) as total_branches,
                        COUNT(DISTINCT canteens.id) as total_canteens
                    FROM segments s
                    LEFT JOIN sites ON sites.segment_id = s.id
                    LEFT JOIN canteens ON canteens.branch_id = sites.id
                    GROUP BY s.id, s.name, s.description, s.created_at, s.updated_at
                    ORDER BY s.name ASC";
            
            $segments = Database::fetchAll($sql);
            Response::success(['data' => $segments], 200);
            
        } elseif ($action === 'get' && $id) {
            // Get single segment by ID
            $id = intval($id);
            $sql = "SELECT 
                        s.id,
                        s.name,
                        s.description,
                        s.created_at,
                        s.updated_at,
                        COUNT(DISTINCT sites.id) as total_branches,
                        COUNT(DISTINCT canteens.id) as total_canteens
                    FROM segments s
                    LEFT JOIN sites ON sites.segment_id = s.id
                    LEFT JOIN canteens ON canteens.branch_id = sites.id
                    WHERE s.id = ?
                    GROUP BY s.id, s.name, s.description, s.created_at, s.updated_at";
            
            $segment = Database::fetchOne($sql, [$id]);
            
            if (!$segment) {
                Response::error('Segment not found', 404);
                return;
            }
            
            Response::success($segment, 200);
        } else {
            Response::error('Invalid action', 400);
        }
        
    } catch (Exception $e) {
        error_log('Segments Fetch Error: ' . $e->getMessage());
        Response::error('Failed to fetch segments: ' . $e->getMessage(), 500);
    } catch (Throwable $t) {
        error_log('Segments Fatal Error: ' . $t->getMessage());
        Response::error('Fatal error fetching segments: ' . $t->getMessage(), 500);
    }
}

/**
 * Handle POST request - create new segment
 */
function handleCreate()
{
    // Require admin authentication
    Auth::requireRole('admin');
    
    try {
        $body = json_decode(file_get_contents('php://input'), true);
        
        if (!$body || !isset($body['name'])) {
            Response::error('Segment name is required', 400);
            return;
        }
        
        $name = trim($body['name'] ?? '');
        $description = isset($body['description']) ? trim($body['description']) : null;
        
        if (empty($name)) {
            Response::error('Segment name cannot be empty', 400);
            return;
        }
        
        // Check if segment already exists
        $existing = Database::fetchOne('SELECT id FROM segments WHERE name = ?', [$name]);
        if ($existing) {
            Response::error('Segment with this name already exists', 409);
            return;
        }
        
        // Create segment
        Database::execute(
            'INSERT INTO segments (name, description) VALUES (?, ?)',
            [$name, $description]
        );
        
        // Get the ID of the newly created segment
        $lastId = Database::lastInsertId();
        
        // Fetch and return the created segment
        $segment = Database::fetchOne(
            'SELECT id, name, description, created_at, updated_at FROM segments WHERE id = ?',
            [$lastId]
        );
        
        Response::success($segment, 201);
        
    } catch (Exception $e) {
        Response::error('Failed to create segment: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle PUT request - update segment
 */
function handleUpdate($id)
{
    // Require admin authentication
    Auth::requireRole('admin');
    
    try {
        $id = intval($id);
        $body = json_decode(file_get_contents('php://input'), true);
        
        if (!$body) {
            Response::error('Request body is required', 400);
            return;
        }
        
        // Check if segment exists
        $segment = Database::fetchOne('SELECT id FROM segments WHERE id = ?', [$id]);
        if (!$segment) {
            Response::error('Segment not found', 404);
            return;
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($body['name'])) {
            $updates[] = 'name = ?';
            $params[] = trim($body['name']);
        }
        
        if (isset($body['description'])) {
            $updates[] = 'description = ?';
            $params[] = trim($body['description']);
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 400);
            return;
        }
        
        // Add ID to params for WHERE clause
        $params[] = $id;
        
        $sql = "UPDATE segments SET " . implode(', ', $updates) . " WHERE id = ?";
        Database::execute($sql, $params);
        
        // Fetch and return updated segment
        $updated = Database::fetchOne(
            'SELECT id, name, description, created_at, updated_at FROM segments WHERE id = ?',
            [$id]
        );
        
        Response::success($updated, 200);
        
    } catch (Exception $e) {
        Response::error('Failed to update segment: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle DELETE request - delete segment
 */
function handleDelete($id)
{
    // Require admin authentication
    Auth::requireRole('admin');
    
    try {
        $id = intval($id);
        
        // Check if segment exists
        $segment = Database::fetchOne('SELECT id, name FROM segments WHERE id = ?', [$id]);
        if (!$segment) {
            Response::error('Segment not found', 404);
            return;
        }
        
        // Check for any dependent records across all related tables
        $reasons = [];
        
        // 1. Branches / Sites
        $branchCount = Database::fetchOne('SELECT COUNT(*) as count FROM branches WHERE segment_id = ?', [$id]);
        $bCount = $branchCount ? intval($branchCount['count']) : 0;
        
        $siteCount = Database::fetchOne('SELECT COUNT(*) as count FROM sites WHERE segment_id = ?', [$id]);
        $sCount = $siteCount ? intval($siteCount['count']) : 0;
        $totalBranches = max($bCount, $sCount);
        if ($totalBranches > 0) {
            $reasons[] = "{$totalBranches} branch(es)";
        }

        // 2. Canteens linked via branches/sites
        $canteenCount = Database::fetchOne(
            'SELECT COUNT(*) as count FROM canteens WHERE branch_id IN (SELECT id FROM branches WHERE segment_id = ?) OR site IN (SELECT location FROM sites WHERE segment_id = ?)',
            [$id, $id]
        );
        $cCount = $canteenCount ? intval($canteenCount['count']) : 0;
        if ($cCount > 0) {
            $reasons[] = "{$cCount} canteen(s)";
        }
        
        // 3. Questions
        $questionCount = Database::fetchOne('SELECT COUNT(*) as count FROM questions WHERE segment_id = ?', [$id]);
        $qCount = $questionCount ? intval($questionCount['count']) : 0;
        if ($qCount > 0) {
            $reasons[] = "{$qCount} question(s)";
        }
        
        // 4. Feedback
        $feedbackCount = Database::fetchOne('SELECT COUNT(*) as count FROM feedback WHERE segment_id = ?', [$id]);
        $fCount = $feedbackCount ? intval($feedbackCount['count']) : 0;
        if ($fCount > 0) {
            $reasons[] = "{$fCount} feedback response(s)";
        }
        
        if (!empty($reasons)) {
            $details = implode(', ', $reasons);
            Response::error(
                "Cannot delete segment '{$segment['name']}': {$details} are linked. Please reassign or remove them first.",
                409,
                [
                    'branches' => $totalBranches,
                    'canteens' => $cCount,
                    'questions' => $qCount,
                    'feedback' => $fCount,
                    'dependencies' => $reasons
                ]
            );
            return;
        }
        
        // Delete segment safely
        Database::execute('DELETE FROM segments WHERE id = ?', [$id]);
        
        Response::success(['message' => 'Segment deleted successfully'], 200);
        
    } catch (Exception $e) {
        Response::error('Failed to delete segment: ' . $e->getMessage(), 500);
    }
}
?>
