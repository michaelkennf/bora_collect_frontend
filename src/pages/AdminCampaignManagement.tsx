import React, { useState, useEffect } from 'react';
import { environment } from '../config/environment';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  targetProvince?: string;
  selectedODD?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  publisher?: {
    id: string;
    name: string;
  };
}

const AdminCampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [filters, setFilters] = useState({
    province: '',
    odd: '',
    status: ''
  });

  const PROVINCES = [
    'BAS_UELE', 'EQUATEUR', 'HAUT_KATANGA', 'HAUT_LOMAMI', 'HAUT_UELE',
    'ITURI', 'KASAI', 'KASAI_CENTRAL', 'KASAI_ORIENTAL', 'KINSHASA',
    'KONGO_CENTRAL', 'KWANGO', 'KWILU', 'LOMAMI', 'LUALABA',
    'MAI_NDOMBE', 'MANIEMA', 'MONGALA', 'NORD_KIVU', 'NORD_UBANGI',
    'SANKURU', 'SUD_KIVU', 'SUD_UBANGI', 'TANGANYIKA', 'TSHOPO', 'TSHUAPA'
  ];

  const ODD_OPTIONS = Array.from({ length: 17 }, (_, i) => ({
    value: i + 1,
    label: `ODD ${i + 1}`
  }));

  const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminée' },
    { value: 'PENDING', label: 'En attente' }
  ];

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [campaigns, filters]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${environment.apiBaseUrl}/surveys/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...campaigns];

    if (filters.province) {
      filtered = filtered.filter(campaign => campaign.targetProvince === filters.province);
    }

    if (filters.odd) {
      filtered = filtered.filter(campaign => campaign.selectedODD === parseInt(filters.odd));
    }

    if (filters.status) {
      filtered = filtered.filter(campaign => campaign.status === filters.status);
    }

    setFilteredCampaigns(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      province: '',
      odd: '',
      status: ''
    });
  };

  // Fonction pour gérer le retournement des cartes
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'PENDING': return 'En attente';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getODDColor = (odd: number) => {
    const colors = [
      '#E74C3C', '#F39C12', '#27AE60', '#8E44AD', '#E67E22',
      '#3498DB', '#F1C40F', '#2ECC71', '#E67E22', '#E74C3C',
      '#F39C12', '#27AE60', '#2ECC71', '#3498DB', '#27AE60',
      '#8E44AD', '#2ECC71'
    ];
    return colors[odd - 1] || '#6C5CE7';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Province
            </label>
            <select
              value={filters.province}
              onChange={(e) => handleFilterChange('province', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les provinces</option>
              {PROVINCES.map(province => (
                <option key={province} value={province}>
                  {province.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ODD
            </label>
            <select
              value={filters.odd}
              onChange={(e) => handleFilterChange('odd', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les ODD</option>
              {ODD_OPTIONS.map(odd => (
                <option key={odd.value} value={odd.value}>
                  {odd.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Effacer les filtres
          </button>
        </div>
      </div>

      {/* Compteur Campagnes avec effet de retournement - Style PM */}
      <div className="flex justify-center">
        <div 
          className="relative w-full max-w-sm h-32 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
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
                  <svg className="w-8 h-8 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div className="text-sm font-semibold">Total Campagnes</div>
                <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
              </div>
            </div>
            {/* Verso */}
            <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
              <div className="text-center text-white">
                <div className="text-3xl font-bold mb-2">
                  <span className="animate-bounce hover:animate-pulse transition-all duration-300 hover:scale-110 hover:text-yellow-200">
                    {filteredCampaigns.length}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div>En cours: <span className="animate-bounce font-bold">{filteredCampaigns.filter(c => c.status === 'ACTIVE').length}</span></div>
                  <div>Terminées: <span className="animate-bounce font-bold">{filteredCampaigns.filter(c => c.status === 'COMPLETED').length}</span></div>
                  <div>En attente: <span className="animate-bounce font-bold">{filteredCampaigns.filter(c => c.status === 'PENDING').length}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS pour les animations 3D */}
      <style>{`
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
      `}</style>

      {/* Liste des campagnes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Campagnes ({filteredCampaigns.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campagne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Province
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ODD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{campaign.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.publisher ? campaign.publisher.name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.targetProvince ? campaign.targetProvince.replace(/_/g, ' ') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {campaign.selectedODD ? (
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2"
                          style={{ backgroundColor: getODDColor(campaign.selectedODD) }}
                        >
                          {campaign.selectedODD}
                        </div>
                        <span className="text-sm text-gray-900">ODD {campaign.selectedODD}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusLabel(campaign.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      {campaign.startDate && (
                        <div>Début: {new Date(campaign.startDate).toLocaleDateString('fr-FR')}</div>
                      )}
                      {campaign.endDate && (
                        <div>Fin: {new Date(campaign.endDate).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune campagne</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucune campagne ne correspond aux filtres sélectionnés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampaignManagement;
