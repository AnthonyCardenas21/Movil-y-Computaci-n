import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      role: ['paciente', [Validators.required]],
      telefono: [''],
      direccion: [''],
      documento_identidad: [''],
      fecha_nacimiento: [''],
      especialidad: [''],
      numero_licencia: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {}

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onRoleChange(event: any) {
    const role = event.detail.value;
    this.registerForm.patchValue({ role });
    
    if (role === 'médico') {
      this.registerForm.get('especialidad')?.setValidators([Validators.required]);
      this.registerForm.get('numero_licencia')?.setValidators([Validators.required]);
    } else {
      this.registerForm.get('especialidad')?.clearValidators();
      this.registerForm.get('numero_licencia')?.clearValidators();
    }
    
    this.registerForm.get('especialidad')?.updateValueAndValidity();
    this.registerForm.get('numero_licencia')?.updateValueAndValidity();
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      const loading = await this.loadingController.create({
        message: 'Registrando usuario...'
      });
      await loading.present();

      try {
        const formData = { ...this.registerForm.value };
        delete formData.confirmPassword;

        await this.authService.register(formData);
        
        await loading.dismiss();
        
        const alert = await this.alertController.create({
          header: 'Registro Exitoso',
          message: 'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }]
        });
        
        await alert.present();
      } catch (error: any) {
        await loading.dismiss();
        
        const alert = await this.alertController.create({
          header: 'Error',
          message: error?.message || 'Ocurrió un error durante el registro',
          buttons: ['OK']
        });
        
        await alert.present();
      } finally {
        this.loading = false;
      }
    } else {
      const alert = await this.alertController.create({
        header: 'Formulario Inválido',
        message: 'Por favor completa todos los campos requeridos',
        buttons: ['OK']
      });
      
      await alert.present();
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    return this.getErrorMessage(fieldName);
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'email': 'Email',
      'password': 'Contraseña',
      'confirmPassword': 'Confirmar Contraseña',
      'first_name': 'Nombres',
      'last_name': 'Apellidos',
      'role': 'Rol',
      'telefono': 'Teléfono',
      'direccion': 'Dirección',
      'documento_identidad': 'Documento de Identidad',
      'fecha_nacimiento': 'Fecha de Nacimiento',
      'especialidad': 'Especialidad',
      'numero_licencia': 'Número de Licencia'
    };
    return fieldNames[fieldName] || fieldName;
  }
}
