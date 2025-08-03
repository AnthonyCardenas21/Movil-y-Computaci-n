import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { AppointmentsService, Appointment } from '../../services/appointments.service';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.page.html',
  styleUrls: ['./appointments.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AppointmentsPage implements OnInit {
  currentUser: User | null = null;
  appointments: Appointment[] = [];
  isLoading = true;
  selectedSegment = 'upcoming';

  constructor(
    private authService: AuthService,
    private appointmentsService: AppointmentsService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.loadCurrentUser();
    await this.loadAppointments();
    this.isLoading = false;
  }

  async loadCurrentUser() {
    try {
      this.currentUser = await this.authService.getUser();
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  async loadAppointments() {
    try {
      if (!this.currentUser) return;

      let result;
      if (this.currentUser.role === 'paciente') {
        // Para pacientes, obtener sus citas
        result = await this.appointmentsService.getAppointments();
      } else if (this.currentUser.role === 'médico') {
        // Para médicos, obtener las citas asignadas a ellos
        result = await this.appointmentsService.getDoctorAppointments(this.currentUser.id);
      }

      // Verificar que el resultado sea un array
      if (Array.isArray(result)) {
        this.appointments = result;
      } else {
        console.error('El servicio no devolvió un array:', result);
        this.appointments = [];
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.showToast('Error al cargar las citas', 'danger');
      this.appointments = []; // Asegurar que sea un array vacío en caso de error
    }
  }

  onSegmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  async doRefresh(event: any) {
    await this.loadAppointments();
    event.target.complete();
  }

  get filteredAppointments() {
    if (!Array.isArray(this.appointments)) {
      console.error('this.appointments no es un array:', this.appointments);
      return [];
    }
    
    const now = new Date();
    return this.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_datetime);
      
      switch (this.selectedSegment) {
        case 'upcoming':
          return appointmentDate >= now;
        case 'past':
          return appointmentDate < now;
        default:
          return true;
      }
    }).sort((a, b) => {
      const dateA = new Date(a.appointment_datetime);
      const dateB = new Date(b.appointment_datetime);
      return this.selectedSegment === 'upcoming' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
  }

  getUpcomingAppointments() {
    if (!Array.isArray(this.appointments)) {
      console.error('this.appointments no es un array:', this.appointments);
      return [];
    }
    
    const now = new Date();
    return this.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_datetime);
      return appointmentDate >= now;
    }).sort((a, b) => {
      const dateA = new Date(a.appointment_datetime);
      const dateB = new Date(b.appointment_datetime);
      return dateA.getTime() - dateB.getTime();
    });
  }

  getPastAppointments() {
    if (!Array.isArray(this.appointments)) {
      console.error('this.appointments no es un array:', this.appointments);
      return [];
    }
    
    const now = new Date();
    return this.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_datetime);
      return appointmentDate < now;
    }).sort((a, b) => {
      const dateA = new Date(a.appointment_datetime);
      const dateB = new Date(b.appointment_datetime);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async editAppointment(appointment: Appointment) {
    if (this.currentUser?.role !== 'paciente') {
      this.showToast('Solo los pacientes pueden editar citas', 'warning');
      return;
    }

    const appointmentDate = new Date(appointment.appointment_datetime);
    const now = new Date();
    
    if (appointmentDate <= now) {
      this.showToast('No se pueden editar citas pasadas', 'warning');
      return;
    }

    this.router.navigate(['/tabs/edit-appointment', appointment.id]);
  }

  async cancelAppointment(appointment: Appointment) {
    if (this.currentUser?.role !== 'paciente') {
      this.showToast('Solo los pacientes pueden cancelar citas', 'warning');
      return;
    }

    const appointmentDate = new Date(appointment.appointment_datetime);
    const now = new Date();
    
    if (appointmentDate <= now) {
      this.showToast('No se pueden cancelar citas pasadas', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cancelar Cita',
      message: '¿Estás seguro de que quieres cancelar esta cita?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Sí, Cancelar',
          handler: async () => {
            try {
              await this.appointmentsService.deleteAppointment(appointment.id);
              this.showToast('Cita cancelada exitosamente', 'success');
              await this.loadAppointments();
            } catch (error) {
              console.error('Error canceling appointment:', error);
              this.showToast('Error al cancelar la cita', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  navigateToCreateAppointment() {
    if (this.currentUser?.role !== 'paciente') {
      this.showToast('Solo los pacientes pueden crear citas', 'warning');
      return;
    }
    this.router.navigate(['/tabs/create-appointment']);
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(appointment: Appointment): string {
    const now = new Date();
    const appointmentDate = new Date(appointment.appointment_datetime);
    
    if (appointmentDate < now) {
      return 'medium';
    } else if (appointmentDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'warning';
    } else {
      return 'primary';
    }
  }

  getStatusText(appointment: Appointment): string {
    const now = new Date();
    const appointmentDate = new Date(appointment.appointment_datetime);
    
    if (appointmentDate < now) {
      return 'Completada';
    } else if (appointmentDate.getTime() - now.getTime() < 60 * 60 * 1000) {
      return 'Próxima';
    } else {
      return 'Programada';
    }
  }

  canModifyAppointment(appointment: Appointment): boolean {
    if (this.currentUser?.role !== 'paciente') return false;
    
    const appointmentDate = new Date(appointment.appointment_datetime);
    const now = new Date();
    
    return appointmentDate > now;
  }

  async refreshAppointments() {
    await this.loadAppointments();
  }

  getDoctorInfo(appointment: Appointment): string {
    return appointment.doctor_info 
      ? `Dr. ${appointment.doctor_info.first_name} ${appointment.doctor_info.last_name}`
      : 'Médico no especificado';
  }

  getPatientInfo(appointment: Appointment): string {
    return appointment.patient_info 
      ? `${appointment.patient_info.first_name} ${appointment.patient_info.last_name}`
      : 'Paciente no especificado';
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}
