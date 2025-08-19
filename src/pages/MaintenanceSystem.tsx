import React, { useState } from 'react';

export default function MaintenanceSystem() {
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // Téléchargement du backup
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('http://localhost:3000/maintenance/backup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let fileName = 'backup.sql';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      window.alert('Sauvegarde terminée et téléchargée.');
    } catch (e: any) {
      window.alert(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setBackupLoading(false);
    }
  };

  // Optimisation
  const handleOptimize = async () => {
    setOptimizeLoading(true);
    try {
      const res = await fetch('http://localhost:3000/maintenance/optimize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors de l\'optimisation');
      window.alert('Optimisation terminée avec succès.');
    } catch (e: any) {
      window.alert(e.message || 'Erreur lors de l\'optimisation');
    } finally {
      setOptimizeLoading(false);
    }
  };

  // Affichage des logs
  const handleLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/maintenance/logs?lines=100', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la récupération des logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e: any) {
      setLogs(['Erreur lors de la récupération des logs']);
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold text-center mb-8">Maintenance du système</h2>
      <div className="space-y-8">
        {/* Sauvegarde */}
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2 text-blue-800">Backup (Sauvegarde)</h3>
          <p className="mb-4 text-gray-700">Effectuez une sauvegarde complète de la base de données du système.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-60" onClick={handleBackup} disabled={backupLoading}>
            {backupLoading ? 'Sauvegarde en cours...' : 'Lancer une sauvegarde'}
          </button>
        </div>
        {/* Optimisation */}
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2 text-green-800">Optimisation de la base de données</h3>
          <p className="mb-4 text-gray-700">Optimisez les performances de la base de données pour garantir la rapidité du système.</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-60" onClick={handleOptimize} disabled={optimizeLoading}>
            {optimizeLoading ? 'Optimisation...' : 'Optimiser la base de données'}
          </button>
        </div>
        {/* Logs */}
        <div className="bg-yellow-50 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2 text-yellow-800">Suivi des logs</h3>
          <p className="mb-4 text-gray-700">Consultez les logs système pour surveiller l'activité et détecter d'éventuels problèmes.</p>
          <button className="bg-yellow-600 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-700 transition disabled:opacity-60 mb-4" onClick={handleLogs} disabled={logsLoading}>
            {logsLoading ? 'Chargement...' : 'Voir les logs'}
          </button>
          {logs.length > 0 && (
            <div className="bg-gray-900 text-green-200 rounded p-4 mt-2 max-h-64 overflow-y-auto text-xs font-mono whitespace-pre-line border border-gray-300">
              {logs.map((line, idx) => <div key={idx}>{line}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 