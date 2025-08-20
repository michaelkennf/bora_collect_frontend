import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo2 from '../assets/images/logo2.jpg';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
);

const communesKinshasa = [
  'Gombe', 'Kinshasa', 'Kintambo', 'Ngaliema', 'Mont-Ngafula',
  'Selembao', 'Bumbu', 'Makala', 'Ngiri-Ngiri', 'Kalamu',
  'Kasa-Vubu', 'Bandalungwa', 'Lingwala', 'Barumbu', 'Matete',
  'Lemba', 'Ngaba', 'Kisenso', 'Limete', 'Masina',
  'Nsele', 'Maluku', 'Kimbaseke', 'Ndjili'
];

export default function AnalystHome() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'dashboard'|'enquetes'|'statistiques'>('dashboard');
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [search, setSearch] = useState('');
  const [communeFilter, setCommuneFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  // Récupérer les statistiques du tableau de bord (chargement automatique dès la connexion)
  useEffect(() => {
    setDashboardLoading(true);
    setDashboardError('');
    
    fetch('http://localhost:3000/records/stats/overview', { 
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
    })
    .then(r => r.json())
    .then(stats => {
      // setDashboardStats(stats); // This line was removed as per the edit hint
    })
    .catch(e => {
      setDashboardError('Erreur lors du chargement des statistiques');
    })
    .finally(() => setDashboardLoading(false));
  }, []); // Chargement automatique au montage du composant

  // Récupérer les enquêtes (chargement automatique dès la connexion)
  useEffect(() => {
    fetchRecords();
  }, []); // Chargement automatique au montage du composant

  // Récupérer les enquêtes
  const fetchRecords = async () => {
    setRecordsLoading(true);
    setRecordsError('');
    try {
      let url = 'http://localhost:3000/records/search?';
      const params = [];
      if (search) params.push(`nomOuCode=${encodeURIComponent(search)}`);
      if (communeFilter) params.push(`commune=${encodeURIComponent(communeFilter)}`);
      if (params.length) url += params.join('&');
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      
      // Enrichir les records avec les informations des utilisateurs
      const enrichedRecords = await Promise.all(
        data.map(async (record: any) => {
          if (record.authorId) {
            try {
              const userRes = await fetch(`http://localhost:3000/users/${record.authorId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                return {
                  ...record,
                  authorName: userData.name || userData.email || 'Utilisateur inconnu'
                };
              }
            } catch (error) {
              console.warn(`Impossible de récupérer les informations de l'utilisateur ${record.authorId}:`, error);
            }
          }
          return {
            ...record,
            authorName: record.authorId || 'N/A'
          };
        })
      );
      
      setRecords(enrichedRecords);
    } catch (err: any) {
      setRecordsError(err.message || 'Erreur inconnue');
    } finally {
      setRecordsLoading(false);
    }
  };

  // Recharger les enquêtes quand les filtres changent
  useEffect(() => {
    if (view === 'enquetes') {
      fetchRecords();
    }
  }, [view, search, communeFilter]);

  // Calcul des statistiques des solutions de cuisson (version améliorée avec répartition par commune)
  const calculateCookingStats = () => {
    if (!records.length) return null;

    const stats = {
      combustibles: {} as Record<string, number>,
      equipements: {} as Record<string, number>,
      communes: {} as Record<string, number>,
      status: {} as Record<string, number>,
      totalEnquetes: records.length,
      totalEnqueteurs: 0, // NOUVEAU : Nombre total d'enquêteurs
      // NOUVEAU : Statistiques détaillées par commune
      equipementsParCommune: {} as Record<string, Record<string, number>>,
      combustiblesParCommune: {} as Record<string, Record<string, number>>
    };

    // Set pour compter les enquêteurs uniques
    const enqueteursUniques = new Set<string>();

    records.forEach(record => {
      // Compter les enquêteurs uniques
      if (record.authorId) {
        enqueteursUniques.add(record.authorId);
      }

      // Stats par statut
      const status = record.status || 'Inconnu';
      stats.status[status] = (stats.status[status] || 0) + 1;

      // Stats par commune
      const commune = record.formData?.household?.communeQuartier || 'Non spécifiée';
      stats.communes[commune] = (stats.communes[commune] || 0) + 1;

      // Initialiser les objets pour cette commune si nécessaire
      if (!stats.equipementsParCommune[commune]) {
        stats.equipementsParCommune[commune] = {};
        stats.combustiblesParCommune[commune] = {};
      }

      // Stats par combustible (global et par commune)
      if (record.formData?.cooking?.combustibles) {
        record.formData.cooking.combustibles.forEach((combustible: string) => {
          // Global
          stats.combustibles[combustible] = (stats.combustibles[combustible] || 0) + 1;
          // Par commune
          stats.combustiblesParCommune[commune][combustible] = 
            (stats.combustiblesParCommune[commune][combustible] || 0) + 1;
        });
      }

      // Stats par équipement (global et par commune)
      if (record.formData?.cooking?.equipements) {
        record.formData.cooking.equipements.forEach((equipement: string) => {
          // Global
          stats.equipements[equipement] = (stats.equipements[equipement] || 0) + 1;
          // Par commune
          stats.equipementsParCommune[commune][equipement] = 
            (stats.equipementsParCommune[commune][equipement] || 0) + 1;
        });
      }
    });

    // Calculer le nombre total d'enquêteurs uniques
    stats.totalEnqueteurs = enqueteursUniques.size;

    return stats;
  };

  const cookingStats = calculateCookingStats();

  // Données pour les graphiques (version améliorée avec répartition par commune)
  const getChartData = () => {
    if (!cookingStats) return null;

    // Préparer les données pour les graphiques par commune
    const communesAvecDonnees = Object.keys(cookingStats.communes).filter(commune => 
      cookingStats.communes[commune] > 0
    ); // TOUTES les communes avec des enquêtes

    // Créer les datasets pour équipements par commune
    const equipementsLabels = Object.keys(cookingStats.equipements);
    const datasetsEquipements = equipementsLabels.map((equipement, index) => ({
      label: equipement,
      data: communesAvecDonnees.map(commune => 
        cookingStats.equipementsParCommune[commune]?.[equipement] || 0
      ),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
      ][index % 5],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ][index % 5],
      borderWidth: 1
    }));

    // Créer les datasets pour combustibles par commune
    const combustiblesLabels = Object.keys(cookingStats.combustibles);
    const datasetsCombustibles = combustiblesLabels.map((combustible, index) => ({
      label: combustible,
      data: communesAvecDonnees.map(commune => 
        cookingStats.combustiblesParCommune[commune]?.[combustible] || 0
      ),
      backgroundColor: [
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(78, 252, 3, 0.8)',
        'rgba(252, 3, 244, 0.8)',
      ][index % 5],
      borderColor: [
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(78, 252, 3, 1)',
        'rgba(252, 3, 244, 1)',
      ][index % 5],
      borderWidth: 1
    }));

    return {
      combustibles: {
        labels: Object.keys(cookingStats.combustibles),
        datasets: [{
          label: 'Nombre d\'enquêtes',
          data: Object.values(cookingStats.combustibles),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
        }]
      },
      equipements: {
        labels: Object.keys(cookingStats.equipements),
        datasets: [{
          label: 'Nombre d\'enquêtes',
          data: Object.values(cookingStats.equipements),
          backgroundColor: [
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(78, 252, 3, 0.8)',
            'rgba(252, 3, 244, 0.8)',
          ],
        }]
      },
      communes: {
        labels: Object.keys(cookingStats.communes), // TOUTES les communes
        datasets: [{
          label: 'Nombre d\'enquêtes',
          data: Object.values(cookingStats.communes), // TOUTES les données
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
        }]
      },
      // NOUVEAU : Graphiques par commune
      equipementsParCommune: {
        labels: communesAvecDonnees,
        datasets: datasetsEquipements
      },
      combustiblesParCommune: {
        labels: communesAvecDonnees,
        datasets: datasetsCombustibles
      }
    };
  };

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo2} alt="Logo 2" className="h-12 w-auto object-contain bg-white rounded shadow" />
          <span className="font-bold text-lg ml-2 truncate" style={{maxWidth: 120}}>Analyste</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink min-w-0">
          <button 
            onClick={() => setView('dashboard')} 
            className={`px-3 py-2 rounded font-semibold ${view==='dashboard' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}
          >
            Tableau de bord
          </button>
          <button 
            onClick={() => setView('enquetes')} 
            className={`px-3 py-2 rounded font-semibold ${view==='enquetes' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}
          >
            Les enquêtes
          </button>
          <button 
            onClick={() => setView('statistiques')} 
            className={`px-3 py-2 rounded font-semibold ${view==='statistiques' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow' : 'hover:bg-blue-800'} text-white text-sm`}
          >
            Statistiques Détaillées
          </button>
          {user && (
            <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold ml-2">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }} 
            className="ml-2 bg-white text-blue-900 px-3 py-1 rounded font-semibold text-sm"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="p-8">
        {/* Tableau de bord */}
        {view === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-center">Tableau de Bord - Interface Analyste</h1>
            
            {/* Message de bienvenue */}
            <div className="max-w-2xl mx-auto bg-blue-50 rounded-xl shadow p-6 mb-8">
              <p className="text-lg text-gray-800 mb-4 text-center">
                Bienvenue sur le tableau de bord analyste.<br/>
                Ici, vous pouvez analyser les données des solutions de cuisson propre collectées dans le système.
              </p>
              <ul className="list-disc ml-8 text-gray-700 mb-4">
                <li>Voir le nombre total d'enquêtes enregistrées</li>
                <li>Analyser les statistiques par combustible et équipement</li>
                <li>Consulter la répartition par commune</li>
                <li>Exporter les résultats d'analyse</li>
              </ul>
            </div>

            {/* Affichage des erreurs */}
            {dashboardError && (
              <div className="text-red-600 text-center mb-4 bg-red-50 p-3 rounded-lg">
                {dashboardError}
              </div>
            )}

            {/* Chargement */}
            {dashboardLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
              </div>
            ) : (
              <>
                {/* Statistiques globales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {cookingStats?.totalEnquetes || 0}
                    </div>
                    <div className="text-gray-600">Total des enquêtes</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {cookingStats?.totalEnqueteurs || 0}
                    </div>
                    <div className="text-gray-600">Total des enquêteurs</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {Object.keys(cookingStats?.combustibles || {}).length || 0}
                    </div>
                    <div className="text-gray-600">Types de combustibles</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {Object.keys(cookingStats?.equipements || {}).length || 0}
                    </div>
                    <div className="text-gray-600">Types d'équipements</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {Object.keys(cookingStats?.communes || {}).length || 0}
                    </div>
                    <div className="text-gray-600">Communes couvertes</div>
                  </div>
                </div>

                {/* Graphiques des solutions de cuisson */}
                {chartData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Graphique des combustibles */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                      <h3 className="text-lg font-bold mb-4 text-center">Répartition par Type de Combustible</h3>
                      <div style={{ height: '300px' }}>
                        <Bar
                          data={chartData.combustibles}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              title: { display: false },
                            },
                            scales: {
                              y: { beginAtZero: true, title: { display: true, text: 'Nombre d\'enquêtes' } },
                              x: { title: { display: true, text: 'Types de combustibles' } }
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Graphique des équipements */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                      <h3 className="text-lg font-bold mb-4 text-center">Répartition par Type d'Équipement</h3>
                      <div style={{ height: '300px' }}>
                        <Bar
                          data={chartData.equipements}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              title: { display: false },
                            },
                            scales: {
                              y: { beginAtZero: true, title: { display: true, text: 'Nombre d\'enquêtes' } },
                              x: { title: { display: true, text: 'Types d\'équipements' } }
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Graphique des communes */}
                {chartData && (
                  <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h3 className="text-lg font-bold mb-4 text-center">Répartition par Commune - Toutes les Communes de Kinshasa</h3>
                    <div style={{ height: '500px', width: '100%' }}>
                      <Bar
                        data={chartData.communes}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true, title: { display: true, text: 'Nombre d\'enquêtes' } },
                            x: { 
                              title: { display: true, text: 'Communes' },
                              ticks: { 
                                maxRotation: 45, 
                                minRotation: 45,
                                autoSkip: false,
                                maxTicksLimit: 0
                              }
                            }
                          },
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* NOUVEAU : Graphique des équipements par commune */}
                {chartData && (
                  <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h3 className="text-lg font-bold mb-4 text-center">Répartition par Type d'Équipement par Commune</h3>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Classement des types d'équipements les plus utilisés dans chaque commune
                    </p>
                    <div className="flex justify-center">
                      <div style={{ width: '100%', height: '500px' }}>
                        <Bar
                          data={chartData.equipementsParCommune}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { position: 'top' },
                              title: { display: false },
                            },
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: 'Communes'
                                },
                                ticks: {
                                  maxRotation: 45,
                                  minRotation: 45,
                                  autoSkip: false,
                                  maxTicksLimit: 0
                                }
                              },
                              y: {
                                title: {
                                  display: true,
                                  text: 'Nombre d\'enquêtes'
                                },
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* NOUVEAU : Graphique des combustibles par commune */}
                {chartData && (
                  <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h3 className="text-lg font-bold mb-4 text-center">Répartition par Type de Combustible par Commune</h3>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Classement des types de combustibles les plus utilisés dans chaque commune
                    </p>
                    <div className="flex justify-center">
                      <div style={{ width: '100%', height: '500px' }}>
                        <Bar
                          data={chartData.combustiblesParCommune}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { position: 'top' },
                              title: { display: false },
                            },
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: 'Communes'
                                },
                                ticks: {
                                  maxRotation: 45,
                                  minRotation: 45,
                                  autoSkip: false,
                                  maxTicksLimit: 0
                                }
                              },
                              y: {
                                title: {
                                  display: true,
                                  text: 'Nombre d\'enquêtes'
                                },
                                beginAtZero: true
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton pour aller aux enquêtes */}
                <div className="text-center">
                  <button
                    onClick={() => setView('enquetes')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Voir toutes les enquêtes
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Page des enquêtes */}
        {view === 'enquetes' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-center">Liste des Enquêtes</h1>
            
            {/* Filtres */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h4 className="text-lg font-semibold mb-4">Filtres de recherche</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2 text-sm text-gray-700">Recherche par nom du ménage</label>
                  <input
                    type="text"
                    placeholder="Nom du ménage..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm text-gray-700">Commune</label>
                  <select
                    value={communeFilter}
                    onChange={e => setCommuneFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Toutes les communes</option>
                    {communesKinshasa.map(commune => <option key={commune} value={commune}>{commune}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearch('');
                    setCommuneFilter('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>

            {/* Affichage des erreurs */}
            {recordsError && (
              <div className="text-red-600 mb-4 text-center bg-red-50 p-3 rounded-lg">
                {recordsError}
              </div>
            )}

            {/* Chargement */}
            {recordsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Chargement des enquêtes...</p>
              </div>
            ) : (
              /* Liste des enquêtes */
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Enquêtes trouvées : {records.length}
                  </h3>
                </div>
                
                {records.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucune enquête trouvée avec les critères sélectionnés
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ménage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Commune/Quartier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GPS
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date de création
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((record, index) => (
                          <tr key={record.id || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.formData?.household?.nomOuCode || 'N/A'}
                              <br />
                              <span className="text-xs text-gray-500">
                                {record.formData?.household?.age || 'N/A'} • {record.formData?.household?.sexe || 'N/A'} • {record.formData?.household?.tailleMenage || 'N/A'} personnes
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.formData?.household?.communeQuartier || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.formData?.household?.geolocalisation || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.createdAt ? new Date(record.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                                record.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                record.status === 'PENDING_VALIDATION' ? 'bg-green-100 text-green-800' :
                                record.status === 'PENDING' ? 'bg-green-100 text-green-800' :
                                record.status === 'TO_CORRECT' ? 'bg-green-100 text-green-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {record.status === 'VALIDATED' ? 'Synchronisé' :
                                 record.status === 'SENT' ? 'Synchronisé' :
                                 record.status === 'PENDING_VALIDATION' ? 'Synchronisé' :
                                 record.status === 'PENDING' ? 'Synchronisé' :
                                 record.status === 'TO_CORRECT' ? 'Synchronisé' :
                                 'Synchronisé'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowDetailModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-semibold"
                              >
                                Voir détails
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Page des statistiques détaillées */}
        {view === 'statistiques' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-center">Statistiques Détaillées - Toutes les Communes</h1>
            
            {/* Message d'information */}
            <div className="max-w-4xl mx-auto bg-blue-50 rounded-xl shadow p-6 mb-8">
              <p className="text-lg text-gray-800 mb-4 text-center">
                Tableaux récapitulatifs détaillés des données collectées dans toutes les communes de Kinshasa.<br/>
                Visualisez les statistiques numériques précises pour chaque zone géographique.
              </p>
            </div>

            {/* Chargement */}
            {dashboardLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
              </div>
            ) : (
              <>
                {/* Tableau récapitulatif par commune */}
                {cookingStats && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                      Récapitulatif par Commune - {Object.keys(cookingStats.communes).length} Communes
                    </h2>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Commune
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre d'Enquêtes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Types de Combustibles
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Types d'Équipements
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              % du Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(cookingStats.communes)
                            .sort(([,a], [,b]) => b - a) // Trier par nombre d'enquêtes décroissant
                            .map(([commune, count]) => {
                              const totalEnquetes = cookingStats.totalEnquetes;
                              const pourcentage = totalEnquetes > 0 ? ((count / totalEnquetes) * 100).toFixed(1) : '0.0';
                              
                              return (
                                <tr key={commune} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {commune}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {count}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                    {Object.keys(cookingStats.combustiblesParCommune[commune] || {}).length}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                    {Object.keys(cookingStats.equipementsParCommune[commune] || {}).length}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {pourcentage}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tableau détaillé des combustibles par commune */}
                {cookingStats && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                      Répartition des Combustibles par Commune
                    </h2>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Commune
                            </th>
                            {Object.keys(cookingStats.combustibles).map(combustible => (
                              <th key={combustible} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {combustible}
                              </th>
                            ))}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.keys(cookingStats.communes)
                            .sort((a, b) => cookingStats.communes[b] - cookingStats.communes[a])
                            .map(commune => {
                              const totalCommune = Object.values(cookingStats.combustiblesParCommune[commune] || {}).reduce((sum, count) => sum + count, 0);
                              
                              return (
                                <tr key={commune} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {commune}
                                  </td>
                                  {Object.keys(cookingStats.combustibles).map(combustible => {
                                    const count = cookingStats.combustiblesParCommune[commune]?.[combustible] || 0;
                                    return (
                                      <td key={combustible} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {count > 0 ? (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            {count}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {totalCommune}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tableau détaillé des équipements par commune */}
                {cookingStats && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                      Répartition des Équipements par Commune
                    </h2>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Commune
                            </th>
                            {Object.keys(cookingStats.equipements).map(equipement => (
                              <th key={equipement} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {equipement}
                              </th>
                            ))}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.keys(cookingStats.communes)
                            .sort((a, b) => cookingStats.communes[b] - cookingStats.communes[a])
                            .map(commune => {
                              const totalCommune = Object.values(cookingStats.equipementsParCommune[commune] || {}).reduce((sum, count) => sum + count, 0);
                              
                              return (
                                <tr key={commune} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {commune}
                                  </td>
                                  {Object.keys(cookingStats.equipements).map(equipement => {
                                    const count = cookingStats.equipementsParCommune[commune]?.[equipement] || 0;
                                    return (
                                      <td key={equipement} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {count > 0 ? (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {count}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {totalCommune}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Statistiques globales détaillées */}
                {cookingStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Statistiques des combustibles */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
                        Statistiques Globales - Combustibles
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(cookingStats.combustibles)
                          .sort(([,a], [,b]) => b - a)
                          .map(([combustible, count]) => (
                            <div key={combustible} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-700">{combustible}</span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {count} enquêtes
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Statistiques des équipements */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
                        Statistiques Globales - Équipements
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(cookingStats.equipements)
                          .sort(([,a], [,b]) => b - a)
                          .map(([equipement, count]) => (
                            <div key={equipement} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-700">{equipement}</span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {count} enquêtes
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modal de détails de l'enquête */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de l'enquête - {selectedRecord.formData?.household?.nomOuCode || 'Ménage'}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRecord(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="max-h-96 overflow-y-auto">
                {/* Informations générales */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                    Informations générales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Ménage :</span>
                      <span className="ml-2 text-gray-900">{selectedRecord.formData?.household?.nomOuCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Enquêteur :</span>
                      <span className="ml-2 text-gray-900">{selectedRecord.authorName || selectedRecord.authorId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Commune/Quartier :</span>
                      <span className="ml-2 text-gray-900">{selectedRecord.formData?.household?.communeQuartier || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date de création :</span>
                      <span className="ml-2 text-gray-900">
                        {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Données du ménage */}
                {selectedRecord.formData?.household && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Données du ménage
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Age :</span>
                        <span className="ml-2 text-gray-900">{selectedRecord.formData.household.age || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Sexe :</span>
                        <span className="ml-2 text-gray-900">{selectedRecord.formData.household.sexe || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Taille du ménage :</span>
                        <span className="ml-2 text-gray-900">{selectedRecord.formData.household.tailleMenage || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Géolocalisation :</span>
                        <span className="ml-2 text-gray-900">{selectedRecord.formData.household.geolocalisation || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Solutions de cuisson actuelles */}
                {selectedRecord.formData?.cooking && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Solutions de cuisson actuelles
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Combustibles :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(selectedRecord.formData.cooking.combustibles) 
                            ? selectedRecord.formData.cooking.combustibles.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Équipements :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(selectedRecord.formData.cooking.equipements) 
                            ? selectedRecord.formData.cooking.equipements.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connaissance des solutions propres */}
                {selectedRecord.formData?.knowledge && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Connaissance des solutions propres
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Connaissance :</span>
                        <span className="ml-2 text-gray-900">{selectedRecord.formData.knowledge.connaissanceSolutions || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Avantages :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(selectedRecord.formData.knowledge.avantages) 
                            ? selectedRecord.formData.knowledge.avantages.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contraintes d'adoption */}
                {selectedRecord.formData?.constraints && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Contraintes d'adoption
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Obstacles :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(selectedRecord.formData.constraints.obstacles) 
                            ? selectedRecord.formData.constraints.obstacles.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Intention d'adoption */}
                {selectedRecord.formData?.adoption && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Intention d'adoption
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Prêt à acheter foyer :</span>
                        <span className="ml-2 text-gray-900">{selectedRecord.formData.adoption.pretAcheterFoyer || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Prêt à acheter GPL :</span>
                        <span className="ml-2 text-gray-900">{selectedRecord.formData.adoption.pretAcheterGPL || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRecord(null);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 