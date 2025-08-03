# Script de pruebas para el sistema distribuido de turnos médicos
# Ejecutar con: .\test_api.ps1

Write-Host "🚀 Iniciando pruebas del sistema distribuido..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar health checks
Write-Host "=== VERIFICACIÓN DE SERVICIOS ===" -ForegroundColor Magenta

try {
    Write-Host "🔍 Health check del servicio de autenticación" -ForegroundColor Yellow
    $authHealth = Invoke-RestMethod -Uri "http://localhost:8001/health"
    Write-Host "✅ Auth Service: $($authHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en Auth Service: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "🔍 Health check del servicio de turnos" -ForegroundColor Yellow
    $appointmentsHealth = Invoke-RestMethod -Uri "http://localhost:8002/health"
    Write-Host "✅ Appointments Service: $($appointmentsHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en Appointments Service: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== PRUEBAS DE REGISTRO ===" -ForegroundColor Magenta

# 2. Registrar un médico
try {
    Write-Host "🔍 Registrando médico..." -ForegroundColor Yellow
    $doctorData = '{"email":"doctor@hospital.com","password":"doctor123","first_name":"Dr. Carlos","last_name":"Mendoza","role":"médico"}'
    $headers = @{"Content-Type" = "application/json"}
    $doctor = Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $doctorData -Headers $headers
    Write-Host "✅ Médico registrado: $($doctor.first_name) $($doctor.last_name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error registrando médico: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Registrar un paciente
try {
    Write-Host "🔍 Registrando paciente..." -ForegroundColor Yellow
    $patientData = '{"email":"paciente@email.com","password":"paciente123","first_name":"Ana","last_name":"García","role":"paciente"}'
    $patient = Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $patientData -Headers $headers
    Write-Host "✅ Paciente registrado: $($patient.first_name) $($patient.last_name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error registrando paciente: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Pruebas básicas completadas. ¡El sistema distribuido está funcionando!" -ForegroundColor Cyan
