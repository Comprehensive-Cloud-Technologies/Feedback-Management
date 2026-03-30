# Canteen Feedback System - PHP Backend

Complete PHP backend for the Canteen Feedback System with MySQL database.

## Features

- ✅ RESTful API with 30+ endpoints
- ✅ JWT authentication
- ✅ Role-based access control (Admin, Branch Admin, User)
- ✅ MySQL database with PDO
- ✅ CORS support
- ✅ Security headers
- ✅ Error handling and logging
- ✅ Password hashing with bcrypt

## Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache with mod_rewrite enabled
- PDO MySQL extension

## Installation

### 1. Upload Files

Upload all files to your Hostinger subdomain folder:
```
/public_html/subdomain/backend/
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```env
DB_HOST=localhost
DB_NAME=canteen_feedback_system
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_secret_key_here
ADMIN_PASSWORD=admin123
ENVIRONMENT=production
FRONTEND_URL=https://yourdomain.com
```

### 3. Create Database

Create a MySQL database in Hostinger cPanel:
1. Go to MySQL Databases
2. Create database: `canteen_feedback_system`
3. Create user and assign to database
4. Note down credentials

### 4. Run Database Setup

Execute the setup script via browser or CLI:

**Via Browser:**
```
https://yourdomain.com/backend/database/setup.php
```

**Via CLI (if available):**
```bash
php database/setup.php
```

This will:
- Create all required tables
- Seed sample sites
- Create branch admin accounts
- Add default questions
- Add sample canteens

### 5. Verify Installation

Test the API:
```
https://yourdomain.com/backend/
```

Should return:
```json
{
  "message": "Canteen Feedback System API",
  "version": "1.0.0"
}
```

## API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /admin-login` - Admin login
- `POST /branch-admin-login` - Branch admin login

### Sites
- `GET /sites` - List all sites
- `POST /sites` - Create site (admin only)
- `PUT /sites` - Update site (admin only)
- `DELETE /sites?id=X` - Delete site (admin only)

### Feedback
- `POST /feedback` - Submit feedback
- `GET /admin/feedback` - List feedback (admin/branch admin)
- `DELETE /admin/feedback?id=X` - Delete feedback

### Canteens
- `GET /canteens?site=X` - List canteens for site
- `POST /admin/canteens` - Create canteen (admin only)
- `DELETE /admin/canteens?site=X&name=Y` - Delete canteen (admin only)

### Questions
- `GET /questions?site=X` - List questions for site
- `POST /questions` - Create question (admin only)
- `PUT /questions` - Update question (admin only)
- `DELETE /questions?id=X` - Delete question (admin only)

### Users
- `GET /admin/users` - List users (admin only)
- `POST /admin/users` - Create user (admin only)
- `PUT /admin/users` - Update user (admin only)
- `DELETE /admin/users?id=X` - Delete user (admin only)

### Branch Admins
- `GET /admin/branch-admins` - List branch admins (admin only)
- `POST /admin/branch-admins` - Create branch admin (admin only)
- `PUT /admin/branch-admins` - Update branch admin (admin only)
- `DELETE /admin/branch-admins?id=X` - Delete branch admin (admin only)

## Sample Credentials

### System Admin
- Password: `admin123` (change in .env)

### Branch Admins
- Mumbai Central: `mumbai_admin` / `mumbai123`
- Delhi NCR: `delhi_admin` / `delhi123`
- Bangalore Tech Park: `blr_admin` / `bangalore123`
- Pune Office: `pune_admin` / `pune123`
- Chennai Branch: `chennai_admin` / `chennai123`

## Security

- All passwords are hashed using bcrypt
- JWT tokens expire after 2 hours
- SQL injection protection via prepared statements
- CORS configured for allowed origins
- Security headers enabled
- Input validation on all endpoints

## Troubleshooting

### 500 Internal Server Error
- Check PHP error logs
- Verify database credentials in .env
- Ensure mod_rewrite is enabled
- Check file permissions

### Database Connection Failed
- Verify database exists
- Check credentials in .env
- Ensure MySQL service is running
- Check database user permissions

### CORS Errors
- Update FRONTEND_URL in .env
- Check CORS configuration in config/cors.php
- Verify .htaccess is working

## File Structure

```
cfs-backend-php/
├── api/
│   ├── auth/
│   ├── sites/
│   ├── feedback/
│   ├── canteens/
│   ├── questions/
│   ├── users/
│   └── branch-admins/
├── config/
│   ├── database.php
│   ├── cors.php
│   └── constants.php
├── utils/
│   ├── jwt.php
│   ├── auth.php
│   └── response.php
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── setup.php
├── .htaccess
├── .env.example
├── index.php
└── README.md
```

## Support

For issues or questions, check the error logs:
- PHP error log (configured in php.ini)
- Apache error log
- Application logs (if configured)

## License

Proprietary - Canteen Feedback System
