from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, timezone

# Esquemas para crear citas
class AppointmentCreate(BaseModel):
    doctor_id: int
    title: str
    description: Optional[str] = None
    appointment_datetime: datetime
    duration_minutes: int = 30
    
    @validator('appointment_datetime')
    def validate_future_date(cls, v):
        # Convertir a UTC si tiene zona horaria, o agregar UTC si no la tiene
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        else:
            # Si ya tiene timezone, convertir a UTC
            v = v.astimezone(timezone.utc)
        
        current_time = datetime.now(timezone.utc)
        if v <= current_time:
            raise ValueError('La fecha de la cita debe ser en el futuro')
        return v
    
    @validator('duration_minutes')
    def validate_duration(cls, v):
        if v <= 0 or v > 480:  # Máximo 8 horas
            raise ValueError('La duración debe ser entre 1 y 480 minutos')
        return v

class AppointmentUpdate(BaseModel):
    doctor_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    appointment_datetime: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    
    @validator('appointment_datetime')
    def validate_future_date(cls, v):
        if v:
            # Convertir a UTC si tiene zona horaria, o agregar UTC si no la tiene
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            else:
                # Si ya tiene timezone, convertir a UTC
                v = v.astimezone(timezone.utc)
            
            current_time = datetime.now(timezone.utc)
            if v <= current_time:
                raise ValueError('La fecha de la cita debe ser en el futuro')
        return v
    
    @validator('duration_minutes')
    def validate_duration(cls, v):
        if v and (v <= 0 or v > 480):
            raise ValueError('La duración debe ser entre 1 y 480 minutos')
        return v

# Esquemas de respuesta
class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    title: str
    description: Optional[str]
    appointment_datetime: datetime
    duration_minutes: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Esquema para información de usuario (desde auth_service)
class UserInfo(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str

# Esquema extendido de cita con información de usuario
class AppointmentDetailResponse(AppointmentResponse):
    patient_info: Optional[UserInfo] = None
    doctor_info: Optional[UserInfo] = None
