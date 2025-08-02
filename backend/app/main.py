from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import hashlib
import uuid
from enum import Enum

app = FastAPI(title="EcoFleet APU API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

security = HTTPBearer()
SECRET_KEY = "ecofleet-secret-key-2025"
ALGORITHM = "HS256"

users_db = {}
dealers_db = []
downloads_db = []
faq_db = []
forum_posts_db = []
service_history_db = {}
photos_db = []
apu_devices_db = {}

class UserRole(str, Enum):
    FREE = "free"
    PAID = "paid"
    ADMIN = "admin"

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

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = users_db.get(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_paid_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.PAID, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Paid subscription required")
    return current_user

def init_sample_data():
    dealers_db.extend([
        {
            "id": "dealer1",
            "name": "EcoFleet Service Center - Chicago",
            "address": "123 Industrial Blvd",
            "city": "Chicago",
            "state": "IL",
            "zip_code": "60601",
            "phone": "(312) 555-0123",
            "email": "chicago@ecofleet.com",
            "services": ["sales", "service", "support"],
            "latitude": 41.8781,
            "longitude": -87.6298
        },
        {
            "id": "dealer2", 
            "name": "Midwest APU Solutions",
            "address": "456 Truck Stop Way",
            "city": "Indianapolis",
            "state": "IN",
            "zip_code": "46201",
            "phone": "(317) 555-0456",
            "email": "indy@midwestapu.com",
            "services": ["service", "support"],
            "latitude": 39.7684,
            "longitude": -86.1581
        }
    ])
    
    downloads_db.extend([
        {
            "id": "download1",
            "title": "HP2000 APU Installation Manual",
            "description": "Complete installation guide for HP2000 APU systems",
            "file_url": "/downloads/hp2000-install-manual.pdf",
            "category": "manual",
            "version": "v2.1",
            "file_size": "5.2 MB",
            "upload_date": datetime.now()
        },
        {
            "id": "download2",
            "title": "Firmware Update v3.4.1",
            "description": "Latest firmware update with improved efficiency",
            "file_url": "/downloads/firmware-v3.4.1.bin",
            "category": "update",
            "version": "3.4.1",
            "file_size": "2.8 MB",
            "upload_date": datetime.now()
        }
    ])
    
    faq_db.extend([
        {
            "id": "faq1",
            "question": "How do I start my HP2000 APU remotely?",
            "answer": "Use the EcoFleet mobile app to start your APU remotely. Ensure you have a paid subscription and your device is connected to the network.",
            "category": "operation",
            "order": 1
        },
        {
            "id": "faq2",
            "question": "What maintenance is required for my APU?",
            "answer": "Regular maintenance includes oil changes every 500 hours, air filter replacement every 250 hours, and annual inspections.",
            "category": "maintenance",
            "order": 2
        }
    ])

init_sample_data()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/auth/register")
async def register(user_data: UserCreate):
    if user_data.email in [u["email"] for u in users_db.values()]:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "role": user_data.role,
        "created_at": datetime.now()
    }
    
    users_db[user_id] = user
    
    token = create_access_token({"sub": user_id})
    return {"access_token": token, "token_type": "bearer", "user": User(**user)}

@app.post("/auth/login")
async def login(login_data: UserLogin):
    user = None
    for u in users_db.values():
        if u["email"] == login_data.email:
            user = u
            break
    
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"]})
    return {"access_token": token, "token_type": "bearer", "user": User(**user)}

@app.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@app.get("/apu/devices")
async def get_user_devices(current_user: dict = Depends(require_paid_user)):
    user_devices = [device for device in apu_devices_db.values() if device["owner_id"] == current_user["id"]]
    return user_devices

@app.post("/apu/control")
async def control_apu(control: APUControl, current_user: dict = Depends(require_paid_user)):
    device = apu_devices_db.get(control.device_id)
    if not device or device["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if control.action == "start":
        device["status"] = APUStatus.RUNNING
        return {"message": "APU started successfully", "status": device["status"]}
    elif control.action == "stop":
        device["status"] = APUStatus.STOPPED
        return {"message": "APU stopped successfully", "status": device["status"]}
    elif control.action == "status":
        return {"device_id": control.device_id, "status": device["status"], "details": device}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@app.get("/apu/status/{device_id}")
async def get_apu_status(device_id: str, current_user: dict = Depends(require_paid_user)):
    device = apu_devices_db.get(device_id)
    if not device or device["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@app.get("/dealers")
async def get_dealers(service_type: Optional[str] = None, state: Optional[str] = None):
    filtered_dealers = dealers_db
    
    if service_type:
        filtered_dealers = [d for d in filtered_dealers if service_type in d["services"]]
    
    if state:
        filtered_dealers = [d for d in filtered_dealers if d["state"].lower() == state.lower()]
    
    return filtered_dealers

@app.get("/dealers/nearby")
async def get_nearby_dealers(lat: float, lng: float, radius: float = 50.0):
    import math
    
    def calculate_distance(lat1, lon1, lat2, lon2):
        R = 3959  # Earth's radius in miles
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    nearby_dealers = []
    for dealer in dealers_db:
        distance = calculate_distance(lat, lng, dealer["latitude"], dealer["longitude"])
        if distance <= radius:
            dealer_with_distance = dealer.copy()
            dealer_with_distance["distance"] = round(distance, 1)
            nearby_dealers.append(dealer_with_distance)
    
    return sorted(nearby_dealers, key=lambda x: x["distance"])

@app.get("/downloads")
async def get_downloads(category: Optional[str] = None):
    filtered_downloads = downloads_db
    
    if category:
        filtered_downloads = [d for d in filtered_downloads if d["category"] == category]
    
    return filtered_downloads

@app.get("/downloads/{download_id}")
async def get_download(download_id: str):
    download = next((d for d in downloads_db if d["id"] == download_id), None)
    if not download:
        raise HTTPException(status_code=404, detail="Download not found")
    return download

@app.get("/faq")
async def get_faq(category: Optional[str] = None):
    filtered_faq = faq_db
    
    if category:
        filtered_faq = [f for f in filtered_faq if f["category"] == category]
    
    return sorted(filtered_faq, key=lambda x: x["order"])

@app.get("/faq/categories")
async def get_faq_categories():
    categories = list(set(f["category"] for f in faq_db))
    return categories

@app.post("/contact")
async def submit_contact_message(message: ContactMessage):
    message_id = str(uuid.uuid4())
    return {
        "message_id": message_id,
        "status": "received",
        "message": "Your message has been received. We'll get back to you within 24 hours."
    }

@app.get("/forum/posts")
async def get_forum_posts(tag: Optional[str] = None, limit: int = 20):
    filtered_posts = forum_posts_db
    
    if tag:
        filtered_posts = [p for p in filtered_posts if tag in p["tags"]]
    
    return sorted(filtered_posts, key=lambda x: x["created_at"], reverse=True)[:limit]

@app.post("/forum/posts")
async def create_forum_post(title: str, content: str, tags: List[str], current_user: dict = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    post = {
        "id": post_id,
        "title": title,
        "content": content,
        "author_id": current_user["id"],
        "author_name": current_user["full_name"],
        "created_at": datetime.now(),
        "replies": [],
        "tags": tags
    }
    
    forum_posts_db.append(post)
    return post

@app.get("/forum/posts/{post_id}")
async def get_forum_post(post_id: str):
    post = next((p for p in forum_posts_db if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@app.get("/service/history")
async def get_service_history(current_user: dict = Depends(get_current_user)):
    user_services = service_history_db.get(current_user["id"], [])
    return sorted(user_services, key=lambda x: x["service_date"], reverse=True)

@app.post("/service/history")
async def add_service_record(record: ServiceRecord, current_user: dict = Depends(get_current_user)):
    if current_user["id"] not in service_history_db:
        service_history_db[current_user["id"]] = []
    
    record_dict = record.dict()
    record_dict["user_id"] = current_user["id"]
    record_dict["id"] = str(uuid.uuid4())
    
    service_history_db[current_user["id"]].append(record_dict)
    return record_dict

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
async def get_photos(status: Optional[PhotoStatus] = PhotoStatus.APPROVED):
    filtered_photos = [p for p in photos_db if p["status"] == status]
    return sorted(filtered_photos, key=lambda x: x["upload_date"], reverse=True)

@app.post("/photos/upload")
async def upload_photo(caption: str, current_user: dict = Depends(get_current_user)):
    photo_id = str(uuid.uuid4())
    photo = {
        "id": photo_id,
        "user_id": current_user["id"],
        "filename": f"photo_{photo_id}.jpg",
        "caption": caption,
        "status": PhotoStatus.PENDING,
        "upload_date": datetime.now(),
        "approval_date": None,
        "admin_notes": None
    }
    
    photos_db.append(photo)
    return {"message": "Photo uploaded successfully. It will be reviewed for approval.", "photo_id": photo_id}

@app.get("/photos/my-uploads")
async def get_my_photos(current_user: dict = Depends(get_current_user)):
    user_photos = [p for p in photos_db if p["user_id"] == current_user["id"]]
    return sorted(user_photos, key=lambda x: x["upload_date"], reverse=True)

@app.put("/admin/photos/{photo_id}/approve")
async def approve_photo(photo_id: str, admin_notes: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    photo = next((p for p in photos_db if p["id"] == photo_id), None)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    photo["status"] = PhotoStatus.APPROVED
    photo["approval_date"] = datetime.now()
    photo["admin_notes"] = admin_notes
    
    return {"message": "Photo approved successfully"}

@app.put("/admin/photos/{photo_id}/reject")
async def reject_photo(photo_id: str, admin_notes: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    photo = next((p for p in photos_db if p["id"] == photo_id), None)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    photo["status"] = PhotoStatus.REJECTED
    photo["approval_date"] = datetime.now()
    photo["admin_notes"] = admin_notes
    
    return {"message": "Photo rejected"}

@app.get("/admin/photos/pending")
async def get_pending_photos(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pending_photos = [p for p in photos_db if p["status"] == PhotoStatus.PENDING]
    return sorted(pending_photos, key=lambda x: x["upload_date"])
