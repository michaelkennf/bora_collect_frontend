import React, { useState, useEffect } from 'react';
import { environment } from '../config/environment';
import CarteRDCSVG from '../components/CarteRDCSVG';

interface UserStats {
  totalProjectManagers: number;
  totalEnumerators: number;
  totalAnalysts: number;
  projectManagersByProvince: { [key: string]: number };
  enumeratorsByProvince: { [key: string]: number };
  analystsByProvince: { [key: string]: number };
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingCampaigns: number;
  campaignsByProvince: { [key: string]: number };
  campaignsByODD: { [key: string]: number };
}

const AdminDashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats>({
    totalProjectManagers: 0,
    totalEnumerators: 0,
    totalAnalysts: 0,
    projectManagersByProvince: {},
    enumeratorsByProvince: {},
    analystsByProvince: {}
  });

  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    pendingCampaigns: 0,
    campaignsByProvince: {},
    campaignsByODD: {}
  });

  const [loading, setLoading] = useState(true);

  const PROVINCES = [
    'BAS_UELE', 'EQUATEUR', 'HAUT_KATANGA', 'HAUT_LOMAMI', 'HAUT_UELE',
    'ITURI', 'KASAI', 'KASAI_CENTRAL', 'KASAI_ORIENTAL', 'KINSHASA',
    'KONGO_CENTRAL', 'KWANGO', 'KWILU', 'LOMAMI', 'LUALABA',
    'MAI_NDOMBE', 'MANIEMA', 'MONGALA', 'NORD_KIVU', 'NORD_UBANGI',
    'SANKURU', 'SUD_KIVU', 'SUD_UBANGI', 'TANGANYIKA', 'TSHOPO', 'TSHUAPA'
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Récupérer les statistiques des utilisateurs
      const usersResponse = await fetch(`${environment.apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();

        const stats: UserStats = {
          totalProjectManagers: users.filter((u: any) => u.role === 'ANALYST').length,
          totalEnumerators: users.filter((u: any) => u.role === 'CONTROLLER').length,
          totalAnalysts: users.filter((u: any) => u.role === 'ANALYST').length,
          projectManagersByProvince: {},
          enumeratorsByProvince: {},
          analystsByProvince: {}
        };

        // Calculer les statistiques par province
        PROVINCES.forEach(province => {
          const provinceUsers = users.filter((u: any) => u.targetProvince === province);
          stats.projectManagersByProvince[province] = provinceUsers.filter((u: any) => u.role === 'ANALYST').length;
          stats.enumeratorsByProvince[province] = provinceUsers.filter((u: any) => u.role === 'CONTROLLER').length;
          stats.analystsByProvince[province] = provinceUsers.filter((u: any) => u.role === 'ANALYST').length;
        });

        setUserStats(stats);
      }

      // Récupérer les statistiques des campagnes
      const campaignsResponse = await fetch(`${environment.apiBaseUrl}/surveys/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (campaignsResponse.ok) {
        const campaigns = await campaignsResponse.json();
        
        const campaignStats: CampaignStats = {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
          completedCampaigns: campaigns.filter((c: any) => c.status === 'COMPLETED').length,
          pendingCampaigns: campaigns.filter((c: any) => c.status === 'PENDING').length,
          campaignsByProvince: {},
          campaignsByODD: {}
        };

        // Calculer les statistiques par province et ODD
        PROVINCES.forEach(province => {
          campaignStats.campaignsByProvince[province] = campaigns.filter((c: any) => c.targetProvince === province).length;
        });

        // Calculer par ODD (1-17)
        for (let i = 1; i <= 17; i++) {
          campaignStats.campaignsByODD[`ODD ${i}`] = campaigns.filter((c: any) => c.selectedODD === i).length;
        }

        setCampaignStats(campaignStats);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Carte Interactive de la RDC */}
      <CarteRDCSVG />

      {/* Statistiques des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Project Managers</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats.totalProjectManagers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enquêteurs</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats.totalEnumerators}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Analystes</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats.totalAnalysts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques des campagnes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campagnes</p>
              <p className="text-2xl font-semibold text-gray-900">{campaignStats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-semibold text-gray-900">{campaignStats.activeCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-semibold text-gray-900">{campaignStats.completedCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-semibold text-gray-900">{campaignStats.pendingCampaigns}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
