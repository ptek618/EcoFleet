from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import jwt
import hashlib
import uuid
import os
import json
from enum import Enum
from dotenv import load_dotenv

from .database import get_db, create_tables, UserDB, DealerDB, DownloadDB, FAQDB, APUDeviceDB, ForumPostDB, ServiceRecordDB, PhotoUploadDB
from .auth import get_current_user, require_paid_user, UserRole, SECRET_KEY, ALGORITHM
from . import admin

load_dotenv()

app = FastAPI(title="EcoFleet APU API", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


create_tables()
app.include_router(admin.router)


class APUStatus(str, Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    MAINTENANCE = "maintenance"
    ERROR = "error"

class PhotoStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.FREE

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    role: UserRole
    created_at: datetime

class APUControl(BaseModel):
    device_id: str
    action: str  # start, stop, status
    
class APUDevice(BaseModel):
    id: str
    name: str
    model: str
    status: APUStatus
    temperature: Optional[float]
    voltage: Optional[float]
    runtime_hours: Optional[int]
    last_maintenance: Optional[datetime]
    owner_id: str

class Dealer(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    phone: str
    email: str
    services: List[str]  # sales, service, support
    latitude: float
    longitude: float

class Download(BaseModel):
    id: str
    title: str
    description: str
    file_url: str
    category: str  # manual, update, brochure
    version: Optional[str]
    file_size: str
    upload_date: datetime

class FAQ(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    order: int

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str]
    subject: str
    message: str
    category: str  # support, sales, general

class ForumPost(BaseModel):
    id: str
    title: str
    content: str
    author_id: str
    author_name: str
    created_at: datetime
    replies: List[Dict[str, Any]]
    tags: List[str]

class ServiceRecord(BaseModel):
    id: str
    user_id: str
    device_id: str
    service_type: str  # maintenance, repair, warranty
    description: str
    cost: Optional[float]
    service_date: datetime
    technician: str
    status: str

class PhotoUpload(BaseModel):
    id: str
    user_id: str
    filename: str
    caption: str
    status: PhotoStatus
    upload_date: datetime
    approval_date: Optional[datetime]
    admin_notes: Optional[str]

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def init_sample_data(db: Session):
    if db.query(DealerDB).count() == 0:
        dealers = [
            DealerDB(
                id="dealer1",
                name="EcoFleet Service Center - Chicago",
                address="123 Industrial Blvd",
                city="Chicago",
                state="IL",
                zip_code="60601",
                phone="(312) 555-0123",
                email="chicago@ecofleet.com",
                services=json.dumps(["sales", "service", "support"]),
                latitude=41.8781,
                longitude=-87.6298
            ),
            DealerDB(
                id="dealer2",
                name="Midwest APU Solutions",
                address="456 Truck Stop Way",
                city="Indianapolis",
                state="IN",
                zip_code="46201",
                phone="(317) 555-0456",
                email="indy@midwestapu.com",
                services=json.dumps(["service", "support"]),
                latitude=39.7684,
                longitude=-86.1581
            )
        ]
        db.add_all(dealers)
    
    if db.query(DownloadDB).count() == 0:
        downloads = [
            DownloadDB(
                id="download1",
                title="HP2000 APU Installation Manual",
                description="Complete installation guide for HP2000 APU systems",
                file_url="/downloads/hp2000-install-manual.pdf",
                category="manual",
                version="v2.1",
                file_size="5.2 MB",
                upload_date=datetime.now()
            ),
            DownloadDB(
                id="download2",
                title="Firmware Update v3.4.1",
                description="Latest firmware update with improved efficiency",
                file_url="/downloads/firmware-v3.4.1.bin",
                category="update",
                version="3.4.1",
                file_size="2.8 MB",
                upload_date=datetime.now()
            )
        ]
        db.add_all(downloads)
    
    if db.query(FAQDB).count() == 0:
        faqs = [
            FAQDB(
                id="faq1",
                question="How do I start my HP2000 APU remotely?",
                answer="Use the EcoFleet mobile app to start your APU remotely. Ensure you have a paid subscription and your device is connected to the network.",
                category="operation",
                order=1
            ),
            FAQDB(
                id="faq2",
                question="What maintenance is required for my APU?",
                answer="Regular maintenance includes oil changes every 500 hours, air filter replacement every 250 hours, and annual inspections.",
                category="maintenance",
                order=2
            )
        ]
        db.add_all(faqs)
    
    if db.query(UserDB).filter(UserDB.role == "admin").count() == 0:
        admin_user = UserDB(
            id="admin-user-1",
            email="admin@ecofleet.com",
            password=hash_password("admin123"),
            full_name="EcoFleet Administrator",
            role="admin",
            created_at=datetime.now()
        )
        db.add(admin_user)
    
    db.commit()

@app.on_event("startup")
async def startup_event():
    from .database import SessionLocal
    db = SessionLocal()
    try:
        init_sample_data(db)
    finally:
        db.close()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/auth/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(UserDB).filter(UserDB.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user = UserDB(
        id=user_id,
        email=user_data.email,
        password=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=user_data.role,
        created_at=datetime.now()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": user_id})
    return {"access_token": token, "token_type": "bearer", "user": User(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        created_at=user.created_at
    )}

@app.post("/auth/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": User(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        created_at=user.created_at
    )}

@app.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@app.get("/apu/devices")
async def get_user_devices(current_user: dict = Depends(require_paid_user), db: Session = Depends(get_db)):
    user_devices = db.query(APUDeviceDB).filter(APUDeviceDB.owner_id == current_user["id"]).all()
    return user_devices

@app.post("/apu/control")
async def control_apu(control: APUControl, current_user: dict = Depends(require_paid_user), db: Session = Depends(get_db)):
    device = db.query(APUDeviceDB).filter(APUDeviceDB.id == control.device_id, APUDeviceDB.owner_id == current_user["id"]).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if control.action == "start":
        device.status = APUStatus.RUNNING
        db.commit()
        return {"message": "APU started successfully", "status": device.status}
    elif control.action == "stop":
        device.status = APUStatus.STOPPED
        db.commit()
        return {"message": "APU stopped successfully", "status": device.status}
    elif control.action == "status":
        return {"device_id": control.device_id, "status": device.status, "details": {
            "id": device.id,
            "name": device.name,
            "model": device.model,
            "status": device.status,
            "temperature": device.temperature,
            "voltage": device.voltage,
            "runtime_hours": device.runtime_hours,
            "last_maintenance": device.last_maintenance,
            "owner_id": device.owner_id
        }}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@app.get("/apu/status/{device_id}")
async def get_apu_status(device_id: str, current_user: dict = Depends(require_paid_user), db: Session = Depends(get_db)):
    device = db.query(APUDeviceDB).filter(APUDeviceDB.id == device_id, APUDeviceDB.owner_id == current_user["id"]).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return {
        "id": device.id,
        "name": device.name,
        "model": device.model,
        "status": device.status,
        "temperature": device.temperature,
        "voltage": device.voltage,
        "runtime_hours": device.runtime_hours,
        "last_maintenance": device.last_maintenance,
        "owner_id": device.owner_id
    }

@app.get("/dealers")
async def get_dealers(service_type: Optional[str] = None, state: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DealerDB)
    
    if state:
        query = query.filter(DealerDB.state.ilike(f"%{state}%"))
    
    dealers = query.all()
    
    if service_type:
        filtered_dealers = []
        for dealer in dealers:
            services = json.loads(dealer.services)
            if service_type in services:
                filtered_dealers.append({
                    "id": dealer.id,
                    "name": dealer.name,
                    "address": dealer.address,
                    "city": dealer.city,
                    "state": dealer.state,
                    "zip_code": dealer.zip_code,
                    "phone": dealer.phone,
                    "email": dealer.email,
                    "services": services,
                    "latitude": dealer.latitude,
                    "longitude": dealer.longitude
                })
        return filtered_dealers
    
    return [{
        "id": dealer.id,
        "name": dealer.name,
        "address": dealer.address,
        "city": dealer.city,
        "state": dealer.state,
        "zip_code": dealer.zip_code,
        "phone": dealer.phone,
        "email": dealer.email,
        "services": json.loads(dealer.services),
        "latitude": dealer.latitude,
        "longitude": dealer.longitude
    } for dealer in dealers]

@app.get("/dealers/nearby")
async def get_nearby_dealers(lat: float, lng: float, radius: float = 50.0, db: Session = Depends(get_db)):
    import math
    
    def calculate_distance(lat1, lon1, lat2, lon2):
        R = 3959
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    dealers = db.query(DealerDB).all()
    nearby_dealers = []
    
    for dealer in dealers:
        distance = calculate_distance(lat, lng, dealer.latitude, dealer.longitude)
        if distance <= radius:
            dealer_data = {
                "id": dealer.id,
                "name": dealer.name,
                "address": dealer.address,
                "city": dealer.city,
                "state": dealer.state,
                "zip_code": dealer.zip_code,
                "phone": dealer.phone,
                "email": dealer.email,
                "services": json.loads(dealer.services),
                "latitude": dealer.latitude,
                "longitude": dealer.longitude,
                "distance": round(distance, 1)
            }
            nearby_dealers.append(dealer_data)
    
    return sorted(nearby_dealers, key=lambda x: x["distance"])

@app.get("/downloads")
async def get_downloads(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DownloadDB)
    
    if category:
        query = query.filter(DownloadDB.category == category)
    
    downloads = query.all()
    return [{
        "id": download.id,
        "title": download.title,
        "description": download.description,
        "file_url": download.file_url,
        "category": download.category,
        "version": download.version,
        "file_size": download.file_size,
        "upload_date": download.upload_date
    } for download in downloads]

@app.get("/downloads/{download_id}")
async def get_download(download_id: str, db: Session = Depends(get_db)):
    download = db.query(DownloadDB).filter(DownloadDB.id == download_id).first()
    if not download:
        raise HTTPException(status_code=404, detail="Download not found")
    return {
        "id": download.id,
        "title": download.title,
        "description": download.description,
        "file_url": download.file_url,
        "category": download.category,
        "version": download.version,
        "file_size": download.file_size,
        "upload_date": download.upload_date
    }

@app.get("/faq")
async def get_faq(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FAQDB)
    
    if category:
        query = query.filter(FAQDB.category == category)
    
    faqs = query.order_by(FAQDB.order).all()
    return [{
        "id": faq.id,
        "question": faq.question,
        "answer": faq.answer,
        "category": faq.category,
        "order": faq.order
    } for faq in faqs]

@app.get("/faq/categories")
async def get_faq_categories(db: Session = Depends(get_db)):
    categories = db.query(FAQDB.category).distinct().all()
    return [category[0] for category in categories]

@app.post("/contact")
async def submit_contact_message(message: ContactMessage):
    message_id = str(uuid.uuid4())
    return {
        "message_id": message_id,
        "status": "received",
        "message": "Your message has been received. We'll get back to you within 24 hours."
    }

@app.get("/forum/posts")
async def get_forum_posts(tag: Optional[str] = None, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(ForumPostDB).order_by(ForumPostDB.created_at.desc()).limit(limit)
    posts = query.all()
    
    result = []
    for post in posts:
        tags = json.loads(post.tags)
        if tag is None or tag in tags:
            result.append({
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "author_id": post.author_id,
                "author_name": post.author_name,
                "created_at": post.created_at,
                "replies": json.loads(post.replies),
                "tags": tags
            })
    
    return result

@app.post("/forum/posts")
async def create_forum_post(title: str, content: str, tags: List[str], current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    post_id = str(uuid.uuid4())
    new_post = ForumPostDB(
        id=post_id,
        title=title,
        content=content,
        author_id=current_user["id"],
        author_name=current_user["full_name"],
        created_at=datetime.now(),
        replies=json.dumps([]),
        tags=json.dumps(tags)
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {
        "id": new_post.id,
        "title": new_post.title,
        "content": new_post.content,
        "author_id": new_post.author_id,
        "author_name": new_post.author_name,
        "created_at": new_post.created_at,
        "replies": json.loads(new_post.replies),
        "tags": json.loads(new_post.tags)
    }

@app.get("/forum/posts/{post_id}")
async def get_forum_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(ForumPostDB).filter(ForumPostDB.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "author_id": post.author_id,
        "author_name": post.author_name,
        "created_at": post.created_at,
        "replies": json.loads(post.replies),
        "tags": json.loads(post.tags)
    }

@app.get("/service/history")
async def get_service_history(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    service_records = db.query(ServiceRecordDB).filter(ServiceRecordDB.user_id == current_user["id"]).all()
    return sorted([{
        "id": record.id,
        "device_id": record.device_id,
        "service_type": record.service_type,
        "description": record.description,
        "cost": record.cost,
        "service_date": record.service_date,
        "technician": record.technician,
        "status": record.status
    } for record in service_records], key=lambda x: x["service_date"], reverse=True)

@app.post("/service/history")
async def add_service_record(record: ServiceRecord, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    record_id = str(uuid.uuid4())
    new_record = ServiceRecordDB(
        id=record_id,
        user_id=current_user["id"],
        device_id=record.device_id,
        service_type=record.service_type,
        description=record.description,
        cost=record.cost,
        service_date=record.service_date,
        technician=record.technician,
        status=record.status
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "id": new_record.id,
        "device_id": new_record.device_id,
        "service_type": new_record.service_type,
        "description": new_record.description,
        "cost": new_record.cost,
        "service_date": new_record.service_date,
        "technician": new_record.technician,
        "status": new_record.status,
        "user_id": new_record.user_id
    }

@app.get("/social/links")
async def get_social_media_links():
    return {
        "facebook": "https://facebook.com/ecofleet",
        "twitter": "https://twitter.com/ecofleet",
        "instagram": "https://instagram.com/ecofleet",
        "youtube": "https://youtube.com/ecofleet",
        "linkedin": "https://linkedin.com/company/ecofleet"
    }

@app.get("/photos")
async def get_photos(status: Optional[PhotoStatus] = PhotoStatus.APPROVED, db: Session = Depends(get_db)):
    photos = db.query(PhotoUploadDB).filter(PhotoUploadDB.status == status).all()
    return sorted([{
        "id": photo.id,
        "user_id": photo.user_id,
        "filename": photo.filename,
        "caption": photo.caption,
        "status": photo.status,
        "upload_date": photo.upload_date,
        "approval_date": photo.approval_date,
        "admin_notes": photo.admin_notes
    } for photo in photos], key=lambda x: x["upload_date"], reverse=True)

@app.post("/photos/upload")
async def upload_photo(caption: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    photo_id = str(uuid.uuid4())
    new_photo = PhotoUploadDB(
        id=photo_id,
        user_id=current_user["id"],
        filename=f"photo_{photo_id}.jpg",
        caption=caption,
        status=PhotoStatus.PENDING,
        upload_date=datetime.now(),
        approval_date=None,
        admin_notes=None
    )
    
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    
    return {"message": "Photo uploaded successfully. It will be reviewed for approval.", "photo_id": photo_id}

@app.get("/photos/my-uploads")
async def get_my_photos(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_photos = db.query(PhotoUploadDB).filter(PhotoUploadDB.user_id == current_user["id"]).all()
    return sorted([{
        "id": photo.id,
        "user_id": photo.user_id,
        "filename": photo.filename,
        "caption": photo.caption,
        "status": photo.status,
        "upload_date": photo.upload_date,
        "approval_date": photo.approval_date,
        "admin_notes": photo.admin_notes
    } for photo in user_photos], key=lambda x: x["upload_date"], reverse=True)
