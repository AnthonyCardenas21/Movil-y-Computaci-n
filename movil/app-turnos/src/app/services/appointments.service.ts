import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';
import axios, { AxiosResponse } from 'axios';

export interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  title: string;
  description?: string;
  appointment_datetime: string;
  duration_minutes: number;
  created_at: string;
  updated_at?: string;
  patient_info?: UserInfo;
  doctor_info?: UserInfo;
}

export interface CreateAppointmentData {
  doctor_id: number;
  title: string;
  description?: string;
  appointment_datetime: string;
  duration_minutes: number;
}

export interface UpdateAppointmentData {
  doctor_id?: number;
  title?: string;
  description?: string;
  appointment_datetime?: string;
  duration_minutes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private apiUrl = environment.appointmentsServiceUrl;
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  private async getAuthHeader(): Promise<{ Authorization: string } | {}> {
    if (!this._storage) {
      await this.init();
    }
    const token = await this._storage?.get('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getAppointments(): Promise<Appointment[]> {
    try {
      const headers = await this.getAuthHeader();
      console.log('Getting appointments with headers:', headers);
      const response: AxiosResponse<Appointment[]> = await axios.get(
        `${this.apiUrl}/appointments`,
        { headers }
      );
      console.log('Appointments response:', response.data);
      
      // Verificar que la respuesta sea un array
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('La respuesta no es un array:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error getting appointments:', error);
      throw new Error(error.response?.data?.detail || 'Error obteniendo turnos');
    }
  }

  async getAppointmentById(id: number): Promise<Appointment> {
    try {
      const headers = await this.getAuthHeader();
      const response: AxiosResponse<Appointment> = await axios.get(
        `${this.apiUrl}/appointments/${id}`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error obteniendo turno');
    }
  }

  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const headers = await this.getAuthHeader();
      console.log('Creating appointment with data:', data);
      console.log('Using headers:', headers);
      console.log('API URL:', `${this.apiUrl}/appointments`);
      
      const response: AxiosResponse<Appointment> = await axios.post(
        `${this.apiUrl}/appointments`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Full error details:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Error creando turno');
    }
  }

  async updateAppointment(id: number, data: UpdateAppointmentData): Promise<Appointment> {
    try {
      const headers = await this.getAuthHeader();
      const response: AxiosResponse<Appointment> = await axios.put(
        `${this.apiUrl}/appointments/${id}`,
        data,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error actualizando turno');
    }
  }

  async deleteAppointment(id: number): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(
        `${this.apiUrl}/appointments/${id}`,
        { headers }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error eliminando turno');
    }
  }

  async getDoctorAppointments(doctorId: number): Promise<Appointment[]> {
    try {
      const headers = await this.getAuthHeader();
      console.log('Getting doctor appointments for doctor ID:', doctorId);
      const response: AxiosResponse<Appointment[]> = await axios.get(
        `${this.apiUrl}/appointments/doctor/${doctorId}`,
        { headers }
      );
      console.log('Doctor appointments response:', response.data);
      
      // Verificar que la respuesta sea un array
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error('La respuesta no es un array:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error getting doctor appointments:', error);
      throw new Error(error.response?.data?.detail || 'Error obteniendo turnos del médico');
    }
  }
}
