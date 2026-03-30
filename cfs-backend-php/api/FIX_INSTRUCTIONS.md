# COMPLETE FIX - STEP BY STEP

## PROBLEM: Authorization header blocked on Hostinger

## SOLUTION IMPLEMENTED:

1. **Created fallback token extraction methods:**
   - Try Authorization header (Bearer token)
   - Try X-Token header
   - Try query parameter ?token=xxx
   - Try JSON body {token: "xxx"}

2. **Files updated:**
   - jwt.php: Added extractToken() method with 4 fallback methods
   - auth.php: Updated to use extractToken() instead of extractFromHeader()
   - .htaccess: Added Apache rules to pass Authorization header

3. **Files created for testing:**
   - test-save.php: Direct database insert test (bypasses auth)
   - branch-admins/index-debug.php: Debug handler (minimal, no auth)

## UPLOAD INSTRUCTIONS:

Using Hostinger File Manager:

### Step 1: Upload backend fixes
```
FROM:                                    TO:
jwt.php                       →  api/utils/jwt.php
auth.php                      →  api/utils/auth.php
.htaccess                     →  api/.htaccess
```

### Step 2: Upload test files
```
test-save.php                 →  api/test-save.php
branch-admins/index-debug.php →  api/branch-admins/index-debug.php
```

### Step 3: Upload frontend (from cfs-frontend/dist)
```
dist/index.html               →  public_html/feedback/index.html
dist/assets/*                 →  public_html/feedback/assets/
```

## TESTING:

### Test A: Database connectivity (CRITICAL)
Open: https://feedback.catalystsolutions.eco/api/test-save.php

Expected output:
```json
{
  "init_loaded": true,
  "database_class": "OK",
  "jwt_class": "OK",
  "db_connection": "SUCCESS",
  "branch_admins_check": "TABLE EXISTS, rows: 0",
  "insert_test": "SUCCESS - Inserted ID: 123",
  "verify_insert": "SUCCESS - Last record: {...}"
}
```

If you see SUCCESS on all checks, database is working.

### Test B: Try adding branch via UI
1. Open https://feedback.catalystsolutions.eco/admin/sites
2. Click "Add Branch"
3. Fill in: Site, Username, Password
4. Click "Add Branch"
5. Check: Does it appear in the list? (Check browser console for errors)

### Test C: Check database directly
1. Go to Hostinger → MySQL → phpMyAdmin
2. Open database: u727010312_feedback
3. Click table: branch_admins
4. Check: Do you see new rows?

## IF STILL NOT WORKING:

### Check error logs:
1. Hostinger → File Manager → navigate to public_html/feedback/api
2. Right-click on api folder → View Error Logs
3. Copy any error messages and send them here

### Manual test with query parameter:
Open this in browser:
```
https://feedback.catalystsolutions.eco/api/test-branch-admins.php?token=YOUR_JWT_TOKEN_HERE
```

This bypasses all header issues and tests if token extraction works.

## EXPECTED FINAL RESULT:

After all fixes:
1. ✅ Admin can login
2. ✅ Can navigate to "Manage Branches"
3. ✅ Can click "Add Branch"
4. ✅ Form submits successfully
5. ✅ New admin appears in list immediately
6. ✅ Data is saved in database (phpMyAdmin shows it)
7. ✅ No 500 errors in console

## QUICK CHECKLIST:

Before testing:
- [ ] jwt.php uploaded to api/utils/
- [ ] auth.php uploaded to api/utils/
- [ ] .htaccess uploaded to api/
- [ ] test-save.php uploaded to api/
- [ ] Frontend rebuilt and uploaded
- [ ] Browser hard refresh (Ctrl+Shift+R)

Testing:
- [ ] Run test-save.php and get SUCCESS
- [ ] Try adding branch via UI
- [ ] Check phpMyAdmin for new row
- [ ] Check browser console for errors
