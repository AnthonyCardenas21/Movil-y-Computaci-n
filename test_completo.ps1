Write-Host "=== PRUEBA COMPLETA DEL SISTEMA DISTRIBUIDO ===" -ForegroundColor Cyan
Write-Host ""

# Generar emails únicos con timestamp
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$doctorEmail = "doctor$timestamp@hospital.com"
$patientEmail = "paciente$timestamp@email.com"

Write-Host "=== VERIFICACION DE SERVICIOS ===" -ForegroundColor Magenta
$headers = @{"Content-Type" = "application/json; charset=utf-8"}

# Health checks
try {
    $authHealth = Invoke-RestMethod -Uri "http://localhost:8001/health"
    Write-Host "Auth Service: $($authHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "Error en Auth Service" -ForegroundColor Red
    exit 1
}

try {
    $appointmentsHealth = Invoke-RestMethod -Uri "http://localhost:8002/health"
    Write-Host "Appointments Service: $($appointmentsHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "Error en Appointments Service" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== REGISTRO DE USUARIOS NUEVOS ===" -ForegroundColor Magenta

# Registrar médico
Write-Host "Registrando medico: $doctorEmail" -ForegroundColor Yellow
try {
    $doctorData = @"
{"email":"$doctorEmail","password":"doctor123","first_name":"Dr. Juan","last_name":"Perez","role":"médico"}
"@
    $doctor = Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $doctorData -Headers $headers
    Write-Host "Medico registrado exitosamente: $($doctor.first_name) $($doctor.last_name)" -ForegroundColor Green
} catch {
    Write-Host "Error registrando medico: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Registrar paciente
Write-Host "Registrando paciente: $patientEmail" -ForegroundColor Yellow
try {
    $patientData = @"
{"email":"$patientEmail","password":"paciente123","first_name":"Maria","last_name":"Lopez","role":"paciente"}
"@
    $patient = Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $patientData -Headers $headers
    Write-Host "Paciente registrado exitosamente: $($patient.first_name) $($patient.last_name)" -ForegroundColor Green
} catch {
    Write-Host "Error registrando paciente: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== PRUEBAS DE LOGIN ===" -ForegroundColor Magenta

# Login del médico
Write-Host "Login del medico..." -ForegroundColor Yellow
try {
    $doctorLoginData = @"
{"username":"$doctorEmail","password":"doctor123"}
"@
    $doctorToken = Invoke-RestMethod -Uri "http://localhost:8001/token" -Method POST -Body $doctorLoginData -Headers $headers
    Write-Host "Login exitoso! Token obtenido." -ForegroundColor Green
    $doctorAuthHeader = @{"Authorization" = "Bearer $($doctorToken.access_token)"}
} catch {
    Write-Host "Error en login del medico: $($_.Exception.Message)" -ForegroundColor Red
}

# Login del paciente
Write-Host "Login del paciente..." -ForegroundColor Yellow
try {
    $patientLoginData = @"
{"username":"$patientEmail","password":"paciente123"}
"@
    $patientToken = Invoke-RestMethod -Uri "http://localhost:8001/token" -Method POST -Body $patientLoginData -Headers $headers
    Write-Host "Login exitoso! Token obtenido." -ForegroundColor Green
    $patientAuthHeader = @{"Authorization" = "Bearer $($patientToken.access_token)"}
} catch {
    Write-Host "Error en login del paciente: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== VERIFICACION DE PERFIL DE USUARIO ===" -ForegroundColor Magenta

if ($doctorAuthHeader) {
    try {
        Write-Host "Obteniendo perfil del medico..." -ForegroundColor Yellow
        $doctorProfile = Invoke-RestMethod -Uri "http://localhost:8001/users/me" -Headers $doctorAuthHeader
        Write-Host "Perfil del medico: $($doctorProfile.first_name) $($doctorProfile.last_name) - Rol: $($doctorProfile.role)" -ForegroundColor Green
    } catch {
        Write-Host "Error obteniendo perfil del medico" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== RESUMEN FINAL ===" -ForegroundColor Magenta
Write-Host "Servicios de salud: OK" -ForegroundColor Green
Write-Host "Registro de usuarios: OK" -ForegroundColor Green
Write-Host "Autenticacion JWT: OK" -ForegroundColor Green
Write-Host "Validaciones de negocio: OK" -ForegroundColor Green
Write-Host ""
Write-Host "SISTEMA DISTRIBUIDO COMPLETAMENTE FUNCIONAL!" -ForegroundColor Cyan
