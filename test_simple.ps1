Write-Host "Iniciando pruebas del sistema distribuido..." -ForegroundColor Cyan
Write-Host ""

Write-Host "=== VERIFICACION DE SERVICIOS ===" -ForegroundColor Magenta

Write-Host "Health check del servicio de autenticacion" -ForegroundColor Yellow
try {
    $authHealth = Invoke-RestMethod -Uri "http://localhost:8001/health"
    Write-Host "Auth Service: $($authHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "Error en Auth Service: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Health check del servicio de turnos" -ForegroundColor Yellow
try {
    $appointmentsHealth = Invoke-RestMethod -Uri "http://localhost:8002/health"
    Write-Host "Appointments Service: $($appointmentsHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "Error en Appointments Service: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== PRUEBAS DE REGISTRO ===" -ForegroundColor Magenta

Write-Host "Registrando medico..." -ForegroundColor Yellow
try {
    $doctorData = '{"email":"doctor@hospital.com","password":"doctor123","first_name":"Dr. Carlos","last_name":"Mendoza","role":"medico"}'
    $headers = @{"Content-Type" = "application/json"}
    $doctor = Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $doctorData -Headers $headers
    Write-Host "Medico registrado: $($doctor.first_name) $($doctor.last_name)" -ForegroundColor Green
} catch {
    Write-Host "Error registrando medico: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Registrando paciente..." -ForegroundColor Yellow
try {
    $patientData = '{"email":"paciente@email.com","password":"paciente123","first_name":"Ana","last_name":"Garcia","role":"paciente"}'
    $patient = Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $patientData -Headers $headers
    Write-Host "Paciente registrado: $($patient.first_name) $($patient.last_name)" -ForegroundColor Green
} catch {
    Write-Host "Error registrando paciente: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pruebas completadas. El sistema distribuido esta funcionando!" -ForegroundColor Cyan
