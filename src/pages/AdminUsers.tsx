import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

// Rôles disponibles
const roles = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CONTROLLER', label: 'Contrôleur' },
  { value: 'ANALYST', label: 'Analyste' },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  status: string;
}

const USERS_PER_PAGE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; email: string; password: string; role: string; contact?: string }>({ name: '', email: '', password: '', role: 'CONTROLLER', contact: '' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('CONTROLLER');
  const [roleSaving, setRoleSaving] = useState(false);
  const [search, setSearch] = useState('');
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
      const res = await fetch('http://localhost:3000/users', {
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
      const res = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de la création');
      }
      setShowAdd(false);
      setAddForm({ name: '', email: '', password: '', role: 'CONTROLLER', contact: '' });
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
      const res = await fetch(`http://localhost:3000/users/${confirmDeleteId}`, {
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
      const res = await fetch(`http://localhost:3000/users/${editRoleId}`, {
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
      const res = await fetch(`http://localhost:3000/users/${showReset}`, {
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
      const res = await fetch(`http://localhost:3000/users/${id}`, {
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
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
        <Link to="/admin/deleted-users" className="text-sm text-red-600 underline">Voir les utilisateurs supprimés</Link>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border rounded p-2 w-full md:w-1/3"
        />
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow self-end">+ Ajouter un utilisateur</button>
      </div>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <>
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Avatar</th>
              <th className="p-2">Nom</th>
              <th className="p-2">Email</th>
              <th className="p-2">Rôle</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(u => (
              <tr key={u.id}>
                <td className="p-2 text-center">
                  {u.profilePictureUrl ? (
                    <img 
                      src={u.profilePictureUrl} 
                      alt="avatar" 
                      className="w-8 h-8 rounded-full object-cover mx-auto" 
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.avatar-fallback')?.classList.remove('hidden'); }}
                    />
                  ) : null}
                  {/* Fallback avatar (initiale) */}
                  <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold mx-auto avatar-fallback" style={{ display: u.profilePictureUrl ? 'none' : undefined }}>
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                </td>
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  {editRoleId === u.id ? (
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="border rounded p-1">
                      {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  ) : (
                    u.role
                  )}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.status === 'ACTIVE' ? 'Activé' : 'Désactivé'}</span>
                </td>
                <td className="p-2 flex gap-2 flex-wrap">
                  {editRoleId === u.id ? (
                    <>
                      <button onClick={handleEditRole} className="bg-green-600 text-white px-2 py-1 rounded" disabled={roleSaving}>Valider</button>
                      <button onClick={() => setEditRoleId(null)} className="bg-gray-300 px-2 py-1 rounded">Annuler</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditRoleId(u.id); setEditRole(u.role); }} className="text-blue-600 underline">Modifier rôle</button>
                      <button onClick={() => setShowReset(u.id)} className="text-yellow-600 underline">Réinitialiser mot de passe</button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-600 underline">Supprimer</button>
                      {u.status === 'DELETED' && (
                        <button onClick={() => handleReactivate(u.id)} className="text-green-600 underline">Réactiver</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Préc.</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Suiv.</button>
          </div>
        )}
        </>
      )}
      {/* Modal ajout utilisateur */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-2 right-2 text-gray-500 text-2xl">&times;</button>
            <h3 className="text-xl font-bold mb-4">Ajouter un utilisateur</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div>
                <label className="block font-semibold mb-1">Nom</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded p-2" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded p-2" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mot de passe</label>
                <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} className="w-full border rounded p-2" required minLength={6} />
              </div>
              <div>
                <label className="block font-semibold mb-1">Rôle</label>
                <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="w-full border rounded p-2">
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Contact (téléphone)</label>
                <input type="text" value={addForm.contact || ''} onChange={e => setAddForm(f => ({ ...f, contact: e.target.value }))} className="w-full border rounded p-2" placeholder="Numéro de téléphone" />
              </div>
              {addError && <div className="text-red-600 text-center">{addError}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded shadow" onClick={() => setShowAdd(false)}>Fermer</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow" disabled={saving}>{saving ? 'Création...' : 'Créer'}</button>
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