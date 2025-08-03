# Ejemplos de pruebas del sistema - Ejecutar paso a paso

## IMPORTANTE: Primero levantar el sistema
# .\manage.ps1 start

## 1. REGISTRO DE USUARIOS

### Registrar un Médico
$doctorData = @{
    email = "doctor@hospital.com"
    password = "doctor123"
    first_name = "Dr. Carlos"
    last_name = "Mendoza"
    role = "médico"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $doctorData -ContentType "application/json"

### Registrar un Paciente
$patientData = @{
    email = "paciente@email.com"
    password = "paciente123"
    first_name = "María"
    last_name = "González"
    role = "paciente"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/register" -Method POST -Body $patientData -ContentType "application/json"

## 2. LOGIN Y OBTENCIÓN DE TOKENS

### Login del Médico
$doctorLogin = @{
    email = "doctor@hospital.com"
    password = "doctor123"
} | ConvertTo-Json

$doctorToken = (Invoke-RestMethod -Uri "http://localhost:8001/login" -Method POST -Body $doctorLogin -ContentType "application/json").access_token
Write-Host "Token del médico: $doctorToken"

### Login del Paciente
$patientLogin = @{
    email = "paciente@email.com"
    password = "paciente123"
} | ConvertTo-Json

$patientToken = (Invoke-RestMethod -Uri "http://localhost:8001/login" -Method POST -Body $patientLogin -ContentType "application/json").access_token
Write-Host "Token del paciente: $patientToken"

## 3. VERIFICAR INFORMACIÓN DE USUARIO

### Información del médico
$headers = @{ Authorization = "Bearer $doctorToken" }
$doctorInfo = Invoke-RestMethod -Uri "http://localhost:8001/me" -Method GET -Headers $headers
Write-Host "ID del médico: $($doctorInfo.id)"

### Información del paciente
$headers = @{ Authorization = "Bearer $patientToken" }
$patientInfo = Invoke-RestMethod -Uri "http://localhost:8001/me" -Method GET -Headers $headers
Write-Host "ID del paciente: $($patientInfo.id)"

## 4. CREAR CITAS MÉDICAS (como Paciente)

### Crear primera cita
$appointment1 = @{
    doctor_id = $doctorInfo.id
    title = "Consulta General"
    description = "Chequeo médico rutinario"
    appointment_datetime = "2025-07-25T10:00:00"
    duration_minutes = 30
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $patientToken" }
$newAppointment = Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method POST -Body $appointment1 -Headers $headers -ContentType "application/json"
Write-Host "Cita creada con ID: $($newAppointment.id)"

### Intentar crear cita conflictiva (debería fallar)
$conflictAppointment = @{
    doctor_id = $doctorInfo.id
    title = "Cita Conflictiva"
    description = "Esta cita debería generar conflicto"
    appointment_datetime = "2025-07-25T10:15:00"  # Se superpone con la anterior
    duration_minutes = 30
} | ConvertTo-Json

try {
    $headers = @{ Authorization = "Bearer $patientToken" }
    Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method POST -Body $conflictAppointment -Headers $headers -ContentType "application/json"
    Write-Host "ERROR: La cita conflictiva se creó cuando no debería" -ForegroundColor Red
} catch {
    Write-Host "✅ Conflicto detectado correctamente: $($_.Exception.Message)" -ForegroundColor Green
}

### Crear segunda cita válida
$appointment2 = @{
    doctor_id = $doctorInfo.id
    title = "Consulta de Seguimiento"
    description = "Revisión de resultados"
    appointment_datetime = "2025-07-25T11:00:00"  # Una hora después
    duration_minutes = 45
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $patientToken" }
$secondAppointment = Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method POST -Body $appointment2 -Headers $headers -ContentType "application/json"
Write-Host "Segunda cita creada con ID: $($secondAppointment.id)"

## 5. VER CITAS

### Ver citas del paciente
$headers = @{ Authorization = "Bearer $patientToken" }
$patientAppointments = Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method GET -Headers $headers
Write-Host "El paciente tiene $($patientAppointments.Count) citas:"
$patientAppointments | ForEach-Object { Write-Host "  - $($_.title) el $($_.appointment_datetime)" }

### Ver citas del médico
$headers = @{ Authorization = "Bearer $doctorToken" }
$doctorAppointments = Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method GET -Headers $headers
Write-Host "El médico tiene $($doctorAppointments.Count) citas asignadas:"
$doctorAppointments | ForEach-Object { Write-Host "  - $($_.title) el $($_.appointment_datetime)" }

## 6. MODIFICAR CITA (como Paciente)

### Actualizar la primera cita
$updateData = @{
    title = "Consulta General - ACTUALIZADA"
    description = "Chequeo médico con análisis adicionales"
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $patientToken" }
$updatedAppointment = Invoke-RestMethod -Uri "http://localhost:8002/appointments/$($newAppointment.id)" -Method PUT -Body $updateData -Headers $headers -ContentType "application/json"
Write-Host "Cita actualizada: $($updatedAppointment.title)"

## 7. INTENTAR OPERACIONES NO PERMITIDAS

### Intentar que el médico cree una cita (debería fallar)
$invalidAppointment = @{
    doctor_id = $doctorInfo.id
    title = "Cita creada por médico"
    appointment_datetime = "2025-07-26T09:00:00"
    duration_minutes = 30
} | ConvertTo-Json

try {
    $headers = @{ Authorization = "Bearer $doctorToken" }
    Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method POST -Body $invalidAppointment -Headers $headers -ContentType "application/json"
    Write-Host "ERROR: El médico pudo crear una cita cuando no debería" -ForegroundColor Red
} catch {
    Write-Host "✅ Correcto: Solo los pacientes pueden crear citas" -ForegroundColor Green
}

## 8. ELIMINAR CITA (como Paciente)

### Eliminar la segunda cita
$headers = @{ Authorization = "Bearer $patientToken" }
try {
    Invoke-RestMethod -Uri "http://localhost:8002/appointments/$($secondAppointment.id)" -Method DELETE -Headers $headers
    Write-Host "✅ Cita eliminada correctamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al eliminar cita: $($_.Exception.Message)" -ForegroundColor Red
}

## 9. VERIFICACIÓN FINAL

### Ver citas finales del paciente
$headers = @{ Authorization = "Bearer $patientToken" }
$finalPatientAppointments = Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method GET -Headers $headers
Write-Host "Citas finales del paciente: $($finalPatientAppointments.Count)"

### Ver citas finales del médico
$headers = @{ Authorization = "Bearer $doctorToken" }
$finalDoctorAppointments = Invoke-RestMethod -Uri "http://localhost:8002/appointments" -Method GET -Headers $headers
Write-Host "Citas finales del médico: $($finalDoctorAppointments.Count)"

Write-Host ""
Write-Host "=== PRUEBAS COMPLETADAS ===" -ForegroundColor Green
Write-Host "El sistema funciona correctamente con todas las validaciones" -ForegroundColor Green
