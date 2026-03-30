#!/usr/bin/env python3
"""
Database Migration Script for Segments Hierarchy
Adds segments table and relationships to existing tables
"""

import mysql.connector
import sys

def run_migration():
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user='feedback_user',
            password='feedback_user',
            database='canteen_feedback'
        )
        cursor = conn.cursor()
        print('✓ Connected to database')
        
        # Create segments table
        cursor.execute('''CREATE TABLE IF NOT EXISTS segments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci''')
        print('✓ Segments table created/verified')
        
        # Add segment_id to sites table
        try:
            cursor.execute('ALTER TABLE sites ADD COLUMN segment_id INT NULL')
            print('✓ Added segment_id to sites')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  segment_id already exists in sites')
            else:
                raise
        
        # Add foreign key for sites.segment_id
        try:
            cursor.execute('ALTER TABLE sites ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE')
            print('✓ Added FK: sites.segment_id → segments.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for sites.segment_id')
            else:
                raise
        
        # Add index
        try:
            cursor.execute('ALTER TABLE sites ADD INDEX idx_segment_id (segment_id)')
        except:
            pass
        
        # Add branch_id to canteens
        try:
            cursor.execute('ALTER TABLE canteens ADD COLUMN branch_id INT NULL')
            print('✓ Added branch_id to canteens')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  branch_id already exists in canteens')
            else:
                raise
        
        # Add foreign key for canteens.branch_id
        try:
            cursor.execute('ALTER TABLE canteens ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE')
            print('✓ Added FK: canteens.branch_id → sites.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for canteens.branch_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE canteens ADD INDEX idx_branch_id (branch_id)')
        except:
            pass
        
        # Add segment_id to branch_admins
        try:
            cursor.execute('ALTER TABLE branch_admins ADD COLUMN segment_id INT NULL')
            print('✓ Added segment_id to branch_admins')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  segment_id already exists in branch_admins')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE branch_admins ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE')
            print('✓ Added FK: branch_admins.segment_id → segments.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for branch_admins.segment_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE branch_admins ADD INDEX idx_segment_id (segment_id)')
        except:
            pass
        
        # Add segment_id and branch_id to questions
        try:
            cursor.execute('ALTER TABLE questions ADD COLUMN segment_id INT NULL')
            print('✓ Added segment_id to questions')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  segment_id already exists in questions')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE questions ADD COLUMN branch_id INT NULL')
            print('✓ Added branch_id to questions')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  branch_id already exists in questions')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE questions ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE')
            print('✓ Added FK: questions.segment_id → segments.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for questions.segment_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE questions ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE')
            print('✓ Added FK: questions.branch_id → sites.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for questions.branch_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE questions ADD INDEX idx_segment_id (segment_id)')
            cursor.execute('ALTER TABLE questions ADD INDEX idx_branch_id (branch_id)')
        except:
            pass
        
        # Add segment_id and branch_id to feedback
        try:
            cursor.execute('ALTER TABLE feedback ADD COLUMN segment_id INT NULL')
            print('✓ Added segment_id to feedback')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  segment_id already exists in feedback')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE feedback ADD COLUMN branch_id INT NULL')
            print('✓ Added branch_id to feedback')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  branch_id already exists in feedback')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE feedback ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE')
            print('✓ Added FK: feedback.segment_id → segments.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for feedback.segment_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE feedback ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE')
            print('✓ Added FK: feedback.branch_id → sites.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for feedback.branch_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE feedback ADD INDEX idx_segment_id (segment_id)')
            cursor.execute('ALTER TABLE feedback ADD INDEX idx_branch_id (branch_id)')
        except:
            pass
        
        # Add segment_id and branch_id to users
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN segment_id INT NULL')
            print('✓ Added segment_id to users')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  segment_id already exists in users')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN branch_id INT NULL')
            print('✓ Added branch_id to users')
        except mysql.connector.Error as e:
            if 'Duplicate column' in str(e):
                print('  branch_id already exists in users')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE users ADD FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE')
            print('✓ Added FK: users.segment_id → segments.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for users.segment_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE users ADD FOREIGN KEY (branch_id) REFERENCES sites(id) ON DELETE CASCADE')
            print('✓ Added FK: users.branch_id → sites.id')
        except mysql.connector.Error as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('  FK already exists for users.branch_id')
            else:
                raise
        
        try:
            cursor.execute('ALTER TABLE users ADD INDEX idx_segment_id (segment_id)')
            cursor.execute('ALTER TABLE users ADD INDEX idx_branch_id (branch_id)')
        except:
            pass
        
        # Insert initial segments
        print('\nInserting initial segments...')
        cursor.execute('INSERT IGNORE INTO segments (name, description) VALUES (%s, %s)', ('FM', 'Facility Management'))
        cursor.execute('INSERT IGNORE INTO segments (name, description) VALUES (%s, %s)', ('FS', 'Facilities Support'))
        cursor.execute('INSERT IGNORE INTO segments (name, description) VALUES (%s, %s)', ('INFRA', 'Infrastructure'))
        print('✓ Inserted initial segments (FM, FS, INFRA)')
        
        # Update existing sites with default segment (FM)
        cursor.execute('UPDATE sites SET segment_id = (SELECT id FROM segments WHERE name = %s LIMIT 1) WHERE segment_id IS NULL', ('FM',))
        updated = cursor.rowcount
        if updated > 0:
            print(f'✓ Updated {updated} existing sites with default segment (FM)')
        
        # Update canteens to link to their sites
        cursor.execute('''UPDATE canteens c 
                          JOIN sites s ON c.site = s.location 
                          SET c.branch_id = s.id 
                          WHERE c.branch_id IS NULL''')
        updated = cursor.rowcount
        if updated > 0:
            print(f'✓ Updated {updated} canteens with branch references')
        
        conn.commit()
        print('\n✅ Migration completed successfully!')
        
        # Verify
        cursor.execute('SELECT COUNT(*) FROM segments')
        seg_count = cursor.fetchone()[0]
        print(f'\nVerification:')
        print(f'  Segments: {seg_count}')
        
        cursor.execute('SELECT COUNT(*) FROM sites WHERE segment_id IS NOT NULL')
        branch_count = cursor.fetchone()[0]
        print(f'  Sites with segment: {branch_count}')
        
        cursor.execute('SELECT COUNT(*) FROM canteens WHERE branch_id IS NOT NULL')
        canteen_count = cursor.fetchone()[0]
        print(f'  Canteens with branch: {canteen_count}')
        
        # Show segments
        cursor.execute('SELECT id, name, description FROM segments ORDER BY name')
        print(f'\nSegments in database:')
        for seg_id, name, desc in cursor.fetchall():
            print(f'  [{seg_id}] {name}: {desc}')
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f'\n✗ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
