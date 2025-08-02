from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from .database import get_db, UserDB, DealerDB, DownloadDB, FAQDB, APUDeviceDB, ForumPostDB, ServiceRecordDB, PhotoUploadDB
from .auth import get_current_user, UserRole

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SystemStats(BaseModel):
    total_users: int
    free_users: int
    paid_users: int
    admin_users: int
    total_devices: int
    active_devices: int
    pending_photos: int
    total_forum_posts: int

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0, 
    limit: int = 100,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    query = db.query(UserDB)
    
    if role:
        query = query.filter(UserDB.role == role)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email is not None:
        existing_user = db.query(UserDB).filter(UserDB.email == user_update.email, UserDB.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = user_update.email
    
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    
    if user_update.phone is not None:
        user.phone = user_update.phone
    
    if user_update.role is not None:
        if user_update.role not in ["free", "paid", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = user_update.role
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    total_users = db.query(UserDB).count()
    free_users = db.query(UserDB).filter(UserDB.role == "free").count()
    paid_users = db.query(UserDB).filter(UserDB.role == "paid").count()
    admin_users = db.query(UserDB).filter(UserDB.role == "admin").count()
    
    total_devices = db.query(APUDeviceDB).count()
    active_devices = db.query(APUDeviceDB).filter(APUDeviceDB.status == "running").count()
    
    pending_photos = db.query(PhotoUploadDB).filter(PhotoUploadDB.status == "pending").count()
    total_forum_posts = db.query(ForumPostDB).count()
    
    return SystemStats(
        total_users=total_users,
        free_users=free_users,
        paid_users=paid_users,
        admin_users=admin_users,
        total_devices=total_devices,
        active_devices=active_devices,
        pending_photos=pending_photos,
        total_forum_posts=total_forum_posts
    )

@router.get("/photos/pending")
async def get_pending_photos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    photos = db.query(PhotoUploadDB).filter(PhotoUploadDB.status == "pending").all()
    return photos

@router.put("/photos/{photo_id}/approve")
async def approve_photo_admin(
    photo_id: str,
    admin_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    photo = db.query(PhotoUploadDB).filter(PhotoUploadDB.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    photo.status = "approved"
    photo.approval_date = datetime.utcnow()
    photo.admin_notes = admin_notes
    
    db.commit()
    return {"message": "Photo approved successfully"}

@router.put("/photos/{photo_id}/reject")
async def reject_photo_admin(
    photo_id: str,
    admin_notes: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    photo = db.query(PhotoUploadDB).filter(PhotoUploadDB.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    photo.status = "rejected"
    photo.approval_date = datetime.utcnow()
    photo.admin_notes = admin_notes
    
    db.commit()
    return {"message": "Photo rejected"}

@router.get("/content/faq")
async def get_all_faq_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    faq_entries = db.query(FAQDB).order_by(FAQDB.order).all()
    return faq_entries

@router.get("/content/downloads")
async def get_all_downloads_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    downloads = db.query(DownloadDB).order_by(DownloadDB.upload_date.desc()).all()
    return downloads

@router.get("/content/dealers")
async def get_all_dealers_admin(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_user)
):
    dealers = db.query(DealerDB).all()
    return dealers
