# Segments Hierarchy Implementation Guide

## 📊 New System Architecture

### Hierarchy Structure
```
Segments (FM, FS, INFRA, etc.)
├── Branch 1
│   ├── Canteen 1
│   ├── Canteen 2
│   └── Canteen 3
├── Branch 2
│   ├── Canteen 1
│   ├── Canteen 2
│   └── Canteen 3
└── Branch 3
    ├── Canteen 1
    └── Canteen 2
```

### What Changed

**Old Hierarchy:**
- Branch → Canteens

**New Hierarchy:**
- Segments → Branches → Canteens

---

## 🗄️ Database Changes

### New Tables
- **segments** - Organizational hierarchy top level
  - `id` (INT, Primary Key)
  - `name` (VARCHAR, UNIQUE) - e.g., "FM", "FS", "INFRA"
  - `description` (TEXT) - e.g., "Facility Management"
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### Modified Tables
All existing tables now include references to the hierarchy:

**sites** (formerly branches):
- NEW: `segment_id` (INT, Foreign Key → segments.id)

**canteens**:
- NEW: `branch_id` (INT, Foreign Key → sites.id)
- EXISTING: `site` (kept for backward compatibility)

**branch_admins**:
- NEW: `segment_id` (INT, Foreign Key → segments.id)

**questions**:
- NEW: `segment_id` (INT, Foreign Key → segments.id)
- NEW: `branch_id` (INT, Foreign Key → sites.id)

**feedback**:
- NEW: `segment_id` (INT, Foreign Key → segments.id)
- NEW: `branch_id` (INT, Foreign Key → sites.id)

**users**:
- NEW: `segment_id` (INT, Foreign Key → segments.id)
- NEW: `branch_id` (INT, Foreign Key → sites.id)

---

## 🔌 New API Endpoints

### Segments API
Base URL: `http://192.168.1.100:8000/api/segments/index.php`

#### 1. Get All Segments
```
GET /api/segments/index.php?action=list
Authorization: Bearer {adminToken}

Response (200):
[
  {
    "id": 1,
    "name": "FM",
    "description": "Facility Management",
    "created_at": "2026-01-29T10:00:00Z",
    "updated_at": "2026-01-29T10:00:00Z",
    "total_branches": 3,
    "total_canteens": 8
  }
]
```

#### 2. Get Single Segment
```
GET /api/segments/index.php?action=get&id=1
Authorization: Bearer {adminToken}

Response (200):
{
  "id": 1,
  "name": "FM",
  "description": "Facility Management",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z",
  "total_branches": 3,
  "total_canteens": 8
}
```

#### 3. Create Segment
```
POST /api/segments/index.php?action=create
Authorization: Bearer {adminToken}
Content-Type: application/json

Body:
{
  "name": "FM",
  "description": "Facility Management"
}

Response (201):
{
  "id": 1,
  "name": "FM",
  "description": "Facility Management",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z",
  "total_branches": 0,
  "total_canteens": 0
}
```

#### 4. Update Segment
```
PUT /api/segments/index.php?action=update&id=1
Authorization: Bearer {adminToken}
Content-Type: application/json

Body:
{
  "name": "FM",
  "description": "Facility Management Updated"
}

Response (200):
{
  "id": 1,
  "name": "FM",
  "description": "Facility Management Updated",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z",
  "total_branches": 3,
  "total_canteens": 8
}
```

#### 5. Delete Segment
```
DELETE /api/segments/index.php?action=delete&id=1
Authorization: Bearer {adminToken}

Response (200):
{
  "message": "Segment deleted successfully"
}

Response (409) - Cannot delete if has branches/canteens:
{
  "error": "Cannot delete segment with existing branches and canteens",
  "branches": 3,
  "canteens": 8
}
```

---

## 🖥️ Frontend Components

### AdminSegments Component
**File:** `cfs-frontend/components/AdminSegments.tsx`

**Features:**
- ✅ Create new segments with name and description
- ✅ View all segments with statistics (branch count, canteen count)
- ✅ Edit segment details
- ✅ Delete segments (with validation to prevent orphaned data)
- ✅ Real-time error handling and notifications

**UI Elements:**
1. **Add New Segment Form**
   - Segment Name (required) - e.g., "FM", "FS", "INFRA"
   - Description (optional) - e.g., "Facility Management"

2. **Segments Table**
   - ID: Unique segment identifier
   - Name: Segment name
   - Description: Segment description
   - Branches: Number of branches in segment
   - Canteens: Total canteens across all branches
   - Created: Date segment was created
   - Actions: Edit, Delete

### Updated Components

**AdminBranchAdmins.tsx**
- Now includes `segment_id` field
- Users select segment before managing branches

**AdminCanteens.tsx**
- Filters canteens by segment → branch hierarchy
- Shows canteens only for selected segment's branches

**Other Admin Components**
- AdminQuestionManager: Filter questions by segment
- AdminFeedback: Show feedback filtered by segment
- AdminDashboard: Statistics by segment

---

## 🔄 Data Flow

### Creating a Segment-Branch-Canteen Structure

```
1. Super Admin logs in
   ↓
2. Admin → Manage Segments
   - Creates "FM" segment
   ↓
3. Admin → Manage Branches (now shows segment dropdown)
   - Selects "FM" segment
   - Creates "Branch 1" under FM
   - Creates "Branch 2" under FM
   ↓
4. Admin → Manage Canteens (now shows segment → branch selection)
   - Selects "FM" segment
   - Selects "Branch 1"
   - Creates "Canteen 1"
   - Creates "Canteen 2"
   ↓
5. Admin → Manage Questions/Feedback
   - Questions/Feedback filtered by segment → branch → canteen
```

---

## ✅ CRUD Operations by Component

### Segments CRUD (AdminSegments.tsx)
| Operation | Component | API Endpoint | Status |
|-----------|-----------|--------------|--------|
| Create | AdminSegments | POST /api/segments/index.php?action=create | ✅ |
| Read | AdminSegments | GET /api/segments/index.php?action=list | ✅ |
| Read (Single) | AdminSegments | GET /api/segments/index.php?action=get&id={id} | ✅ |
| Update | AdminSegments | PUT /api/segments/index.php?action=update&id={id} | ✅ |
| Delete | AdminSegments | DELETE /api/segments/index.php?action=delete&id={id} | ✅ |

### Branches CRUD (AdminBranchAdmins.tsx - to be updated)
| Operation | Component | Notes |
|-----------|-----------|-------|
| Create | AdminBranchAdmins | Now requires segment_id |
| Read | AdminBranchAdmins | Filter by segment_id |
| Update | AdminBranchAdmins | Can update segment_id |
| Delete | AdminBranchAdmins | Cascade deletes canteens |

### Canteens CRUD (AdminCanteens.tsx - to be updated)
| Operation | Component | Notes |
|-----------|-----------|-------|
| Create | AdminCanteens | Now requires branch_id (via segment → branch selection) |
| Read | AdminCanteens | Filter by segment → branch |
| Update | AdminCanteens | Can update branch assignment |
| Delete | AdminCanteens | Cascade deletes feedback |

---

## 🚀 Usage Instructions

### For Super Admin

#### Step 1: Create Segments
1. Login: `http://192.168.1.100:5173/#/admin-login`
2. Credentials: `admin/admin`
3. Click "Manage Segments" in sidebar
4. Fill "Add New Segment":
   - Segment Name: "FM" (or "FS", "INFRA", etc.)
   - Description: "Facility Management"
5. Click "Create Segment"

#### Step 2: Create Branches (under Segments)
1. Click "Manage Branches"
2. Select Segment: "FM"
3. Fill "Add New Branch":
   - Branch Name: "Branch 1"
   - Location: "Mumbai Central"
4. Click "Add Branch"

#### Step 3: Create Canteens (under Branches)
1. Click "Manage Canteens"
2. Select Segment: "FM"
3. Select Branch: "Branch 1"
4. Fill "Add New Canteen":
   - Canteen Name: "Canteen 1"
5. Click "Add Canteen"

#### Step 4: Manage Branch Admins
1. Click "Manage Branch Admins"
2. Select Segment: "FM"
3. Select Branch: "Branch 1"
4. Assign admin to branch

---

## 🧪 Testing Checklist

### Segments Management
- [ ] Create new segment with name and description
- [ ] Edit segment details (name, description)
- [ ] View all segments with accurate branch/canteen counts
- [ ] Delete empty segment successfully
- [ ] Cannot delete segment with branches (error shown)
- [ ] Cannot delete segment with canteens (error shown)
- [ ] Segment appears immediately after creation

### Branch Management (Integration)
- [ ] Can select segment when creating branch
- [ ] Branch appears under correct segment
- [ ] Can edit branch's segment assignment
- [ ] Cannot delete branch with canteens

### Canteen Management (Integration)
- [ ] Canteen creation requires segment → branch selection
- [ ] Canteen appears under correct branch
- [ ] Can filter canteens by segment → branch
- [ ] Feedback correctly associated with segment → branch → canteen

### Data Integrity
- [ ] All foreign key relationships enforced
- [ ] Cascade deletes work correctly
- [ ] No orphaned records
- [ ] Existing data properly migrated

---

## 🔐 Permissions

### Admin Only
- ✅ Create segments
- ✅ Edit segments
- ✅ Delete segments
- ✅ View all segments, branches, canteens
- ✅ Create/Edit/Delete branches
- ✅ Assign branch admins

### Branch Admin
- ✅ View only assigned segment & branches
- ✅ View canteens in assigned branches
- ✅ Manage questions for assigned segment/branch
- ✅ View feedback for assigned segment/branch
- ❌ Create/Delete segments
- ❌ Create/Delete branches
- ❌ Assign branch admins

### Regular Users
- ✅ Submit feedback
- ✅ View available canteens/questions
- ❌ Create/Edit/Delete anything

---

## 📝 SQL Queries for Testing

### View All Segments with Statistics
```sql
SELECT 
    s.id,
    s.name,
    s.description,
    COUNT(DISTINCT sites.id) as branches,
    COUNT(DISTINCT canteens.id) as canteens,
    s.created_at
FROM segments s
LEFT JOIN sites ON sites.segment_id = s.id
LEFT JOIN canteens ON canteens.branch_id = sites.id
GROUP BY s.id
ORDER BY s.name;
```

### View Hierarchy (Segment → Branch → Canteen)
```sql
SELECT 
    s.name as segment,
    sites.location as branch,
    canteens.name as canteen
FROM segments s
LEFT JOIN sites ON sites.segment_id = s.id
LEFT JOIN canteens ON canteens.branch_id = sites.id
ORDER BY s.name, sites.location, canteens.name;
```

### Count Canteens per Segment
```sql
SELECT 
    s.name as segment,
    COUNT(canteens.id) as total_canteens,
    COUNT(DISTINCT sites.id) as total_branches
FROM segments s
LEFT JOIN sites ON sites.segment_id = s.id
LEFT JOIN canteens ON canteens.branch_id = sites.id
GROUP BY s.id, s.name;
```

### View Feedback Distribution by Segment
```sql
SELECT 
    s.name as segment,
    sites.location as branch,
    canteens.name as canteen,
    COUNT(feedback.id) as total_feedback
FROM segments s
LEFT JOIN sites ON sites.segment_id = s.id
LEFT JOIN canteens ON canteens.branch_id = sites.id
LEFT JOIN feedback ON feedback.canteen_id = canteens.id
GROUP BY s.id, sites.id, canteens.id
ORDER BY s.name, sites.location, canteens.name;
```

---

## 📋 Migration Status

### Completed ✅
- [x] Database schema updated
- [x] Segments table created
- [x] Foreign keys added to all tables
- [x] Segments API endpoint created
- [x] AdminSegments component created
- [x] App.tsx updated with segments routing
- [x] Sidebar menu updated

### In Progress 🔄
- [ ] AdminBranchAdmins updated to support segment selection
- [ ] AdminCanteens updated to support segment → branch cascade
- [ ] AdminQuestionManager updated for segment filtering
- [ ] AdminFeedback updated for segment filtering
- [ ] Database migration script applied

### Pending 📋
- [ ] End-to-end testing of full hierarchy
- [ ] User documentation updates
- [ ] API documentation updates
- [ ] Production data migration

---

## 🆘 Troubleshooting

### Issue: "Segment not found" error
**Solution:** Ensure segment exists before creating branches/canteens under it

### Issue: Cannot delete segment
**Solution:** First delete all canteens, then delete branches, then delete segment

### Issue: Branch not showing after creation
**Solution:** Check that segment_id is correctly assigned in database

### Issue: Feedback not showing after submission
**Solution:** Verify feedback.segment_id and feedback.branch_id are set correctly

---

## 📞 Support & Questions

For issues or questions about the segments hierarchy implementation:
1. Check the SQL test queries above
2. Review the API endpoint documentation
3. Check browser console (F12) for error messages
4. Verify database migrations were applied

---

**Last Updated:** January 29, 2026
**Status:** ✅ Implementation In Progress
**Next Phase:** Component Updates & Integration Testing
