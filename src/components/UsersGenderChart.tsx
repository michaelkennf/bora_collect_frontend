import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  gender?: string;
  status: string;
}

interface UsersGenderChartProps {
  users: User[];
}

export default function UsersGenderChart({ users }: UsersGenderChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (users.length > 0) {
      // Compter les utilisateurs par sexe
      const genderCounts = {
        MALE: 0,
        FEMALE: 0,
        OTHER: 0
      };

      users.forEach(user => {
        if (user.gender && user.status === 'ACTIVE') {
          genderCounts[user.gender as keyof typeof genderCounts]++;
        }
      });

      // Préparer les données pour le graphique
      const data = {
        labels: ['Masculin', 'Féminin', 'Autre'],
        datasets: [
          {
            data: [genderCounts.MALE, genderCounts.FEMALE, genderCounts.OTHER],
            backgroundColor: [
              '#3B82F6', // Bleu pour masculin
              '#EC4899', // Rose pour féminin
              '#10B981', // Vert pour autre
            ],
            borderColor: [
              '#2563EB',
              '#DB2777',
              '#059669',
            ],
            borderWidth: 2,
          },
        ],
      };

      setChartData(data);
      setLoading(false);
    }
  }, [users]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Répartition par Sexe</h3>
        <div className="text-center text-gray-500 py-8">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  // Calculer les pourcentages
  const total = chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
  const percentages = chartData.datasets[0].data.map((value: number) => 
    total > 0 ? Math.round((value / total) * 100) : 0
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Répartition des Utilisateurs par Sexe</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique */}
        <div className="flex justify-center">
          <div className="w-48 h-48">
            <Doughnut 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                      pointStyle: 'circle',
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const percentage = percentages[context.dataIndex];
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                Masculin
              </span>
              <span className="font-semibold">
                {chartData.datasets[0].data[0]} ({percentages[0]}%)
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                Féminin
              </span>
              <span className="font-semibold">
                {chartData.datasets[0].data[1]} ({percentages[1]}%)
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                Autre
              </span>
              <span className="font-semibold">
                {chartData.datasets[0].data[2]} ({percentages[2]}%)
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{total}</div>
              <div className="text-sm text-gray-600">Total d'utilisateurs actifs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 