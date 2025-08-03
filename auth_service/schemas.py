from pydantic import BaseModel, EmailStr
from typing import Optional
from database import UserRole
from datetime import datetime

# Esquemas para registro de usuario
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Esquemas de respuesta
class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
