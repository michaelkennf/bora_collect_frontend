import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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

interface DashboardChartsProps {
  stats: {
    total: number;
    byStatus: { status: string; count: number }[];
    byCommune: { commune: string; count: number }[];
    byCombustible: { combustible: string; count: number }[];
    byEquipement: { equipement: string; count: number }[];
    timeSeries: { date: string; count: number }[];
  };
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  // Données pour le graphique en barres - Répartition par commune
  const communeData = {
    labels: stats.byCommune?.map((c: any) => c.commune) || [],
    datasets: [
      {
        label: 'Nombre d\'enquêtes',
        data: stats.byCommune?.map((c: any) => c.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique en barres - Répartition par combustible
  const combustibleData = {
    labels: stats.byCombustible?.map((c: any) => c.combustible) || [],
    datasets: [
      {
        label: 'Nombre d\'utilisations',
        data: stats.byCombustible?.map((c: any) => c.count) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique en barres - Répartition par équipement
  const equipementData = {
    labels: stats.byEquipement?.map((e: any) => e.equipement) || [],
    datasets: [
      {
        label: 'Nombre d\'utilisations',
        data: stats.byEquipement?.map((e: any) => e.count) || [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique en anneau - Répartition par statut
  const statusData = {
    labels: stats.byStatus?.map((s: any) => s.status) || [],
    datasets: [
      {
        data: stats.byStatus?.map((s: any) => s.count) || [],
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
        borderWidth: 2,
      },
    ],
  };

  // Données pour le graphique linéaire - Évolution temporelle
  const timeSeriesData = {
    labels: stats.timeSeries?.map((t: any) => new Date(t.date).toLocaleDateString('fr-FR')) || [],
    datasets: [
      {
        label: 'Enquêtes par jour',
        data: stats.timeSeries?.map((t: any) => t.count) || [],
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Graphique en barres - Répartition par commune */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Répartition des ménages enquêtés par commune</h3>
        <div className="h-80">
          <Bar
            data={communeData}
            options={{
              ...chartOptions,
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

      {/* Graphiques côte à côte pour combustibles et équipements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en barres - Répartition par combustible */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Types de combustibles utilisés</h3>
          <div className="h-80">
            <Bar
              data={combustibleData}
              options={{
                ...chartOptions,
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

        {/* Graphique en barres - Répartition par équipement */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Équipements de cuisson utilisés</h3>
          <div className="h-80">
            <Bar
              data={equipementData}
              options={{
                ...chartOptions,
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
      </div>

      {/* Graphiques côte à côte pour statut et évolution temporelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en anneau - Répartition par statut */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Statut des enquêtes</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={statusData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Graphique linéaire - Évolution temporelle */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Évolution des enquêtes dans le temps</h3>
          <div className="h-80">
            <Line
              data={timeSeriesData}
              options={{
                ...chartOptions,
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
      </div>

      {/* Statistiques résumées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-blue-800">Total des enquêtes</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.byStatus?.find((s: any) => s.status === 'SENT')?.count || 0}
          </div>
          <div className="text-green-800">Enquêtes envoyées</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.byStatus?.find((s: any) => s.status === 'PENDING')?.count || 0}
          </div>
          <div className="text-yellow-800">En attente</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.byCommune?.length || 0}
          </div>
          <div className="text-purple-800">Communes couvertes</div>
        </div>
      </div>
    </div>
  );
} 