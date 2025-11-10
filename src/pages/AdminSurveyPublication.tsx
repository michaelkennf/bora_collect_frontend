import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

// Types et interfaces
interface Survey {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  duration?: string;
  compensation?: string;
  maxApplicants?: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED' | 'TERMINATED';
  publishedAt?: string;
  createdAt: string;
  applications: any[];
  publisher?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateSurveyData {
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  duration?: string;
  compensation?: string;
  maxApplicants?: number;
  startDate: string;
  endDate: string;
}

const AdminSurveyPublication: React.FC = () => {
  // États
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState<CreateSurveyData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    duration: '',
    compensation: '',
    maxApplicants: undefined,
    startDate: '',
    endDate: ''
  });

  // Configuration
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Fonction utilitaire pour la gestion des erreurs
  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`❌ Erreur ${context}:`, error);
    
    let errorMessage = `Erreur lors de ${context}`;
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage);
    return errorMessage;
  }, []);

  // Fonction pour calculer automatiquement la date de fin
  const calculateEndDate = useCallback((startDate: string, duration: string): string => {
    if (!startDate || !duration) return '';
    
    try {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return '';
      
      const durationLower = duration.toLowerCase();
      let endDate = new Date(start);
      
      if (durationLower.includes('jour') || durationLower.includes('day')) {
        const days = parseInt(duration.match(/\d+/)?.[0] || '1');
        endDate.setDate(start.getDate() + days);
      } else if (durationLower.includes('semaine') || durationLower.includes('week')) {
        const weeks = parseInt(duration.match(/\d+/)?.[0] || '1');
        endDate.setDate(start.getDate() + (weeks * 7));
      } else if (durationLower.includes('mois') || durationLower.includes('month')) {
        const months = parseInt(duration.match(/\d+/)?.[0] || '1');
        endDate.setMonth(start.getMonth() + months);
      } else {
        endDate.setDate(start.getDate() + 7);
      }
      
      return endDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('❌ Erreur calcul date:', error);
      return '';
    }
  }, []);

  // Fonction pour obtenir le token d'authentification
  const getAuthToken = useCallback((): string | null => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vous devez être connecté pour accéder à cette page');
      return null;
    }

    // Vérifier si le token est expiré
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          toast.error('Votre session a expiré. Veuillez vous reconnecter.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return null;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      toast.error('Token invalide. Veuillez vous reconnecter.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }

    return token;
  }, []);

  // Fonction pour recharger le token si nécessaire
  const refreshTokenIfNeeded = useCallback(async (): Promise<string | null> => {
    const token = getAuthToken();
    if (token) return token;

    // Si pas de token, essayer de se reconnecter automatiquement
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            password: 'admin123' // En production, il faudrait stocker le mot de passe de manière sécurisée
          })
        });

        if (response.ok) {
          const loginData = await response.json();
          localStorage.setItem('token', loginData.access_token);
          toast.success('Session renouvelée automatiquement');
          return loginData.access_token;
        }
      } catch (error) {
        console.error('Erreur lors du renouvellement automatique:', error);
      }
    }

    return null;
  }, [apiBaseUrl, getAuthToken]);

  // Fonction pour charger les enquêtes
  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/surveys/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSurveys(data);
    } catch (error) {
      handleApiError(error, 'du chargement des enquêtes');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, getAuthToken, handleApiError]);

  // Fonction pour soumettre le formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Validation des données
      if (!formData.title.trim() || !formData.description.trim() || !formData.startDate || !formData.endDate) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Validation des dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error('Dates invalides détectées');
        return;
      }

      if (endDate <= startDate) {
        toast.error('La date de fin doit être après la date de début');
        return;
      }

      const token = getAuthToken();
      if (!token) return;

      // Préparation des données
      const cleanData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        requirements: formData.requirements?.trim() || null,
        location: formData.location?.trim() || null,
        duration: formData.duration?.trim() || null,
        compensation: formData.compensation?.trim() || null,
        maxApplicants: formData.maxApplicants || null
      };

      // URL et méthode
      const url = editingSurvey 
        ? `${apiBaseUrl}/surveys/${editingSurvey.id}`
        : `${apiBaseUrl}/surveys/admin`;
      
      const method = editingSurvey ? 'PUT' : 'POST';

      // Envoi de la requête
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Succès
      const action = editingSurvey ? 'modifiée' : 'créée';
      toast.success(`Enquête ${action} avec succès !`);
      
      // Réinitialisation et rechargement
      resetForm();
      await fetchSurveys();
      
    } catch (error) {
      handleApiError(error, 'de la création/modification de l\'enquête');
    } finally {
      setSubmitting(false);
    }
  }, [formData, editingSurvey, apiBaseUrl, getAuthToken, handleApiError, fetchSurveys]);

  // Fonction pour réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      location: '',
      duration: '',
      compensation: '',
      maxApplicants: undefined,
      startDate: '',
      endDate: ''
    });
    setEditingSurvey(null);
    setShowCreateForm(false);
  }, []);

  // Fonction pour éditer une enquête
  const editSurvey = useCallback((survey: Survey) => {
    setFormData({
      title: survey.title,
      description: survey.description,
      requirements: survey.requirements || '',
      location: survey.location || '',
      duration: survey.duration || '',
      compensation: survey.compensation || '',
      maxApplicants: survey.maxApplicants,
      startDate: survey.startDate || '',
      endDate: survey.endDate || ''
    });
    setEditingSurvey(survey);
    setShowCreateForm(true);
  }, []);

  // Fonction pour publier une enquête
  const publishSurvey = useCallback(async (surveyId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/surveys/${surveyId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success('Enquête publiée avec succès !');
      await fetchSurveys();
    } catch (error) {
      handleApiError(error, 'de la publication de l\'enquête');
    }
  }, [apiBaseUrl, getAuthToken, handleApiError, fetchSurveys]);

  // Fonction pour fermer une enquête
  const closeSurvey = useCallback(async (surveyId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/surveys/${surveyId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success('Enquête fermée avec succès !');
      await fetchSurveys();
    } catch (error) {
      handleApiError(error, 'de la fermeture de l\'enquête');
    }
  }, [apiBaseUrl, getAuthToken, handleApiError, fetchSurveys]);

  // Fonction pour terminer une enquête
  const terminateSurvey = useCallback(async (surveyId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/surveys/${surveyId}/terminate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success('Enquête terminée avec succès !');
      await fetchSurveys();
    } catch (error) {
      handleApiError(error, 'de la terminaison de l\'enquête');
    }
  }, [apiBaseUrl, getAuthToken, handleApiError, fetchSurveys]);

  // Fonction pour supprimer une enquête
  const deleteSurvey = useCallback(async (surveyId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette enquête ?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/surveys/${surveyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success('Enquête supprimée avec succès !');
      await fetchSurveys();
    } catch (error) {
      handleApiError(error, 'de la suppression de l\'enquête');
    }
  }, [apiBaseUrl, getAuthToken, handleApiError, fetchSurveys]);

  // Fonctions utilitaires pour l'affichage
  const getStatusLabel = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Brouillon',
      'PUBLISHED': 'Publiée',
      'CLOSED': 'Fermée',
      'CANCELLED': 'Annulée',
      'TERMINATED': 'Terminée'
    };
    return statusMap[status] || status;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colorMap: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PUBLISHED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-orange-100 text-orange-800',
      'CANCELLED': 'bg-yellow-100 text-yellow-800',
      'TERMINATED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }, []);

  // Effet pour charger les enquêtes au montage
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Gestionnaires d'événements pour le formulaire
  const handleInputChange = useCallback((field: keyof CreateSurveyData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calcul automatique de la date de fin si nécessaire
      if ((field === 'startDate' || field === 'duration') && newData.startDate && newData.duration) {
        const calculatedEndDate = calculateEndDate(newData.startDate, newData.duration);
        if (calculatedEndDate) {
          newData.endDate = calculatedEndDate;
        }
      }
      
      return newData;
    });
  }, [calculateEndDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des enquêtes
          </h1>
          <p className="text-gray-600">
            Créez et gérez les enquêtes pour les enquêteurs
          </p>
        </div>

        {/* Bouton de création */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Créer une nouvelle enquête
          </button>
        </div>

        {/* Formulaire de création/modification */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingSurvey ? 'Modifier l\'enquête' : 'Créer une nouvelle enquête'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>

                {/* Localisation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 2 semaines, 1 mois, 30 jours"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés: "2 semaines", "1 mois", "30 jours"
                  </p>
                </div>

                {/* Compensation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 500€"
                    value={formData.compensation || ''}
                    onChange={(e) => handleInputChange('compensation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>

                {/* Nombre max de candidats */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre max de candidats
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxApplicants || ''}
                    onChange={(e) => handleInputChange('maxApplicants', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>

                {/* Date de début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>

                {/* Date de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin *
                    {formData.startDate && formData.duration && (
                      <span className="text-xs text-blue-600 ml-2">(calculée automatiquement)</span>
                    )}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.startDate}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formData.startDate && formData.duration 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-300'
                    }`}
                    disabled={submitting}
                  />
                  {formData.startDate && formData.duration && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-blue-600">
                        Basée sur: {formData.startDate} + {formData.duration}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.startDate && formData.duration) {
                            const calculatedEndDate = calculateEndDate(formData.startDate, formData.duration);
                            if (calculatedEndDate) {
                              handleInputChange('endDate', calculatedEndDate);
                            }
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                        disabled={submitting}
                      >
                        Recalculer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>

              {/* Exigences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exigences
                </label>
                <textarea
                  rows={3}
                  value={formData.requirements || ''}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : (editingSurvey ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Écran de chargement */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des enquêtes...</p>
          </div>
        )}

        {/* Liste des enquêtes */}
        {!loading && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Enquêtes ({surveys.length})
              </h2>
            </div>

            {surveys.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune enquête</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre première enquête.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enquête
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surveys.map((survey) => (
                      <tr key={survey.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{survey.title}</div>
                            <div className="text-sm text-gray-500">
                              {survey.description.substring(0, 100)}
                              {survey.description.length > 100 && '...'}
                            </div>
                            {survey.publisher && (
                              <div className="text-xs text-gray-400 mt-1">
                                Par: {survey.publisher.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(survey.status)}`}>
                            {getStatusLabel(survey.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="text-xs text-gray-500">Début:</div>
                            <div>{survey.startDate ? new Date(survey.startDate).toLocaleDateString('fr-FR') : 'N/A'}</div>
                            <div className="text-xs text-gray-500 mt-1">Fin:</div>
                            <div>{survey.endDate ? new Date(survey.endDate).toLocaleDateString('fr-FR') : 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            {/* Bouton Modifier */}
                            <button
                              onClick={() => editSurvey(survey)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                            >
                              Modifier
                            </button>

                            {/* Bouton Publier (si DRAFT) */}
                            {survey.status === 'DRAFT' && (
                              <button
                                onClick={() => publishSurvey(survey.id)}
                                className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Publier
                              </button>
                            )}

                            {/* Bouton Fermer (si PUBLISHED) */}
                            {survey.status === 'PUBLISHED' && (
                              <button
                                onClick={() => closeSurvey(survey.id)}
                                className="text-orange-600 hover:text-orange-900 bg-orange-100 hover:bg-orange-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Fermer
                              </button>
                            )}

                            {/* Bouton Terminer (si CLOSED) */}
                            {survey.status === 'CLOSED' && (
                              <button
                                onClick={() => terminateSurvey(survey.id)}
                                className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Terminer
                              </button>
                            )}

                            {/* Bouton Supprimer (si DRAFT ou TERMINATED) */}
                            {(survey.status === 'DRAFT' || survey.status === 'TERMINATED') && (
                              <button
                                onClick={() => deleteSurvey(survey.id)}
                                className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSurveyPublication;

