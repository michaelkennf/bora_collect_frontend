import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { environment } from '../config/environment';

interface AnalystValidationStats {
  totalPending: number;
  totalValidated: number;
  totalNeedsReview: number;
  pendingByEnumerator: { enumeratorName: string; count: number }[];
  validatedByDate: { date: string; count: number }[];
  needsReviewByReason: { reason: string; count: number }[];
}

const AnalystValidationCharts: React.FC = () => {
  const [stats, setStats] = useState<AnalystValidationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${environment.apiBaseUrl}/validation/analyst-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-600">
        Aucune donnée disponible pour le moment
      </div>
    );
  }

  // Données pour le graphique circulaire de validation
  const validationChartData = {
    labels: ['Validés', 'À revoir', 'En attente'],
    datasets: [{
      data: [
        stats.totalValidated,
        stats.totalNeedsReview,
        stats.totalPending
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',    // Vert pour Validés
        'rgba(251, 146, 60, 0.8)',    // Orange pour À revoir
        'rgba(59, 130, 246, 0.8)'    // Bleu pour En attente
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(59, 130, 246, 1)'
      ],
      borderWidth: 2,
    }]
  };

  // Données pour le graphique en barres par enquêteur
  const enumeratorChartData = {
    labels: stats.pendingByEnumerator.map(e => e.enumeratorName),
    datasets: [{
      label: 'Formulaires en attente',
      data: stats.pendingByEnumerator.map(e => e.count),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  // Données pour l'évolution des validations par date
  const validationEvolutionData = {
    labels: stats.validatedByDate.map(d => new Date(d.date).toLocaleDateString('fr-FR')),
    datasets: [{
      label: 'Formulaires validés',
      data: stats.validatedByDate.map(d => d.count),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 1,
    }]
  };

  return (
    <div className="space-y-6">
      {/* Résumé global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalPending}</p>
              <p className="text-xs text-gray-500 mt-2">Formulaires</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M13,7V13H16V15H11V7H13Z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validés</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalValidated}</p>
              <p className="text-xs text-gray-500 mt-2">Formulaires</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9,12L11,14L15,10M19,8V19A2,2 0 0,1 17,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H16M17,3L19,5L17,7"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">À revoir</p>
              <p className="text-3xl font-bold text-orange-600">{stats.totalNeedsReview}</p>
              <p className="text-xs text-gray-500 mt-2">Formulaires</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M16,7C17.1,7 18,7.9 18,9C18,10.1 17.1,11 16,11C14.9,11 14,10.1 14,9C14,7.9 14.9,7 16,7M8,7C9.1,7 10,7.9 10,9C10,10.1 9.1,11 8,11C6.9,11 6,10.1 6,9C6,7.9 6.9,7 8,7M2,9C3,9 3.67,9.75 3.67,10.75C3.67,11.75 3,12.5 2,12.5C1,12.5 0.33,11.75 0.33,10.75C0.33,9.75 1,9 2,9M22,9C23,9 23.67,9.75 23.67,10.75C23.67,11.75 23,12.5 22,12.5C21,12.5 20.33,11.75 20.33,10.75C20.33,9.75 21,9 22,9M8,15C9.1,15 10,15.9 10,17C10,18.1 9.1,19 8,19C6.9,19 6,18.1 6,17C6,15.9 6.9,15 8,15M16,15C17.1,15 18,15.9 18,17C18,18.1 17.1,19 16,19C14.9,19 14,18.1 14,17C14,15.9 14.9,15 16,15M12,17C13.1,17 14,17.9 14,19C14,20.1 13.1,21 12,21C10.9,21 10,20.1 10,19C10,17.9 10.9,17 12,17Z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique circulaire - Vue globale de la validation */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
          Vue globale de la validation
        </h3>
        <div className="flex justify-center">
          <div style={{ width: '400px', height: '400px' }}>
            <Doughnut
              data={validationChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                      font: {
                        size: 14
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Graphique en barres - Formulaires en attente par enquêteur */}
      {stats.pendingByEnumerator.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
            Formulaires en attente par enquêteur
          </h3>
          <div style={{ height: '400px' }}>
            <Bar
              data={enumeratorChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  title: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Nombre de formulaires'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Enquêteurs'
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Graphique en barres - Évolution des validations */}
      {stats.validatedByDate.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
            Évolution des validations
          </h3>
          <div style={{ height: '400px' }}>
            <Bar
              data={validationEvolutionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Nombre de formulaires validés'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalystValidationCharts;
