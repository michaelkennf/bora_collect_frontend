import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { localStorageService } from '../services/localStorageService';
import { syncService } from '../services/syncService';

// Types pour les solutions de cuisson propre
interface HouseholdData {
  nomOuCode: string;
  age: string;
  sexe: 'Homme' | 'Femme';
  tailleMenage: string;
  communeQuartier: string;
  geolocalisation: string;
}

interface CookingData {
  combustibles: string[];
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
  geolocalisation: ''
};

const initialCooking: CookingData = {
  combustibles: [],
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
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Écouter les changements de connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('🌐 Connexion internet rétablie - Synchronisation en cours...');
      // Synchroniser les données locales
      syncService.syncLocalRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('📱 Mode hors ligne - Les données seront sauvegardées localement');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capturer la géolocalisation
  const captureGeolocation = () => {
    if (!navigator.geolocation) {
      setGeolocation(prev => ({ ...prev, error: 'Géolocalisation non supportée' }));
      return;
    }

    setGeolocation(prev => ({ ...prev, isCapturing: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGeolocation({
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now(),
          isCapturing: false,
          error: null,
        });
        
        // Mettre à jour le formulaire avec les coordonnées GPS
        setForm(prev => ({
          ...prev,
          formData: {
            ...prev.formData,
            household: {
              ...prev.formData.household,
              geolocalisation: `${latitude}, ${longitude}`,
            },
          },
        }));
      },
      (error) => {
        setGeolocation({
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: null,
          isCapturing: false,
          error: `Erreur GPS: ${error.message}`,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

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
  const handleHouseholdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  };

  // Gestion du changement des combustibles
  const handleCombustiblesChange = (combustible: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        cooking: {
          ...prev.formData.cooking,
          combustibles: checked
            ? [...prev.formData.cooking.combustibles, combustible]
            : prev.formData.cooking.combustibles.filter(c => c !== combustible)
        }
      }
    }));
  };

  // Gestion du changement des équipements
  const handleEquipementsChange = (equipement: string, checked: boolean) => {
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
  };

  // Gestion du changement des avantages
  const handleAvantagesChange = (avantage: string, checked: boolean) => {
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
  };

  // Gestion du changement des obstacles
  const handleObstaclesChange = (obstacle: string, checked: boolean) => {
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
  };

  // Gestion du changement des autres champs
  const handleOtherChange = (section: string, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [section]: {
          ...prev.formData[section as keyof typeof prev.formData],
          [field]: value
        }
      }
    }));
  };

  // Validation simple
  const validate = (): boolean => {
    if (!form.formData.household.nomOuCode || !form.formData.household.age || !form.formData.household.tailleMenage) {
      toast.error('Veuillez remplir tous les champs d\'identification du ménage.');
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
    
    // Validation GPS obligatoire
    if (!geolocation.latitude) {
      toast.warning('⚠️ La capture GPS est obligatoire. Veuillez utiliser le bouton "Capturer ma position GPS" pour obtenir vos coordonnées automatiquement.');
      return false;
    }
    
    // Validation du format GPS
    const gpsRegex = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;
    if (!gpsRegex.test(form.formData.household.geolocalisation.trim())) {
      toast.warning('⚠️ Format GPS invalide. Utilisez le bouton de capture automatique ou respectez le format "latitude, longitude" (ex: -4.4419, 15.2663)');
      return false;
    }
    
    toast.success('✅ Formulaire valide !');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Vérifier la connectivité
      if (!isOnline) {
        // Mode hors ligne : sauvegarder en local
        await localStorageService.saveRecord(form);
        toast.success('✅ Formulaire sauvegardé en local (mode hors ligne)');
        toast.info('📱 Les données seront synchronisées automatiquement lors de la reconnexion');
        setForm(initialForm);
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null });
        return;
      }

      // Mode en ligne : envoyer directement au serveur
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('❌ Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ formData: form })
      });

      if (response.ok) {
        toast.success('✅ Formulaire soumis avec succès !');
        setForm(initialForm);
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null });
        
        // Rediriger vers la liste des enregistrements
        navigate('/records');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la soumission');
      }

    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      
      if (!isOnline) {
        // En cas d'erreur en mode hors ligne, sauvegarder en local
        await localStorageService.saveRecord(form);
        toast.success('✅ Formulaire sauvegardé en local suite à l\'erreur');
        toast.info('📱 Les données seront synchronisées lors de la reconnexion');
        setForm(initialForm);
        setGeolocation({ latitude: null, longitude: null, accuracy: null, timestamp: null, isCapturing: false, error: null });
      } else {
        toast.error(`❌ Erreur lors de la soumission: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-8">
      {/* Bouton de retour */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow"
          style={{ backgroundColor: '#0033A0', color: 'white', border: 'none', outline: 'none' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-center mb-6">SOLUTIONS DE CUISSON PROPRE</h2>
        <p className="text-center text-gray-600 mb-6">Enquête sur l'adoption des solutions de cuisson propre en RDC</p>
        
        {/* Bannière d'information GPS */}
        <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-2">📍 Géolocalisation GPS Obligatoire</h4>
              <p className="text-blue-700 text-sm mb-2">
                Pour garantir la précision des données et permettre une analyse géographique fiable, 
                la capture automatique de votre position GPS est <strong>obligatoire</strong>.
              </p>
              <div className="text-blue-600 text-xs">
                <strong>Avantages :</strong> Précision des données, analyse géographique, validation de la localisation, 
                suivi des tendances par zone géographique.
              </div>
            </div>
          </div>
        </div>
        
        {/* Section 1: Identification du ménage */}
        <div className="mb-8 bg-blue-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 text-blue-800">1. Identification du ménage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Nom ou code du ménage *</label>
              <input
                type="text"
                name="nomOuCode"
                value={form.formData.household.nomOuCode}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-2">Age *</label>
              <input
                type="text"
                name="age"
                value={form.formData.household.age}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2"
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-2">Sexe *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sexe"
                    value="Homme"
                    checked={form.formData.household.sexe === 'Homme'}
                    onChange={handleHouseholdChange}
                  />
                  Homme
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="sexe"
                    value="Femme"
                    checked={form.formData.household.sexe === 'Femme'}
                    onChange={handleHouseholdChange}
                  />
                  Femme
                </label>
              </div>
            </div>
            
            <div>
              <label className="block font-semibold mb-2">Taille du ménage *</label>
              <input
                type="text"
                name="tailleMenage"
                value={form.formData.household.tailleMenage}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2"
                placeholder="ex: 5-8 personnes"
                required
              />
            </div>
            
            <div>
              <label className="block font-semibold mb-2">Commune/Quartier *</label>
              <select
                name="communeQuartier"
                value={form.formData.household.communeQuartier}
                onChange={handleHouseholdChange}
                className="w-full border rounded p-2"
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
            
            <div className="md:col-span-2">
              <label className="block font-semibold mb-2">Géolocalisation GPS *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="geolocalisation"
                  value={form.formData.household.geolocalisation}
                  onChange={handleHouseholdChange}
                  className="flex-1 border rounded p-2"
                  placeholder="Cliquez sur 'Capturer ma position GPS' pour obtenir automatiquement vos coordonnées"
                  readOnly
                  required
                />
                <button
                  type="button"
                  onClick={captureGeolocation}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Capture...' : 'Capturer ma position GPS'}
                </button>
              </div>
              {geolocation.latitude && geolocation.longitude && (
                <p className="text-green-600 text-sm mt-1">📍 {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Mode de cuisson actuelle */}
        <div className="mb-8 bg-green-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 text-green-800">2. Mode de cuisson actuelle</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3">2.1.1. Quels types de combustibles utilisez-vous principalement pour la cuisson ? *</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {combustibles.map(combustible => (
                <label key={combustible} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.formData.cooking.combustibles.includes(combustible)}
                    onChange={(e) => handleCombustiblesChange(combustible, e.target.checked)}
                  />
                  {combustible}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="block font-semibold mb-2">Autres (précisez):</label>
              <input
                type="text"
                value={form.formData.cooking.autresCombustibles || ''}
                onChange={(e) => handleOtherChange('cooking', 'autresCombustibles', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Précisez les autres combustibles"
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">2.1.2. Quel est l'équipement de cuisson actuel ? (Plusieurs choix possibles) *</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {equipements.map(equipement => (
                <label key={equipement} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.formData.cooking.equipements.includes(equipement)}
                    onChange={(e) => handleEquipementsChange(equipement, e.target.checked)}
                  />
                  {equipement}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="block font-semibold mb-2">Autres (précisez):</label>
              <input
                type="text"
                value={form.formData.cooking.autresEquipements || ''}
                onChange={(e) => handleOtherChange('cooking', 'autresEquipements', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Précisez les autres équipements"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Connaissance des solutions de cuisson propres */}
        <div className="mb-8 bg-yellow-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 text-yellow-800">3. Connaissance des solutions de cuisson propres</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3">3.1. Avez-vous déjà entendu parler des solutions de cuisson dites « propres » ?</h4>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="connaissanceSolutions"
                  value="Oui"
                  checked={form.formData.knowledge.connaissanceSolutions === 'Oui'}
                  onChange={(e) => handleOtherChange('knowledge', 'connaissanceSolutions', e.target.value)}
                />
                Oui
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="connaissanceSolutions"
                  value="Non"
                  checked={form.formData.knowledge.connaissanceSolutions === 'Non'}
                  onChange={(e) => handleOtherChange('knowledge', 'connaissanceSolutions', e.target.value)}
                />
                Non
              </label>
            </div>
            {form.formData.knowledge.connaissanceSolutions === 'Oui' && (
              <div>
                <label className="block font-semibold mb-2">Si oui, lesquelles ?</label>
                <input
                  type="text"
                  value={form.formData.knowledge.solutionsConnaissances || ''}
                  onChange={(e) => handleOtherChange('knowledge', 'solutionsConnaissances', e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Précisez les solutions connues"
                />
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">3.2. Selon vous, quels sont les avantages potentiels des solutions de cuisson propre ? (plusieurs réponses possibles)</h4>
            <div className="grid grid-cols-1 gap-3">
              {avantages.map(avantage => (
                <label key={avantage} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.formData.knowledge.avantages.includes(avantage)}
                    onChange={(e) => handleAvantagesChange(avantage, e.target.checked)}
                  />
                  {avantage}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="block font-semibold mb-2">Autres :</label>
              <input
                type="text"
                value={form.formData.knowledge.autresAvantages || ''}
                onChange={(e) => handleOtherChange('knowledge', 'autresAvantages', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Précisez les autres avantages"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Perceptions et contraintes */}
        <div className="mb-8 bg-red-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 text-red-800">4. Perceptions et contraintes</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3">4.1. Quels sont les principaux obstacles à l'adoption d'une solution de cuisson propre dans votre foyer ? (plusieurs réponses possibles)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {obstacles.map(obstacle => (
                <label key={obstacle} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.formData.constraints.obstacles.includes(obstacle)}
                    onChange={(e) => handleObstaclesChange(obstacle, e.target.checked)}
                  />
                  {obstacle}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="block font-semibold mb-2">Autres :</label>
              <input
                type="text"
                value={form.formData.constraints.autresObstacles || ''}
                onChange={(e) => handleOtherChange('constraints', 'autresObstacles', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Précisez les autres obstacles"
              />
            </div>
          </div>
          
          <div>
            <label className="block font-semibold mb-2">Je suis prêt(e) à :</label>
            <input
              type="text"
              value={form.formData.constraints.pretA || ''}
              onChange={(e) => handleOtherChange('constraints', 'pretA', e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Précisez ce que vous êtes prêt(e) à faire"
            />
          </div>
        </div>

        {/* Section 5: Intention d'adoption */}
        <div className="mb-8 bg-purple-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 text-purple-800">5. Intention d'adoption</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3">5.1. Seriez-vous prêt(e) à acheter et remplacer votre mode actuel par une solution propre (soit foyer amélioré) ?</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterFoyer"
                  value="Oui"
                  checked={form.formData.adoption.pretAcheterFoyer === 'Oui'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterFoyer', e.target.value)}
                />
                Oui
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterFoyer"
                  value="Non"
                  checked={form.formData.adoption.pretAcheterFoyer === 'Non'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterFoyer', e.target.value)}
                />
                Non
              </label>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">5.2. Seriez-vous prêt(e) à acheter/utiliser un réchaud GPL dans les 6 prochains mois ?</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterGPL"
                  value="Oui"
                  checked={form.formData.adoption.pretAcheterGPL === 'Oui'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterGPL', e.target.value)}
                />
                Oui
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pretAcheterGPL"
                  value="Non"
                  checked={form.formData.adoption.pretAcheterGPL === 'Non'}
                  onChange={(e) => handleOtherChange('adoption', 'pretAcheterGPL', e.target.value)}
                />
                Non
              </label>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl text-lg font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Soumettre'}
        </button>
      </form>
    </div>
  );
} 