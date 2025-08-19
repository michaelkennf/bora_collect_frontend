import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  contact?: string;
  status: string;
  createdAt: string;
}

export default function AdminSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
  });

  // Charger les informations de l'utilisateur connecté
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUser(user);
          setFormData({
            name: user.name || '',
            email: user.email || '',
            contact: user.contact || '',
          });
        }
      } catch (err) {
        setError('Erreur lors du chargement des données utilisateur');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Mettre à jour le profil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch(`http://localhost:3000/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Profil mis à jour avec succès !');
        // Mettre à jour les données locales
        const updatedUser = { ...user!, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Émettre un événement pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Utilisateur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Paramètres du Profil</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-medium mb-2">Nom complet</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Contact (téléphone)</label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+243812345678"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm p-3 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm p-3 bg-green-50 rounded border border-green-200">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? 'Mise à jour...' : 'Mettre à jour le profil'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">Informations du compte</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Rôle :</strong> {user.role}</p>
          <p><strong>Statut :</strong> {user.status}</p>
          <p><strong>Membre depuis :</strong> {new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
} 