from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
import jwt
import os
from enum import Enum
from dotenv import load_dotenv

from .database import get_db, UserDB

load_dotenv()

class UserRole(str, Enum):
    FREE = "free"
    PAID = "paid"
    ADMIN = "admin"

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "ecofleet-secret-key-2025")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role,
        "created_at": user.created_at
    }

def require_paid_user(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.PAID, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Paid subscription required")
    return current_user
