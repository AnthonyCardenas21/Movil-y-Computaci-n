#!/usr/bin/env python3
"""
Script de prueba para verificar que el sistema funciona correctamente
"""
import requests
import json
from datetime import datetime, timedelta

def test_auth_service():
    """Prueba el servicio de autenticación"""
    print("🔍 Probando servicio de autenticación...")
    
    # Health check
    response = requests.get("http://localhost:8001/health")
    print(f"✅ Health check: {response.json()}")
    
    # Registrar médico
    doctor_data = {
        "email": "doctor@hospital.com",
        "password": "doctor123",
        "first_name": "Dr. Carlos",
        "last_name": "Mendoza",
        "role": "médico"
    }
    
    try:
        response = requests.post("http://localhost:8001/register", json=doctor_data)
        if response.status_code == 200:
            print(f"✅ Médico registrado: {response.json()}")
        else:
            print(f"❌ Error en registro: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
    
    # Registrar paciente
    patient_data = {
        "email": "paciente@email.com",
        "password": "paciente123",
        "first_name": "Ana",
        "last_name": "García",
        "role": "paciente"
    }
    
    try:
        response = requests.post("http://localhost:8001/register", json=patient_data)
        if response.status_code == 200:
            print(f"✅ Paciente registrado: {response.json()}")
        else:
            print(f"❌ Error en registro: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

def test_appointments_service():
    """Prueba el servicio de turnos"""
    print("\n🔍 Probando servicio de turnos...")
    
    # Health check
    response = requests.get("http://localhost:8002/health")
    print(f"✅ Health check: {response.json()}")

def main():
    print("🚀 Iniciando pruebas del sistema distribuido...\n")
    
    try:
        test_auth_service()
        test_appointments_service()
        print("\n✅ Todas las pruebas completadas!")
    except Exception as e:
        print(f"\n❌ Error general: {e}")

if __name__ == "__main__":
    main()
