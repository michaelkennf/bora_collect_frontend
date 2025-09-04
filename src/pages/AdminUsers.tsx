import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

// Rôles disponibles
const roles = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CONTROLLER', label: 'Enquêteur' },
  { value: 'ANALYST', label: 'Analyste' },
];

// Options pour le sexe
const genderOptions = [
  { value: 'MALE', label: 'Masculin' },
  { value: 'FEMALE', label: 'Féminin' },
  { value: 'OTHER', label: 'Autre' },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  gender?: string;
  profilePictureUrl?: string;
  status: string;
}

const USERS_PER_PAGE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; email: string; password: string; role: string; gender: string; contact?: string }>({ name: '', email: '', password: '', role: 'CONTROLLER', gender: 'OTHER', contact: '' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('CONTROLLER');
  const [roleSaving, setRoleSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showReset, setShowReset] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Charger tous les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.collect.fikiri.co/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
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
      const payload = { ...addForm };
              const res = await fetch('https://api.collect.fikiri.co/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la création');
      }
      setShowAdd(false);
      setAddForm({ name: '', email: '', password: '', role: 'CONTROLLER', gender: 'OTHER', contact: '' });
      fetchUsers();
    } catch (err: any) {
      setAddError(err.message || 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un utilisateur
  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setLoading(true);
    try {
              const res = await fetch(`https://api.collect.fikiri.co/users/${confirmDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
      setConfirmDeleteId(null);
    }
  };

  // Modifier le rôle d'un utilisateur
  const handleEditRole = async () => {
    if (!editRoleId) return;
    setRoleSaving(true);
    try {
              const res = await fetch(`https://api.collect.fikiri.co/users/${editRoleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) throw new Error('Erreur lors de la modification du rôle');
      setEditRoleId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setRoleSaving(false);
    }
  };

  // Réinitialiser le mot de passe
  const handleResetPwd = async () => {
    if (!showReset) return;
    setResetSaving(true);
    setResetError('');
    try {
              const res = await fetch(`https://api.collect.fikiri.co/users/${showReset}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ password: resetPwd }),
      });
      if (!res.ok) throw new Error('Erreur lors de la réinitialisation');
      setShowReset(null);
      setResetPwd('');
      fetchUsers();
    } catch (err: any) {
      setResetError(err.message || 'Erreur inconnue');
    } finally {
      setResetSaving(false);
    }
  };

  // Recherche et pagination
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / USERS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  // Réactiver un utilisateur
  const handleReactivate = async (id: string) => {
    setLoading(true);
    try {
              const res = await fetch(`https://api.collect.fikiri.co/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (!res.ok) throw new Error('Erreur lors de la réactivation');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-lg mt-4 sm:mt-8 mx-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestion des utilisateurs</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base transition-colors"
        >
          + Ajouter un utilisateur
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="PENDING_APPROVAL">En attente</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          {users.length} utilisateur(s) trouvé(s)
        </div>
      </div>

      {/* Tableau responsive */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sexe</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm sm:text-base">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm sm:text-base font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm sm:text-base text-gray-900">
                  {user.gender || 'N/A'}
                </td>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user.role === 'CONTROLLER' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'ADMIN' ? 'Admin' :
                     user.role === 'CONTROLLER' ? 'Enquêteur' :
                     user.role === 'ANALYST' ? 'Analyste' : user.role}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    user.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.status === 'ACTIVE' ? 'Actif' :
                     user.status === 'INACTIVE' ? 'Inactif' :
                     user.status === 'PENDING_APPROVAL' ? 'En attente' : user.status}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm sm:text-base font-medium">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setEditRoleId(user.id)}
                      className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                    >
                      Modifier le rôle
                    </button>
                    <button
                      onClick={() => setShowReset(user.id)}
                      className="text-green-600 hover:text-green-900 text-xs sm:text-sm"
                    >
                      Réinitialiser le mot de passe
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(user.id)}
                      className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
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

      {/* Pagination responsive */}
      {users.length > USERS_PER_PAGE && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Affichage de {((page - 1) * USERS_PER_PAGE) + 1} à {Math.min(page * USERS_PER_PAGE, users.length)} sur {users.length} utilisateurs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * USERS_PER_PAGE >= users.length}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
      {/* Modal ajout utilisateur */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors">&times;</button>
            <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Ajouter un utilisateur</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Nom complet *</label>
                <input 
                  type="text" 
                  value={addForm.name} 
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  placeholder="Entrez le nom complet"
                  required 
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Adresse email *</label>
                <input 
                  type="email" 
                  value={addForm.email} 
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  placeholder="exemple@email.com"
                  required 
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Mot de passe *</label>
                <input 
                  type="password" 
                  value={addForm.password} 
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  placeholder="Minimum 6 caractères"
                  required 
                  minLength={6} 
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Rôle *</label>
                <select 
                  value={addForm.role} 
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Genre</label>
                <select 
                  value={addForm.gender} 
                  onChange={e => setAddForm(f => ({ ...f, gender: e.target.value }))} 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {genderOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2 text-gray-700">Contact (téléphone)</label>
                <input 
                  type="text" 
                  value={addForm.contact || ''} 
                  onChange={e => setAddForm(f => ({ ...f, contact: e.target.value }))} 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" 
                  placeholder="+243 123 456 789" 
                />
              </div>
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center font-medium">
                  {addError}
                </div>
              )}
              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md shadow-md transition-colors font-medium" 
                  onClick={() => setShowAdd(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={saving}
                >
                  {saving ? 'Création...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal réinitialisation mot de passe */}
      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full relative">
            <button onClick={() => setShowReset(null)} className="absolute top-2 right-2 text-gray-500 text-2xl">&times;</button>
            <h3 className="text-xl font-bold mb-4">Réinitialiser le mot de passe</h3>
            <div className="mb-4">Saisissez le nouveau mot de passe pour cet utilisateur.</div>
            <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} className="w-full border rounded p-2 mb-2" minLength={6} placeholder="Nouveau mot de passe" />
            {resetError && <div className="text-red-600 text-center mb-2">{resetError}</div>}
            <button onClick={handleResetPwd} className="bg-blue-600 text-white px-4 py-2 rounded shadow w-full" disabled={resetSaving || resetPwd.length < 6}>{resetSaving ? 'Réinitialisation...' : 'Réinitialiser'}</button>
          </div>
        </div>
      )}
      {/* Modal confirmation suppression */}
      <ConfirmModal
        show={!!confirmDeleteId}
        message="Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
} 
