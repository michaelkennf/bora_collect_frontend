import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { localStorageService } from '../services/localStorageService';
import { syncService } from '../services/syncService';

// Types pour les solutions de cuisson propre
interface HouseholdData {
  nomOuCode: string;
  age: string;
  sexe: 'Homme' | 'Femme' | 'Autre';
  tailleMenage: string;
  communeQuartier: string;
  geolocalisation: string;
  provinceFromGPS?: string;
}

interface CookingData {
  combustibles: string[];
  combustiblesRanking: { [key: string]: number }; // Classement des combustibles (1er, 2e, 3e, etc.)
  equipements: string[];
  autresCombustibles?: string;
  autresEquipements?: string;
}

interface KnowledgeData {
  connaissanceSolutions: 'Oui' | 'Non';
  solutionsConnaissances?: string;
  avantages: string[];
  autresAvantages?: string;
}

interface ConstraintsData {
  obstacles: string[];
  autresObstacles?: string;
  pretA: string;
}

interface AdoptionData {
  pretAcheterFoyer: 'Oui' | 'Non';
  pretAcheterGPL: 'Oui' | 'Non';
}

// Interface pour les enquêtes
interface Survey {
  id: string;
  title: string;
  description: string;
  status: string;
  publishedAt: string;
}

// Types pour le formulaire principal
interface FormState {
  formData: {
    household: HouseholdData;
    cooking: CookingData;
    knowledge: KnowledgeData;
    constraints: ConstraintsData;
    adoption: AdoptionData;
  };
}

// Types pour la géolocalisation
interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  isCapturing: boolean;
  error: string | null;
  province: string | null;
  provinceStatus: 'idle' | 'loading' | 'success' | 'error';
}

// Options pour les combustibles
const combustibles = [
  'Bois',
  'Charbon de bois (Makala)',
  'Gaz (butane/propane)',
  'Électricité',
  'Briquettes'
];

// Options pour les équipements
const equipements = [
  'Foyer trois pierres traditionnel',
  'Foyer classique au charbon/bois',
  'Foyer amélioré au charbon/bois',
  'Réchaud à gaz (GPL)',
  'Cuisinière électrique'
];

// Options pour les avantages
const avantages = [
  'Absence de fumée (réduction des maladies respiratoires)',
  'Économie d\'argent',
  'Gain de temps pour d\'autres activités',
  'Moins de fumée / meilleure santé (sont plus sûres pour la santé de ma famille.)',
  'Économie de combustible (cuisinent aussi bien que les méthodes traditionnelles)',
  'Gain de temps (Rapide)',
  'Respect de l\'environnement'
];

// Options pour les obstacles
const obstacles = [
  'Les solutions de cuisson propres coûtent trop cher à l\'achat.',
  'Manque d\'information',
  'Difficulté d\'accès aux équipements',
  'Préférences culturelles ou habitudes',
  'Manque de fiabilité perçue'
];

const initialHousehold: HouseholdData = {
  nomOuCode: '',
  age: '',
  sexe: 'Homme',
  tailleMenage: '',
  communeQuartier: '',
  geolocalisation: '',
  provinceFromGPS: '',
};

const initialCooking: CookingData = {
  combustibles: [],
  combustiblesRanking: {},
  equipements: [],
  autresCombustibles: '',
  autresEquipements: ''
};

const initialKnowledge: KnowledgeData = {
  connaissanceSolutions: 'Non',
  solutionsConnaissances: '',
  avantages: [],
  autresAvantages: ''
};

const initialConstraints: ConstraintsData = {
  obstacles: [],
  autresObstacles: '',
  pretA: ''
};

const initialAdoption: AdoptionData = {
  pretAcheterFoyer: 'Non',
  pretAcheterGPL: 'Non'
};

const initialForm: FormState = {
  formData: {
    household: { ...initialHousehold },
    cooking: { ...initialCooking },
    knowledge: { ...initialKnowledge },
    constraints: { ...initialConstraints },
    adoption: { ...initialAdoption },
  },
};

interface SchoolFormProps {
  initialData?: FormState;
  onEditDone?: () => void;
  editId?: string;
}

export default function SchoolForm() {
  const [form, setForm] = useState<FormState>({
    formData: {
      household: initialHousehold,
      cooking: initialCooking,
      knowledge: initialKnowledge,
      constraints: initialConstraints,
      adoption: initialAdoption,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geolocation, setGeolocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    isCapturing: false,
    error: null,
    province: null,
    provinceStatus: 'idle',
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Vérification d'authentification au chargement du composant
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast.error('❌ Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }
    
    // Vérifier que l'utilisateur est bien un enquêteur
    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'CONTROLLER') {
        toast.error('❌ Accès non autorisé. Seuls les enquêteurs peuvent accéder à cette page.');
        navigate('/login');
        return;
      }
    } catch (error) {
      toast.error('❌ Erreur de session. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Écouter les changements de connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Connexion internet rétablie - Synchronisation en cours...');
      // Synchroniser les données locales
      syncService.syncLocalRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Mode hors ligne - Les données seront sauvegardées localement');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capturer la géolocalisation (optimisée avec useCallback pour Chrome mobile)
  const captureGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocation(prev => ({ 
        ...prev, 
        error: 'Géolocalisation non supportée par votre navigateur',
        provinceStatus: 'idle',
      }));
      toast.error('❌ Votre navigateur ne supporte pas la géolocalisation');
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
          setGeolocation({
            latitude: null,
            longitude: null,
            accuracy: null,
            timestamp: null,
            isCapturing: false,
            error: 'Coordonnées GPS invalides',
            province: null,
            provinceStatus: 'idle',
          });
          toast.error('❌ Coordonnées GPS invalides. Veuillez réessayer.');
          return;
        }
        
        // Log pour débogage
        console.log(`📍 GPS capturé: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}, Précision: ${Math.round(accuracy)}m`);

        setGeolocation({
          latitude,
          longitude,
          accuracy,
          timestamp,
          isCapturing: false,
          error: null,
          province: null,
          provinceStatus: 'idle',
        });
        
        // Mettre à jour le formulaire avec les coordonnées GPS
        setForm(prev => ({
          ...prev,
          formData: {
            ...prev.formData,
            household: {
              ...prev.formData.household,
              geolocalisation: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            },
          },
        }));

        // Notification de succès
        toast.success(`📍 Position GPS capturée : ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        // Les informations GPS détaillées sont disponibles dans geolocation state
      },
      (error) => {
        // Logs réduits pour améliorer les performances
        
        let errorMessage = '';
        let toastMessage = '';
        
        // Gestion détaillée des erreurs GPS
        if (error && typeof error === 'object') {
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Permission GPS refusée. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur.';
              toastMessage = '❌ Permission GPS refusée. Autorisez l\'accès dans les paramètres.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Position GPS temporairement indisponible. Assurez-vous d\'être à l\'extérieur et réessayez dans quelques instants.';
              toastMessage = '⚠️ Position GPS indisponible. Sortez à l\'extérieur et réessayez.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Délai de capture GPS dépassé. Vérifiez que vous êtes à l\'extérieur et que votre appareil GPS fonctionne.';
              toastMessage = '⏰ Délai GPS dépassé. Vérifiez votre position et réessayez.';
              break;
            default:
              errorMessage = `Erreur GPS inconnue (Code: ${error.code}). Message: ${error.message || 'Aucun message d\'erreur'}`;
              toastMessage = '❌ Erreur GPS inconnue. Réessayez.';
          }
        } else {
          // Erreur non standard
          errorMessage = 'Erreur GPS inattendue. Vérifiez que votre appareil supporte le GPS et réessayez.';
          toastMessage = '❌ Erreur GPS inattendue. Vérifiez votre appareil.';
        }

        // Logs réduits pour améliorer les performances

        setGeolocation({
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: null,
          isCapturing: false,
          error: errorMessage,
          province: null,
          provinceStatus: 'idle',
        });

        toast.error(toastMessage);
      },
      options
    );
  }, []);

  // Chargement automatique du formulaire à modifier si effectiveEditId est fourni
  useEffect(() => {
    // This part of the logic is removed as per the new_code, as the component is simplified.
    // If a record needs to be loaded for editing, it would require a different approach,
    // likely involving a separate edit form or a more complex state management.
  }, []);

  // Gestion du changement d'un champ principal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Gestion du changement d'un champ du ménage
  const handleHouseholdChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        household: {
          ...prev.formData.household,
          [name]: value
        }
      }
    }));
  }, []);

  // Gestion du changement des combustibles avec classement (optimisé avec useCallback)
  const handleCombustiblesChange = useCallback((combustible: string, checked: boolean) => {
    setForm(prev => {
      const currentCombustibles = prev.formData.cooking.combustibles;
      const currentRanking = prev.formData.cooking.combustiblesRanking;
      
      let newCombustibles: string[];
      let newRanking: { [key: string]: number } = { ...currentRanking };
      
      if (checked) {
        // Ajouter le combustible
        newCombustibles = [...currentCombustibles, combustible];
        // Assigner le prochain rang disponible
        const nextRank = newCombustibles.length;
        newRanking[combustible] = nextRank;
      } else {
        // Supprimer le combustible
        newCombustibles = currentCombustibles.filter(c => c !== combustible);
        // Supprimer du classement
        delete newRanking[combustible];
        // Réorganiser les rangs
        const remainingCombustibles = Object.keys(newRanking);
        newRanking = {};
        remainingCombustibles.forEach((c, index) => {
          newRanking[c] = index + 1;
        });
      }
      
      return {
        ...prev,
        formData: {
          ...prev.formData,
          cooking: {
            ...prev.formData.cooking,
            combustibles: newCombustibles,
            combustiblesRanking: newRanking
          }
        }
      };
    });
  }, []);

  // Gestion du changement de classement des combustibles
  const handleCombustibleRankingChange = (combustible: string, newRank: number) => {
    setForm(prev => {
      const currentRanking = prev.formData.cooking.combustiblesRanking;
      const newRanking = { ...currentRanking };
      
      // Vérifier si le rang est déjà utilisé
      const existingCombustible = Object.keys(newRanking).find(c => newRanking[c] === newRank);
      
      if (existingCombustible && existingCombustible !== combustible) {
        // Échanger les rangs
        newRanking[existingCombustible] = currentRanking[combustible];
      }
      
      newRanking[combustible] = newRank;
      
      return {
        ...prev,
        formData: {
          ...prev.formData,
          cooking: {
            ...prev.formData.cooking,
            combustiblesRanking: newRanking
          }
        }
      };
    });
  };

  // Sélection de l'équipement principal (choix unique)
  const handleEquipementPrincipalChange = (equipement: string) => {
    setForm(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        cooking: {
          ...prev.formData.cooking,
          equipements: [equipement]
        }
      }
    }));
  };

  // Gestion du changement des équipements (optimisé avec useCallback)
  const handleEquipementsChange = useCallback((equipement: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        cooking: {
          ...prev.formData.cooking,
          equipements: checked
            ? [...prev.formData.cooking.equipements, equipement]
            : prev.formData.cooking.equipements.filter(e => e !== equipement)
        }
      }
    }));
  }, []);

  // Gestion du changement des avantages (optimisé avec useCallback)
  const handleAvantagesChange = useCallback((avantage: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        knowledge: {
          ...prev.formData.knowledge,
          avantages: checked
            ? [...prev.formData.knowledge.avantages, avantage]
            : prev.formData.knowledge.avantages.filter(a => a !== avantage)
        }
      }
    }));
  }, []);

  // Gestion du changement des obstacles (optimisé avec useCallback)
  const handleObstaclesChange = useCallback((obstacle: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        constraints: {
          ...prev.formData.constraints,
          obstacles: checked
            ? [...prev.formData.constraints.obstacles, obstacle]
            : prev.formData.constraints.obstacles.filter(o => o !== obstacle)
        }
      }
    }));
  }, []);

  // Gestion du changement des autres champs
  const handleOtherChange = (section: string, field: string, value: string) => {
    setForm(prev => {
      const next = {
        ...prev,
        formData: {
          ...prev.formData,
          [section]: {
            ...prev.formData[section as keyof typeof prev.formData],
            [field]: value
          }
        }
      } as typeof prev;

      // Logique conditionnelle: si connaissanceSolutions passe à "Non", vider les avantages
      if (section === 'knowledge' && field === 'connaissanceSolutions' && value === 'Non') {
        (next.formData as any).knowledge.avantages = [];
        (next.formData as any).knowledge.autresAvantages = '';
      }

      return next;
    });
  };

  // Validation simple
  const validate = (): boolean => {
    if (!form.formData.household.nomOuCode || !form.formData.household.age || !form.formData.household.tailleMenage) {
      toast.error('Veuillez remplir tous les champs d\'identification du ménage.');
      return false;
    }
    
    // VALIDATION GPS OBLIGATOIRE
    const hasGPS = geolocation.latitude !== null && 
                   geolocation.longitude !== null && 
                   !isNaN(geolocation.latitude) && 
                   !isNaN(geolocation.longitude);
    
    const gpsInFormData = form.formData.household.geolocalisation && 
                          form.formData.household.geolocalisation.trim() !== '';
    
    if (!hasGPS && !gpsInFormData) {
      toast.error('❌ Veuillez capturer votre position GPS avant de soumettre le formulaire.');
      // Faire défiler vers le champ GPS si visible
      const gpsField = document.querySelector('[placeholder*="GPS"], [placeholder*="gps"], [placeholder*="Géolocalisation"]');
      if (gpsField) {
        gpsField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (gpsField as HTMLElement).focus();
      }
      return false;
    }
    
    if (form.formData.cooking.combustibles.length === 0) {
      toast.error('Veuillez sélectionner au moins un type de combustible.');
      return false;
    }
    if (form.formData.cooking.equipements.length === 0) {
      toast.error('Veuillez sélectionner au moins un équipement de cuisson.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ÉTAPE 0: VALIDATION OBLIGATOIRE (même hors ligne)
      if (!validate()) {
        setIsSubmitting(false);
        return;
      }

      // ÉTAPE 1: TOUJOURS sauvegarder en local d'abord (sécurité)
      const localId = await localStorageService.saveRecord(form);
      // Logs réduits pour améliorer les performances

      // ÉTAPE 2: Vérifier la connectivité
      if (!isOnline) {
        // Mode hors ligne : notification simple de sauvegarde locale
        toast.success('✅ Formulaire sauvegardé localement');
        
        // Réinitialiser le formulaire
        setForm(initialForm);
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null, province: null, provinceStatus: 'idle' });
        
        // Démarrer la synchronisation automatique
        setTimeout(() => {
          syncService.syncLocalRecords();
        }, 1000);
        
        setIsSubmitting(false);
        return;
      }

      // ÉTAPE 3: Mode en ligne - vérifier le token
      const token = localStorage.getItem('token');
      if (!token) {
        // Session expirée : notification de sauvegarde locale
        toast.success('✅ Formulaire sauvegardé localement');
        toast.info('📡 Synchronisation automatique lors de la reconnexion');
        
        // Réinitialiser le formulaire
        setForm(initialForm);
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null, province: null, provinceStatus: 'idle' });
        
        setIsSubmitting(false);
        navigate('/login');
        return;
      }

      // ÉTAPE 4: Tentative d'envoi au serveur (endpoint système)
      // Logs réduits pour améliorer les performances
      const response = await fetch('https://api.collect.fikiri.co/records/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ formData: form })
      });

      // ÉTAPE 5: Traitement de la réponse du serveur
      if (response.ok) {
        // SUCCÈS: Le serveur a accepté le formulaire
        const result = await response.json();
        // Logs réduits pour améliorer les performances
        
        // Nettoyer le stockage local (optionnel, mais recommandé)
        try {
          await localStorageService.markAsSynced(localId, result.id);
          await localStorageService.removeSyncedRecord(localId);
          // Logs réduits pour améliorer les performances
        } catch (cleanupError) {
          console.warn('⚠️ Erreur lors du nettoyage local (non critique):', cleanupError);
        }
        
        // NOTIFICATION UNIQUE : Formulaire envoyé au serveur
        toast.success('✅ Formulaire envoyé au serveur');
        
        // Réinitialiser le formulaire
        setForm(initialForm);
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null, province: null, provinceStatus: 'idle' });
        
        // Rediriger vers la page du contrôleur
        navigate('/controleur');
        
      } else {
        // ÉCHEC: Le serveur a rejeté le formulaire
        let errorMessage = 'Erreur lors de la soumission au serveur';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.warn('Impossible de parser la réponse d\'erreur du serveur');
        }
        
        console.error('❌ Erreur serveur:', errorMessage);
        
        // NOTIFICATION SIMPLE : Formulaire sauvegardé localement
        toast.success('✅ Formulaire sauvegardé localement');
        
        // Réinitialiser le formulaire
        setForm(initialForm);
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null, province: null, provinceStatus: 'idle' });
        
        // Programmer la synchronisation automatique
        setTimeout(() => {
          syncService.syncLocalRecords();
        }, 2000);
      }

    } catch (error: any) {
      // ERREUR: Exception JavaScript (réseau, parsing, etc.)
      console.error('❌ Exception lors de la soumission:', error);
      
      // NOTIFICATION SIMPLE : Formulaire sauvegardé localement
      toast.success('✅ Formulaire sauvegardé localement');
      
      // Réinitialiser le formulaire
      setForm(initialForm);
      setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null, province: null, provinceStatus: 'idle' });
      
      // Programmer la synchronisation automatique
      setTimeout(() => {
        syncService.syncLocalRecords();
      }, 2000);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-lg mt-4 sm:mt-8 mx-4">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">SOLUTIONS DE CUISSON PROPRE</h2>
        <p className="text-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Enquête sur l'adoption des solutions de cuisson propre en RDC</p>
        
        {/* Bannière d'information GPS - Responsive */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">📍 Géolocalisation GPS Obligatoire (Fonctionne Hors Ligne)</h4>
              <p className="text-blue-700 text-xs sm:text-sm mb-2">
                <strong>✅ IMPORTANT :</strong> La capture GPS fonctionne <strong>SANS INTERNET</strong> ! 
                Le GPS utilise le récepteur intégré de votre appareil et ne nécessite aucune connexion.
              </p>
              <div className="text-blue-600 text-xs space-y-1">
                <div><strong>Avantages :</strong></div>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Fonctionne en mode hors ligne (sans internet)</li>
                  <li>Précision maximale avec GPS haute précision</li>
                  <li>Capture automatique des coordonnées</li>
                  <li>Validation en temps réel de la position</li>
                </ul>
                <div className="mt-2 text-blue-700">
                  <strong>💡 Conseil :</strong> Assurez-vous d'être à l'extérieur ou près d'une fenêtre pour une meilleure réception GPS.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section 1: Identification du ménage - Responsive */}
        <div className="mb-6 sm:mb-8 bg-blue-50 p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-800">1. Identification du ménage</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Nom ou code du ménage *</label>
              <input
                type="text"
                name="nomOuCode"
                value={form.formData.household.nomOuCode}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2 text-sm sm:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Age *</label>
              <input
                type="text"
                name="age"
                value={form.formData.household.age}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2 text-sm sm:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Sexe *</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sexe"
                    value="Homme"
                    checked={form.formData.household.sexe === 'Homme'}
                    onChange={handleHouseholdChange}
                  />
                  <span className="text-sm sm:text-base">Homme</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sexe"
                    value="Femme"
                    checked={form.formData.household.sexe === 'Femme'}
                    onChange={handleHouseholdChange}
                  />
                  <span className="text-sm sm:text-base">Femme</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sexe"
                    value="Autre"
                    checked={form.formData.household.sexe === 'Autre'}
                    onChange={handleHouseholdChange}
                  />
                  <span className="text-sm sm:text-base">Autre</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Taille du ménage *</label>
              <input
                type="text"
                name="tailleMenage"
                value={form.formData.household.tailleMenage}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2 text-sm sm:text-base"
                placeholder="ex: 5-8 personnes"
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-2 text-sm sm:text-base">Commune/Quartier *</label>
              <select
                name="communeQuartier"
                value={form.formData.household.communeQuartier}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2 text-sm sm:text-base"
                required
              >
                <option value="">Sélectionnez une commune</option>
                <option value="Gombe">Gombe</option>
                <option value="Kinshasa">Kinshasa</option>
                <option value="Kintambo">Kintambo</option>
                <option value="Ngaliema">Ngaliema</option>
                <option value="Mont-Ngafula">Mont-Ngafula</option>
                <option value="Selembao">Selembao</option>
                <option value="Bumbu">Bumbu</option>
                <option value="Makala">Makala</option>
                <option value="Ngiri-Ngiri">Ngiri-Ngiri</option>
                <option value="Kalamu">Kalamu</option>
                <option value="Kasa-Vubu">Kasa-Vubu</option>
                <option value="Bandalungwa">Bandalungwa</option>
                <option value="Lingwala">Lingwala</option>
                <option value="Barumbu">Barumbu</option>
                <option value="Matete">Matete</option>
                <option value="Lemba">Lemba</option>
                <option value="Ngaba">Ngaba</option>
                <option value="Kisenso">Kisenso</option>
                <option value="Limete">Limete</option>
                <option value="Masina">Masina</option>
                <option value="Nsele">Nsele</option>
                <option value="Maluku">Maluku</option>
                <option value="Kimbaseke">Kimbaseke</option>
                <option value="Ndjili">Ndjili</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-2 text-sm sm:text-base">Géolocalisation GPS *</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="geolocalisation"
                  value={form.formData.household.geolocalisation}
                  onChange={handleHouseholdChange}
                  className="flex-1 border rounded p-2 text-sm sm:text-base"
                  placeholder="Cliquez sur 'Capturer ma position GPS' pour obtenir automatiquement vos coordonnées"
                  readOnly
                  required
                />
                <button
                  type="button"
                  onClick={captureGeolocation}
                  disabled={isSubmitting || geolocation.isCapturing}
                  className={`px-3 sm:px-4 py-2 rounded transition-colors text-sm sm:text-base whitespace-nowrap ${
                    geolocation.isCapturing 
                      ? 'bg-yellow-600 text-white cursor-wait' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                  {geolocation.isCapturing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Capture...
                    </span>
                  ) : (
                    'Capturer ma position GPS'
                  )}
                </button>
              </div>
              
              {/* Affichage du statut GPS - Responsive */}
              <div className="mt-2 space-y-2">
                {/* Coordonnées capturées */}
                {geolocation.latitude && geolocation.longitude && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-green-600 text-xs sm:text-sm">
                    <span>✅</span>
                    <span className="font-medium">Position GPS capturée :</span>
                    <span className="font-mono bg-green-100 px-2 py-1 rounded text-xs">
                      {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
                
                
                {/* Précision GPS */}
                {geolocation.accuracy && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-blue-600 text-xs sm:text-sm">
                    <span>📏</span>
                    <span>Précision : {Math.round(geolocation.accuracy)} mètres</span>
                  </div>
                )}
                
                {/* Heure de capture */}
                {geolocation.timestamp && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-gray-600 text-xs sm:text-sm">
                    <span>🕐</span>
                    <span>Capturé le {new Date(geolocation.timestamp).toLocaleDateString('fr-FR')} à {new Date(geolocation.timestamp).toLocaleTimeString('fr-FR')}</span>
                  </div>
                )}
                
                {/* Erreur GPS */}
                {geolocation.error && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-red-600 text-xs sm:text-sm">
                    <span>❌</span>
                    <span>{geolocation.error}</span>
                  </div>
                )}
                
                {/* Indicateur de disponibilité GPS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-gray-500">
                  <span>📡</span>
                  <span>GPS disponible : {navigator.geolocation ? 'Oui' : 'Non'}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Mode hors ligne : {!navigator.onLine ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Mode de cuisson actuelle - Responsive */}
        <div className="mb-6 sm:mb-8 bg-green-50 p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-green-800">2. Mode de cuisson actuelle</h3>
          
          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold mb-3 text-sm sm:text-base">2.1.1. Quels types de combustibles utilisez-vous principalement pour la cuisson ? *</h4>
            <p className="text-sm text-gray-600 mb-4">Sélectionnez les combustibles utilisés et classez-les par ordre d'importance (1er, 2e, 3e, etc.)</p>
            <div className="space-y-3">
              {combustibles.map(combustible => {
                const isSelected = form.formData.cooking.combustibles.includes(combustible);
                const currentRank = form.formData.cooking.combustiblesRanking[combustible];
                const maxRank = form.formData.cooking.combustibles.length;
                
                return (
                  <div key={combustible} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleCombustiblesChange(combustible, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm sm:text-base flex-1">{combustible}</span>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Rang:</label>
                        <select
                          value={currentRank || ''}
                          onChange={(e) => handleCombustibleRankingChange(combustible, parseInt(e.target.value))}
                          className="border rounded px-2 py-1 text-sm w-16"
                        >
                          {Array.from({ length: maxRank }, (_, i) => i + 1).map(rank => (
                            <option key={rank} value={rank}>
                              {rank === 1 ? '1er' : rank === 2 ? '2e' : rank === 3 ? '3e' : `${rank}e`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <label className="block font-semibold mb-2 text-sm sm:text-base">Autres (précisez):</label>
              <input
                type="text"
                value={form.formData.cooking.autresCombustibles || ''}
                onChange={(e) => handleOtherChange('cooking', 'autresCombustibles', e.target.value)}
                className="w-full border rounded p-2 text-sm sm:text-base"
                placeholder="Précisez les autres combustibles"
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm sm:text-base">2.1.2. Quel est votre principal équipement de cuisson actuellement ? *</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {equipements.map(equipement => (
                <label key={equipement} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="equipementPrincipal"
                    checked={form.formData.cooking.equipements.includes(equipement)}
                    onChange={() => handleEquipementPrincipalChange(equipement)}
                  />
                  <span className="text-sm sm:text-base">{equipement}</span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="block font-semibold mb-2 text-sm sm:text-base">Autres (précisez):</label>
              <input
                type="text"
                value={form.formData.cooking.autresEquipements || ''}
                onChange={(e) => handleOtherChange('cooking', 'autresEquipements', e.target.value)}
                className="w-full border rounded p-2 text-sm sm:text-base"
                placeholder="Précisez les autres équipements"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Connaissance des solutions de cuisson propres - Responsive */}
        <div className="mb-6 sm:mb-8 bg-yellow-50 p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-yellow-800">3. Connaissance des solutions de cuisson propres</h3>
          
          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold mb-3 text-sm sm:text-base">3.1. Avez-vous déjà entendu parler des solutions de cuisson dites « propres » ?</h4>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="connaissanceSolutions"
                  value="Oui"
                  checked={form.formData.knowledge.connaissanceSolutions === 'Oui'}
                  onChange={(e) => handleOtherChange('knowledge', 'connaissanceSolutions', e.target.value)}
                />
                <span className="text-sm sm:text-base">Oui</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="connaissanceSolutions"
                  value="Non"
                  checked={form.formData.knowledge.connaissanceSolutions === 'Non'}
                  onChange={(e) => handleOtherChange('knowledge', 'connaissanceSolutions', e.target.value)}
                />
                <span className="text-sm sm:text-base">Non</span>
              </label>
            </div>
            {form.formData.knowledge.connaissanceSolutions === 'Oui' && (
              <div>
                <label className="block font-semibold mb-2 text-sm sm:text-base">Si oui, lesquelles ?</label>
                <input
                  type="text"
                  value={form.formData.knowledge.solutionsConnaissances || ''}
                  onChange={(e) => handleOtherChange('knowledge', 'solutionsConnaissances', e.target.value)}
                  className="w-full border rounded p-2 text-sm sm:text-base"
                  placeholder="Précisez les solutions connues"
                />
              </div>
            )}
          </div>
          
          {form.formData.knowledge.connaissanceSolutions === 'Oui' && (
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">3.2. Selon vous, quels sont les avantages potentiels des solutions de cuisson propre ? (plusieurs réponses possibles)</h4>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {avantages.map(avantage => (
                  <label key={avantage} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.formData.knowledge.avantages.includes(avantage)}
                      onChange={(e) => handleAvantagesChange(avantage, e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm sm:text-base">{avantage}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className="block font-semibold mb-2 text-sm sm:text-base">Autres :</label>
                <input
                  type="text"
                  value={form.formData.knowledge.autresAvantages || ''}
                  onChange={(e) => handleOtherChange('knowledge', 'autresAvantages', e.target.value)}
                  className="w-full border rounded p-2 text-sm sm:text-base"
                  placeholder="Précisez les autres avantages"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Perceptions et contraintes - Responsive */}
        <div className="mb-6 sm:mb-8 bg-red-50 p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-red-800">4. Perceptions et contraintes</h3>
          
          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold mb-3 text-sm sm:text-base">4.1. Quels sont les principaux obstacles à l'adoption d'une solution de cuisson propre dans votre foyer ? (plusieurs réponses possibles)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {obstacles.map(obstacle => (
                <label key={obstacle} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={form.formData.constraints.obstacles.includes(obstacle)}
                    onChange={(e) => handleObstaclesChange(obstacle, e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm sm:text-base">{obstacle}</span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="block font-semibold mb-2 text-sm sm:text-base">Autres :</label>
              <input
                type="text"
                value={form.formData.constraints.autresObstacles || ''}
                onChange={(e) => handleOtherChange('constraints', 'autresObstacles', e.target.value)}
                className="w-full border rounded p-2 text-sm sm:text-base"
                placeholder="Précisez les autres obstacles"
              />
            </div>
          </div>
          
          <div>
            <label className="block font-semibold mb-2 text-sm sm:text-base">Je suis prêt(e) à :</label>
            <input
              type="text"
              value={form.formData.constraints.pretA || ''}
              onChange={(e) => handleOtherChange('constraints', 'pretA', e.target.value)}
              className="w-full border rounded p-2 text-sm sm:text-base"
              placeholder="Précisez ce que vous êtes prêt(e) à faire"
            />
          </div>
        </div>

        {/* Section 5: Intention d'adoption - Responsive */}
        <div className="mb-6 sm:mb-8 bg-purple-50 p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-purple-800">5. Intention d'adoption</h3>
          
          <div className="mb-4 sm:mb-6">
            <h4 className="font-semibold mb-3 text-sm sm:text-base">5.1. Seriez-vous prêt(e) à acheter et remplacer votre mode actuel par une solution propre (soit foyer amélioré) ?</h4>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterFoyer"
                  value="Oui"
                  checked={form.formData.adoption.pretAcheterFoyer === 'Oui'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterFoyer', e.target.value)}
                />
                <span className="text-sm sm:text-base">Oui</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterFoyer"
                  value="Non"
                  checked={form.formData.adoption.pretAcheterFoyer === 'Non'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterFoyer', e.target.value)}
                />
                <span className="text-sm sm:text-base">Non</span>
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm sm:text-base">5.2. Seriez-vous prêt(e) à acheter/utiliser un réchaud GPL dans les 6 prochains mois ?</h4>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterGPL"
                  value="Oui"
                  checked={form.formData.adoption.pretAcheterGPL === 'Oui'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterGPL', e.target.value)}
                />
                <span className="text-sm sm:text-base">Oui</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterGPL"
                  value="Non"
                  checked={form.formData.adoption.pretAcheterGPL === 'Non'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterGPL', e.target.value)}
                />
                <span className="text-sm sm:text-base">Non</span>
              </label>
            </div>
          </div>
        </div>

        {/* Indicateur GPS */}
        {!(geolocation.latitude && geolocation.longitude) && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">⚠️ La capture GPS est obligatoire avant la soumission</span>
            </div>
          </div>
        )}
        <button 
          type="submit" 
          className={`w-full py-3 rounded-xl text-base sm:text-lg font-bold shadow-lg transition-colors ${
            geolocation.latitude && geolocation.longitude
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
          disabled={isSubmitting || !(geolocation.latitude && geolocation.longitude)}
        >
          {isSubmitting 
            ? 'Enregistrement...' 
            : geolocation.latitude && geolocation.longitude 
              ? 'Soumettre' 
              : 'GPS requis pour soumettre'
          }
        </button>
      </form>
    </div>
  );
} 
