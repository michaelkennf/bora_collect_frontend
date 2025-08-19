import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo2 from '../assets/images/logo2.jpg';
import AdminDashboardCharts from '../components/AdminDashboardCharts';
import FormBuilder from '../components/FormBuilder';
import UserManager from '../components/UserManager';
import AdminSettings from '../components/AdminSettings';
import SystemMaintenance from '../components/SystemMaintenance';
import AdminStatistics from '../components/AdminStatistics';

export function DashboardAdmin() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    const handler = () => {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    };
    window.addEventListener('userProfileUpdated', handler);
    return () => window.removeEventListener('userProfileUpdated', handler);
  }, []);

  // Récupérer la liste des utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Erreur:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calculer les statistiques des utilisateurs
  const userStats = {
    totalUsers: users.length,
    activeUsers: users.filter((u: any) => u.status !== 'DELETED').length,
    deletedUsers: users.filter((u: any) => u.status === 'DELETED').length,
    usersByRole: {
      admin: users.filter((u: any) => u.role === 'ADMIN').length,
      controller: users.filter((u: any) => u.role === 'CONTROLLER').length,
      supervisor: 0, // Rôle SUPERVISOR supprimé
      analyst: users.filter((u: any) => u.role === 'ANALYST').length,
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-center">Tableau de bord Admin - BoraCollect</h1>
      {/* Statistiques utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{userStats.totalUsers}</div>
          <div className="text-gray-600">Utilisateurs enregistrés</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{userStats.activeUsers}</div>
          <div className="text-gray-600">Utilisateurs actifs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">{userStats.deletedUsers}</div>
          <div className="text-gray-600">Utilisateurs supprimés</div>
        </div>
      </div>
      {/* Graphiques */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      ) : (
        <AdminDashboardCharts users={users} />
      )}
      <div className="max-w-4xl mx-auto bg-blue-50 rounded-xl shadow p-6 mb-8">
        <p className="text-lg text-gray-800 mb-4 text-center">Bienvenue sur le tableau de bord administrateur de BoraCollect.<br/>Ici, vous pouvez&nbsp;:</p>
        <ul className="list-disc ml-8 text-gray-700 mb-4">
          <li>Gérer les utilisateurs et leurs permissions</li>
          <li>Créer et personnaliser des formulaires</li>
          <li>Consulter les statistiques détaillées du système</li>
          <li>Configurer les paramètres du système</li>
          <li>Effectuer la maintenance du système</li>
        </ul>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'utilisateurs', 'formulaires', 'statistiques', 'parametres', 'maintenance'

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    };
    window.addEventListener('userProfileUpdated', handler);
    return () => window.removeEventListener('userProfileUpdated', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo2} alt="Logo 2" className="h-12 w-auto object-contain bg-white rounded shadow" />
          <span className="font-bold text-lg ml-2 truncate" style={{maxWidth: 120}}>Admin</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink min-w-0">
          <button onClick={() => setView('dashboard')} className={`px-3 py-2 rounded font-semibold ${view === 'dashboard' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}>Dashboard</button>
          <button onClick={() => setView('utilisateurs')} className={`px-3 py-2 rounded font-semibold ${view === 'utilisateurs' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}>Utilisateurs</button>
          <button onClick={() => setView('formulaires')} className={`px-3 py-2 rounded font-semibold text-white text-sm ${view === 'formulaires' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'}`} style={{ minWidth: 180 }}>Formulaires</button>
          <button onClick={() => setView('statistiques')} className={`px-3 py-2 rounded font-semibold ${view === 'statistiques' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}>Statistiques</button>
          <button onClick={() => setView('parametres')} className={`px-3 py-2 rounded font-semibold ${view === 'parametres' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}>Paramètres</button>
          <button onClick={() => setView('maintenance')} className={`px-3 py-2 rounded font-semibold ${view === 'maintenance' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}>Maintenance</button>
          {user && (
            <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold ml-2">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="ml-2 bg-white text-blue-900 px-3 py-1 rounded font-semibold text-sm">Déconnexion</button>
        </div>
      </nav>
      <main className="p-8">
        {view === 'dashboard' && <DashboardAdmin />}
        {view === 'utilisateurs' && <UserManager onUserAdded={() => {}} />}
        {view === 'formulaires' && <FormBuilder />}
        {view === 'statistiques' && <AdminStatistics />}
        {view === 'parametres' && <AdminSettings />}
        {view === 'maintenance' && <SystemMaintenance />}
      </main>
    </div>
  );
} 