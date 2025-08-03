import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppointmentsService, CreateAppointmentData } from '../../services/appointments.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-create-appointment',
  templateUrl: './create-appointment.page.html',
  styleUrls: ['./create-appointment.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class CreateAppointmentPage implements OnInit {
  appointmentForm: FormGroup;
  isLoading = false;
  doctors: User[] = [];
  selectedDateTime: string | null = null;
  selectedDate: string | null = null;
  selectedTime: string | null = null;
  
  // Fechas mínima y máxima para el datepicker
  minDate = new Date().toISOString();
  maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 3 meses

  constructor(
    private fb: FormBuilder,
    private appointmentsService: AppointmentsService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.appointmentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      doctor_id: ['', [Validators.required]],
      duration_minutes: [30, [Validators.required]]
    });
  }

  async ngOnInit() {
    await this.loadDoctors();
  }

  // Cargar lista de médicos
  async loadDoctors() {
    try {
      // Por ahora usaremos médicos de ejemplo hasta implementar endpoint para obtener médicos
      this.doctors = [
        {
          id: 2,
          email: 'doctor1@hospital.com',
          first_name: 'Ana',
          last_name: 'García',
          role: 'médico',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          email: 'doctor2@hospital.com',
          first_name: 'Carlos',
          last_name: 'López',
          role: 'médico',
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          email: 'doctor3@hospital.com',
          first_name: 'María',
          last_name: 'Rodríguez',
          role: 'médico',
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error cargando médicos:', error);
      await this.presentToast('Error al cargar la lista de médicos', 'danger');
    }
  }

  // Manejar cambio de fecha
  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    this.updateDateTime();
  }

  // Manejar cambio de hora
  onTimeChange(event: any) {
    this.selectedTime = event.detail.value;
    this.updateDateTime();
  }

  // Actualizar fecha y hora combinada
  private updateDateTime() {
    if (this.selectedDate && this.selectedTime) {
      const date = new Date(this.selectedDate);
      const time = new Date(this.selectedTime);
      
      // Combinar fecha y hora
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());
      
      this.selectedDateTime = date.toISOString();
    }
  }

  // Formatear fecha y hora para mostrar
  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Verificar si un campo es inválido
  isFieldInvalid(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Obtener mensaje de error para un campo
  getFieldError(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }

    return '';
  }

  // Obtener etiqueta del campo
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Motivo de la consulta',
      doctor_id: 'Médico',
      duration_minutes: 'Duración'
    };
    return labels[fieldName] || fieldName;
  }

  // Mostrar toast
  async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  // Enviar formulario
  async onSubmit() {
    if (this.appointmentForm.valid && this.selectedDateTime && !this.isLoading) {
      this.isLoading = true;

      try {
        const formData = this.appointmentForm.value;
        
        // Validar que la fecha sea futura (al menos 1 hora)
        const appointmentDate = new Date(this.selectedDateTime);
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        if (appointmentDate <= oneHourFromNow) {
          await this.presentToast('La cita debe agendarse con al menos 1 hora de anticipación', 'warning');
          return;
        }

        // Crear objeto de cita
        const appointmentData: CreateAppointmentData = {
          doctor_id: formData.doctor_id,
          title: formData.title,
          description: formData.description || undefined,
          appointment_datetime: this.selectedDateTime,
          duration_minutes: formData.duration_minutes
        };

        await this.appointmentsService.createAppointment(appointmentData);
        
        await this.presentToast('¡Cita agendada exitosamente!', 'success');
        this.router.navigate(['/tabs/appointments']);
        
      } catch (error: any) {
        console.error('Error al crear cita:', error);
        
        let errorMessage = 'Error al agendar la cita. Intenta nuevamente.';
        
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        await this.presentToast(errorMessage, 'danger');
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.presentToast('Por favor completa todos los campos y selecciona fecha y hora', 'warning');
    }
  }
}
