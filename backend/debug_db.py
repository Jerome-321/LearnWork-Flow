import sqlite3
import os

db_path = 'db.sqlite3'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Enable FK constraints
cursor.execute("PRAGMA foreign_keys = ON")

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("=== TABLES ===")
for table in tables:
    print(f"  - {table['name']}")

# Get UserProgress FK constraints
print("\n=== USERPROGRESS TABLE SCHEMA ===")
cursor.execute("PRAGMA table_info(api_userprogress)")
for row in cursor.fetchall():
    print(f"  cid={row['cid']}, name={row['name']}, type={row['type']}, notnull={row['notnull']}, dflt_value={row['dflt_value']}, pk={row['pk']}")

# Get CustomUser FK constraints  
print("\n=== CUSTOMUSER TABLE SCHEMA ===")
cursor.execute("PRAGMA table_info(api_customuser)")
for row in cursor.fetchall():
    print(f"  cid={row['cid']}, name={row['name']}, type={row['type']}, notnull={row['notnull']}, dflt_value={row['dflt_value']}, pk={row['pk']}")

# Check FK constraints for api_userprogress
print("\n=== FOREIGN KEY CONSTRAINTS FOR userprogress ===")
cursor.execute("PRAGMA foreign_key_list(api_userprogress)")
for row in cursor.fetchall():
    print(f"  id={row['id']}, table={row['table']}, from={row['from']}, to={row['to']}, on_delete={row['on_delete']}")

# Count records
print("\n=== RECORD COUNTS ===")
cursor.execute("SELECT COUNT(*) FROM api_customuser")
print(f"  CustomUser count: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM api_userprogress")
print(f"  UserProgress count: {cursor.fetchone()[0]}")

# Try to manually insert
print("\n=== TESTING MANUAL INSERT ===")
try:
    # First check if there's a CustomUser to reference
    cursor.execute("SELECT id FROM api_customuser LIMIT 1")
    result = cursor.fetchone()
    if result:
        user_id = result[0]
        print(f"  Found CustomUser with id={user_id}")
        try:
            cursor.execute("""
                INSERT INTO api_userprogress (user_id, totalPoints, tasksCompleted, petLevel, petStage, currentStreak, longestStreak)
                VALUES (?, 0, 0, 1, 'egg', 0, 0)
            """, (user_id,))
            conn.commit()
            print(f"  Successfully inserted UserProgress")
        except Exception as e:
            print(f"  INSERT failed with ALL fields: {e}")
            conn.rollback()
            # Try with just the basic fields
            try:
                cursor.execute("""
                    INSERT INTO api_userprogress (user_id, totalPoints, tasksCompleted, petLevel, petStage, currentStreak, longestStreak)
                    VALUES (?, 0, 0, 1, 'egg', 0, 0)
                """, (user_id,))
                conn.commit()
                print(f"  Successfully inserted with all fields")
            except Exception as e2:
                print(f"  Still failed: {e2}")
    else:
        print("  No CustomUser found to reference")
except Exception as e:
    print(f"  Error: {e}")

conn.close()
