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
            if ($action === 'delete' && $id) {
                handleDelete($id);
            } else {
                Response::error('Invalid action', 400);
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
        $segment = Database::fetchOne('SELECT id FROM segments WHERE id = ?', [$id]);
        if (!$segment) {
            Response::error('Segment not found', 404);
            return;
        }
        
        // Check if segment has any branches
        $branchCount = Database::fetchOne(
            'SELECT COUNT(*) as count FROM sites WHERE segment_id = ?',
            [$id]
        );
        
        if ($branchCount && $branchCount['count'] > 0) {
            Response::error(
                'Cannot delete segment with associated branches or canteens',
                409,
                ['count' => $branchCount['count']]
            );
            return;
        }
        
        // Delete segment
        Database::execute('DELETE FROM segments WHERE id = ?', [$id]);
        
        Response::success(['message' => 'Segment deleted successfully'], 200);
        
    } catch (Exception $e) {
        Response::error('Failed to delete segment: ' . $e->getMessage(), 500);
    }
}
?>
