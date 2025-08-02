from app.database import SessionLocal, create_tables
from app.main import init_sample_data

def main():
    create_tables()
    db = SessionLocal()
    try:
        init_sample_data(db)
        print('Sample data initialized successfully')
    finally:
        db.close()

if __name__ == "__main__":
    main()
