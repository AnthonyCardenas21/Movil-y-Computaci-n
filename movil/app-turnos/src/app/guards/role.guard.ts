import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.authService.getUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // Permitir acceso a ambos roles por ahora
    // Se puede extender para rutas específicas por rol
    return true;
  }
}
