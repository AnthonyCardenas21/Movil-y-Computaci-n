import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ProfilePage implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  isEditing = false;
  isLoading = true;

  specialties = [
    'Medicina General',
    'Cardiología',
    'Dermatología',
    'Endocrinología',
    'Gastroenterología',
    'Ginecología',
    'Neurología',
    'Oftalmología',
    'Ortopedia',
    'Pediatría',
    'Psiquiatría',
    'Urología'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      direccion: ['', [Validators.required]],
      especialidad: [''],
      numero_licencia: ['']
    });
  }

  async ngOnInit() {
    await this.loadUserData();
    this.isLoading = false;
  }

  async ionViewWillEnter() {
    await this.loadUserData();
  }

  private async loadUserData() {
    try {
      this.user = await this.authService.getUser();
      if (this.user) {
        this.profileForm.patchValue({
          first_name: this.user.first_name,
          last_name: this.user.last_name,
          telefono: this.user.telefono,
          direccion: this.user.direccion,
          especialidad: this.user.especialidad || '',
          numero_licencia: this.user.numero_licencia || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      await this.authService.showToast('Error al cargar datos del perfil', 'danger');
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to original values
      this.loadUserData();
    }
  }

  async saveProfile() {
    if (this.profileForm.valid) {
      try {
        // Aquí implementarías la llamada al API para actualizar el perfil
        await this.authService.showToast('Perfil actualizado exitosamente', 'success');
        this.isEditing = false;
        // Recargar datos actualizados
        await this.loadUserData();
      } catch (error) {
        await this.authService.showToast('Error al actualizar perfil', 'danger');
      }
    } else {
      this.markFormGroupTouched();
      await this.authService.showToast('Por favor, completa todos los campos requeridos', 'warning');
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['pattern']) return 'Formato inválido';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      first_name: 'Nombres',
      last_name: 'Apellidos',
      telefono: 'Teléfono',
      direccion: 'Dirección',
      especialidad: 'Especialidad',
      numero_licencia: 'Número de licencia'
    };
    return labels[fieldName] || fieldName;
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

  async changePassword() {
    await this.authService.showToast('Función de cambio de contraseña en desarrollo', 'primary');
  }
}
