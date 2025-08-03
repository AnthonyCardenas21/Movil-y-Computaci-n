import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';
import axios, { AxiosResponse } from 'axios';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'paciente' | 'médico';
  created_at: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  direccion?: string;
  documento_identidad?: string;
  fecha_nacimiento?: string;
  especialidad?: string;
  numero_licencia?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'paciente' | 'médico';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8001'; // Para navegador - corregido desde 10.0.2.2
  private _storage: Storage | null = null;

  constructor(
    private storage: Storage,
    private toastController: ToastController
  ) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await axios.post(
        `${this.apiUrl}/login`, 
        { email, password }
      );
      
      await this.setToken(response.data.access_token);
      await this.setUser(response.data.user);
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error en el login');
    }
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response: AxiosResponse<User> = await axios.post(
        `${this.apiUrl}/register`, 
        data
      );
      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Error en el registro'
      };
    }
  }

  async logout(): Promise<void> {
    await this._storage?.clear();
  }

  async getToken(): Promise<string | null> {
    return await this._storage?.get('token');
  }

  async setToken(token: string): Promise<void> {
    await this._storage?.set('token', token);
  }

  async getUser(): Promise<User | null> {
    return await this._storage?.get('user');
  }

  async setUser(user: User): Promise<void> {
    await this._storage?.set('user', user);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async getCurrentUserProfile(): Promise<User> {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No hay token de autenticación');

      const response: AxiosResponse<User> = await axios.get(
        `${this.apiUrl}/users/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await this.setUser(response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error obteniendo perfil');
    }
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
