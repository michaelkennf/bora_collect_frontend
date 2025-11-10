import React, { useState, useEffect } from 'react';
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
import { environment } from '../config/environment';

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

interface AdminStatisticsProps {
  onRefresh?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Record {
  id: string;
  status: string;
  createdAt: string;
  authorId: string;
}

interface Stats {
  users: {
    total: number;
    active: number;
    deleted: number;
    byRole: { role: string; count: number }[];
  };
  records: {
    total: number;
    byStatus: { status: string; count: number }[];
    byCommune: { commune: string; count: number }[];
  };
}

export default function AdminStatistics({ onRefresh }: AdminStatisticsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats>({
    users: { total: 0, active: 0, deleted: 0, byRole: [] },
    records: { total: 0, byStatus: [], byCommune: [] }
  });

  // Charger les données
  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger les utilisateurs
      const usersRes = await fetch(`${environment.apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!usersRes.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const usersData = await usersRes.json();

      // Charger les enregistrements
      const recordsRes = await fetch(`${environment.apiBaseUrl}/records`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!recordsRes.ok) throw new Error('Erreur lors du chargement des enregistrements');
      const recordsData = await recordsRes.json();

      // Calculer les statistiques
      calculateStats(usersData, recordsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (usersData: User[], recordsData: Record[]) => {
    // Statistiques des utilisateurs
    const usersByRole = usersData.reduce((acc: any, user: User) => {
      if (user.status === 'ACTIVE') {
        acc[user.role] = (acc[user.role] || 0) + 1;
      }
      return acc;
    }, {});

    const usersStats = {
      total: usersData.length,
      active: usersData.filter(u => u.status === 'ACTIVE').length,
      deleted: usersData.filter(u => u.status === 'DELETED').length,
      byRole: Object.entries(usersByRole).map(([role, count]) => ({ role, count: count as number }))
    };

    // Statistiques des enregistrements
    const recordsByStatus = recordsData.reduce((acc: any, record: Record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    const recordsByCommune = recordsData.reduce((acc: any) => {
      // Extraire la commune depuis formData (si disponible)
      const commune = 'Commune inconnue'; // À adapter selon la structure des données
      acc[commune] = (acc[commune] || 0) + 1;
      return acc;
    }, {});

    const recordsStats = {
      total: recordsData.length,
      byStatus: Object.entries(recordsByStatus).map(([status, count]) => ({ status, count: count as number })),
      byCommune: Object.entries(recordsByCommune).map(([commune, count]) => ({ commune, count: count as number }))
    };

    setStats({
      users: usersStats,
      records: recordsStats
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Données pour les graphiques
  const userRoleData = {
    labels: stats.users.byRole.map(item => item.role),
    datasets: [{
      label: 'Utilisateurs par rôle',
      data: stats.users.byRole.map(item => item.count),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 1,
    }]
  };

  const recordStatusData = {
    labels: stats.records.byStatus.map(item => item.status),
    datasets: [{
      label: 'Enregistrements par statut',
      data: stats.records.byStatus.map(item => item.count),
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 1,
    }]
  };

  const communeData = {
    labels: stats.records.byCommune.map(item => item.commune),
    datasets: [{
      label: 'Enregistrements par commune',
      data: stats.records.byCommune.map(item => item.count),
      backgroundColor: 'rgba(147, 51, 234, 0.8)',
      borderColor: 'rgba(147, 51, 234, 1)',
      borderWidth: 1,
    }]
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Statistiques Administratives</h1>
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.users.total}</div>
          <div className="text-gray-600">Total des utilisateurs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.users.active}</div>
          <div className="text-gray-600">Utilisateurs actifs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">{stats.users.deleted}</div>
          <div className="text-gray-600">Utilisateurs supprimés</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.records.total}</div>
          <div className="text-gray-600">Total des enquêtes</div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Utilisateurs par rôle */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Utilisateurs par Rôle</h3>
          <div className="h-80">
            <Bar
              data={userRoleData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Statut des enregistrements */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Statut des Enregistrements</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={recordStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Graphique des communes */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">Enregistrements par Commune</h3>
        <div className="h-80">
          <Bar
            data={communeData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Détails des statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Utilisateurs par rôle */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Utilisateurs par Rôle</h3>
          <div className="space-y-2">
            {stats.users.byRole.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{item.role}</span>
                <span className="text-blue-600 font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enregistrements par statut */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Enregistrements par Statut</h3>
          <div className="space-y-2">
            {stats.records.byStatus.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{item.status}</span>
                <span className="text-green-600 font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
