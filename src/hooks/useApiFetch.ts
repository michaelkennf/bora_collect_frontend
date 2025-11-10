import { useState, useCallback } from 'react';
import { environment } from '../config/environment';
import { useErrorHandler } from './useErrorHandler';

interface UseApiFetchOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Hook personnalisé pour les appels API avec gestion d'erreurs centralisée
 */
export const useApiFetch = (endpoint: string, options: UseApiFetchOptions = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleApiError, handleAuthError, handleNetworkError } = useErrorHandler();

  const fetchData = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const url = `${environment.apiBaseUrl}${endpoint}`;
      const config: RequestInit = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Timeout: 30 secondes
        signal: AbortSignal.timeout(30000)
      };

      const response = await fetch(url, config);

      if (response.ok) {
        const result = await response.json();
        setData(result);
        options.onSuccess?.(result);
        return result;
      } else if (response.status === 401) {
        handleAuthError({ response: { status: 401 } });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }
    } catch (error: any) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        handleNetworkError(error, endpoint);
      } else if (error.message?.includes('Token')) {
        handleAuthError(error);
      } else {
        const errorMessage = handleApiError(error, `la récupération des données depuis ${endpoint}`);
        setError(errorMessage);
        options.onError?.(error);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, handleApiError, handleAuthError, handleNetworkError, options]);

  const postData = useCallback(async (body: any) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const url = `${environment.apiBaseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
        options.onSuccess?.(result);
        return result;
      } else if (response.status === 401) {
        handleAuthError({ response: { status: 401 } });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }
    } catch (error: any) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        handleNetworkError(error, endpoint);
      } else {
        const errorMessage = handleApiError(error, `l'envoi des données vers ${endpoint}`);
        setError(errorMessage);
        options.onError?.(error);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, handleApiError, handleAuthError, handleNetworkError, options]);

  return {
    data,
    loading,
    error,
    fetchData,
    postData,
    setData
  };
};

