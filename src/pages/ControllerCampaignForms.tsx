import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { environment } from '../config/environment';
import { localStorageService } from '../services/localStorageService';
import LocationInput from '../components/LocationInput';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  publishedAt: string;
  endDate?: string | null;
  isExpired?: boolean;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  surveyId: string;
  fields: any; // Objet avec propriétés imbriquées, pas un tableau
  isActive: boolean;
  isVisibleToControllers: boolean;
}

const initialGeolocationState = {
  latitude: null as number | null,
  longitude: null as number | null,
  accuracy: null as number | null,
  timestamp: null as number | null,
  isCapturing: false,
  error: null as string | null,
  province: null as string | null,
  provinceStatus: 'idle' as 'idle' | 'loading' | 'success' | 'error',
};

const ControllerCampaignForms: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [geolocation, setGeolocation] = useState(initialGeolocationState);

  const resetGeolocation = () => setGeolocation({ ...initialGeolocationState });

  // Fonction pour extraire les champs de la structure imbriquée (optimisée)
  const extractFieldsFromForm = useCallback((fields: any): any[] => {
    if (!fields) return [];
    
    // Si fields est une chaîne JSON, la parser
    let parsedFields = fields;
    if (typeof fields === 'string') {
      try {
        parsedFields = JSON.parse(fields);
      } catch (error) {
        // Réduire les logs pour améliorer les performances sur appareils mobiles
        // Ne logger que si nécessaire pour le débogage
        return [];
      }
    }
    
    if (!parsedFields || typeof parsedFields !== 'object') return [];
    
    const extractedFields: any[] = [];
    
    // Parcourir les propriétés principales (identification, modeCuisson, etc.)
    Object.keys(parsedFields).forEach(sectionKey => {
      const section = parsedFields[sectionKey];
      if (section && typeof section === 'object' && section.fields) {
        // Parcourir les champs de chaque section
        Object.keys(section.fields).forEach(fieldKey => {
          const field = section.fields[fieldKey];
          extractedFields.push({
            id: `${sectionKey}.${fieldKey}`,
            label: field.label || field.title || fieldKey,
            type: field.type || 'text',
            required: field.required || false,
            placeholder: field.placeholder || '',
            options: field.options || field.enum || [],
            min: field.min || field.minimum,
            max: field.max || field.maximum,
            section: sectionKey,
            sectionLabel: section.label || section.title || sectionKey,
            conditional: field.conditional || null,
            rankingOptions: field.rankingOptions || null
          });
        });
      }
    });
    
    // Réduire les logs pour améliorer les performances
    // Les logs peuvent ralentir les appareils avec peu de mémoire
    
    return extractedFields;
  }, []);
  
  // Mémoriser les champs extraits pour éviter de recalculer à chaque rendu
  const extractedFields = useMemo(() => {
    if (!selectedForm) return [];
    return extractFieldsFromForm(selectedForm.fields);
  }, [selectedForm, extractFieldsFromForm]);
  
  // Fonction pour vérifier si un champ doit être affiché selon les conditions (déclarée avant utilisation)
  const shouldShowField = useCallback((field: any): boolean => {
    if (!field.conditional) return true;
    
    const { field: conditionalField, value: conditionalValue, operator } = field.conditional;
    
    // Construire l'ID complet du champ conditionnel
    const conditionalFieldId = conditionalField.includes('.') ? conditionalField : `${field.section}.${conditionalField}`;
    const fieldValue = formData[conditionalFieldId];
    
    switch (operator) {
      case 'equals':
        return fieldValue === conditionalValue;
      case 'not_equals':
        return fieldValue !== conditionalValue;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(conditionalValue) : fieldValue?.includes(conditionalValue);
      default:
        return true;
    }
  }, [formData]);
  
  // Mémoriser les sections groupées pour éviter de recalculer à chaque rendu
  const sections = useMemo(() => {
    if (!extractedFields.length) return {};
    
    return extractedFields.reduce((acc: any, field: any) => {
      if (!acc[field.section]) {
        acc[field.section] = { label: field.sectionLabel, fields: [] };
      }
      acc[field.section].fields.push(field);
      return acc;
    }, {});
  }, [extractedFields]);
  
  // Mémoriser les fonctions utilitaires pour éviter les recréations
  const getSectionClasses = useCallback((label: string) => {
    if (/Identification du ménage/i.test(label)) return 'bg-blue-50 border-blue-200';
    if (/Mode de cuisson actuelle/i.test(label)) return 'bg-green-50 border-green-200';
    if (/Connaissance des solutions de cuisson propres/i.test(label)) return 'bg-yellow-50 border-yellow-200';
    if (/Perceptions et contraintes/i.test(label)) return 'bg-red-50 border-red-200';
    if (/Intention d\'adoption/i.test(label)) return 'bg-purple-50 border-purple-200';
    return 'bg-gray-50 border-gray-200';
  }, []);
  
  const getSectionNumber = useCallback((label: string) => {
    if (/Identification du ménage/i.test(label)) return '1. ';
    if (/Mode de cuisson actuelle/i.test(label)) return '2. ';
    if (/Connaissance des solutions de cuisson propres/i.test(label)) return '3. ';
    if (/Perceptions et contraintes/i.test(label)) return '4. ';
    if (/Intention d\'adoption/i.test(label)) return '5. ';
    return '';
  }, []);
  
  // Mémoriser les champs visibles par section pour éviter les recalculs
  const visibleFieldsBySection = useMemo(() => {
    const result: Record<string, any[]> = {};
    Object.keys(sections).forEach(sectionKey => {
      result[sectionKey] = sections[sectionKey].fields.filter((field: any) => shouldShowField(field));
    });
    return result;
  }, [sections, shouldShowField]);
  
  // Vérifier la compatibilité du navigateur (spécialement pour Chrome)
  useEffect(() => {
    // Vérifier si le navigateur supporte les fonctionnalités nécessaires
    if (typeof navigator !== 'undefined') {
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      const hasGeolocation = 'geolocation' in navigator;
      const hasLocalStorage = typeof Storage !== 'undefined';
      
      // Vérifier la mémoire disponible (approximatif) et optimiser si nécessaire
      if ('deviceMemory' in navigator) {
        const deviceMemory = (navigator as any).deviceMemory;
        if (deviceMemory && deviceMemory < 2) {
          // Appareil avec mémoire limitée - optimisations déjà en place via useMemo
        }
      }
    }
  }, []);
  
  const captureGeolocation = () => {
    if (!navigator.geolocation) {
      setGeolocation(prev => ({ ...prev, error: 'Géolocalisation non supportée par votre navigateur', provinceStatus: 'idle' }));
      return;
    }

                                  setGeolocation(prev => ({ ...prev, isCapturing: true, error: null, provinceStatus: 'idle' }));
    
    // Options GPS optimisées pour une capture simple et fiable
    const options = { 
      enableHighAccuracy: true,  // Activer la haute précision GPS
      timeout: 60000,            // 60 secondes (timeout plus long pour éviter les erreurs)
      maximumAge: 0              // Forcer une nouvelle capture (pas de cache)
    };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = Date.now();
        
        // Vérifier que les coordonnées sont valides
        if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
          setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: 'Coordonnées GPS invalides', province: null, provinceStatus: 'idle' });
          toast.error('❌ Coordonnées GPS invalides. Veuillez réessayer.');
          return;
        }
        
        // Log pour débogage
        console.log(`📍 GPS capturé: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}, Précision: ${Math.round(accuracy)}m`);
        
        setGeolocation({ latitude, longitude, accuracy, timestamp, isCapturing: false, error: null, province: null, provinceStatus: 'idle' });
        setFormData(prev => ({
          ...prev,
          ['household.geolocalisation']: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        toast.success(`📍 Position GPS capturée : ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (error) => {
        let errorMessage = 'Erreur GPS inattendue.';
        if (error && typeof error === 'object') {
          switch ((error as any).code) {
            case 1: errorMessage = 'Permission GPS refusée.'; break;
            case 2: errorMessage = 'Position GPS indisponible.'; break;
            case 3: errorMessage = 'Délai de capture GPS dépassé.'; break;
          }
        }
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: errorMessage, province: null, provinceStatus: 'idle' });
        toast.error(`❌ ${errorMessage}`);
      },
      options
    );
  };
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineSubmissions, setOfflineSubmissions] = useState<any[]>([]);

  const apiBaseUrl = environment.apiBaseUrl;

  useEffect(() => {
    fetchApprovedCampaigns();
    
    // Écouter les changements de connectivité
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Charger les soumissions hors ligne sauvegardées
    const savedSubmissions = localStorage.getItem('offlineSubmissions');
    if (savedSubmissions) {
      setOfflineSubmissions(JSON.parse(savedSubmissions));
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchApprovedCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté pour accéder à cette page');
        return;
      }

      // Récupérer les campagnes pour lesquelles l'utilisateur est approuvé
      const response = await fetch(`${apiBaseUrl}/users/enumerator-campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const applicationsData = await response.json();
        
        // Extraire les campagnes des applications
        const now = new Date();
        const campaignsFromApplications = applicationsData.map((app: any) => {
          const endDate = app.survey.endDate ? new Date(app.survey.endDate) : null;
          const isExpired = endDate ? endDate < now : false;
          return {
            id: app.survey.id,
            title: app.survey.title,
            description: app.survey.description,
            startDate: app.survey.startDate,
            endDate: app.survey.endDate,
            status: app.survey.status,
            publishedAt: app.survey.publishedAt,
            publisher: app.survey.publisher,
            isExpired
          };
        });
        
        setCampaigns(campaignsFromApplications);
      } else {
        // Réduire les logs pour améliorer les performances
        toast.error('Erreur lors du chargement des campagnes');
      }
    } catch (error) {
      // Réduire les logs pour améliorer les performances
      toast.error('Erreur de connexion au serveur');
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };


  const handleCampaignSelect = useCallback(async (campaignId: string) => {
    if (!campaignId) {
      setSelectedCampaignId('');
      setSelectedForm(null);
      return;
    }
    
    // Réinitialiser le formulaire sélectionné avant de charger
    setSelectedForm(null);
    setSelectedCampaignId(campaignId);
    setFormsLoading(true);
    
    // Vérifier d'abord côté frontend si la campagne est expirée
    const selectedCampaign = campaigns.find(c => c.id === campaignId);
    if (selectedCampaign?.isExpired) {
      toast.warning('Cette campagne est terminée. Les formulaires ne sont plus accessibles.');
      setFormsLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté pour accéder à cette page');
        setFormsLoading(false);
        return;
      }

      // Récupérer les formulaires de la campagne sélectionnée
      const response = await fetch(`${apiBaseUrl}/forms/by-survey/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Vérifier si la campagne est expirée
        if (responseData.isExpired) {
          toast.warning(responseData.message || 'Cette campagne est terminée');
          setSelectedForm(null);
          setFormsLoading(false);
          return;
        }
        
        // Si c'est un tableau (ancien format) ou un objet avec forms
        const formsData = Array.isArray(responseData) ? responseData : (responseData.forms || []);
        
        if (formsData.length > 0) {
          // Ouvrir directement le premier formulaire actif
          const activeForm = formsData.find((form: FormTemplate) => form.isActive);
          if (activeForm) {
            setSelectedForm(activeForm);
          } else {
            toast.warning('Aucun formulaire actif trouvé pour cette campagne');
            setSelectedForm(null);
          }
        } else {
          toast.warning('Aucun formulaire trouvé pour cette campagne');
          setSelectedForm(null);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur lors du chargement des formulaires:', response.status, errorText);
        toast.error(`Erreur lors du chargement des formulaires: ${response.status}`);
        setSelectedForm(null);
      }
    } catch (error) {
      console.error('❌ Erreur de connexion au serveur:', error);
      toast.error('Erreur de connexion au serveur');
      setSelectedForm(null);
    } finally {
      setFormsLoading(false);
    }
  }, [apiBaseUrl, campaigns]);

  const handleFormSubmit = async () => {
    if (!selectedForm) return;

    // VALIDATION GPS OBLIGATOIRE
    const hasGPS = geolocation.latitude !== null && 
                   geolocation.longitude !== null && 
                   !isNaN(geolocation.latitude) && 
                   !isNaN(geolocation.longitude);
    
    // Vérifier aussi dans formData au cas où les données GPS sont stockées différemment
    const gpsInFormData = Object.keys(formData).some(key => 
      /geolocalisation/i.test(key) && formData[key] && formData[key].trim() !== ''
    );

    const provinceInFormData = formData['household.provinceFromGPS'] && formData['household.provinceFromGPS'].trim() !== '';
    if (!hasGPS && !gpsInFormData) {
      toast.error('❌ Veuillez capturer votre position GPS avant de soumettre le formulaire.');
      // Faire défiler vers le champ GPS si visible
      const gpsField = document.querySelector('[placeholder*="GPS"], [placeholder*="gps"], [placeholder*="Géolocalisation"]');
      if (gpsField) {
        gpsField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (gpsField as HTMLElement).focus();
      }
      return;
    }

    const submissionData = {
      formId: selectedForm.id,
      surveyId: selectedCampaignId,
      formData: formData,
      submittedAt: new Date().toISOString(),
      isOnline: isOnline
    };

    if (isOnline) {
      // Soumission en ligne
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBaseUrl}/records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        if (response.ok) {
          toast.success('Formulaire soumis avec succès !');
          setFormData({});
          handleBackToSelection();
          
          // Déclencher un événement pour notifier les interfaces PM/Admin
          const event = new CustomEvent('newRecordSubmitted', {
            detail: {
              surveyId: selectedCampaignId,
              timestamp: new Date().toISOString()
            }
          });
          window.dispatchEvent(event);
          console.log('🔔 Événement newRecordSubmitted déclenché');
        } else {
          throw new Error('Erreur lors de la soumission');
        }
      } catch (error) {
        console.error('Erreur soumission en ligne:', error);
        // En cas d'erreur, sauvegarder hors ligne
        saveOfflineSubmission(submissionData);
      }
    } else {
      // Soumission hors ligne
      saveOfflineSubmission(submissionData);
    }
  };

  const saveOfflineSubmission = async (submissionData: any) => {
    // VALIDATION GPS OBLIGATOIRE même en mode hors ligne
    const hasGPS = geolocation.latitude !== null && 
                   geolocation.longitude !== null && 
                   !isNaN(geolocation.latitude) && 
                   !isNaN(geolocation.longitude);
    
    const gpsInFormData = Object.keys(submissionData.formData || {}).some(key => 
      /geolocalisation/i.test(key) && submissionData.formData[key] && submissionData.formData[key].trim() !== ''
    );

    const provinceInPayload = submissionData.formData?.['household.provinceFromGPS'] && submissionData.formData['household.provinceFromGPS'].trim() !== '';
    if (!hasGPS && !gpsInFormData) {
      toast.error('❌ Veuillez capturer votre position GPS avant de sauvegarder le formulaire.');
      const gpsField = document.querySelector('[placeholder*="GPS"], [placeholder*="gps"], [placeholder*="Géolocalisation"]');
      if (gpsField) {
        gpsField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (gpsField as HTMLElement).focus();
      }
      return;
    }

    try {
      // Utiliser le localStorageService pour sauvegarder avec le surveyId
      await localStorageService.saveRecord(submissionData.formData, submissionData.surveyId);
      
      // Mettre à jour l'état local pour l'affichage
      const newSubmissions = [...offlineSubmissions, submissionData];
      setOfflineSubmissions(newSubmissions);
      localStorage.setItem('offlineSubmissions', JSON.stringify(newSubmissions));
      
      toast.success('Formulaire sauvegardé hors ligne. Il sera envoyé quand vous serez connecté.');
      setFormData({});
      handleBackToSelection();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde hors ligne:', error);
      toast.error('Erreur lors de la sauvegarde hors ligne');
    }
  };

  const syncOfflineSubmissions = async () => {
    if (!isOnline || offlineSubmissions.length === 0) return;

    const token = localStorage.getItem('token');
    const successfulSubmissions: number[] = [];

    for (let i = 0; i < offlineSubmissions.length; i++) {
      try {
        const response = await fetch(`${apiBaseUrl}/records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(offlineSubmissions[i]),
        });

        if (response.ok) {
          successfulSubmissions.push(i);
        }
      } catch (error) {
        console.error('Erreur synchronisation:', error);
      }
    }

    // Supprimer les soumissions réussies
    if (successfulSubmissions.length > 0) {
      const remainingSubmissions = offlineSubmissions.filter((_, index) => 
        !successfulSubmissions.includes(index)
      );
      setOfflineSubmissions(remainingSubmissions);
      localStorage.setItem('offlineSubmissions', JSON.stringify(remainingSubmissions));
      toast.success(`${successfulSubmissions.length} formulaire(s) synchronisé(s) avec succès !`);
    }
  };

  const handleBackToSelection = () => {
    setSelectedForm(null);
    setSelectedCampaignId('');
    setFormData({});
    resetGeolocation();
  };

  // Optimiser handleFieldChange avec useCallback pour éviter les re-renders
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  }, []);


  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des campagnes...</p>
        </div>
      </div>
    );
  }

  // Si un formulaire est sélectionné, vérifier d'abord si la campagne n'est pas expirée
  if (selectedForm) {
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    
    // Si la campagne est expirée, ne pas afficher le formulaire
    if (selectedCampaign?.isExpired) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800">Campagne terminée</h3>
                  <p className="text-orange-700 mt-2">
                    Cette campagne est terminée. Les formulaires ne sont plus accessibles.
                    {selectedCampaign.endDate && (
                      <span className="block mt-2">
                        Date de fin : {formatDate(selectedCampaign.endDate)}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={handleBackToSelection}
                    className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Retour à la sélection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* En-tête avec bouton retour */}
          <div className="mb-6">
            <button
              onClick={handleBackToSelection}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 mb-4"
            >
              <span>←</span>
              <span>Retour à la sélection</span>
            </button>
            
            {/* Indicateur de connectivité */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </div>
              
              {offlineSubmissions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {offlineSubmissions.length} formulaire(s) en attente
                  </span>
                  {isOnline && (
                    <button
                      onClick={syncOfflineSubmissions}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Synchroniser
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Formulaire Principal de Collecte (Cuisson Propre)
            </h1>
            <p className="text-gray-600">
              {selectedForm.description}
            </p>
            {selectedCampaign && (
              <p className="text-sm text-gray-500 mt-2">
                Campagne: {selectedCampaign.title}
              </p>
            )}
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Formulaire de collecte de données
              </h2>
              <div className="text-sm text-gray-600 mb-4">
                {extractedFields.length} champ(s) à remplir
              </div>
            </div>

            {/* Formulaire dynamique avec sections colorées (ultra-optimisé pour Chrome) */}
            <div className="space-y-6">
              {Object.keys(sections).map((sectionKey) => {
                const section = sections[sectionKey];
                const visibleFields = visibleFieldsBySection[sectionKey] || [];
                
                // Si aucune section visible, ne pas rendre
                if (visibleFields.length === 0) return null;
                
                const sectionClasses = getSectionClasses(section.label);
                const sectionNumber = getSectionNumber(section.label);
                
                return (
                  <div key={sectionKey} className={`p-4 sm:p-6 rounded-xl border ${sectionClasses}`}>
                      <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                        {sectionNumber}{section.label}
                      </h3>
                      <div className="space-y-4">
                        {visibleFields.map((field: any, index: number) => {
                          
                          return (
                            <div key={index} className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>

                            {/* Spécifique GPS */}
                            {(/geolocalisation/i.test(field.id) || /géolocalisation/i.test(field.label)) ? (
                              <LocationInput
                                fieldId={field.id}
                                value={formData[field.id] || ''}
                                onChange={(fieldId, value) => {
                                  // Adapter pour gérer les champs avec préfixes (household.geolocalisation)
                                  if (fieldId.includes('_')) {
                                    // C'est un champ d'adresse manuelle (province, city, etc.)
                                    handleFieldChange(fieldId, value);
                                  } else {
                                    // C'est le champ GPS principal
                                    handleFieldChange(fieldId, value);
                                  }
                                }}
                                onGPSCapture={(fieldId) => {
                                  // Utiliser captureGeolocation mais adapter pour le fieldId
                                  if (!navigator.geolocation) {
                                    setGeolocation(prev => ({ ...prev, error: 'Géolocalisation non supportée', provinceStatus: 'idle' }));
                                    toast.error('❌ Géolocalisation non supportée par votre navigateur');
                                    return;
                                  }
                                  setGeolocation(prev => ({ ...prev, isCapturing: true, error: null, provinceStatus: 'idle' }));
                                  
                                  // Options GPS optimisées pour une capture simple et fiable
                                  const gpsOptions = {
                                    enableHighAccuracy: true,  // Activer la haute précision GPS
                                    timeout: 60000,           // 60 secondes (timeout plus long pour éviter les erreurs)
                                    maximumAge: 0             // Forcer une nouvelle capture (pas de cache)
                                  };
                                  
                                  navigator.geolocation.getCurrentPosition(
                                    async (position) => {
                                      const { latitude, longitude, accuracy } = position.coords;
                                      
                                      // Vérifier que les coordonnées sont valides
                                      if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
                                        setGeolocation(prev => ({ ...prev, isCapturing: false, error: 'Coordonnées GPS invalides', provinceStatus: 'idle' }));
                                        toast.error('❌ Coordonnées GPS invalides. Veuillez réessayer.');
                                        return;
                                      }
                                      
                                      // Log pour débogage
                                      console.log(`📍 GPS capturé: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}, Précision: ${Math.round(accuracy)}m`);
                                      
                                      const coordsValue = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                                      handleFieldChange(fieldId, coordsValue);
                                      setGeolocation(prev => ({ 
                                        ...prev, 
                                        latitude, 
                                        longitude, 
                                        isCapturing: false, 
                                        province: null, 
                                        provinceStatus: 'idle' 
                                      }));
                                      toast.success(`📍 Position GPS capturée : ${coordsValue}`);
                                    },
                                    (error) => {
                                      let errorMessage = 'Erreur GPS inattendue.';
                                      if (error && typeof error === 'object') {
                                        switch ((error as any).code) {
                                          case 1: errorMessage = 'Permission GPS refusée.'; break;
                                          case 2: errorMessage = 'Position GPS indisponible.'; break;
                                          case 3: errorMessage = 'Délai de capture GPS dépassé.'; break;
                                        }
                                      }
                                      setGeolocation(prev => ({ ...prev, isCapturing: false, error: errorMessage, provinceStatus: 'idle' }));
                                      toast.error(`❌ ${errorMessage}`);
                                    },
                                    gpsOptions
                                  );
                                }}
                                required={field.required}
                                className="border rounded p-2 text-sm sm:text-base"
                              />
                            ) : null}

                            {field.type === 'text' && !field.id.toLowerCase().includes('geolocalisation') && (
                              <input
                                type="text"
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={field.placeholder || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                            {field.type === 'textarea' && (
                              <textarea
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={field.placeholder || ''}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                            {field.type === 'number' && (
                              <input
                                type="number"
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={field.placeholder || ''}
                                min={field.min}
                                max={field.max}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                            {field.type === 'select' && field.options && (
                              <select
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Sélectionnez une option</option>
                                {field.options.map((option: string, optIndex: number) => (
                                  <option key={optIndex} value={option}>{option}</option>
                                ))}
                              </select>
                            )}
                            {field.type === 'radio' && field.options && (
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                {field.options.map((option: string, optIndex: number) => (
                                  <label key={optIndex} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={field.id}
                                      value={option}
                                      checked={formData[field.id] === option}
                                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {field.type === 'checkbox' && field.options && (
                              <div className="space-y-2">
                                {field.options.map((option: string, optIndex: number) => (
                                  <label key={optIndex} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      value={option}
                                      checked={Array.isArray(formData[field.id]) ? formData[field.id].includes(option) : false}
                                      onChange={(e) => {
                                        const currentValues = Array.isArray(formData[field.id]) ? formData[field.id] : [];
                                        const newValues = e.target.checked
                                          ? [...currentValues, option]
                                          : currentValues.filter((v: string) => v !== option);
                                        handleFieldChange(field.id, newValues);
                                      }}
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {field.type === 'ranking' && field.options && field.rankingOptions && (
                              <div className="space-y-3">
                                <p className="text-sm text-gray-600 mb-3">
                                  Sélectionnez les combustibles utilisés et classez-les par ordre d'importance (1er, 2e, 3e, etc.)
                                </p>
                                {field.options.map((option: string, optIndex: number) => {
                                  // Obtenir les rangs déjà utilisés
                                  const currentRankings = formData[field.id] || {};
                                  const usedRanks = Object.values(currentRankings).filter(rank => rank !== '');
                                  const currentRank = currentRankings[option] || '';
                                  
                                  return (
                                    <div key={optIndex} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                      <input
                                        type="checkbox"
                                        checked={currentRank !== ''}
                                        onChange={(e) => {
                                          const currentRankings = formData[field.id] || {};
                                          let newRankings = { ...currentRankings };
                                          
                                          if (e.target.checked) {
                                            // Si on coche, assigner le premier rang disponible
                                            const availableRanks = field.rankingOptions.filter((rank: string) => !usedRanks.includes(rank));
                                            if (availableRanks.length > 0) {
                                              newRankings[option] = availableRanks[0];
                                            }
                                          } else {
                                            // Si on décoche, retirer le rang
                                            newRankings[option] = '';
                                          }
                                          
                                          handleFieldChange(field.id, newRankings);
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm font-medium text-gray-700 flex-1">{option}</span>
                                      <select
                                        value={currentRank}
                                        onChange={(e) => {
                                          const newRank = e.target.value;
                                          const currentRankings = formData[field.id] || {};
                                          
                                          // Si on sélectionne un rang déjà utilisé par un autre combustible, on le retire d'abord
                                          let newRankings = { ...currentRankings };
                                          if (newRank !== '') {
                                            // Retirer ce rang de tous les autres combustibles
                                            Object.keys(newRankings).forEach(key => {
                                              if (key !== option && newRankings[key] === newRank) {
                                                newRankings[key] = '';
                                              }
                                            });
                                          }
                                          
                                          // Assigner le nouveau rang au combustible actuel
                                          newRankings[option] = newRank;
                                          handleFieldChange(field.id, newRankings);
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        disabled={currentRank === ''}
                                      >
                                        <option value="">-- Non utilisé --</option>
                                        {field.rankingOptions.map((rank: string, rankIndex: number) => {
                                          const isUsed = usedRanks.includes(rank) && rank !== currentRank;
                                          return (
                                            <option 
                                              key={rankIndex} 
                                              value={rank}
                                              disabled={isUsed}
                                              style={{ color: isUsed ? '#999' : 'inherit' }}
                                            >
                                              {rank} {isUsed ? '(déjà utilisé)' : ''}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                  );
                                })}
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-blue-700">
                                    <strong>Instructions :</strong> Cochez les combustibles utilisés et classez-les par ordre d'importance. 
                                    Chaque rang ne peut être utilisé qu'une seule fois.
                                  </p>
                                </div>
                              </div>
                            )}
                            {field.type === 'info' && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-blue-800">Note pour l'enquêteur</p>
                                    <p className="text-sm text-blue-700 mt-1">{field.label}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Note conditionnelle pour l'enquêteur quand la réponse à 3.1 est "Non" */}
                            {field.id === 'connaissance.connaissanceSolutionsPropres' && formData[field.id] === 'Non' && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                                <div className="flex items-start gap-2">
                                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-yellow-800">Note pour l'enquêteur</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                      L'interviewé n'a pas entendu parler des solutions de cuisson propres. 
                                      Expliquez brièvement ce que sont les solutions de cuisson propres : 
                                      foyers améliorés, gaz, électricité SNEL.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                        })}

                        {/* Statuts GPS si la section correspond */}
                        {section.label && /Identification du ménage/i.test(section.label) && (
                          <div className="mt-2 space-y-2">
                            {geolocation.latitude && geolocation.longitude && (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-green-600 text-xs sm:text-sm">
                                <span>✅</span>
                                <span className="font-medium">Position GPS capturée :</span>
                                <span className="font-mono bg-green-100 px-2 py-1 rounded text-xs">
                                  {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}
                                </span>
                              </div>
                            )}
                            {geolocation.accuracy && (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-blue-600 text-xs sm:text-sm">
                                <span>📏</span>
                                <span>Précision : {Math.round(geolocation.accuracy)} mètres</span>
                              </div>
                            )}
                            {geolocation.error && (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-red-600 text-xs sm:text-sm">
                                <span>❌</span>
                                <span>{geolocation.error}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              {/* Indicateur GPS */}
              {!(geolocation.latitude && geolocation.longitude) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 w-full max-w-md">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">⚠️ La capture GPS est obligatoire avant la soumission</span>
                  </div>
                </div>
              )}
              <button
                onClick={handleFormSubmit}
                disabled={!(geolocation.latitude && geolocation.longitude)}
                className={`px-8 py-3 rounded-lg transition-colors text-lg font-medium ${
                  geolocation.latitude && geolocation.longitude
                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {geolocation.latitude && geolocation.longitude ? 'Soumettre' : 'GPS requis pour soumettre'}
              </button>
            </div>
            
            {/* Footer avec copyright PNUD */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                © PNUD 2025. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau sondage
          </h1>
          <p className="text-gray-600">
            Sélectionnez une campagne pour accéder à son formulaire
          </p>
        </div>

        {/* Sélection de campagne */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label htmlFor="campaign-select" className="block text-sm font-medium text-gray-700 mb-2">
              Choisir une campagne
            </label>
            <select
              id="campaign-select"
              value={selectedCampaignId}
              onChange={(e) => handleCampaignSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={formsLoading}
            >
              <option value="">-- Sélectionnez une campagne --</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title} {campaign.isExpired ? '(Terminée)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Message si une campagne expirée est sélectionnée */}
          {selectedCampaignId && (() => {
            const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
            if (selectedCampaign?.isExpired) {
              return (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-orange-800">Campagne terminée</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Cette campagne est terminée. Les formulaires ne sont plus accessibles.
                        {selectedCampaign.endDate && (
                          <span className="block mt-1">
                            Date de fin : {formatDate(selectedCampaign.endDate)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune campagne approuvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous n'avez pas encore de campagnes approuvées. Postulez aux enquêtes disponibles.
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {campaigns.length} campagne(s) disponible(s)
            </div>
          )}

          {formsLoading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Chargement du formulaire...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControllerCampaignForms;

