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
  LineElement
);

interface AdminDashboardChartsProps {
  users: any[];
}

export default function AdminDashboardCharts({ users }: AdminDashboardChartsProps) {
  if (!users || users.length === 0) return null;

  // Statistiques des utilisateurs par rôle
  const usersByRole = {
    admin: users.filter((u: any) => u.role === 'ADMIN').length,
    controller: users.filter((u: any) => u.role === 'CONTROLLER').length,
    supervisor: 0, // Rôle SUPERVISOR supprimé
    analyst: users.filter((u: any) => u.role === 'ANALYST').length,
  };

  // Données pour le graphique en anneau - Répartition des utilisateurs par rôle
  const roleData = {
    labels: ['Administrateurs', 'Contrôleurs', 'Analystes'],
    datasets: [
      {
        data: [usersByRole.admin, usersByRole.controller, usersByRole.analyst],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Rouge pour admin
          'rgba(59, 130, 246, 0.8)',   // Bleu pour contrôleurs
          'rgba(245, 158, 11, 0.8)',   // Orange pour analystes
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Données pour le graphique linéaire - Nouveaux utilisateurs par jour (30 derniers jours)
  const now = new Date();
  const days = [];
  const newUsersCount = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    days.push(dateStr);
    
    const count = users.filter((user: any) => {
      const userDate = new Date(user.createdAt);
      return userDate.toISOString().slice(0, 10) === dateStr;
    }).length;
    
    newUsersCount.push(count);
  }

  const timeSeriesData = {
    labels: days.map(day => new Date(day).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })),
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
      {/* Graphiques en anneau et barres côte à côte */}
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
                  text: 'Nouveaux utilisateurs (30 derniers jours)',
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

      {/* Résumé des statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-blue-800">Total utilisateurs</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{users.filter((u: any) => u.status !== 'DELETED').length}</div>
          <div className="text-green-800">Utilisateurs actifs</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{users.filter((u: any) => u.status === 'DELETED').length}</div>
          <div className="text-orange-800">Utilisateurs supprimés</div>
        </div>
      </div>
    </div>
  );
} 