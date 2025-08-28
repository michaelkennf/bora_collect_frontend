import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, Save, X } from 'lucide-react';
import PNUDFooter from '../components/PNUDFooter';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SettingsForm {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<SettingsForm>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      setForm(prev => ({
        ...prev,
        name: userObj.name || '',
        email: userObj.email || ''
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Le nom est requis' });
      return false;
    }

    if (!form.email.trim()) {
      setMessage({ type: 'error', text: 'L\'email est requis' });
      return false;
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return false;
    }

    if (form.newPassword && form.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Token d\'authentification manquant' });
        return;
      }

      const updateData: any = {
        name: form.name.trim(),
        email: form.email.trim()
      };

      // Ajouter le changement de mot de passe si fourni
      if (form.newPassword && form.currentPassword) {
        updateData.currentPassword = form.currentPassword;
        updateData.newPassword = form.newPassword;
      }

                    const response = await fetch(`https://api.collect.fikiri.co/users/me`, {
         method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Mettre à jour le localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setMessage({ 
          type: 'success', 
          text: 'Profil mis à jour avec succès !' 
        });

        // Réinitialiser les champs de mot de passe
        setForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await response.json();
        setMessage({ 
          type: 'error', 
          text: error.message || 'Erreur lors de la mise à jour du profil' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Erreur de connexion au serveur' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Revenir aux valeurs originales
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }
    setMessage(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-lg mt-4 sm:mt-8 mx-4">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Paramètres du compte</h2>
      
      {/* Infos principales */}
      <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
        <h3 className="text-base sm:text-lg font-bold mb-2">Informations personnelles</h3>
        <div>
          <label className="block font-semibold mb-1 text-sm sm:text-base">Nom</label>
          <input 
            type="text" 
            value={form.name} 
            onChange={handleInputChange} 
            className="w-full border rounded p-2 text-sm sm:text-base" 
            required 
          />
        </div>
        <div>
          <label className="block font-semibold mb-1 text-sm sm:text-base">Email</label>
          <input 
            type="email" 
            value={form.email} 
            onChange={handleInputChange} 
            className="w-full border rounded p-2 text-sm sm:text-base" 
            required 
          />
        </div>
        {message && (
          <div className={`text-center text-sm sm:text-base ${
            message.type === 'success' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {message.text}
          </div>
        )}
        <button 
          type="submit" 
          className="bg-blue-900 text-white px-4 py-2 rounded shadow self-end text-sm sm:text-base hover:bg-blue-800 transition-colors" 
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
      
      {/* Mot de passe */}
      <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
        <h3 className="text-base sm:text-lg font-bold mb-2">Changer le mot de passe</h3>
        <div>
          <label className="block font-semibold mb-1 text-sm sm:text-base">Mot de passe actuel</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleInputChange}
              className="w-full border rounded p-2 text-sm sm:text-base pr-10"
              placeholder="Laissez vide si pas de changement"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1 text-sm sm:text-base">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={form.newPassword}
              onChange={handleInputChange}
              className="w-full border rounded p-2 text-sm sm:text-base pr-10"
              placeholder="Laissez vide si pas de changement"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1 text-sm sm:text-base">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleInputChange}
            className="w-full border rounded p-2 text-sm sm:text-base"
            placeholder="Confirmez le nouveau mot de passe"
          />
        </div>
        {message && (
          <div className={`text-center text-sm sm:text-base ${
            message.type === 'success' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {message.text}
          </div>
        )}
        <button 
          type="submit" 
          className="bg-blue-900 text-white px-4 py-2 rounded shadow self-end text-sm sm:text-base hover:bg-blue-800 transition-colors" 
          disabled={loading}
        >
          {loading ? 'Changement...' : 'Changer'}
        </button>
      </form>
      
      {/* Photo de profil */}
      <form className="flex flex-col gap-3 sm:gap-4">
        <h3 className="text-base sm:text-lg font-bold mb-2">Photo de profil</h3>
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold mx-auto border-2 border-blue-200" style={{ fontSize: '2rem' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      </form>
      
      <PNUDFooter />
    </div>
  );
}

