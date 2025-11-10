import { useState, useEffect } from 'react';
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
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface AdminDashboardChartsProps {
  users: any[];
}

export default function AdminDashboardCharts({ users }: AdminDashboardChartsProps) {
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Charger le nombre de demandes d'approbation en attente
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`http://localhost:3000/users/approval-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPendingApprovals(data.pending || 0);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des demandes d\'approbation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  if (!users || users.length === 0) return null;

  // Statistiques des utilisateurs par rôle
  const usersByRole = {
    admin: users.filter((u: any) => u.role === 'ADMIN').length,
    controller: users.filter((u: any) => u.role === 'CONTROLLER').length,
    supervisor: 0, // Rôle SUPERVISOR supprimé
    analyst: users.filter((u: any) => u.role === 'ANALYST').length,
    projectManager: users.filter((u: any) => u.role === 'PROJECT_MANAGER').length,
  };

  // Données pour le graphique en anneau - Répartition des utilisateurs par sexe
  const genderData = {
    labels: ['Masculin', 'Féminin', 'Autre'],
    datasets: [
      {
        data: [
          users.filter((u: any) => u.gender === 'MALE' && u.status === 'ACTIVE').length,
          users.filter((u: any) => u.gender === 'FEMALE' && u.status === 'ACTIVE').length,
          users.filter((u: any) => u.gender === 'OTHER' && u.status === 'ACTIVE').length,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Bleu pour masculin
          'rgba(236, 72, 153, 0.8)',   // Rose pour féminin
          'rgba(16, 185, 129, 0.8)',   // Vert pour autre
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Données pour le graphique en anneau - Répartition des utilisateurs par rôle
  const roleData = {
    labels: ['Administrateurs', 'Enquêteurs', 'Analystes', 'Project Managers'],
    datasets: [
      {
        data: [usersByRole.admin, usersByRole.controller, usersByRole.analyst, usersByRole.projectManager],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Rouge pour admin
          'rgba(59, 130, 246, 0.8)',   // Bleu pour enquêteurs
          'rgba(245, 158, 11, 0.8)',   // Orange pour analystes
          'rgba(16, 185, 129, 0.8)',   // Vert pour project managers
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Données pour le graphique linéaire - Nouveaux utilisateurs par mois (6 mois à partir du mois actuel)
  const now = new Date();
  const currentMonth = now.getMonth(); // Mois actuel (0-indexed)
  const currentYear = now.getFullYear();
  const months = [];
  const newUsersCount = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
    months.push(monthName);
    
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const count = users.filter((user: any) => {
      const userDate = new Date(user.createdAt);
      return userDate >= monthStart && userDate <= monthEnd;
    }).length;
    
    newUsersCount.push(count);
  }

  const timeSeriesData = {
    labels: months,
    datasets: [
      {
        label: 'Nouveaux utilisateurs',
        data: newUsersCount,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Graphiques en anneau côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique en anneau - Répartition des utilisateurs par rôle */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Répartition des utilisateurs par rôle</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={roleData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  title: {
                    display: true,
                    text: 'Répartition des utilisateurs par rôle',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Graphique en anneau - Répartition des utilisateurs par sexe */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Répartition des utilisateurs par sexe</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={genderData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  title: {
                    display: true,
                    text: 'Répartition des utilisateurs par sexe',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Graphique linéaire - Évolution des nouveaux utilisateurs */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Évolution des nouveaux utilisateurs</h3>
        <div className="h-80">
          <Line
            data={timeSeriesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Nouveaux utilisateurs (6 mois à partir du mois actuel)',
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Nombre de nouveaux utilisateurs',
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: 'Date',
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 
