import React, { useEffect, useState } from 'react';

export default function AdminDeletedUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setUsers(data.filter((u: any) => u.status === 'DELETED'));
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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
      <h2 className="text-2xl font-bold text-center mb-6">Utilisateurs supprimés</h2>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      {loading ? (
        <div>Chargement...</div>
      ) : users.length === 0 ? (
        <div className="text-center text-gray-500">Aucun utilisateur supprimé.</div>
      ) : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Nom</th>
              <th className="p-2">Email</th>
              <th className="p-2">Rôle</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id}>
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2"><span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">Désactivé</span></td>
                <td className="p-2">
                  <button onClick={() => handleReactivate(u.id)} className="text-green-600 underline">Réactiver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 