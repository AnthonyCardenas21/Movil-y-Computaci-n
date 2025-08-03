import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomePage implements OnInit {
  user: User | null = null;
  upcomingAppointments: any[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private appointmentsService: AppointmentsService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadUserData();
    await this.loadUpcomingAppointments();
    this.isLoading = false;
  }

  async loadUserData() {
    try {
      this.user = await this.authService.getUser();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async loadUpcomingAppointments() {
    try {
      if (!this.user) return;

      if (this.user.role === 'paciente') {
        // Para pacientes, obtener sus próximas citas
        const allAppointments = await this.appointmentsService.getAppointments();
        this.upcomingAppointments = allAppointments
          .filter(apt => new Date(apt.appointment_datetime) > new Date())
          .sort((a, b) => new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime())
          .slice(0, 3);
      } else if (this.user.role === 'médico') {
        // Para médicos, obtener sus próximas citas del día
        const todayAppointments = await this.appointmentsService.getDoctorAppointments(this.user.id);
        const today = new Date();
        this.upcomingAppointments = todayAppointments
          .filter(apt => {
            const aptDate = new Date(apt.appointment_datetime);
            return aptDate.toDateString() === today.toDateString() && aptDate > today;
          })
          .sort((a, b) => new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime())
          .slice(0, 3);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }

  navigateToAppointments() {
    this.router.navigate(['/tabs/appointments']);
  }

  navigateToCreateAppointment() {
    this.router.navigate(['/tabs/create-appointment']);
  }

  bookAppointment() {
    this.navigateToCreateAppointment();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Buenos días';
    } else if (hour < 18) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  }

  navigateToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleLabel(): string {
    switch (this.user?.role) {
      case 'paciente': return 'Paciente';
      case 'médico': return 'Médico/a';
      default: return '';
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
