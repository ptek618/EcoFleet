from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecofleet.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=False, default="free")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    apu_devices = relationship("APUDeviceDB", back_populates="owner")
    service_records = relationship("ServiceRecordDB", back_populates="user")
    photos = relationship("PhotoUploadDB", back_populates="user")
    forum_posts = relationship("ForumPostDB", back_populates="author")

class DealerDB(Base):
    __tablename__ = "dealers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    services = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

class DownloadDB(Base):
    __tablename__ = "downloads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    file_url = Column(String, nullable=False)
    category = Column(String, nullable=False)
    version = Column(String, nullable=True)
    file_size = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)

class FAQDB(Base):
    __tablename__ = "faq"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    order = Column(Integer, nullable=False)

class APUDeviceDB(Base):
    __tablename__ = "apu_devices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    model = Column(String, nullable=False)
    status = Column(String, nullable=False, default="stopped")
    temperature = Column(Float, nullable=True)
    voltage = Column(Float, nullable=True)
    runtime_hours = Column(Integer, nullable=True)
    last_maintenance = Column(DateTime, nullable=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    owner = relationship("UserDB", back_populates="apu_devices")

class ForumPostDB(Base):
    __tablename__ = "forum_posts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    author_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    replies = Column(Text, nullable=False, default="[]")
    tags = Column(Text, nullable=False, default="[]")
    
    author = relationship("UserDB", back_populates="forum_posts")

class ServiceRecordDB(Base):
    __tablename__ = "service_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    device_id = Column(String, nullable=False)
    service_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    cost = Column(Float, nullable=True)
    service_date = Column(DateTime, nullable=False)
    technician = Column(String, nullable=False)
    status = Column(String, nullable=False)
    
    user = relationship("UserDB", back_populates="service_records")

class PhotoUploadDB(Base):
    __tablename__ = "photo_uploads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    caption = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending")
    upload_date = Column(DateTime, default=datetime.utcnow)
    approval_date = Column(DateTime, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    user = relationship("UserDB", back_populates="photos")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
