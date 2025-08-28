import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo2 from '../assets/images/logo2.jpg';
import AdminDashboardCharts from '../components/AdminDashboardCharts';
import AdminUsers from './AdminUsers';
import FormBuilder from '../components/FormBuilder';
import AdminParametres from './AdminParametres';
import AdminDeletedUsers from './AdminDeletedUsers';
import AdminPendingApprovals from './AdminPendingApprovals';
import AdminSurveyPublication from './AdminSurveyPublication';
import AdminCandidatures from './AdminCandidatures';
import AdminSettings from '../components/AdminSettings';
import AdminStatistics from '../components/AdminStatistics';
import PNUDFooter from '../components/PNUDFooter';

export function DashboardAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    usersByRole: {
      admin: 0,
      controller: 0,
      supervisor: 0,
      analyst: 0,
    }
  });

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
      
      // Calculer les statistiques des utilisateurs
      setUserStats({
        totalUsers: data.length,
        activeUsers: data.filter((u: any) => u.status === 'ACTIVE').length,
        pendingApprovals: 0, // Sera mis à jour avec les vraies données
        usersByRole: {
          admin: data.filter((u: any) => u.role === 'ADMIN' && u.status === 'ACTIVE').length,
          controller: data.filter((u: any) => u.role === 'CONTROLLER' && u.status === 'ACTIVE').length,
          supervisor: 0, // Rôle SUPERVISOR supprimé
          analyst: data.filter((u: any) => u.role === 'ANALYST' && u.status === 'ACTIVE').length,
        }
      });
    } catch (err: any) {
      console.error('Erreur:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Charger les demandes d'approbation en attente
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/users/approval-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserStats(prev => ({
            ...prev,
            pendingApprovals: data.pending || 0
          }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des demandes d\'approbation:', error);
      }
    };

    fetchPendingApprovals();
  }, []);

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center px-4">Tableau de bord Admin - FikiriCollect</h1>
      
      {/* Statistiques utilisateurs - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{userStats.totalUsers}</div>
          <div className="text-sm sm:text-base text-gray-600">Total des utilisateurs</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{userStats.activeUsers}</div>
          <div className="text-sm sm:text-base text-gray-600">Utilisateurs actifs</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center sm:col-span-2 lg:col-span-1">
          <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">{userStats.pendingApprovals}</div>
          <div className="text-sm sm:text-base text-gray-600">Demandes d'inscription en attente</div>
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
      
      {/* Section d'accueil responsive */}
      <div className="max-w-4xl mx-auto bg-blue-50 rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8 mx-4">
        <p className="text-base sm:text-lg text-gray-800 mb-4 text-center">Bienvenue sur le tableau de bord administrateur de FikiriCollect.<br/>Ici, vous pouvez&nbsp;:</p>
        <ul className="list-disc ml-4 sm:ml-8 text-sm sm:text-base text-gray-700 mb-4 space-y-1">
          <li>Gérer les utilisateurs du système</li>
          <li>Consulter les statistiques globales</li>
          <li>Exporter les données et rapports</li>
          <li>Configurer les paramètres du système</li>
        </ul>
      </div>
    </>
  );
}

export default function AdminHome() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'utilisateurs', 'formulaires', 'statistiques', 'parametres'

  // Fonction pour charger les utilisateurs
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Erreur:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchUsers();
  }, []);

  useEffect(() => {
    const handler = () => {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    };
    window.addEventListener('userProfileUpdated', handler);
    return () => window.removeEventListener('userProfileUpdated', handler);
  }, []);

  // Fermer le menu mobile lors du changement de vue
  const handleViewChange = (newView: string) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation responsive */}
      <nav className="bg-blue-900 text-white p-4">
        <div className="flex justify-between items-center">
          {/* Logo et titre */}
        <div className="flex items-center gap-2 min-w-0">
            <img src={logo2} alt="Logo 2" className="h-10 sm:h-12 w-auto object-contain bg-white rounded shadow" />
            <span className="font-bold text-base sm:text-lg ml-2 truncate" style={{maxWidth: 120}}>Admin</span>
        </div>
          
          {/* Bouton menu mobile */}
          <button 
            className="md:hidden p-2 rounded hover:bg-blue-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-1 flex-shrink min-w-0">
          <button 
              onClick={() => handleViewChange('dashboard')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'dashboard' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
          >
            Dashboard
          </button>
          <button 
              onClick={() => handleViewChange('utilisateurs')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'utilisateurs' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
          >
            Utilisateurs
          </button>
          <button 
              onClick={() => handleViewChange('formulaires')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'formulaires' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
          >
              Gestion de formulaires
          </button>
          <button 
              onClick={() => handleViewChange('statistiques')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'statistiques' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
          >
            Statistiques
          </button>
          <button 
              onClick={() => handleViewChange('candidatures')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'candidatures' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
          >
              Candidatures
          </button>
          <button 
              onClick={() => handleViewChange('pending-approvals')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'pending-approvals' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
          >
            Demandes d'inscription
          </button>
          <button 
              onClick={() => handleViewChange('survey-publication')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'survey-publication' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
          >
            Publication d'enquêtes
          </button>
          <button 
              onClick={() => handleViewChange('parametres')} 
              className={`px-2 py-2 rounded font-semibold text-xs ${view === 'parametres' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white`}
            >
              Paramètres
            </button>
            
            {/* Profil utilisateur et déconnexion */}
            <div className="flex items-center gap-2 ml-2">
              {user && (
                <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }} 
                className="bg-white text-blue-900 px-3 py-1 rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 border-t border-blue-800 pt-4">
            <button 
              onClick={() => handleViewChange('dashboard')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleViewChange('utilisateurs')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'utilisateurs' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
            >
              Utilisateurs
            </button>
            <button 
              onClick={() => handleViewChange('formulaires')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'formulaires' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
            >
              Gestion de formulaires
            </button>
            <button 
              onClick={() => handleViewChange('statistiques')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'statistiques' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
            >
              Statistiques
            </button>
            <button 
              onClick={() => handleViewChange('candidatures')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'candidatures' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
          >
            Candidatures
          </button>
            <button 
              onClick={() => handleViewChange('pending-approvals')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'pending-approvals' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
            >
              Demandes d'inscription
            </button>
            <button 
              onClick={() => handleViewChange('survey-publication')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'survey-publication' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
            >
              Publication d'enquêtes
            </button>
            <button 
              onClick={() => handleViewChange('parametres')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'parametres' ? 'bg-blue-700' : 'hover:bg-blue-800'} text-white`}
            >
              Paramètres
            </button>
            
            {/* Profil et déconnexion mobile */}
            <div className="flex items-center justify-between pt-2 border-t border-blue-800">
          {user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold">
              {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm">{user.name || 'Utilisateur'}</span>
            </div>
          )}
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }} 
                className="bg-white text-blue-900 px-3 py-1 rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Déconnexion
              </button>
            </div>
        </div>
        )}
      </nav>
      
      {/* Contenu principal */}
      <main className="p-4 sm:p-8">
        {view === 'dashboard' && <DashboardAdmin />}
        {view === 'utilisateurs' && <AdminUsers />}
        {view === 'formulaires' && <FormBuilder />}
        {view === 'statistiques' && <AdminDashboardCharts users={users} />}
        {view === 'parametres' && <AdminParametres />}
        {view === 'pending-approvals' && <AdminPendingApprovals />}
        {view === 'survey-publication' && <AdminSurveyPublication />}
        {view === 'candidatures' && <AdminCandidatures />}
      </main>
      
      <PNUDFooter />
    </div>
  );
} 