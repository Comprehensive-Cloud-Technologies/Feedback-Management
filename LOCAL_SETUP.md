# Canteen Feedback System - Local Development Setup

## System Requirements

- **Windows 10/11**
- **PHP 8.5+** (installed at `D:\php`)
- **Node.js 18+** (for npm)
- **MySQL 8.0+** (running as service on localhost:3306)

## Quick Start

### Option 1: Use the Startup Script (Recommended)

Double-click `START_SERVERS.bat` in the root directory. This will automatically:
- Kill any existing PHP/Node processes
- Start PHP Backend Server on `http://localhost:8000`
- Start React Frontend on `http://localhost:5173`

### Option 2: Manual Startup

**Terminal 1 - PHP Backend:**
```bash
cd D:\newlivefeedback\wholefeedback\cfs-backend-php
D:\php\php.exe -c php-dev.ini -S localhost:8000
```

**Terminal 2 - React Frontend:**
```bash
cd D:\newlivefeedback\wholefeedback\cfs-frontend
npm run dev
```

## System Credentials

### Admin Login
- **Username:** admin
- **Password:** SuperAdmin@2835

### Database
- **Username:** feedback_user
- **Password:** feedback123
- **Database:** canteen_feedback
- **Host:** 127.0.0.1:3306

## URLs

| Service | Local URL | Network URL |
|---------|-----------|-------------|
| Frontend | http://localhost:5173 | http://192.168.1.100:5173 |
| Backend API | http://localhost:8000/api | http://192.168.1.100:8000/api |

**Use the Network URL when:**
- Accessing from a different device on the same WiFi
- Testing QR codes (they embed the network IP)
- Testing from mobile phones

## Accessing from Different Devices

### Desktop (Same Network)
1. Open browser on another computer
2. Visit: `http://192.168.1.100:5173`
3. The system automatically detects your IP and uses correct API URLs

### Mobile Phone (Same WiFi)
1. Get your PC's IP: Open PowerShell and run `ipconfig` (look for IPv4 Address)
2. Visit: `http://<YOUR_IP>:5173` in mobile browser
3. QR codes on the QR Codes tab can be scanned to open the feedback form

## Architecture

### Backend (PHP)
- **Location:** `cfs-backend-php/`
- **Entry Point:** `api/index.php` (Router)
- **Configuration:** `api/.env` and `php-dev.ini`
- **Database:** MySQL (`canteen_feedback`)
- **Port:** 8000

### Frontend (React)
- **Location:** `cfs-frontend/`
- **Build Tool:** Vite
- **Package Manager:** npm
- **Port:** 5173

### Database
- **Type:** MySQL 8.0
- **Location:** Local (127.0.0.1:3306)
- **Schema:** `canteen_feedback`
- **Tables:** sites, branch_admins, canteens, feedback, questions, users

## Core Features

### Admin Panel
- **Dashboard:** Overview of all feedback
- **Manage Branches:** Add/edit/delete branch locations
- **Manage Branch Admins:** Create administrators for each branch
- **Manage Canteens:** Manage canteen locations within branches
- **Manage Questions:** Configure feedback questions
- **Manage Feedback:** View and analyze all feedback
- **QR Codes:** Generate and print QR codes for feedback forms

### User Portal
- **Feedback Form:** Rate canteen experience (multiple questions with smiley face ratings)
- **QR Code Scanning:** Scan QR codes to quickly access feedback form
- **Responsive Design:** Works on desktop and mobile

## Key Fixes Implemented

### CORS Configuration
- **File:** `api/init.php`
- **Fix:** Properly echoes back all requested HTTP headers including `x-token`
- **Result:** Mobile and network-based requests no longer blocked

### Dynamic Host Detection
- **File:** `constants.ts`
- **Fix:** Created `getEndpoints()` function that detects host at runtime
- **Result:** QR codes use network IP (192.168.1.100) instead of localhost

### Components Using Dynamic Endpoints
- `AdminLogin.tsx` - Uses `getEndpoints()` for dynamic API URLs
- `AdminBranchAdmins.tsx` - Uses `getEndpoints()` for dynamic API URLs
- Other components still use static `ENDPOINTS` (backward compatible)

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 8000 or 5173
netstat -ano | findstr :<PORT>

# Kill process by ID (replace <PID>)
taskkill /PID <PID> /F
```

### PHP Server Not Starting
- Verify PHP is installed: `D:\php\php.exe -v`
- Check php-dev.ini exists: `D:\newlivefeedback\wholefeedback\cfs-backend-php\php-dev.ini`
- Verify extension directory: `D:\php\ext` has required DLLs

### Frontend Not Connecting to Backend
1. **Check API URL:** Open browser console (F12) and look for network requests
2. **Verify Both Services Running:**
   - Backend: `http://localhost:8000/api/sites` should return JSON
   - Frontend: `http://localhost:5173` should load
3. **Check CORS:** Network tab should show `Access-Control-Allow-Origin` header

### Database Connection Failing
```sql
-- Verify credentials in Command Prompt
mysql -h 127.0.0.1 -u feedback_user -p
-- Type password: feedback123
-- Type: USE canteen_feedback;
-- Type: SELECT COUNT(*) FROM sites;
```

## File Structure

```
d:\newlivefeedback\wholefeedback\
├── START_SERVERS.bat                 ← Start this to run both servers
├── cfs-backend-php/
│   ├── php-dev.ini                   ← PHP Configuration
│   ├── api/
│   │   ├── init.php                  ← CORS & database initialization
│   │   ├── index.php                 ← Router
│   │   ├── config/
│   │   │   ├── database.php          ← MySQL connection
│   │   │   └── constants.php
│   │   ├── utils/
│   │   │   ├── cors.php              ← CORS headers
│   │   │   ├── auth.php              ← JWT authentication
│   │   │   └── response.php
│   │   ├── sites/index.php           ← Manage sites/branches
│   │   ├── branch-admins/index.php   ← Manage branch admins
│   │   ├── feedback/index.php        ← Feedback submission & retrieval
│   │   └── [other endpoints]
│   └── database/
│       ├── schema.sql                ← Database schema
│       └── seed.sql                  ← Sample data
└── cfs-frontend/
    ├── package.json                  ← Dependencies
    ├── vite.config.ts                ← Vite configuration
    ├── tsconfig.json                 ← TypeScript configuration
    ├── constants.ts                  ← API URLs & endpoints (DYNAMIC)
    ├── components/
    │   ├── AdminLogin.tsx            ← Uses getEndpoints()
    │   ├── AdminBranchAdmins.tsx     ← Uses getEndpoints()
    │   ├── AdminSites.tsx
    │   ├── QRCodePrintPage.tsx
    │   └── [other components]
    └── styles/
        ├── index.css
        └── styles.css
```

## Database Schema

### sites (branches)
```
id | location (Site ID) | branch_location | created_at
```

### branch_admins
```
id | site | username | password_hash | created_at
```

### canteens
```
id | site_id | name | location | created_at
```

### feedback
```
id | canteen_id | question_id | rating (1-4) | user_name | created_at
```

### questions
```
id | text | created_at
```

### users
```
id | username | email | password_hash | role | created_at
```

## Common Tasks

### Add a New Branch
1. Login as admin
2. Go to "Manage Branches"
3. Enter Branch Name (Site ID) and Branch Location
4. Click "+ Add Branch"

### Generate QR Codes
1. Go to "QR Codes" tab
2. Select branch and canteen
3. Click "Print QR" to print or "Open Form" to test

### View Analytics
1. Go to "Manage Feedback"
2. Select date range and branch
3. View charts and statistics

## Support & Development

- **Backend Issues:** Check `cfs-backend-php/api/` error logs
- **Frontend Issues:** Check browser console (F12 → Console)
- **Database Issues:** Check MySQL service status

## Notes

- PHP development server uses IPv6 loopback [::1] but resolves via localhost
- CORS headers properly echo back all requested headers including x-token
- Dynamic constants ensure QR codes work from mobile on network
- Session storage used for local authentication tokens
- JWT tokens stored in localStorage for persistence across page reloads
