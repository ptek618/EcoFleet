#!/usr/bin/env python3
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import UserDB, DealerDB, DownloadDB, FAQDB, APUDeviceDB, ForumPostDB, ServiceRecordDB, PhotoUploadDB
from datetime import datetime

def import_data_to_postgresql():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL environment variable not set")
        return
    
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    with open('ecofleet_data_export.json', 'r') as f:
        data = json.load(f)
    
    model_mapping = {
        'users': UserDB,
        'dealers': DealerDB,
        'downloads': DownloadDB,
        'faq': FAQDB,
        'apu_devices': APUDeviceDB,
        'forum_posts': ForumPostDB,
        'service_records': ServiceRecordDB,
        'photo_uploads': PhotoUploadDB
    }
    
    for table_name, model_class in model_mapping.items():
        if table_name in data and data[table_name]:
            for row_data in data[table_name]:
                for key, value in row_data.items():
                    if key.endswith('_date') or key.endswith('_at'):
                        if value:
                            try:
                                row_data[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                            except ValueError:
                                try:
                                    row_data[key] = datetime.strptime(value, '%Y-%m-%d %H:%M:%S.%f')
                                except ValueError:
                                    row_data[key] = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                
                instance = model_class(**row_data)
                db.add(instance)
            
            print(f"Imported {len(data[table_name])} rows to {table_name}")
        else:
            print(f"No data found for table {table_name}")
    
    db.commit()
    db.close()
    print("Data import completed")

if __name__ == "__main__":
    import_data_to_postgresql()
