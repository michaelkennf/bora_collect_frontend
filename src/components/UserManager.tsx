import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import { environment } from '../config/environment';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CONTROLLER' | 'ANALYST';
  contact?: string;
  status: string;
  createdAt: string;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'CONTROLLER' | 'ANALYST';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  contact: string;
}

interface UserManagerProps {
  onUserAdded: () => void;
}

export default function UserManager({ onUserAdded }: UserManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    role: 'CONTROLLER',
    gender: 'OTHER',
    contact: '',
  });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  const roles = [
    { value: 'CONTROLLER', label: 'Enquêteur', color: 'bg-blue-100 text-blue-800' },
    { value: 'ANALYST', label: 'Analyste', color: 'bg-purple-100 text-purple-800' },
    { value: 'ADMIN', label: 'Administrateur', color: 'bg-red-100 text-red-800' },
  ];

  // Charger les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${environment.apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Ajouter un utilisateur
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setSaving(true);
    try {
      const res = await fetch(`${environment.apiBaseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la création');
      }
      setShowAdd(false);
      setNewUser({ name: '', email: '', password: '', role: 'CONTROLLER', gender: 'OTHER', contact: '' });
      fetchUsers();
      onUserAdded();
    } catch (err: any) {
      setAddError(err.message || 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const updateUserStatus = async (userId: string, status: User['status']) => {
    try {
      const response = await fetch(`${environment.apiBaseUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Ajouter un utilisateur
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Tous les rôles</option>
          {roles.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-semibold text-sm">
                              {user.name[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        roles.find(r => r.value === user.role)?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {roles.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        user.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'ACTIVE' ? 'Actif' :
                         user.status === 'INACTIVE' ? 'Inactif' : 'Supprimé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.contact || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setConfirmDeleteUser(user);
                            setConfirmDelete(user.id);
                          }}
                          className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de création d'utilisateur */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Créer un nouvel utilisateur</h3>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="CONTROLLER">Enquêteur</option>
                  <option value="ANALYST">Analyste</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                <select
                  value={newUser.gender}
                  onChange={(e) => setNewUser({ ...newUser, gender: e.target.value as any })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="OTHER">Autre</option>
                  <option value="MALE">Masculin</option>
                  <option value="FEMALE">Féminin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact (téléphone)</label>
                <input
                  type="text"
                  value={newUser.contact}
                  onChange={(e) => setNewUser({ ...newUser, contact: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="+243812345678"
                />
              </div>

              {addError && (
                <div className="text-red-600 text-sm">{addError}</div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {confirmDeleteUser && (
        <ConfirmModal
          show={!!confirmDelete}
          onCancel={() => {
            setConfirmDelete(null);
            setConfirmDeleteUser(null);
          }}
          onConfirm={async () => {
            if (confirmDeleteUser) {
              await updateUserStatus(confirmDeleteUser.id, 'DELETED');
              setConfirmDelete(null);
              setConfirmDeleteUser(null);
            }
          }}
          message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${confirmDeleteUser?.name}" ?`}
          confirmText="Supprimer"
          cancelText="Annuler"
        />
      )}
    </div>
  );
} 
