import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo2 from '../assets/images/logo2.jpg';
import ControllerDashboardCharts from '../components/ControllerDashboardCharts';
import SchoolForm from './SchoolForm';
import RecordsList from './RecordsList';

export function DashboardController() {
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
      const res = await fetch('http://localhost:3000/records', {
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

  // Fonction de débogage pour vérifier l'état des données
  const debugDataState = () => {
    console.log('🔍 ÉTAT ACTUEL DES DONNÉES:');
    console.log('  - personalStats:', personalStats);
    console.log('  - records:', records);
    console.log('  - statsLoading:', statsLoading);
    console.log('  - user:', user);
  };

  // Fonction pour forcer la récupération des données après soumission
  const refreshData = async () => {
    console.log('🔄 Actualisation des données...');
    await fetchPersonalStats();
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-6">Tableau de bord Contrôleur - BoraCollect</h1>
        
        {/* Informations utilisateur */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Bienvenue, {user.name} !</h2>
              <p className="text-blue-700">Rôle: Contrôleur - Enregistrement des enquêtes</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Dernière connexion: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        {/* Statistiques personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {personalStats?.totalRecords || 0}
            </div>
            <div className="text-gray-600">Total des enquêtes</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {personalStats?.syncedRecords || 0}
            </div>
            <div className="text-gray-600">Enquêtes synchronisées</div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/form')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ Nouvelle Enquête
            </button>
            <button
              onClick={refreshData}
              disabled={statsLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              🔄 Actualiser les données
            </button>
            <button
              onClick={debugDataState}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              🐛 Debug
            </button>
          </div>
        </div>

        {/* Graphiques */}
        {statsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Chargement des graphiques...</p>
          </div>
        ) : (
          <ControllerDashboardCharts personalStats={personalStats} />
        )}

        {/* Informations sur le système */}
        <div className="max-w-4xl mx-auto bg-green-50 rounded-xl shadow p-6 mb-8">
          <p className="text-lg text-gray-800 mb-4 text-center">
            Bienvenue sur le tableau de bord contrôleur de BoraCollect.<br/>
            Ici, vous pouvez :
          </p>
          <ul className="list-disc ml-8 text-gray-700 mb-4">
            <li>Créer de nouvelles enquêtes sur les solutions de cuisson propre</li>
            <li>Consulter vos statistiques personnelles</li>
            <li>Visualiser l'évolution de vos enquêtes</li>
            <li>Suivre la synchronisation de vos données</li>
          </ul>
          <div className="text-center">
            <button
              onClick={() => navigate('/form')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              Commencer une nouvelle enquête
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ControllerLayout() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'form', 'records'

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

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo2} alt="Logo 2" className="h-12 w-auto object-contain bg-white rounded shadow" />
          <span className="font-bold text-lg ml-2 truncate" style={{maxWidth: 120}}>Contrôleur</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink min-w-0">
          <button 
            onClick={() => setView('dashboard')} 
            className={`px-3 py-2 rounded font-semibold ${view === 'dashboard' ? 'bg-gradient-to-r from-green-700 to-green-500 shadow' : 'hover:bg-green-800'} text-white text-sm`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setView('form')} 
            className={`px-3 py-2 rounded font-semibold text-white text-sm ${view === 'form' ? 'bg-gradient-to-r from-green-700 to-green-500 shadow' : 'hover:bg-green-800'}`}
          >
            Nouvelle Enquête
          </button>
          <button 
            onClick={() => setView('records')} 
            className={`px-3 py-2 rounded font-semibold ${view === 'records' ? 'bg-gradient-to-r from-green-700 to-green-500 shadow' : 'hover:bg-green-800'} text-white text-sm`}
          >
            Mes Enquêtes
          </button>
          {user && (
            <div className="w-8 h-8 rounded-full bg-white text-green-900 flex items-center justify-center font-bold ml-2">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }} 
            className="ml-2 bg-white text-green-900 px-3 py-1 rounded font-semibold text-sm"
          >
            Déconnexion
          </button>
        </div>
      </nav>
      <main className="p-8">
        {view === 'dashboard' && <DashboardController />}
        {view === 'form' && <SchoolForm />}
        {view === 'records' && <RecordsList />}
      </main>
    </div>
  );
} 