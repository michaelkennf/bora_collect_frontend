import { environment, getApiUrl } from '../config/environment';

// Configuration axios avec timeout et intercepteurs
class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = environment.apiBaseUrl;
    this.timeout = environment.apiTimeout;
  }

  // Méthode pour faire des requêtes GET
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ GET ${url} failed:`, error);
      throw error;
    }
  }

  // Méthode pour faire des requêtes POST
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ POST ${url} failed:`, error);
      throw error;
    }
  }

  // Méthode pour faire des requêtes PUT
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ PUT ${url} failed:`, error);
      throw error;
    }
  }

  // Méthode pour faire des requêtes DELETE
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ DELETE ${url} failed:`, error);
      throw error;
    }
  }

  // Méthode pour faire des requêtes PATCH
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ PATCH ${url} failed:`, error);
      throw error;
    }
  }

  // Méthode pour faire des requêtes avec upload de fichier
  async upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options?.headers,
        },
        body: formData,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ UPLOAD ${url} failed:`, error);
      throw error;
    }
  }

  // Méthode pour obtenir l'URL de base
  getBaseURL(): string {
    return this.baseURL;
  }

  // Méthode pour vérifier si on est en production
  isProduction(): boolean {
    return environment.isProduction;
  }

  // Méthode pour obtenir la configuration
  getConfig() {
    return environment;
  }
}

// Instance singleton du service API
export const apiService = new ApiService();

// Export par défaut
export default apiService;
