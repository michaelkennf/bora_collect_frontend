import React, { useState, useEffect } from 'react';

export default function ExportsStats() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger les enregistrements
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/records', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Exporter en CSV
  const exportCSV = async () => {
    try {
      // D'abord récupérer l'ID de la campagne depuis les records
      const recordsResponse = await fetch('http://localhost:3000/records', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (!recordsResponse.ok) throw new Error('Erreur lors du chargement des records');
      const recordsData = await recordsResponse.json();
      
      if (recordsData.length === 0) {
        setError('Aucune donnée à exporter');
        return;
      }
      
      // Utiliser l'ID de la campagne du premier record
      const campaignId = recordsData[0].surveyId;
      
      const res = await fetch(`http://localhost:3000/records/campaign/${campaignId}/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors de l\'export');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enquetes_cuisson_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export CSV');
    }
  };

  // Exporter en PDF
  const exportPDF = async () => {
    try {
      const res = await fetch('http://localhost:3000/records/export/pdf', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Erreur lors de l\'export');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enquetes_cuisson_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export PDF');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Export des Statistiques</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-4xl font-extrabold text-blue-700 mb-2">{records.length}</div>
          <div className="text-gray-600">Total des enquêtes</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-4xl font-extrabold text-green-700 mb-2">
            {records.filter(r => r.status === 'SENT').length}
          </div>
          <div className="text-gray-600">Enquêtes envoyées</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <div className="text-4xl font-extrabold text-yellow-700 mb-2">
            {records.filter(r => r.status === 'PENDING').length}
          </div>
          <div className="text-gray-600">Enquêtes en attente</div>
        </div>
      </div>

      {/* Boutons d'export */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Exporter les données</h2>
        <div className="flex gap-4">
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📊 Exporter en CSV
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            📄 Exporter en PDF
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Les exports incluent toutes les enquêtes enregistrées dans le système.
        </p>
      </div>

      {/* Tableau des enregistrements récents */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Enquêtes récentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Auteur</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Commune/Quartier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.slice(0, 10).map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">
                    {new Date(record.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'SENT' ? 'bg-green-100 text-green-800' :
                      record.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status === 'SENT' ? 'Envoyé' :
                       record.status === 'PENDING' ? 'En attente' : record.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{record.author?.name || 'N/A'}</td>
                  <td className="px-4 py-2 text-sm">
                    {record.formData?.household?.communeQuartier || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length > 10 && (
          <p className="text-sm text-gray-600 mt-2 text-center">
            Affichage des 10 enquêtes les plus récentes. Utilisez les exports pour voir toutes les données.
          </p>
        )}
      </div>
    </div>
  );
} 
