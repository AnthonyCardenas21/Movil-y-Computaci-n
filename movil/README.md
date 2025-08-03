# App Móvil - Turnos Médicos (Ionic)

Esta app móvil está diseñada para consumir los servicios REST del sistema distribuido de turnos médicos. Incluye buenas prácticas de UI/UX, navegación por tabs y soporte para roles de paciente y médico.

## 🏗️ Estructura del Proyecto

```
movil/app-turnos/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── login/           # Autenticación
│   │   │   ├── register/        # Registro de usuarios
│   │   │   ├── home/            # Dashboard principal
│   │   │   ├── appointments/    # Gestión de citas
│   │   │   └── profile/         # Perfil de usuario
│   │   ├── services/
│   │   │   ├── auth.service.ts      # Servicio de autenticación
│   │   │   └── appointments.service.ts # Servicio de citas
│   │   ├── guards/
│   │   │   ├── auth.guard.ts        # Protección de rutas
│   │   │   └── role.guard.ts        # Control por roles
│   │   └── tabs/                # Navegación principal
│   ├── assets/
│   └── theme/
├── capacitor.config.ts
├── package.json
└── ...
```

## 🚀 Instalación y Configuración

### Prerrequisitos

1. **Node.js y npm** instalados
2. **Ionic CLI**:
   ```bash
   npm install -g @ionic/cli
   ```
3. **Android Studio** (para emulador Android) o **Xcode** (para iOS)

### Configuración del Proyecto

1. **Instalar dependencias**:
   ```bash
   cd movil/app-turnos
   npm install
   ```

2. **Configurar la URL del backend** en `src/app/services/auth.service.ts`:
   ```typescript
   private apiUrl = 'http://10.0.2.2:8001'; // Para emulador Android
   // private apiUrl = 'http://localhost:8001'; // Para navegador
   ```

## 📱 Ejecutar en Emulador

### Opción 1: Navegador Web (Desarrollo rápido)

```bash
# Desde la carpeta movil/app-turnos
ionic serve
```

**URL**: http://localhost:8100

### Opción 2: Emulador Android

1. **Preparar Capacitor**:
   ```bash
   ionic capacitor add android
   ionic capacitor build android
   ```

2. **Abrir en Android Studio**:
   ```bash
   ionic capacitor open android
   ```

3. **Ejecutar desde Android Studio** o usar:
   ```bash
   ionic capacitor run android
   ```

### Opción 3: Emulador iOS (Solo macOS)

1. **Preparar Capacitor**:
   ```bash
   ionic capacitor add ios
   ionic capacitor build ios
   ```

2. **Abrir en Xcode**:
   ```bash
   ionic capacitor open ios
   ```

## 🔧 Configuración de URLs para Emulador

### Para Android Emulator:
- Cambiar `localhost` por `10.0.2.2` en los servicios
- Puerto del backend: `10.0.2.2:8001` y `10.0.2.2:8002`

### Para iOS Simulator:
- Usar la IP real de tu máquina
- Ejemplo: `192.168.1.100:8001`

### Ejemplo de configuración:

```typescript
// src/app/services/auth.service.ts
export class AuthService {
  // Para Android Emulator
  private apiUrl = 'http://10.0.2.2:8001';
  
  // Para iOS Simulator (usar IP real)
  // private apiUrl = 'http://192.168.1.100:8001';
  
  // Para navegador web
  // private apiUrl = 'http://localhost:8001';
}
```

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- Login con email y contraseña
- Registro de usuarios (paciente, doctor, secretario)
- JWT storage con Ionic Storage
- Guards de protección de rutas

### ✅ Dashboard (Home)
- Vista personalizada por rol
- Próximas citas
- Acciones rápidas
- Saludo personalizado

### ✅ Gestión de Citas
- Lista de citas próximas y pasadas
- Segmentación por estado
- Acciones por rol (paciente puede editar/cancelar)
- Vista específica para doctores

### ✅ Perfil de Usuario
- Información personal editable
- Campos específicos para doctores
- Cambio de contraseña (placeholder)
- Logout seguro

### ✅ UI/UX
- Diseño moderno con Material Design
- Tema oscuro automático
- Responsive design
- Animaciones y feedback visual
- Toasts informativos

## 🔄 Flujo de la Aplicación

1. **Pantalla inicial**: Redirige a login
2. **Autenticación**: Login o registro
3. **Dashboard**: Vista principal según rol
4. **Navegación**: Tabs inferiores (Home, Citas, Perfil)
5. **Funcionalidades**: Según permisos del usuario

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo en navegador
ionic serve

# Recargar en dispositivo
ionic capacitor run android --livereload

# Build para producción
ionic build --prod

# Sincronizar con Capacitor
ionic capacitor sync

# Ver logs del dispositivo
ionic capacitor run android --consolelogs
```

## ⚠️ Solución de Problemas

### Error de CORS
- Configurar CORS en el backend para la IP del emulador
- Usar `http://10.0.2.2` en lugar de `localhost` para Android

### Error de red en emulador
1. Verificar que el backend esté corriendo
2. Usar la IP correcta según el emulador
3. Verificar firewall del sistema

### Problemas de Capacitor
```bash
# Limpiar y rebuild
ionic capacitor clean android
ionic capacitor build android
ionic capacitor sync android
```

## 📞 Testing de la API

### 1. Asegurar Backend Activo
```bash
# En la carpeta principal del proyecto
cd backend
docker-compose up --build
```

### 2. Verificar Servicios
- Auth Service: http://localhost:8001/docs
- Appointments Service: http://localhost:8002/docs

### 3. Configurar IP en la App
```typescript
// Para emulador Android, cambiar en auth.service.ts:
private apiUrl = 'http://10.0.2.2:8001';

// En appointments.service.ts:
private apiUrl = 'http://10.0.2.2:8002';
```

## 🎨 Personalización

### Cambiar Tema
Editar `src/theme/variables.css` para personalizar colores.

### Agregar Funcionalidades
1. Crear nueva página: `ionic generate page nombre`
2. Agregar al routing en `app.routes.ts`
3. Implementar servicios necesarios

## 📋 Próximas Funcionalidades

- [ ] Agendar nuevas citas
- [ ] Notificaciones push
- [ ] Chat con médicos
- [ ] Historial médico
- [ ] Recordatorios de citas
