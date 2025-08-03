import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Configuración de base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://appointments_user:appointments_password@localhost:5433/appointments_db")
    
    # Configuración de JWT (debe coincidir con auth_service)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    
    # URL del servicio de autenticación
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
    
    # Configuración del proyecto
    PROJECT_NAME: str = "Medical Appointments - Appointments Service"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Servicio de gestión de turnos médicos"

settings = Settings()
