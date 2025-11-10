import React, { useState, useEffect } from 'react';
import { environment } from '../../config/environment';
import PMDashboardCharts from '../../components/PMDashboardCharts';
import PMDailyObjectives from '../../components/PMDailyObjectives';
import ObjectiveAlerts from '../../components/ObjectiveAlerts';
import ObjectiveProjection from '../../components/ObjectiveProjection';
import EnumeratorLeaderboard from '../../components/EnumeratorLeaderboard';
import CarteRDCSVG from '../../components/CarteRDCSVG';

// Styles CSS pour les animations 3D
const flipCardStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`;

interface PMStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalInscriptions: number;
  pendingInscriptions: number;
  approvedInscriptions: number;
  rejectedInscriptions: number;
  totalCandidatures: number;
  approvedCandidatures: number;
  rejectedCandidatures: number;
  pendingCandidatures: number;
}

interface Campaign {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  applications: number;
  maxApplicants?: number;
}

const DashboardPM: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<PMStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalInscriptions: 0,
    pendingInscriptions: 0,
    approvedInscriptions: 0,
    rejectedInscriptions: 0,
    totalCandidatures: 0,
    approvedCandidatures: 0,
    rejectedCandidatures: 0,
    pendingCandidatures: 0
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [dailyObjectives, setDailyObjectives] = useState<any[]>([]);
  const [objectivesLoading, setObjectivesLoading] = useState(false);

  // États pour les filtres
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week', 'month', 'year', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [showMap, setShowMap] = useState(false); // 'false' pour masquer, 'true' pour afficher
  const [selectedRespondentType, setSelectedRespondentType] = useState('all'); // 'all', 'feminin', 'masculin', 'autre'

  // Fonction pour gérer le retournement des cartes
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Fonctions pour gérer les filtres
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    let start, end;

    switch (period) {
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = today;
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case 'custom':
        // Les dates seront définies manuellement
        return;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const applyFilters = () => {
    console.log('🔍 Filtres appliqués:', {
      period: selectedPeriod,
      startDate,
      endDate,
      campaign: selectedCampaign,
      showMap,
      respondentType: selectedRespondentType
    });
    // Ici on peut appeler une fonction pour refetch les données avec les filtres
    fetchDashboardData();
  };

  const resetFilters = () => {
    setSelectedPeriod('month');
    setSelectedCampaign('');
    setShowMap(false);
    setSelectedRespondentType('all');
    handlePeriodChange('month');
    applyFilters();
  };

  useEffect(() => {
    loadUserData();
    fetchDashboardData();
    fetchDailyObjectives();
    // Initialiser les dates par défaut (mois actuel)
    handlePeriodChange('month');
  }, []);


  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${environment.apiBaseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Récupérer les statistiques du Projet Manager
      const statsResponse = await fetch(`${environment.apiBaseUrl}/users/pm-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        // Convertir explicitement en nombres pour éviter les problèmes de type
        const newStats = {
          totalCampaigns: Number(statsData.totalCampaigns ?? 0) || 0,
          activeCampaigns: Number(statsData.activeCampaigns ?? 0) || 0,
          completedCampaigns: Number(statsData.completedCampaigns ?? 0) || 0,
          totalInscriptions: Number(statsData.totalInscriptions ?? 0) || 0,
          pendingInscriptions: Number(statsData.pendingInscriptions ?? 0) || 0,
          approvedInscriptions: Number(statsData.approvedInscriptions ?? 0) || 0,
          rejectedInscriptions: Number(statsData.rejectedInscriptions ?? 0) || 0,
          totalCandidatures: Number(statsData.totalCandidatures ?? 0) || 0,
          approvedCandidatures: Number(statsData.approvedCandidatures ?? 0) || 0,
          rejectedCandidatures: Number(statsData.rejectedCandidatures ?? 0) || 0,
          pendingCandidatures: Number(statsData.pendingCandidatures ?? 0) || 0
        };
        
        setStats(newStats);
      } else {
        const errorText = await statsResponse.text();
        console.error('❌ Erreur lors de la récupération des statistiques:', 
                     statsResponse.status, statsResponse.statusText, errorText);
      }

      // Récupérer les campagnes du Projet Manager
      const campaignsResponse = await fetch(`${environment.apiBaseUrl}/surveys/pm-surveys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyObjectives = async () => {
    setObjectivesLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${environment.apiBaseUrl}/surveys/pm-daily-objectives`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDailyObjectives(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des objectifs:', error);
      setDailyObjectives([]);
    } finally {
      setObjectivesLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Brouillon',
      'PUBLISHED': 'Publiée',
      'CLOSED': 'Fermée',
      'CANCELLED': 'Annulée',
      'TERMINATED': 'Terminée'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PUBLISHED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-orange-100 text-orange-800',
      'CANCELLED': 'bg-yellow-100 text-yellow-800',
      'TERMINATED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <>
        <style>{flipCardStyles}</style>
        <div className="min-h-screen bg-gray-50">
          {/* Skeleton de la barre de navigation */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg h-20">
            <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 h-full">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-white/20 rounded-lg animate-pulse"></div>
                  <div className="flex flex-col">
                    <div className="w-24 sm:w-32 h-4 bg-white/20 rounded animate-pulse"></div>
                    <div className="w-16 sm:w-20 h-3 bg-white/10 rounded animate-pulse mt-1"></div>
                  </div>
                </div>
                <div className="flex items-center gap-1 lg:gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-16 lg:w-20 h-8 bg-white/20 rounded-lg animate-pulse"></div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton du contenu principal */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Skeleton de l'en-tête */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="w-64 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton des cartes de statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-32 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl shadow-lg animate-pulse"></div>
              ))}
            </div>

            {/* Skeleton des graphiques */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="w-full h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Skeleton des actions rapides */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Skeleton de la carte interactive */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="w-64 h-6 bg-gray-200 rounded animate-pulse mb-4 mx-auto"></div>
              <div className="w-full h-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{flipCardStyles}</style>
      <div className="space-y-8">
        {/* En-tête avec informations utilisateur */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Bienvenue, {user?.name || 'Project Manager'} !
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Interface Project Manager
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                PM
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">Project Manager</div>
                <div className="text-sm text-gray-500">Tableau de bord</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section des filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filtres de données</h3>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Filtre de période */}
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Période:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                  <option value="custom">Période personnalisée</option>
                </select>
              </div>

              {/* Dates personnalisées */}
              {selectedPeriod === 'custom' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Date de début"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Date de fin"
                  />
                </div>
              )}

              {/* Filtre de campagne */}
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Campagne:</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[200px]"
                >
                  <option value="">Toutes les campagnes</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton carte interactive */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showMap 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {showMap ? 'Masquer la carte' : 'Afficher la carte'}
                </button>
              </div>

              {/* Filtre type de répondant */}
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Répondant:</label>
                <select
                  value={selectedRespondentType}
                  onChange={(e) => setSelectedRespondentType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Tous les répondants</option>
                  <option value="feminin">Féminin</option>
                  <option value="masculin">Masculin</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
              >
                Appliquer
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm font-medium"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Affichage des filtres actifs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedPeriod !== 'month' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Période: {selectedPeriod === 'week' ? 'Cette semaine' : selectedPeriod === 'year' ? 'Cette année' : 'Personnalisée'}
                {selectedPeriod === 'custom' && startDate && endDate && ` (${startDate} - ${endDate})`}
              </span>
            )}
            {selectedCampaign && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Campagne: {campaigns.find(c => c.id === selectedCampaign)?.title || selectedCampaign}
              </span>
            )}
            {showMap && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Carte: Interactive RDC
              </span>
            )}
            {selectedRespondentType !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                Répondant: {selectedRespondentType === 'feminin' ? 'Féminin' : selectedRespondentType === 'masculin' ? 'Masculin' : 'Autre'}
              </span>
            )}
          </div>
        </div>

        {/* Statistiques principales avec cartes animées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Carte Total Campagnes */}
          <div 
            className="relative w-full h-24 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
            onClick={() => toggleCardFlip('totalCampaigns')}
          >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
              flippedCards.totalCampaigns ? 'rotate-y-180' : ''
            }`}>
              {/* Recto */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                <div className="text-center text-white">
                  <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                    <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                    <svg className="w-6 h-6 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-semibold">Total Campagnes</div>
                  <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                </div>
              </div>
              {/* Verso */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                <div className="text-center text-white">
                  <div className="text-2xl font-bold mb-1">
                    {loading ? (
                      <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto"></div>
                    ) : (
                      <span className="animate-bounce hover:animate-pulse transition-all duration-300 hover:scale-110 hover:text-yellow-200">
                        {Number(stats.totalCampaigns) || 0}
                      </span>
                    )}
                  </div>
                  <div className="text-xs">
                    <div>Actives: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.activeCampaigns) || 0}</span>
                    )}</div>
                    <div>Terminées: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.completedCampaigns) || 0}</span>
                    )}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carte Total Inscriptions */}
          <div 
            className="relative w-full h-24 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
            onClick={() => toggleCardFlip('totalInscriptions')}
          >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
              flippedCards.totalInscriptions ? 'rotate-y-180' : ''
            }`}>
              {/* Recto */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                <div className="text-center text-white">
                  <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                    <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                    <svg className="w-6 h-6 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div className="text-xs font-semibold">Total Inscriptions</div>
                  <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                </div>
              </div>
              {/* Verso */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                <div className="text-center text-white">
                  <div className="text-2xl font-bold mb-1">
                    {loading ? (
                      <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto"></div>
                    ) : (
                      <span className="animate-bounce hover:animate-pulse transition-all duration-300 hover:scale-110 hover:text-yellow-200">
                        {Number(stats.totalInscriptions) || 0}
                      </span>
                    )}
                  </div>
                  <div className="text-xs">
                    <div>En attente: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.pendingInscriptions) || 0}</span>
                    )}</div>
                    <div>Approuvées: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.approvedInscriptions) || 0}</span>
                    )}</div>
                    <div>Rejetées: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.rejectedInscriptions) || 0}</span>
                    )}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carte Total Candidatures */}
          <div 
            className="relative w-full h-24 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
            onClick={() => toggleCardFlip('totalCandidatures')}
          >
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
              flippedCards.totalCandidatures ? 'rotate-y-180' : ''
            }`}>
              {/* Recto */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                <div className="text-center text-white">
                  <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                    <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                    <svg className="w-6 h-6 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                  </div>
                  <div className="text-xs font-semibold">Total Candidatures</div>
                  <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                </div>
              </div>
              {/* Verso */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                <div className="text-center text-white">
                  <div className="text-2xl font-bold mb-1">
                    {loading ? (
                      <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto"></div>
                    ) : (
                      <span className="animate-bounce hover:animate-pulse transition-all duration-300 hover:scale-110 hover:text-yellow-200">
                        {Number(stats.totalCandidatures) || 0}
                      </span>
                    )}
                  </div>
                  <div className="text-xs">
                    <div>Approuvées: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.approvedCandidatures) || 0}</span>
                    )}</div>
                    <div>Rejetées: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.rejectedCandidatures) || 0}</span>
                    )}</div>
                    <div>En attente: {loading ? (
                      <span className="animate-pulse bg-white/20 rounded w-8 h-4 inline-block"></span>
                    ) : (
                      <span className="animate-bounce">{Number(stats.pendingCandidatures) || 0}</span>
                    )}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <PMDashboardCharts 
          selectedPeriod={selectedPeriod}
          startDate={startDate}
          endDate={endDate}
          selectedCampaign={selectedCampaign}
          selectedRespondentType={selectedRespondentType}
        />

        {/* Alertes et Projections pour les Campagnes */}
        {!objectivesLoading && dailyObjectives.length > 0 && dailyObjectives[0] && (() => {
          // Calculer les soumissions d'aujourd'hui à partir de l'historique
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayKey = today.toISOString().split('T')[0];
          
          // Trouver les soumissions d'aujourd'hui dans l'historique
          const todayHistory = dailyObjectives[0].history?.find((h: any) => h.date === todayKey);
          const dailySubmitted = todayHistory?.submitted || 0;
          
          // Utiliser les formulaires validés pour les alertes (comme demandé par l'utilisateur)
          const totalValidated = dailyObjectives[0].currentProgress.totalValidated || 0;
          const totalSubmitted = dailyObjectives[0].currentProgress.totalSubmitted || 0;
          
          return (
            <>
              {/* Alertes Intelligentes */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Alertes de Campagne</h3>
                <ObjectiveAlerts
                  totalSubmitted={totalValidated}
                  totalTarget={dailyObjectives[0].totalTarget}
                  dailySubmitted={dailySubmitted}
                  dailyTarget={dailyObjectives[0].dailyTarget * (dailyObjectives[0].totalEnumerators || 1)}
                  remainingDays={dailyObjectives[0].recommendations.remainingDays}
                  userRole="PROJECT_MANAGER"
                />
              </div>

              {/* Projections */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <ObjectiveProjection
                  totalSubmitted={totalValidated}
                  totalTarget={dailyObjectives[0].totalTarget}
                  dailySubmitted={dailySubmitted}
                  dailyTarget={dailyObjectives[0].dailyTarget * (dailyObjectives[0].totalEnumerators || 1)}
                  remainingDays={dailyObjectives[0].recommendations.remainingDays}
                  averageDailyRate={dailyObjectives[0].recommendations.avgPerDay}
                />
              </div>
            </>
          );
        })()}

        {/* Objectifs Quotidiens des Campagnes */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Suivi des Objectifs Quotidiens de mes Campagnes</h3>
          <PMDailyObjectives objectives={dailyObjectives} loading={objectivesLoading} />
        </div>

        {/* Carte Interactive de la RDC - Affichage conditionnel */}
        {showMap && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center">
              Carte Interactive de la République Démocratique du Congo
            </h3>
            <div className="px-4">
              <CarteRDCSVG />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardPM;
