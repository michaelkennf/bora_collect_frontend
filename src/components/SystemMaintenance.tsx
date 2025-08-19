import React, { useState } from 'react';

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  logs: string[];
}

const SystemMaintenance: React.FC = () => {
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      name: 'Sauvegarde de la base de données',
      description: 'Création d\'une sauvegarde complète de la base de données',
      status: 'pending',
      progress: 0,
      logs: [],
    },
    {
      id: '2',
      name: 'Nettoyage des fichiers temporaires',
      description: 'Suppression des fichiers temporaires et des logs anciens',
      status: 'pending',
      progress: 0,
      logs: [],
    },
    {
      id: '3',
      name: 'Optimisation de la base de données',
      description: 'Analyse et optimisation des performances de la base de données',
      status: 'pending',
      progress: 0,
      logs: [],
    },
    {
      id: '4',
      name: 'Vérification de l\'intégrité',
      description: 'Vérification de l\'intégrité des données et des fichiers',
      status: 'pending',
      progress: 0,
      logs: [],
    },
  ]);

  const [showLogs, setShowLogs] = useState<string | null>(null);

  const [systemStatus, setSystemStatus] = useState({
    database: 'healthy',
    backend: 'healthy',
    frontend: 'healthy',
    storage: 'healthy',
  });

  const startMaintenance = async (taskId: string) => {
    setMaintenanceTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running', startTime: new Date(), progress: 0 }
        : task
    ));

    // Simulation d'une tâche de maintenance
    const task = maintenanceTasks.find(t => t.id === taskId);
    if (!task) return;

    const interval = setInterval(() => {
      setMaintenanceTasks(prev => prev.map(t => {
        if (t.id === taskId && t.status === 'running') {
          const newProgress = Math.min(t.progress + Math.random() * 20, 100);
          const newLogs = [...t.logs, `Progression: ${Math.round(newProgress)}%`];
          
          if (newProgress >= 100) {
            clearInterval(interval);
            return {
              ...t,
              status: 'completed',
              progress: 100,
              endTime: new Date(),
              logs: newLogs,
            };
          }
          
          return {
            ...t,
            progress: newProgress,
            logs: newLogs,
          };
        }
        return t;
      }));
    }, 1000);
  };

  const startAllMaintenance = async () => {
    maintenanceTasks.forEach(task => {
      if (task.status === 'pending') {
        startMaintenance(task.id);
      }
    });
  };

  const resetTask = (taskId: string) => {
    setMaintenanceTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'pending', progress: 0, startTime: undefined, endTime: undefined, logs: [] }
        : task
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'running': return 'En cours';
      case 'completed': return 'Terminé';
      case 'failed': return 'Échoué';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Maintenance du Système</h1>
        <button
          onClick={startAllMaintenance}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Démarrer toutes les tâches
        </button>
      </div>

      {/* Statut du système */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl mb-2">🗄️</div>
          <div className="text-sm text-gray-600">Base de données</div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(systemStatus.database)}`}>
            {systemStatus.database === 'healthy' ? 'Sain' : 'Problème'}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl mb-2">⚙️</div>
          <div className="text-sm text-gray-600">Backend</div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(systemStatus.backend)}`}>
            {systemStatus.backend === 'healthy' ? 'Sain' : 'Problème'}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl mb-2">🖥️</div>
          <div className="text-sm text-gray-600">Frontend</div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(systemStatus.frontend)}`}>
            {systemStatus.frontend === 'healthy' ? 'Sain' : 'Problème'}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl mb-2">💾</div>
          <div className="text-sm text-gray-600">Stockage</div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(systemStatus.storage)}`}>
            {systemStatus.storage === 'healthy' ? 'Sain' : 'Problème'}
          </span>
        </div>
      </div>

      {/* Tâches de maintenance */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Tâches de Maintenance</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {maintenanceTasks.map((task) => (
            <div key={task.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium">{task.name}</h4>
                  <p className="text-gray-600">{task.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                    {getTaskStatusLabel(task.status)}
                  </span>
                  {task.status === 'pending' && (
                    <button
                      onClick={() => startMaintenance(task.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Démarrer
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button
                      onClick={() => resetTask(task.id)}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  )}
                  <button
                    onClick={() => setShowLogs(showLogs === task.id ? null : task.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    {showLogs === task.id ? 'Masquer' : 'Voir'} les logs
                  </button>
                </div>
              </div>

              {/* Barre de progression */}
              {task.status === 'running' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progression</span>
                    <span>{Math.round(task.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Informations de temps */}
              <div className="text-sm text-gray-500 mb-4">
                {task.startTime && (
                  <span className="mr-4">Début: {task.startTime.toLocaleTimeString()}</span>
                )}
                {task.endTime && (
                  <span>Fin: {task.endTime.toLocaleTimeString()}</span>
                )}
              </div>

              {/* Logs */}
              {showLogs === task.id && task.logs.length > 0 && (
                <div className="bg-gray-50 p-4 rounded border">
                  <h5 className="font-medium mb-2">Logs d'exécution:</h5>
                  <div className="max-h-32 overflow-y-auto">
                    {task.logs.map((log, index) => (
                      <div key={index} className="text-sm text-gray-700 py-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition-colors">
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-medium">Redémarrer le système</div>
          </button>
          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Générer un rapport</div>
          </button>
          <button className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors">
            <div className="text-2xl mb-2">🚨</div>
            <div className="font-medium">Mode d'urgence</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemMaintenance; 