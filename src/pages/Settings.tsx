import React, { useState, useEffect } from 'react';
import { Link2, Copy, Check, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import { environment } from '../config/environment';
import { getCitiesByProvince, getCommunesByCity } from '../data/citiesData';
import { getQuartiersByCommune } from '../data/quartiersData';
import ConfirmationModal from '../components/ConfirmationModal';
import enhancedApiService from '../services/enhancedApiService';

interface PublicLink {
  id: string;
  token: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  survey: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
  _count: {
    submissions: number;
  };
}

interface AvailableSurvey {
  id: string;
  title: string;
  description: string;
  status: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    name: '',
    whatsapp: '',
    gender: '',
    contact: '',
    province: '',
    city: '',
    commune: '',
    quartier: '',
    organization: '',
    campaignDescription: '',
    targetProvince: '',
    campaignDuration: '',
    selectedODD: '',
    numberOfEnumerators: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [customQuartier, setCustomQuartier] = useState('');
  const [showCustomQuartier, setShowCustomQuartier] = useState(false);
  const [photoDeletedLocally, setPhotoDeletedLocally] = useState(false);

  // États pour les liens publics (enquêteurs uniquement)
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [availableSurveys, setAvailableSurveys] = useState<AvailableSurvey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [submissionStats, setSubmissionStats] = useState<{ appSubmissions: number; publicSubmissions: number; total: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

  // Charger les données utilisateur au montage du composant
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // D'abord charger depuis localStorage pour éviter le flash
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          console.log('🔍 Settings - Données utilisateur chargées depuis localStorage:', userData);
          setUser(userData);
          setProfilePhoto(userData.profilePhoto || null);
          setSettings(prev => ({
            ...prev,
            email: userData.email || '',
            name: userData.name || '',
            whatsapp: userData.whatsapp || '',
            gender: userData.gender || '',
            contact: userData.contact || '',
            province: userData.province || '',
            city: userData.city || '',
            commune: userData.commune || '',
            quartier: userData.quartier || '',
            organization: userData.organization || '',
            campaignDescription: userData.campaignDescription || '',
            targetProvince: userData.targetProvince || '',
            campaignDuration: userData.campaignDuration || '',
            selectedODD: userData.selectedODD || '',
            numberOfEnumerators: userData.numberOfEnumerators || ''
          }));
        }

        // Ensuite, mettre à jour depuis le serveur en arrière-plan
        const userData = await enhancedApiService.get<{ user: any }>('/auth/me');
          console.log('🔍 Settings - Données utilisateur mises à jour depuis le serveur:', userData.user);
          
          // Si la photo a été supprimée localement, ne pas la restaurer depuis le serveur
          if (photoDeletedLocally) {
            console.log('🔍 Settings - Photo supprimée localement, ne pas restaurer depuis le serveur');
            setUser({ ...userData.user, profilePhoto: null });
          } else {
            // Mettre à jour normalement
            setUser(userData.user);
            setProfilePhoto(userData.user.profilePhoto || null);
          }
          
          setSettings(prev => ({
            ...prev,
            email: userData.user.email || '',
            name: userData.user.name || '',
            whatsapp: userData.user.whatsapp || '',
            gender: userData.user.gender || '',
            contact: userData.user.contact || '',
            province: userData.user.province || '',
            city: userData.user.city || '',
            commune: userData.user.commune || '',
            quartier: userData.user.quartier || '',
            organization: userData.user.organization || '',
            campaignDescription: userData.user.campaignDescription || '',
            targetProvince: userData.user.targetProvince || '',
            campaignDuration: userData.user.campaignDuration || '',
            selectedODD: userData.user.selectedODD || '',
            numberOfEnumerators: userData.user.numberOfEnumerators || ''
          }));
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };

    loadUserData();
  }, [photoDeletedLocally]);

  // Charger les liens publics et campagnes disponibles pour les enquêteurs
  useEffect(() => {
    const loadPublicLinksData = async () => {
      const localUser = localStorage.getItem('user');
      if (!localUser) return;
      
      const userData = JSON.parse(localUser);
      if (userData.role !== 'CONTROLLER') return;

      const token = localStorage.getItem('token');
      if (!token) return;

      setLoadingLinks(true);
      try {
        // Charger les liens existants
        const linksData = await enhancedApiService.get<PublicLink[]>('/public-links/my-links');
        setPublicLinks(linksData);

        // Charger les campagnes disponibles
        const surveysData = await enhancedApiService.get<AvailableSurvey[]>('/public-links/available-surveys');
        setAvailableSurveys(surveysData);
      } catch (error) {
        console.error('Erreur lors du chargement des liens publics:', error);
      } finally {
        setLoadingLinks(false);
      }
    };

    loadPublicLinksData();
    loadSubmissionStats();
  }, []);

  // Charger les statistiques de soumission pour l'enquêteur
  const loadSubmissionStats = async () => {
    const localUser = localStorage.getItem('user');
    if (!localUser) return;
    
    const userData = JSON.parse(localUser);
    if (userData.role !== 'CONTROLLER') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingStats(true);
    try {
      // Récupérer toutes les campagnes de l'enquêteur
      const surveysResponse = await fetch(`${environment.apiBaseUrl}/public-links/available-surveys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const surveys = await enhancedApiService.get<AvailableSurvey[]>('/public-links/available-surveys');
      let totalAppSubmissions = 0;
      let totalPublicSubmissions = 0;

      // Pour chaque campagne, récupérer les stats
      for (const survey of surveys) {
        try {
          // Stats des soumissions par app
          const appData = await enhancedApiService.get<any>(`/records/controller?campaignId=${survey.id}`);
          totalAppSubmissions += Array.isArray(appData) ? appData.length : (appData?.data?.length || 0);

          // Stats des soumissions par lien public (depuis les liens de l'utilisateur)
          const linksData = await enhancedApiService.get<PublicLink[]>('/public-links/my-links');
          const surveyLinks = linksData.filter((link: PublicLink) => link.survey?.id === survey.id);
          totalPublicSubmissions += surveyLinks.reduce((sum: number, link: PublicLink) => sum + (link._count?.submissions || 0), 0);
        } catch (error) {
          console.error(`Erreur lors du chargement des stats pour la campagne ${survey.id}:`, error);
        }
      }

      setSubmissionStats({
        appSubmissions: totalAppSubmissions,
        publicSubmissions: totalPublicSubmissions,
        total: totalAppSubmissions + totalPublicSubmissions
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Générer un nouveau lien public
  const generatePublicLink = async () => {
    if (!selectedSurveyId) {
      setMessage('Veuillez sélectionner une campagne');
      setMessageType('error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setGeneratingLink(true);
    try {
      const response = await fetch(`${environment.apiBaseUrl}/public-links/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ surveyId: selectedSurveyId })
      });

      if (response.ok) {
        const newLink = await response.json();
        setPublicLinks(prev => [newLink, ...prev]);
        setSelectedSurveyId('');
        setMessage('Lien généré avec succès !');
        setMessageType('success');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Erreur lors de la génération du lien');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erreur lors de la génération du lien');
      setMessageType('error');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Copier le lien dans le presse-papier
  const copyLinkToClipboard = async (link: PublicLink) => {
    const fullUrl = `${window.location.origin}/form/${link.token}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  // Désactiver/réactiver un lien
  const toggleLinkStatus = async (linkId: string, isActive: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const endpoint = isActive ? 'deactivate' : 'reactivate';
      // Utilisation du nouveau service API
      await enhancedApiService.patch(`/public-links/${linkId}/${endpoint}`);
      
      setPublicLinks(prev =>
        prev.map(link =>
          link.id === linkId ? { ...link, isActive: !isActive } : link
        )
      );
    } catch (error) {
      console.error('Erreur lors de la modification du lien:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'province') {
      // Réinitialiser ville et commune quand la province change
      setSettings(prev => ({
        ...prev,
        province: value,
        city: '',
        commune: '',
        quartier: ''
      }));
    } else if (name === 'city') {
      // Réinitialiser commune et quartier quand la ville change
      setSettings(prev => ({
        ...prev,
        city: value,
        commune: '',
        quartier: ''
      }));
      setShowCustomQuartier(false);
      setCustomQuartier('');
    } else if (name === 'commune') {
      // Réinitialiser quartier quand la commune change
      setSettings(prev => ({
        ...prev,
        commune: value,
        quartier: ''
      }));
      setShowCustomQuartier(false);
      setCustomQuartier('');
    } else if (name === 'quartier') {
      if (value === 'CUSTOM') {
        setShowCustomQuartier(true);
        setSettings(prev => ({
          ...prev,
          quartier: ''
        }));
      } else {
        setShowCustomQuartier(false);
        setCustomQuartier('');
        setSettings(prev => ({
          ...prev,
          quartier: value
        }));
      }
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.match(/^image\/(jpg|jpeg|png|gif)$/)) {
      setMessage('Seuls les fichiers image (JPG, PNG, GIF) sont autorisés');
      setMessageType('error');
      return;
    }

    // Vérifier la taille du fichier (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      setMessage('La taille du fichier ne doit pas dépasser 1MB');
      setMessageType('error');
      return;
    }

    setUploadingPhoto(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('file', file);

      // Utilisation du nouveau service API pour l'upload
      const result = await enhancedApiService.upload<{ photoUrl: string }>('/upload/profile-photo', formData);
      
      setProfilePhoto(result.photoUrl);
      setPhotoDeletedLocally(false);
      setMessage('Photo de profil mise à jour avec succès');
      setMessageType('success');
      
      // Mettre à jour les données utilisateur dans localStorage
      const updatedUser = { ...user, profilePhoto: result.photoUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Déclencher l'événement pour mettre à jour l'interface
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
    } catch (error) {
      setMessage('Erreur de connexion lors de l\'upload');
      setMessageType('error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    setUploadingPhoto(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Utilisation du nouveau service API
      await enhancedApiService.delete('/upload/profile-photo');
      
      setProfilePhoto(null);
      setPhotoDeletedLocally(true);
      setMessage('Photo de profil supprimée avec succès');
      setMessageType('success');
      
      // Mettre à jour les données utilisateur dans localStorage
      const updatedUser = { ...user, profilePhoto: null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Déclencher l'événement pour mettre à jour l'interface
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
    } catch (error) {
      setMessage('Erreur de connexion lors de la suppression');
      setMessageType('error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (settings.newPassword !== settings.confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (settings.newPassword.length < 6) {
      setMessage('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Utilisation du nouveau service API
      await enhancedApiService.post('/auth/change-password', {
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword
      });

      setMessage('Mot de passe modifié avec succès');
      setMessageType('success');
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage('Erreur de connexion au serveur');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const requestData = {
        name: settings.name,
        email: settings.email,
        whatsapp: settings.whatsapp,
        gender: settings.gender || undefined,
        contact: settings.contact || undefined,
        province: settings.province || undefined,
        city: settings.city || undefined,
        commune: settings.commune || undefined,
        quartier: showCustomQuartier ? customQuartier : (settings.quartier || undefined),
        organization: settings.organization || undefined,
        campaignDescription: settings.campaignDescription || undefined,
        targetProvince: settings.targetProvince || undefined,
        campaignDuration: settings.campaignDuration || undefined,
        selectedODD: settings.selectedODD ? parseInt(settings.selectedODD) : undefined,
        numberOfEnumerators: settings.numberOfEnumerators ? parseInt(settings.numberOfEnumerators) : undefined
      };

      console.log('🔍 Settings - Tentative de mise à jour du profil');
      console.log('🔍 Settings - URL:', `${environment.apiBaseUrl}/users/update-profile`);
      console.log('🔍 Settings - Token:', !!token);
      console.log('🔍 Settings - Données:', requestData);

      // Utilisation du nouveau service API
      await enhancedApiService.put('/users/update-profile', requestData);

      setMessage('Identité mise à jour avec succès');
      setMessageType('success');
        // Mettre à jour les données utilisateur dans localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const userObj = JSON.parse(userData);
          userObj.name = settings.name;
          userObj.email = settings.email;
          userObj.whatsapp = settings.whatsapp;
          localStorage.setItem('user', JSON.stringify(userObj));
        }
    } catch (error) {
      setMessage('Erreur de connexion au serveur');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        whatsapp: user.whatsapp || ''
      }));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Photo de profil */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Photo de profil</h2>
        
        <div className="flex items-center space-x-6">
          {/* Affichage de la photo actuelle */}
          <div className="relative">
            {profilePhoto ? (
              <img 
                src={`${environment.apiBaseUrl}${profilePhoto}`} 
                alt="Photo de profil" 
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          {/* Boutons d'upload et suppression */}
          <div className="flex-1">
            <div className="flex gap-3 mb-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploadingPhoto ? 'Upload en cours...' : 'Changer la photo'}
                </div>
              </label>
              
              {/* Bouton supprimer */}
              {profilePhoto && (
                <button
                  onClick={() => setShowDeletePhotoModal(true)}
                  disabled={uploadingPhoto}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPhoto ? 'Suppression...' : 'Supprimer'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Formats acceptés: JPG, PNG, GIF (max 1MB)
            </p>
          </div>
        </div>
      </div>

      {/* Modification du mot de passe */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Modifier le mot de passe</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={settings.currentPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={settings.newPassword}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={settings.confirmPassword}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Modification du profil */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Modifier identité</h2>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={settings.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={settings.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                id="gender"
                name="gender"
                value={settings.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez votre genre</option>
                <option value="MALE">Masculin</option>
                <option value="FEMALE">Féminin</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={settings.contact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez votre numéro de téléphone"
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
              Numéro WhatsApp
            </label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              value={settings.whatsapp}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez votre numéro WhatsApp"
            />
          </div>

          {/* Informations géographiques */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations géographiques</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                  Province
                </label>
                <select
                  id="province"
                  name="province"
                  value={settings.province}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez votre province</option>
                  <option value="BAS_UELE">Bas-Uélé</option>
                  <option value="EQUATEUR">Équateur</option>
                  <option value="HAUT_KATANGA">Haut-Katanga</option>
                  <option value="HAUT_LOMAMI">Haut-Lomami</option>
                  <option value="HAUT_UELE">Haut-Uélé</option>
                  <option value="ITURI">Ituri</option>
                  <option value="KASAI">Kasaï</option>
                  <option value="KASAI_CENTRAL">Kasaï-Central</option>
                  <option value="KASAI_ORIENTAL">Kasaï-Oriental</option>
                  <option value="KINSHASA">Kinshasa</option>
                  <option value="KONGO_CENTRAL">Kongo-Central</option>
                  <option value="KWANGO">Kwango</option>
                  <option value="KWILU">Kwilu</option>
                  <option value="LOMAMI">Lomami</option>
                  <option value="LUALABA">Lualaba</option>
                  <option value="MAI_NDOMBE">Maï-Ndombe</option>
                  <option value="MANIEMA">Maniema</option>
                  <option value="MONGALA">Mongala</option>
                  <option value="NORD_KIVU">Nord-Kivu</option>
                  <option value="NORD_UBANGI">Nord-Ubangi</option>
                  <option value="SANKURU">Sankuru</option>
                  <option value="SUD_KIVU">Sud-Kivu</option>
                  <option value="SUD_UBANGI">Sud-Ubangi</option>
                  <option value="TANGANYIKA">Tanganyika</option>
                  <option value="TSHOPO">Tshopo</option>
                  <option value="TSHUAPA">Tshuapa</option>
                </select>
              </div>

              {settings.province && (
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={settings.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez votre ville</option>
                    {getCitiesByProvince(settings.province).map((city, index) => (
                      <option key={index} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {settings.city && (
                <div>
                  <label htmlFor="commune" className="block text-sm font-medium text-gray-700 mb-2">
                    Commune
                  </label>
                  <select
                    id="commune"
                    name="commune"
                    value={settings.commune}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez votre commune</option>
                    {getCommunesByCity(settings.province, settings.city).map((commune, index) => (
                      <option key={index} value={commune}>
                        {commune}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {settings.commune && (
                <div>
                  <label htmlFor="quartier" className="block text-sm font-medium text-gray-700 mb-2">
                    Quartier
                  </label>
                  <select
                    id="quartier"
                    name="quartier"
                    value={settings.quartier}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez votre quartier</option>
                    {getQuartiersByCommune(settings.province, settings.city, settings.commune).map((quartier, index) => (
                      <option key={index} value={quartier}>
                        {quartier}
                      </option>
                    ))}
                    <option value="CUSTOM">Mon quartier n'est pas dans la liste</option>
                  </select>
                </div>
              )}
            </div>

            {showCustomQuartier && (
              <div className="mt-4">
                <label htmlFor="customQuartier" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de votre quartier
                </label>
                <input
                  id="customQuartier"
                  name="customQuartier"
                  type="text"
                  value={customQuartier}
                  onChange={(e) => setCustomQuartier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez le nom de votre quartier"
                />
              </div>
            )}
          </div>


          {/* Informations spécifiques aux Project Managers */}
          {user?.role === 'PROJECT_MANAGER' && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du projet</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    Organisation
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={settings.organization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de votre organisation"
                  />
                </div>

                <div>
                  <label htmlFor="targetProvince" className="block text-sm font-medium text-gray-700 mb-2">
                    Province cible
                  </label>
                  <select
                    id="targetProvince"
                    name="targetProvince"
                    value={settings.targetProvince}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez la province cible</option>
                    <option value="BAS_UELE">Bas-Uélé</option>
                    <option value="EQUATEUR">Équateur</option>
                    <option value="HAUT_KATANGA">Haut-Katanga</option>
                    <option value="HAUT_LOMAMI">Haut-Lomami</option>
                    <option value="HAUT_UELE">Haut-Uélé</option>
                    <option value="ITURI">Ituri</option>
                    <option value="KASAI">Kasaï</option>
                    <option value="KASAI_CENTRAL">Kasaï-Central</option>
                    <option value="KASAI_ORIENTAL">Kasaï-Oriental</option>
                    <option value="KINSHASA">Kinshasa</option>
                    <option value="KONGO_CENTRAL">Kongo-Central</option>
                    <option value="KWANGO">Kwango</option>
                    <option value="KWILU">Kwilu</option>
                    <option value="LOMAMI">Lomami</option>
                    <option value="LUALABA">Lualaba</option>
                    <option value="MAI_NDOMBE">Maï-Ndombe</option>
                    <option value="MANIEMA">Maniema</option>
                    <option value="MONGALA">Mongala</option>
                    <option value="NORD_KIVU">Nord-Kivu</option>
                    <option value="NORD_UBANGI">Nord-Ubangi</option>
                    <option value="SANKURU">Sankuru</option>
                    <option value="SUD_KIVU">Sud-Kivu</option>
                    <option value="SUD_UBANGI">Sud-Ubangi</option>
                    <option value="TANGANYIKA">Tanganyika</option>
                    <option value="TSHOPO">Tshopo</option>
                    <option value="TSHUAPA">Tshuapa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="campaignDuration" className="block text-sm font-medium text-gray-700 mb-2">
                    Durée de campagne
                  </label>
                  <input
                    type="text"
                    id="campaignDuration"
                    name="campaignDuration"
                    value={settings.campaignDuration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 6 mois, 1 an..."
                  />
                </div>

                <div>
                  <label htmlFor="numberOfEnumerators" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d'enquêteurs
                  </label>
                  <input
                    type="number"
                    id="numberOfEnumerators"
                    name="numberOfEnumerators"
                    value={settings.numberOfEnumerators}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre d'enquêteurs prévu"
                    min="1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="campaignDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description de campagne
                </label>
                <textarea
                  id="campaignDescription"
                  name="campaignDescription"
                  value={settings.campaignDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e as any)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez votre campagne..."
                />
              </div>

              <div className="mt-4">
                <label htmlFor="selectedODD" className="block text-sm font-medium text-gray-700 mb-2">
                  ODD sélectionné
                </label>
                <select
                  id="selectedODD"
                  name="selectedODD"
                  value={settings.selectedODD}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionnez un ODD</option>
                  <option value="1">ODD 1 - Éliminer la pauvreté</option>
                  <option value="2">ODD 2 - Éliminer la faim</option>
                  <option value="3">ODD 3 - Bonne santé et bien-être</option>
                  <option value="4">ODD 4 - Éducation de qualité</option>
                  <option value="5">ODD 5 - Égalité des sexes</option>
                  <option value="6">ODD 6 - Eau propre et assainissement</option>
                  <option value="7">ODD 7 - Énergie propre</option>
                  <option value="8">ODD 8 - Travail décent</option>
                  <option value="9">ODD 9 - Industrie, innovation</option>
                  <option value="10">ODD 10 - Inégalités réduites</option>
                  <option value="11">ODD 11 - Villes durables</option>
                  <option value="12">ODD 12 - Consommation responsable</option>
                  <option value="13">ODD 13 - Lutte contre le changement climatique</option>
                  <option value="14">ODD 14 - Vie aquatique</option>
                  <option value="15">ODD 15 - Vie terrestre</option>
                  <option value="16">ODD 16 - Paix et justice</option>
                  <option value="17">ODD 17 - Partenariats</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour l\'identité'}
          </button>
        </form>
      </div>

      {/* Section Statistiques - Uniquement pour les enquêteurs (CONTROLLER) */}
      {user?.role === 'CONTROLLER' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mes statistiques</h2>
              <p className="text-sm text-gray-500">Vue d'ensemble de vos soumissions de formulaires</p>
            </div>
          </div>

          {loadingStats ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500">Chargement des statistiques...</p>
            </div>
          ) : submissionStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {submissionStats.appSubmissions}
                </div>
                <div className="text-blue-800 font-medium">Par application</div>
                <div className="text-xs text-blue-600 mt-1">
                  {submissionStats.total > 0 
                    ? `${Math.round((submissionStats.appSubmissions / submissionStats.total) * 100)}% du total`
                    : '0%'}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {submissionStats.publicSubmissions}
                </div>
                <div className="text-green-800 font-medium">Par lien public</div>
                <div className="text-xs text-green-600 mt-1">
                  {submissionStats.total > 0 
                    ? `${Math.round((submissionStats.publicSubmissions / submissionStats.total) * 100)}% du total`
                    : '0%'}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {submissionStats.total}
                </div>
                <div className="text-purple-800 font-medium">Total</div>
                <div className="text-xs text-purple-600 mt-1">Toutes soumissions</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune statistique disponible pour le moment
            </div>
          )}
        </div>
      )}

      {/* Section Liens Publics - Uniquement pour les enquêteurs (CONTROLLER) */}
      {user && user.role === 'CONTROLLER' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Liens de partage</h2>
              <p className="text-sm text-gray-500">Générez des liens pour permettre à d'autres personnes de remplir vos formulaires</p>
            </div>
          </div>

          {/* Générer un nouveau lien */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-3">Générer un nouveau lien</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={generatingLink || availableSurveys.length === 0}
              >
                <option value="">
                  {availableSurveys.length === 0 
                    ? 'Aucune campagne disponible' 
                    : 'Sélectionner une campagne...'}
                </option>
                {availableSurveys.map((survey) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.title}
                  </option>
                ))}
              </select>
              <button
                onClick={generatePublicLink}
                disabled={generatingLink || !selectedSurveyId}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generatingLink ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Générer
              </button>
            </div>
          </div>

          {/* Liste des liens existants */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Mes liens ({publicLinks.length})</h3>
            
            {loadingLinks ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-500">Chargement des liens...</p>
              </div>
            ) : publicLinks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Aucun lien généré pour le moment</p>
                <p className="text-sm text-gray-400">Sélectionnez une campagne ci-dessus pour créer votre premier lien</p>
              </div>
            ) : (
              <div className="space-y-3">
                {publicLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`border rounded-xl p-4 transition-all ${
                      link.isActive 
                        ? 'border-green-200 bg-green-50/50' 
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{link.survey?.title || 'Campagne inconnue'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            link.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {link.isActive ? 'Actif' : 'Désactivé'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-blue-600">{link._count?.submissions || 0}</span> soumission(s) via ce lien
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Créé le {new Date(link.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyLinkToClipboard(link)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            copiedLinkId === link.id
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title="Copier le lien"
                        >
                          {copiedLinkId === link.id ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copier
                            </>
                          )}
                        </button>
                        <a
                          href={`/form/${link.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Ouvrir le lien"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => toggleLinkStatus(link.id, link.isActive)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            link.isActive
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                          title={link.isActive ? 'Désactiver' : 'Réactiver'}
                        >
                          {link.isActive ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informations système */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Informations système</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version de l'application
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
              FikiriCollect v1.0.0
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dernière connexion
            </label>
            <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
              {new Date().toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;