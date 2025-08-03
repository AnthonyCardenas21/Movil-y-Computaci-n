import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Configuración de base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://auth_user:auth_password@localhost:5432/auth_db")
    
    # Configuración de JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Configuración del proyecto
    PROJECT_NAME: str = "Medical Appointments - Auth Service"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Servicio de autenticación para sistema de turnos médicos"

settings = Settings()
