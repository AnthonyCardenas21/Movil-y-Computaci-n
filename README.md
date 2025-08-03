# Sistema Distribuido de Gestión de Turnos Médicos

Sistema distribuido desarrollado con Python (FastAPI), PostgreSQL y Docker Compose para la gestión de turnos médicos. El sistema implementa una arquitectura de microservicios con autenticación JWT y validaciones de negocio robustas.

## 🏗️ Arquitectura del Sistema

### Microservicios

1. **auth_service** (Puerto 8001)
   - Gestión de usuarios (médicos y pacientes)
   - Autenticación y autorización con JWT
   - Base de datos: PostgreSQL (puerto 5432)

2. **appointments_service** (Puerto 8002)
   - CRUD de turnos médicos
   - Validaciones de conflictos de horarios
   - Base de datos: PostgreSQL (puerto 5433)

### Características Principales

- ✅ **Autenticación JWT** con roles diferenciados
- ✅ **Validación de conflictos** de horarios automática
- ✅ **Arquitectura distribuida** con bases de datos independientes
- ✅ **Documentación automática** con OpenAPI/Swagger
- ✅ **Contenedorización** completa con Docker
- ✅ **Migraciones de BD** con Alembic
- ✅ **Variables de entorno** para configuración

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Docker y Docker Compose instalados
- Git para clonar el repositorio

### Pasos para ejecutar

1. **Clonar el repositorio** (si es necesario):
```bash
git clone <repository-url>
cd backend
```

2. **Levantar el sistema completo**:
```bash
docker-compose up --build
```

3. **Verificar que los servicios estén corriendo**:
   - Auth Service: http://localhost:8001/docs
   - Appointments Service: http://localhost:8002/docs
   - Base de datos Auth: localhost:5432
   - Base de datos Appointments: localhost:5433

### Comandos útiles

```bash
# Levantar en modo detached
docker-compose up -d

# Ver logs de un servicio específico
docker-compose logs auth_service
docker-compose logs appointments_service

# Parar todos los servicios
docker-compose down

# Limpiar volúmenes (CUIDADO: elimina datos)
docker-compose down -v
```

## 📋 Roles de Usuario

### Paciente
- ✅ Puede **crear** turnos médicos
- ✅ Puede **ver** sus propios turnos
- ✅ Puede **modificar** sus propios turnos
- ✅ Puede **eliminar** sus propios turnos
- ❌ No puede ver turnos de otros pacientes

### Médico
- ✅ Puede **ver** turnos asignados a él
- ❌ No puede crear, modificar o eliminar turnos
- ❌ No puede ver turnos de otros médicos

## 🔧 Endpoints API

### Auth Service (Puerto 8001)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesión (devuelve JWT) | No |
| GET | `/me` | Obtener información del usuario actual | Sí |
| GET | `/health` | Verificación de salud del servicio | No |

### Appointments Service (Puerto 8002)

| Método | Endpoint | Descripción | Rol Requerido |
|--------|----------|-------------|---------------|
| POST | `/appointments` | Crear nueva cita | Paciente |
| GET | `/appointments` | Obtener mis citas | Paciente/Médico |
| GET | `/appointments/{id}` | Obtener cita específica | Paciente/Médico |
| PUT | `/appointments/{id}` | Actualizar cita | Paciente (propio) |
| DELETE | `/appointments/{id}` | Eliminar cita | Paciente (propio) |
| GET | `/appointments/doctor/{doctor_id}` | Citas de médico específico | Médico (propio) |
| GET | `/health` | Verificación de salud del servicio | No |

## 🛡️ Validaciones Implementadas

### Validaciones de Negocio

1. **No turnos en el pasado**: No se pueden crear citas con fecha/hora anterior al momento actual
2. **No conflictos de paciente**: Un paciente no puede tener dos citas que se superpongan en horario
3. **No conflictos de médico**: Un médico no puede tener citas superpuestas (ni para el mismo ni para diferentes pacientes)
4. **Permisos de modificación**: Solo el paciente que creó una cita puede modificarla o eliminarla
5. **Autenticación obligatoria**: Todos los endpoints sensibles requieren JWT válido

### Validaciones Técnicas

- Formato de email válido
- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración configurable
- Duración de citas entre 1 y 480 minutos
- Verificación de existencia de recursos

## 📖 Ejemplos de Uso

### 1. Registrar un Paciente

```bash
curl -X POST "http://localhost:8001/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@example.com",
    "password": "password123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "paciente"
  }'
```

### 2. Registrar un Médico

```bash
curl -X POST "http://localhost:8001/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "password123",
    "first_name": "Dra. Ana",
    "last_name": "García",
    "role": "médico"
  }'
```

### 3. Iniciar Sesión

```bash
curl -X POST "http://localhost:8001/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "paciente@example.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "paciente",
    "created_at": "2025-07-13T10:00:00Z"
  }
}
```

### 4. Crear un Turno (como Paciente)

```bash
curl -X POST "http://localhost:8002/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "doctor_id": 2,
    "title": "Consulta general",
    "description": "Consulta médica de rutina",
    "appointment_datetime": "2025-07-20T14:30:00",
    "duration_minutes": 30
  }'
```

### 5. Ver Turnos (como Médico)

```bash
curl -X GET "http://localhost:8002/appointments" \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN"
```

### 6. Ejemplo de Error por Conflicto de Horarios

**Crear un turno conflictivo:**
```bash
curl -X POST "http://localhost:8002/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PATIENT_JWT_TOKEN" \
  -d '{
    "doctor_id": 2,
    "title": "Segunda consulta",
    "appointment_datetime": "2025-07-20T14:30:00",
    "duration_minutes": 60
  }'
```

**Respuesta de error:**
```json
{
  "detail": "El médico ya tiene una cita programada en ese horario"
}
```

## 🔐 Variables de Entorno

### Auth Service
```env
DATABASE_URL=postgresql://auth_user:auth_password@auth_db:5432/auth_db
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Appointments Service
```env
DATABASE_URL=postgresql://appointments_user:appointments_password@appointments_db:5432/appointments_db
AUTH_SERVICE_URL=http://auth_service:8000
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
```

## 🗄️ Migraciones de Base de Datos

### Para Auth Service
```bash
# Entrar al contenedor
docker exec -it auth_service bash

# Crear migración
alembic revision --autogenerate -m "Initial migration"

# Aplicar migración
alembic upgrade head
```

### Para Appointments Service
```bash
# Entrar al contenedor
docker exec -it appointments_service bash

# Crear migración
alembic revision --autogenerate -m "Initial migration"

# Aplicar migración
alembic upgrade head
```

## 🧪 Testing y Desarrollo

### Acceso a las Bases de Datos

**Auth Database:**
```bash
docker exec -it auth_postgres psql -U auth_user -d auth_db
```

**Appointments Database:**
```bash
docker exec -it appointments_postgres psql -U appointments_user -d appointments_db
```

### Logs de Desarrollo

```bash
# Ver logs en tiempo real
docker-compose logs -f auth_service
docker-compose logs -f appointments_service
```

### Documentación Interactiva

- **Auth Service Swagger**: http://localhost:8001/docs
- **Appointments Service Swagger**: http://localhost:8002/docs

## 🔄 Flujo de Trabajo Típico

1. **Registro**: Médicos y pacientes se registran en el sistema
2. **Login**: Usuarios obtienen JWT para autenticación
3. **Creación de Turnos**: Pacientes crean turnos asignando médicos
4. **Validación**: Sistema valida automáticamente conflictos de horarios
5. **Visualización**: Médicos ven sus turnos asignados
6. **Gestión**: Pacientes pueden modificar/eliminar sus propios turnos

## ⚠️ Consideraciones de Producción

- Cambiar `SECRET_KEY` por uno seguro y único
- Configurar CORS para dominios específicos
- Usar HTTPS para todas las comunicaciones
- Implementar rate limiting
- Configurar logs centralizados
- Usar variables de entorno seguras
- Implementar backup de bases de datos
- Configurar health checks más robustos

## 🐛 Resolución de Problemas

### El sistema no levanta
1. Verificar que Docker esté corriendo
2. Verificar puertos disponibles (5432, 5433, 8001, 8002)
3. Revisar logs: `docker-compose logs`

### Error de conexión a base de datos
1. Esperar a que las bases de datos estén completamente iniciadas
2. Verificar variables de entorno
3. Reiniciar servicios: `docker-compose restart`

### Tokens JWT inválidos
1. Verificar que `SECRET_KEY` sea igual en ambos servicios
2. Verificar expiración del token
3. Obtener nuevo token con `/login`

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, por favor crear un issue en el repositorio del proyecto.
