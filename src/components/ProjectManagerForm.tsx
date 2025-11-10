import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { environment } from '../config/environment';
import { ODD_DATA } from '../data/oddData';

// Provinces de la RDC
const PROVINCES = [
  'BAS_UELE', 'EQUATEUR', 'HAUT_KATANGA', 'HAUT_LOMAMI', 'HAUT_UELE',
  'ITURI', 'KASAI', 'KASAI_CENTRAL', 'KASAI_ORIENTAL', 'KINSHASA',
  'KONGO_CENTRAL', 'KWANGO', 'KWILU', 'LOMAMI', 'LUALABA',
  'MAI_NDOMBE', 'MANIEMA', 'MONGALA', 'NORD_KIVU', 'NORD_UBANGI',
  'SANKURU', 'SUD_KIVU', 'SUD_UBANGI', 'TANGANYIKA', 'TSHOPO', 'TSHUAPA'
];

interface ProjectManagerFormProps {
  isAdmin?: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
}

const ProjectManagerForm: React.FC<ProjectManagerFormProps> = ({ 
  isAdmin = false, 
  onBack, 
  onSuccess 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact: '',
    whatsapp: '',
    organization: '',
    campaignDescription: '',
    targetProvinces: [] as string[],
    selectedODD: null as number | null
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleODDSelection = (oddId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedODD: prev.selectedODD === oddId ? null : oddId
    }));
  };

  const handleProvinceSelection = (province: string) => {
    setFormData(prev => {
      let newProvinces = [...prev.targetProvinces];
      
      if (province === 'ALL') {
        // Si "Toutes les provinces" est sélectionné, sélectionner toutes les provinces
        newProvinces = PROVINCES;
      } else {
        // Toggle de la province sélectionnée
        if (newProvinces.includes(province)) {
          newProvinces = newProvinces.filter(p => p !== province);
        } else {
          newProvinces.push(province);
        }
        
        // Si toutes les provinces sont sélectionnées individuellement, les remplacer par "ALL"
        if (newProvinces.length === PROVINCES.length) {
          newProvinces = PROVINCES;
        }
      }
      
      return {
        ...prev,
        targetProvinces: newProvinces
      };
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Le nom complet est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'adresse email est requise');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!formData.organization.trim()) {
      setError('L\'organisation est requise');
      return false;
    }
    if (!formData.campaignDescription.trim()) {
      setError('La description de la campagne est requise');
      return false;
    }
    if (formData.targetProvinces.length === 0) {
      setError('Veuillez sélectionner au moins une province');
      return false;
    }
    if (!formData.selectedODD) {
      setError('Veuillez sélectionner au moins un ODD concerné');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${environment.apiBaseUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'PROJECT_MANAGER', // Project Manager role
          contact: formData.contact || undefined,
          whatsapp: formData.whatsapp || undefined,
          organization: formData.organization,
          campaignDescription: formData.campaignDescription,
          targetProvinces: formData.targetProvinces,
          selectedODD: formData.selectedODD
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isAdmin) {
          alert('Project Manager créé avec succès !');
        } else {
          // Rediriger vers la page de succès avec l'email
          navigate('/account-created', { 
            state: { email: formData.email } 
          });
          return; // Sortir de la fonction pour éviter la réinitialisation
        }
        
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          contact: '',
          whatsapp: '',
          organization: '',
          campaignDescription: '',
          targetProvinces: [],
          selectedODD: null
        });

        // Appeler le callback de succès
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white shadow-xl rounded-lg p-8">
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">Retour</span>
            </button>
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Créer un Project Manager' : 'Inscription Project Manager'}
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom complet *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                  Numéro de téléphone
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Entrez le numéro de téléphone"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                  Numéro WhatsApp
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="Entrez le numéro WhatsApp"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Informations organisationnelles */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations organisationnelles</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                  Organisation *
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  required
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="Nom de l'organisation ou institution"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="campaignDescription" className="block text-sm font-medium text-gray-700">
                  Description de la campagne *
                </label>
                <textarea
                  id="campaignDescription"
                  name="campaignDescription"
                  required
                  rows={4}
                  value={formData.campaignDescription}
                  onChange={handleInputChange}
                  placeholder="Décrivez la campagne d'enquête, ses objectifs et sa portée"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Informations géographiques */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Portée géographique</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provinces ciblées *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Sélectionnez une ou plusieurs provinces pour la campagne
                </p>
                
                {/* Option "Toutes les provinces" */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetProvinces.length === PROVINCES.length}
                      onChange={() => handleProvinceSelection('ALL')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Toutes les provinces
                    </span>
                  </label>
                </div>
                
                {/* Liste des provinces */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {PROVINCES.map(province => (
                    <label key={province} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.targetProvinces.includes(province)}
                        onChange={() => handleProvinceSelection(province)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {province.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
                
                {/* Affichage des provinces sélectionnées */}
                {formData.targetProvinces.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Provinces sélectionnées ({formData.targetProvinces.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {formData.targetProvinces.map(province => (
                        <span
                          key={province}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {province.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sélection des ODD */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">ODD concerné(s) *</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez l'Objectif de Développement Durable concerné par la campagne
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ODD_DATA.map(odd => (
                <div
                  key={odd.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.selectedODD === odd.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleODDSelection(odd.id)}
                  style={{
                    borderColor: formData.selectedODD === odd.id ? odd.color : undefined,
                    backgroundColor: formData.selectedODD === odd.id ? `${odd.color}20` : undefined
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: odd.color }}
                    >
                      {odd.id}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        ODD {odd.id}: {odd.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {odd.description.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                  {formData.selectedODD === odd.id && (
                    <div className="mt-2 text-xs font-medium flex items-center">
                      <span className="text-green-600 mr-1">✓</span>
                      <span style={{ color: odd.color }}>Sélectionné</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (isAdmin ? 'Création en cours...' : 'Inscription en cours...') 
                : (isAdmin ? 'Créer le Project Manager' : 'S\'inscrire')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectManagerForm;