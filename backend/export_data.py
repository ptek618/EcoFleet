#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime

def export_sqlite_data():
    conn = sqlite3.connect('ecofleet.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    tables = ['users', 'dealers', 'downloads', 'faq', 'apu_devices', 'forum_posts', 'service_records', 'photo_uploads']
    exported_data = {}
    
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            exported_data[table] = [dict(row) for row in rows]
            print(f"Exported {len(rows)} rows from {table}")
        except sqlite3.OperationalError as e:
            print(f"Table {table} does not exist: {e}")
            exported_data[table] = []
    
    with open('ecofleet_data_export.json', 'w') as f:
        json.dump(exported_data, f, indent=2, default=str)
    
    conn.close()
    print("Data export completed: ecofleet_data_export.json")

if __name__ == "__main__":
    export_sqlite_data()
