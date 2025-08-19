import React, { useState, useEffect } from 'react';
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
import { Bar, Doughnut } from 'react-chartjs-2';

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

interface ControllerDashboardChartsProps {
  personalStats?: any;
}

export default function ControllerDashboardCharts({ personalStats }: ControllerDashboardChartsProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        // Récupérer les vraies données depuis l'API
        const token = localStorage.getItem('token');
        if (!token) return;

        // Récupérer les statistiques des enregistrements
        const recordsResponse = await fetch('http://localhost:3000/records', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        if (recordsResponse.ok) {
          const records = await recordsResponse.json();
          
          console.log('📊 ControllerDashboardCharts - Données reçues:', records);
          
          // Si pas d'enregistrements, afficher un état vide
          if (!records || records.length === 0) {
            console.log('📊 ControllerDashboardCharts - Aucun enregistrement trouvé');
            setChartData({
              recordsByMonth: [],
              combustiblesData: [],
              equipementsData: []
            });
            return;
          }
          
          // Calculer les vraies statistiques
          const now = new Date();
          const last6Months = [];
          
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const count = records.filter((record: any) => {
              const recordDate = new Date(record.createdAt);
              return recordDate >= monthStart && recordDate <= monthEnd;
            }).length;
            
            last6Months.push({ month: monthName, count });
          }

          // Analyser les types de combustibles et équipements
          const combustiblesCount: { [key: string]: number } = {};
          const equipementsCount: { [key: string]: number } = {};

          records.forEach((record: any) => {
            if (record.formData?.cooking?.combustibles) {
              record.formData.cooking.combustibles.forEach((combustible: string) => {
                combustiblesCount[combustible] = (combustiblesCount[combustible] || 0) + 1;
              });
            }
            
            if (record.formData?.cooking?.equipements) {
              record.formData.cooking.equipements.forEach((equipement: string) => {
                equipementsCount[equipement] = (equipementsCount[equipement] || 0) + 1;
              });
            }
          });

          // Préparer les données pour les graphiques
          const combustiblesData = Object.entries(combustiblesCount).map(([name, count]) => ({
            name,
            count
          }));

          const equipementsData = Object.entries(equipementsCount).map(([name, count]) => ({
            name,
            count
          }));

          setChartData({
            recordsByMonth: last6Months,
            combustiblesData,
            equipementsData
          });

        } else {
          console.error('❌ Erreur lors de la récupération des données:', recordsResponse.status);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement des graphiques...</p>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune donnée disponible pour les graphiques</p>
      </div>
    );
  }

  // Données pour le graphique en barres - Évolution mensuelle
  const monthlyData = {
    labels: chartData.recordsByMonth.map((item: any) => item.month),
    datasets: [
      {
        label: 'Enquêtes par mois',
        data: chartData.recordsByMonth.map((item: any) => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Données pour le graphique en anneau - Répartition des combustibles
  const combustiblesChartData = {
    labels: chartData.combustiblesData.map((item: any) => item.name),
    datasets: [
      {
        data: chartData.combustiblesData.map((item: any) => item.count),
        backgroundColor: [
          'rgba(139, 69, 19, 0.8)',   // Marron pour le bois
          'rgba(47, 79, 79, 0.8)',    // Gris foncé pour le charbon
          'rgba(30, 144, 255, 0.8)',  // Bleu pour le gaz
          'rgba(255, 215, 0, 0.8)',   // Or pour l'électricité
          'rgba(160, 82, 45, 0.8)',   // Brun pour les briquettes
        ],
        borderColor: [
          'rgba(139, 69, 19, 1)',
          'rgba(47, 79, 79, 1)',
          'rgba(30, 144, 255, 1)',
          'rgba(255, 215, 0, 1)',
          'rgba(160, 82, 45, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Données pour le graphique en anneau - Répartition des équipements
  const equipementsChartData = {
    labels: chartData.equipementsData.map((item: any) => item.name),
    datasets: [
      {
        data: chartData.equipementsData.map((item: any) => item.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // Vert pour les foyers améliorés
          'rgba(245, 158, 11, 0.8)',  // Orange pour les foyers classiques
          'rgba(239, 68, 68, 0.8)',   // Rouge pour les foyers traditionnels
          'rgba(147, 51, 234, 0.8)',  // Violet pour les réchauds à gaz
          'rgba(59, 130, 246, 0.8)',  // Bleu pour les cuisinières électriques
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(147, 51, 234, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Graphique en barres - Évolution mensuelle */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Évolution des Enquêtes (6 derniers mois)</h3>
        <div className="h-80">
          <Bar
            data={monthlyData}
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

      {/* Graphiques en anneau côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par type de combustible */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Types de Combustibles Utilisés</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={combustiblesChartData}
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

        {/* Répartition par type d'équipement */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Équipements de Cuisson Utilisés</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={equipementsChartData}
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
      </div>

      {/* Statistiques résumées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {chartData.recordsByMonth.reduce((sum: number, item: any) => sum + item.count, 0)}
          </div>
          <div className="text-blue-800">Total des enquêtes (6 mois)</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {chartData.combustiblesData.length}
          </div>
          <div className="text-green-800">Types de combustibles</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {chartData.equipementsData.length}
          </div>
          <div className="text-purple-800">Types d'équipements</div>
        </div>
      </div>
    </div>
  );
} 