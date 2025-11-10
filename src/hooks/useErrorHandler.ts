import { useCallback } from 'react';
import { toast } from 'react-toastify';

interface ErrorDetails {
  message?: string;
  status?: number;
  statusText?: string;
}

/**
 * Hook personnalisé pour la gestion centralisée des erreurs
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error: any, context: string = '') => {
    console.error(`❌ ${context ? `Erreur ${context}:` : 'Erreur:'}`, error);
    
    let errorMessage = 'Une erreur est survenue';
    
    // Gestion des différents types d'erreurs
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Affichage d'une notification toast si disponible
    if (typeof toast !== 'undefined') {
      toast.error(errorMessage);
    }
    
    return errorMessage;
  }, []);

  const handleApiError = useCallback((error: any, context: string) => {
    return handleError(error, context);
  }, [handleError]);

  const handleNetworkError = useCallback((error: any, context: string) => {
    console.error(`🌐 Erreur réseau ${context}:`, error);
    
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      toast.error('La requête a expiré. Veuillez réessayer.');
    } else if (error?.message?.includes('fetch')) {
      toast.error('Erreur de connexion au serveur. Vérifiez votre connexion.');
    } else {
      handleError(error, context);
    }
  }, [handleError]);

  const handleAuthError = useCallback((error: any) => {
    console.error('🔐 Erreur d\'authentification:', error);
    
    if (error?.response?.status === 401) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }, []);

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleAuthError
  };
};

