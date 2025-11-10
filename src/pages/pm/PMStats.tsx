import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { environment } from '../../config/environment';

interface PMStatsData {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  totalAnalysts: number;
  activeAnalysts: number;
  totalControllers: number;
  activeControllers: number;
  campaignsByStatus: {
    DRAFT: number;
    PUBLISHED: number;
    CLOSED: number;
    CANCELLED: number;
    TERMINATED: number;
  };
  applicationsByMonth: Array<{
    month: string;
    applications: number;
    approved: number;
    rejected: number;
  }>;
  topCampaigns: Array<{
    id: string;
    title: string;
    applications: number;
    approved: number;
    status: string;
  }>;
}

const PMStats: React.FC = () => {
  const [stats, setStats] = useState<PMStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté pour accéder à cette page');
        setLoading(false);
        return;
      }

      const response = await fetch(`${environment.apiBaseUrl}/users/pm-stats-detailed?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        console.log('🔐 Session expirée - redirection vers login');
        // Ne pas afficher de toast pour éviter les notifications répétées
      } else if (response.status === 403) {
        console.log('🚫 Forbidden - user may not have proper permissions');
        // Ne pas afficher de notification d'erreur pour les PM connectés
      } else {
        console.log(`❌ Erreur ${response.status}: ${response.statusText}`);
        // Ne pas afficher de toast pour éviter les notifications répétées
      }
    } catch (error) {
      console.log('❌ Erreur de connexion au serveur:', error);
      // Ne pas afficher de toast pour éviter les notifications répétées
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Statistiques Project Manager
              </h1>
              <p className="text-gray-600">
                Vue d'ensemble de vos performances et activités
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Année
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Campagnes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Campagnes Actives</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Candidatures</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enquêteurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalControllers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques des candidatures */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Candidatures Approuvées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedApplications}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalApplications > 0 
                    ? `${Math.round((stats.approvedApplications / stats.totalApplications) * 100)}% du total`
                    : '0% du total'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Candidatures Rejetées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedApplications}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalApplications > 0 
                    ? `${Math.round((stats.rejectedApplications / stats.totalApplications) * 100)}% du total`
                    : '0% du total'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalApplications > 0 
                    ? `${Math.round((stats.pendingApplications / stats.totalApplications) * 100)}% du total`
                    : '0% du total'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques et tableaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Campagnes par statut */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campagnes par Statut</h3>
            <div className="space-y-3">
              {Object.entries(stats.campaignsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top campagnes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Campagnes</h3>
            <div className="space-y-3">
              {stats.topCampaigns.slice(0, 5).map((campaign, index) => (
                <div key={campaign.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">#{index + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      <div className="text-xs text-gray-500">
                        {campaign.applications} candidatures • {campaign.approved} approuvées
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                    {getStatusLabel(campaign.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Évolution des candidatures */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Évolution des Candidatures</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approuvées
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejetées
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux d'approbation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.applicationsByMonth.map((month, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.applications}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.approved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.rejected}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.applications > 0 
                        ? `${Math.round((month.approved / month.applications) * 100)}%`
                        : '0%'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Résumé des performances */}
        <div className="bg-blue-50 rounded-xl shadow p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Résumé des Performances</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Efficacité des Campagnes</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {stats.totalCampaigns} campagnes créées</li>
                <li>• {stats.activeCampaigns} campagnes actives</li>
                <li>• {stats.completedCampaigns} campagnes terminées</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Gestion des Candidatures</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {stats.totalApplications} candidatures reçues</li>
                <li>• {stats.approvedApplications} candidatures approuvées</li>
                <li>• {stats.rejectedApplications} candidatures rejetées</li>
                <li>• {stats.pendingApplications} candidatures en attente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMStats;
