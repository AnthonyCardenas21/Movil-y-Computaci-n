from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from config import settings
from database import get_db, create_tables, Appointment
from schemas import (
    AppointmentCreate, 
    AppointmentUpdate, 
    AppointmentResponse,
    AppointmentDetailResponse,
    UserInfo
)
from appointments import (
    verify_token,
    create_appointment,
    get_appointments_by_patient,
    get_appointments_by_doctor,
    get_appointment_by_id,
    update_appointment,
    delete_appointment,
    get_user_info
)

# Crear tablas al iniciar
create_tables()

# Inicializar FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8100",
        "http://localhost:8101", 
        "http://localhost:8102",
        "http://localhost:8103",
        "http://localhost:8104",
        "http://localhost:4200",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configuración de seguridad
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Obtener usuario actual desde el token JWT"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

@app.get("/")
async def root():
    """Endpoint raíz - información del servicio"""
    return {
        "service": "Medical Appointments - Appointments Service",
        "version": settings.VERSION,
        "status": "running"
    }

@app.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crear nueva cita médica (solo pacientes)"""
    # Verificar que el usuario sea un paciente
    if current_user.get("role") != "paciente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los pacientes pueden crear citas"
        )
    
    try:
        new_appointment = create_appointment(db, appointment, current_user["user_id"])
        return AppointmentResponse.from_orm(new_appointment)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la cita"
        )

@app.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener citas del usuario actual:
    - Pacientes: sus propias citas
    - Médicos: citas asignadas a ellos
    """
    user_role = current_user.get("role")
    user_id = current_user["user_id"]
    
    if user_role == "paciente":
        appointments = get_appointments_by_patient(db, user_id)
    elif user_role == "médico":
        appointments = get_appointments_by_doctor(db, user_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rol de usuario no válido"
        )
    
    return [AppointmentResponse.from_orm(appointment) for appointment in appointments]

@app.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener cita específica por ID"""
    appointment = get_appointment_by_id(db, appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    
    user_role = current_user.get("role")
    user_id = current_user["user_id"]
    
    # Verificar permisos: paciente propietario o médico asignado
    if user_role == "paciente" and appointment.patient_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta cita"
        )
    elif user_role == "médico" and appointment.doctor_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta cita"
        )
    
    return AppointmentResponse.from_orm(appointment)

@app.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_existing_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualizar cita médica (solo el paciente propietario)"""
    if current_user.get("role") != "paciente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los pacientes pueden modificar citas"
        )
    
    try:
        updated_appointment = update_appointment(
            db, appointment_id, appointment_update, current_user["user_id"]
        )
        return AppointmentResponse.from_orm(updated_appointment)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la cita"
        )

@app.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Eliminar cita médica (solo el paciente propietario)"""
    if current_user.get("role") != "paciente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los pacientes pueden eliminar citas"
        )
    
    try:
        delete_appointment(db, appointment_id, current_user["user_id"])
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar la cita"
        )

@app.get("/appointments/doctor/{doctor_id}", response_model=List[AppointmentResponse])
async def get_doctor_appointments(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener citas de un médico específico (solo el propio médico)"""
    if current_user.get("role") != "médico":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los médicos pueden acceder a este endpoint"
        )
    
    if current_user["user_id"] != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes ver tus propias citas"
        )
    
    appointments = get_appointments_by_doctor(db, doctor_id)
    return [AppointmentResponse.from_orm(appointment) for appointment in appointments]

@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud del servicio"""
    return {"status": "healthy", "service": "appointments_service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
