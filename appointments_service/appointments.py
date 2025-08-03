from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import httpx
from jose import JWTError, jwt

from database import Appointment
from schemas import AppointmentCreate, AppointmentUpdate, UserInfo
from config import settings

def verify_token(token: str) -> Optional[dict]:
    """Verificar y decodificar token JWT"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_user_info(user_id: int) -> Optional[UserInfo]:
    """Obtener información de usuario desde el servicio de autenticación"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.AUTH_SERVICE_URL}/users/{user_id}")
            if response.status_code == 200:
                user_data = response.json()
                return UserInfo(**user_data)
    except Exception:
        pass
    return None

def check_appointment_conflicts(
    db: Session, 
    doctor_id: int, 
    patient_id: int, 
    appointment_datetime: datetime, 
    duration_minutes: int,
    exclude_appointment_id: Optional[int] = None
) -> List[str]:
    """
    Verificar conflictos de horarios para citas médicas.
    Retorna una lista de errores encontrados.
    """
    errors = []
    
    # Asegurar que appointment_datetime sea timezone-aware
    from datetime import timezone
    if appointment_datetime.tzinfo is None:
        appointment_datetime = appointment_datetime.replace(tzinfo=timezone.utc)
    
    # Calcular tiempo de fin de la nueva cita
    end_time = appointment_datetime + timedelta(minutes=duration_minutes)
    
    # Query base para conflictos - obtener todas las citas relevantes y filtrar en Python
    base_query = db.query(Appointment)
    if exclude_appointment_id:
        base_query = base_query.filter(Appointment.id != exclude_appointment_id)
    
    # Obtener todas las citas y hacer la verificación en Python para evitar problemas de timezone en SQL
    all_appointments = base_query.all()
    
    # 1. Verificar conflictos del médico
    doctor_conflicts = []
    for apt in all_appointments:
        if apt.doctor_id == doctor_id:
            # Asegurar que el datetime de la cita existente sea timezone-aware
            apt_datetime = apt.appointment_datetime
            if apt_datetime.tzinfo is None:
                apt_datetime = apt_datetime.replace(tzinfo=timezone.utc)
            
            apt_end_time = apt_datetime + timedelta(minutes=apt.duration_minutes)
            
            # Verificar si hay conflicto
            if (
                (apt_datetime <= appointment_datetime < apt_end_time) or  # Nueva cita empieza durante existente
                (apt_datetime < end_time <= apt_end_time) or              # Nueva cita termina durante existente
                (appointment_datetime <= apt_datetime and end_time >= apt_end_time)  # Nueva cita engloba existente
            ):
                doctor_conflicts.append(apt)
    
    if doctor_conflicts:
        errors.append(f"El médico ya tiene una cita programada en ese horario")
    
    # 2. Verificar conflictos del paciente
    patient_conflicts = []
    for apt in all_appointments:
        if apt.patient_id == patient_id:
            # Asegurar que el datetime de la cita existente sea timezone-aware
            apt_datetime = apt.appointment_datetime
            if apt_datetime.tzinfo is None:
                apt_datetime = apt_datetime.replace(tzinfo=timezone.utc)
            
            apt_end_time = apt_datetime + timedelta(minutes=apt.duration_minutes)
            
            # Verificar si hay conflicto
            if (
                (apt_datetime <= appointment_datetime < apt_end_time) or  # Nueva cita empieza durante existente
                (apt_datetime < end_time <= apt_end_time) or              # Nueva cita termina durante existente
                (appointment_datetime <= apt_datetime and end_time >= apt_end_time)  # Nueva cita engloba existente
            ):
                patient_conflicts.append(apt)
    
    if patient_conflicts:
        errors.append(f"El paciente ya tiene una cita programada en ese horario")
    
    return errors
    
    # Query base para conflictos
    base_query = db.query(Appointment)
    if exclude_appointment_id:
        base_query = base_query.filter(Appointment.id != exclude_appointment_id)
    
    # 1. Verificar conflictos del médico (no puede tener citas que se crucen)
    doctor_conflicts = base_query.filter(
        and_(
            Appointment.doctor_id == doctor_id,
            or_(
                # Nueva cita empieza durante una cita existente
                and_(
                    Appointment.appointment_datetime <= appointment_datetime,
                    Appointment.appointment_datetime + timedelta(minutes=Appointment.duration_minutes) > appointment_datetime
                ),
                # Nueva cita termina durante una cita existente
                and_(
                    Appointment.appointment_datetime < end_time,
                    Appointment.appointment_datetime + timedelta(minutes=Appointment.duration_minutes) >= end_time
                ),
                # Nueva cita engloba una cita existente
                and_(
                    Appointment.appointment_datetime >= appointment_datetime,
                    Appointment.appointment_datetime + timedelta(minutes=Appointment.duration_minutes) <= end_time
                )
            )
        )
    ).all()
    
    if doctor_conflicts:
        errors.append(f"El médico ya tiene una cita programada en ese horario")
    
    # 2. Verificar conflictos del paciente (no puede tener citas que se crucen)
    patient_conflicts = base_query.filter(
        and_(
            Appointment.patient_id == patient_id,
            or_(
                # Nueva cita empieza durante una cita existente
                and_(
                    Appointment.appointment_datetime <= appointment_datetime,
                    Appointment.appointment_datetime + timedelta(minutes=Appointment.duration_minutes) > appointment_datetime
                ),
                # Nueva cita termina durante una cita existente
                and_(
                    Appointment.appointment_datetime < end_time,
                    Appointment.appointment_datetime + timedelta(minutes=Appointment.duration_minutes) >= end_time
                ),
                # Nueva cita engloba una cita existente
                and_(
                    Appointment.appointment_datetime >= appointment_datetime,
                    Appointment.appointment_datetime + timedelta(minutes=Appointment.duration_minutes) <= end_time
                )
            )
        )
    ).all()
    
    if patient_conflicts:
        errors.append(f"El paciente ya tiene una cita programada en ese horario")
    
    return errors

def create_appointment(db: Session, appointment: AppointmentCreate, patient_id: int) -> Appointment:
    """Crear nueva cita médica"""
    # Verificar conflictos
    conflicts = check_appointment_conflicts(
        db, 
        appointment.doctor_id, 
        patient_id, 
        appointment.appointment_datetime, 
        appointment.duration_minutes
    )
    
    if conflicts:
        raise ValueError("; ".join(conflicts))
    
    # Crear la cita
    db_appointment = Appointment(
        patient_id=patient_id,
        doctor_id=appointment.doctor_id,
        title=appointment.title,
        description=appointment.description,
        appointment_datetime=appointment.appointment_datetime,
        duration_minutes=appointment.duration_minutes
    )
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def get_appointments_by_patient(db: Session, patient_id: int) -> List[Appointment]:
    """Obtener todas las citas de un paciente"""
    return db.query(Appointment).filter(Appointment.patient_id == patient_id).all()

def get_appointments_by_doctor(db: Session, doctor_id: int) -> List[Appointment]:
    """Obtener todas las citas asignadas a un médico"""
    return db.query(Appointment).filter(Appointment.doctor_id == doctor_id).all()

def get_appointment_by_id(db: Session, appointment_id: int) -> Optional[Appointment]:
    """Obtener cita por ID"""
    return db.query(Appointment).filter(Appointment.id == appointment_id).first()

def update_appointment(
    db: Session, 
    appointment_id: int, 
    appointment_update: AppointmentUpdate, 
    patient_id: int
) -> Appointment:
    """Actualizar cita médica"""
    db_appointment = get_appointment_by_id(db, appointment_id)
    
    if not db_appointment:
        raise ValueError("Cita no encontrada")
    
    if db_appointment.patient_id != patient_id:
        raise ValueError("No tienes permisos para modificar esta cita")
    
    # Preparar datos actualizados
    update_data = appointment_update.dict(exclude_unset=True)
    
    # Si se actualiza fecha/hora o duración, verificar conflictos
    if 'appointment_datetime' in update_data or 'duration_minutes' in update_data:
        new_datetime = update_data.get('appointment_datetime', db_appointment.appointment_datetime)
        new_duration = update_data.get('duration_minutes', db_appointment.duration_minutes)
        new_doctor_id = update_data.get('doctor_id', db_appointment.doctor_id)
        
        conflicts = check_appointment_conflicts(
            db, 
            new_doctor_id, 
            patient_id, 
            new_datetime, 
            new_duration,
            exclude_appointment_id=appointment_id
        )
        
        if conflicts:
            raise ValueError("; ".join(conflicts))
    
    # Aplicar actualizaciones
    for field, value in update_data.items():
        setattr(db_appointment, field, value)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def delete_appointment(db: Session, appointment_id: int, patient_id: int) -> bool:
    """Eliminar cita médica"""
    db_appointment = get_appointment_by_id(db, appointment_id)
    
    if not db_appointment:
        raise ValueError("Cita no encontrada")
    
    if db_appointment.patient_id != patient_id:
        raise ValueError("No tienes permisos para eliminar esta cita")
    
    db.delete(db_appointment)
    db.commit()
    return True
