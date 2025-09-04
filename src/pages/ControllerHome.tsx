import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo2 from '../assets/images/logo2.jpg';
import ControllerDashboardCharts from '../components/ControllerDashboardCharts';
import SchoolForm from './SchoolForm';
import RecordsList from './RecordsList';
import ControllerAvailableSurveys from './ControllerAvailableSurveys';
import Settings from './Settings';
import PNUDFooter from '../components/PNUDFooter';

export function DashboardController({ setView }: { setView: (view: string) => void }) {
  const [user, setUser] = useState<any>(null);
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const navigate = useNavigate();

  // Fonction pour récupérer les statistiques personnelles
  const fetchPersonalStats = async () => {
    setStatsLoading(true);
    try {
      // Récupérer les vraies statistiques depuis l'API
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      // Forcer la récupération des vraies données sans cache
      const res = await fetch('https://api.collect.fikiri.co/records/controller', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const records = await res.json();
      
      // Vérifier que les données sont bien un tableau
      if (!Array.isArray(records)) {
        console.error('❌ Les données reçues ne sont pas un tableau:', records);
        throw new Error('Format de données invalide');
      }
      
      // Calculer les vraies statistiques - tous les enregistrements sont synchronisés
      const totalRecords = records.length;
      
      console.log(`📊 Données récupérées de l'API: ${totalRecords} enregistrements`);
      console.log('📋 Contenu des enregistrements:', records);
      
      setPersonalStats({
        totalRecords,
        syncedRecords: totalRecords, // Tous sont synchronisés
      });
      
      // Stocker les enquêtes pour l'affichage
      setRecords(records);
      
    } catch (err: any) {
      console.error('❌ Erreur lors de la récupération des données:', err.message);
      // En cas d'erreur, utiliser des données par défaut
      setPersonalStats({
        totalRecords: 0,
        syncedRecords: 0,
      });
      setRecords([]);
    } finally {
      setStatsLoading(false);
    }
  };

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

  useEffect(() => {
    if (user) {
      fetchPersonalStats();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec informations utilisateur */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Bienvenue, {user.name || 'Enquêteur'} !
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Interface de contrôle et de collecte de données
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {user.name?.[0]?.toUpperCase() || 'E'}
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">{user.name || 'Enquêteur'}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques personnelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
            {statsLoading ? '...' : personalStats?.totalRecords || 0}
          </div>
          <div className="text-sm sm:text-base text-gray-600">Total des enquêtes</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
            {statsLoading ? '...' : personalStats?.syncedRecords || 0}
          </div>
          <div className="text-sm sm:text-base text-gray-600">Enquêtes synchronisées</div>
        </div>
      </div>

      {/* Graphiques */}
      {!statsLoading && personalStats && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Statistiques personnelles</h3>
          <ControllerDashboardCharts personalStats={personalStats} />
        </div>
      )}

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setView('formulaire')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-semibold">Nouvelle enquête</div>
            <div className="text-sm opacity-90">Créer un formulaire</div>
          </button>
          <button
            onClick={() => setView('enquetes')}
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Mes enquêtes</div>
            <div className="text-sm opacity-90">Voir mes données</div>
          </button>
          <button
            onClick={() => setView('surveys')}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-semibold">Enquêtes disponibles</div>
            <div className="text-sm opacity-90">Postuler aux enquêtes</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ControllerHome() {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'formulaire', 'enquetes', 'surveys', 'parametres'

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

  // Fermer le menu mobile lors du changement de vue
  const handleViewChange = (newView: string) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement de l'utilisateur...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation responsive */}
      <nav className="bg-blue-800 text-white p-4">
        <div className="flex justify-between items-center">
          {/* Logo et titre */}
          <div className="flex items-center gap-2 min-w-0">
            <img src={logo2} alt="Logo 2" className="h-10 sm:h-12 w-auto object-contain bg-white rounded shadow" />
            <span className="font-bold text-base sm:text-lg ml-2 truncate" style={{maxWidth: 120}}>Enquêteur</span>
          </div>
          
          {/* Bouton menu mobile */}
          <button 
            className="md:hidden p-2 rounded hover:bg-blue-700 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => handleViewChange('dashboard')} 
              className={`px-3 py-2 rounded font-semibold text-sm ${view === 'dashboard' ? 'bg-blue-700 shadow' : 'hover:bg-blue-700'} text-white transition-colors`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleViewChange('formulaire')} 
              className={`px-3 py-2 rounded font-semibold text-sm ${view === 'formulaire' ? 'bg-blue-700 shadow' : 'hover:bg-blue-700'} text-white transition-colors`}
            >
              Nouvelle enquête
            </button>
            <button 
              onClick={() => handleViewChange('enquetes')} 
              className={`px-3 py-2 rounded font-semibold text-sm ${view === 'enquetes' ? 'bg-blue-700 shadow' : 'hover:bg-blue-700'} text-white transition-colors`}
            >
              Mes enquêtes
            </button>
            <button 
              onClick={() => handleViewChange('surveys')} 
              className={`px-3 py-2 rounded font-semibold text-sm ${view === 'surveys' ? 'bg-blue-700 shadow' : 'hover:bg-blue-700'} text-white transition-colors`}
            >
              Enquêtes disponibles
            </button>
            <button 
              onClick={() => handleViewChange('parametres')} 
              className={`px-3 py-2 rounded font-semibold text-sm ${view === 'parametres' ? 'bg-blue-700 shadow' : 'hover:bg-blue-700'} text-white transition-colors`}
            >
              Paramètres
            </button>
            
            {/* Profil utilisateur et déconnexion */}
            <div className="flex items-center gap-2 ml-2">
              {user && (
                <div className="w-8 h-8 rounded-full bg-white text-blue-800 flex items-center justify-center font-bold">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }} 
                className="bg-white text-blue-800 px-3 py-1 rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 border-t border-blue-700 pt-4">
            <button 
              onClick={() => handleViewChange('dashboard')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-700'} text-white`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleViewChange('formulaire')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'formulaire' ? 'bg-blue-700' : 'hover:bg-blue-700'} text-white`}
            >
              Nouvelle enquête
            </button>
            <button 
              onClick={() => handleViewChange('enquetes')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'enquetes' ? 'bg-blue-700' : 'hover:bg-blue-700'} text-white`}
            >
              Mes enquêtes
            </button>
            <button 
              onClick={() => handleViewChange('surveys')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'surveys' ? 'bg-blue-700' : 'hover:bg-blue-700'} text-white`}
            >
              Enquêtes disponibles
            </button>
            <button 
              onClick={() => handleViewChange('parametres')} 
              className={`w-full text-left px-3 py-2 rounded font-semibold text-sm ${view === 'parametres' ? 'bg-blue-700' : 'hover:bg-blue-700'} text-white`}
            >
              Paramètres
            </button>
            
            {/* Profil et déconnexion mobile */}
            <div className="flex items-center justify-between pt-2 border-t border-blue-700">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white text-blue-800 flex items-center justify-center font-bold">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm">{user.name || 'Enquêteur'}</span>
                </div>
              )}
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }} 
                className="bg-white text-blue-800 px-3 py-1 rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* Contenu principal */}
      <main className="p-4 sm:p-8">
        {view === 'dashboard' && <DashboardController setView={setView} />}
        {view === 'formulaire' && <SchoolForm />}
        {view === 'enquetes' && <RecordsList />}
        {view === 'surveys' && <ControllerAvailableSurveys />}
        {view === 'parametres' && <Settings />}
      </main>
      
      <PNUDFooter />
    </div>
  );
} 
