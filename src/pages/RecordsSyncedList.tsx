import React, { useEffect, useState } from 'react';

export default function RecordsSyncedList() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/records?status=SENT', {
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
    if (userData && userData.role === 'ANALYST') return;
    fetchRecords();
  }, []);

  // Fonction utilitaire pour afficher le statut lisible
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_VALIDATION': return 'En attente de validation';
      case 'SENT': return 'Validée';
      case 'TO_CORRECT': return 'À corriger';
      default: return status;
    }
  };

  if (userData && userData.role === 'ANALYST') {
    return <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-8 text-center text-red-600">Accès non autorisé pour l'analyste.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold text-center mb-6">Enquêtes Synchronisées - Solutions de Cuisson Propre</h2>
      {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
      {loading ? (
        <div>Chargement...</div>
      ) : records.length === 0 ? (
        <div className="text-center text-gray-500">Aucune enquête synchronisée trouvée.</div>
      ) : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Ménage</th>
              <th className="p-2">Commune/Quartier</th>
              <th className="p-2">GPS</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="bg-green-50">
                <td className="p-2">{r.formData?.household?.nomOuCode || 'N/A'}</td>
                <td className="p-2">{r.formData?.household?.communeQuartier || 'N/A'}</td>
                <td className="p-2 text-xs font-mono">
                  {r.formData?.household?.geolocalisation ? '📍 GPS' : '❌ Pas de GPS'}
                </td>
                <td className="p-2 font-semibold">{getStatusLabel(r.status)}</td>
                <td className="p-2 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2">
                  <button onClick={() => setSelected(r)} className="bg-blue-600 text-white px-2 py-1 rounded shadow">Voir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Modal de consultation - Solutions de Cuisson Propre */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* En-tête avec bouton fermer */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-blue-800">📋 Détails de l'Enquête - Solutions de Cuisson Propre</h3>
              <button 
                onClick={() => setSelected(null)} 
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Informations générales */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>ID:</strong> {selected.id}</div>
                <div><strong>Statut:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    selected.status === 'SENT' ? 'bg-green-100 text-green-800' :
                    selected.status === 'PENDING_VALIDATION' ? 'bg-yellow-100 text-yellow-800' :
                    selected.status === 'TO_CORRECT' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusLabel(selected.status)}
                  </span>
                </div>
                <div><strong>Date création:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
                {selected.validatedAt && (
                  <div><strong>Date validation:</strong> {new Date(selected.validatedAt).toLocaleString()}</div>
                )}
              </div>
            </div>

            {/* Section 1: Identification du ménage */}
            {selected.formData?.household && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-lg font-bold text-blue-800 mb-4">1. Identification du Ménage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><strong>Nom/Code:</strong> {selected.formData.household.nomOuCode}</div>
                  <div><strong>Âge:</strong> {selected.formData.household.age}</div>
                  <div><strong>Sexe:</strong> {selected.formData.household.sexe}</div>
                  <div><strong>Taille du ménage:</strong> {selected.formData.household.tailleMenage}</div>
                  <div><strong>Commune/Quartier:</strong> {selected.formData.household.communeQuartier || 'Non renseigné'}</div>
                  <div className="col-span-2">
                    <strong>Géolocalisation GPS:</strong> 
                    <span className="ml-2 font-mono text-sm bg-green-100 px-2 py-1 rounded">
                      {selected.formData.household.geolocalisation}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Mode de cuisson actuelle */}
            {selected.formData?.cooking && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h4 className="text-lg font-bold text-green-800 mb-4">2. Mode de Cuisson Actuelle</h4>
                <div className="space-y-4">
                  <div>
                    <strong>Combustibles utilisés:</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.formData.cooking.combustibles.map((combustible: string, idx: number) => (
                        <span key={idx} className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm">
                          {combustible}
                        </span>
                      ))}
                    </div>
                    {selected.formData.cooking.autresCombustibles && (
                      <div className="mt-2">
                        <strong>Autres combustibles:</strong> {selected.formData.cooking.autresCombustibles}
                      </div>
                    )}
                  </div>
                  <div>
                    <strong>Équipements de cuisson:</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.formData.cooking.equipements.map((equipement: string, idx: number) => (
                        <span key={idx} className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm">
                          {equipement}
                        </span>
                      ))}
                    </div>
                    {selected.formData.cooking.autresEquipements && (
                      <div className="mt-2">
                        <strong>Autres équipements:</strong> {selected.formData.cooking.autresEquipements}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Connaissance des solutions propres */}
            {selected.formData?.knowledge && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="text-lg font-bold text-yellow-800 mb-4">3. Connaissance des Solutions Propres</h4>
                <div className="space-y-4">
                  <div><strong>Connaissance des solutions:</strong> {selected.formData.knowledge.connaissanceSolutions}</div>
                  {selected.formData.knowledge.solutionsConnaissances && (
                    <div><strong>Solutions connues:</strong> {selected.formData.knowledge.solutionsConnaissances}</div>
                  )}
                  <div>
                    <strong>Avantages perçus:</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.formData.knowledge.avantages.map((avantage: string, idx: number) => (
                        <span key={idx} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm">
                          {avantage}
                        </span>
                      ))}
                    </div>
                    {selected.formData.knowledge.autresAvantages && (
                      <div className="mt-2">
                        <strong>Autres avantages:</strong> {selected.formData.knowledge.autresAvantages}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Perceptions et contraintes */}
            {selected.formData?.constraints && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg">
                <h4 className="text-lg font-bold text-red-800 mb-4">4. Perceptions et Contraintes</h4>
                <div className="space-y-4">
                  <div>
                    <strong>Obstacles identifiés:</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.formData.constraints.obstacles.map((obstacle: string, idx: number) => (
                        <span key={idx} className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm">
                          {obstacle}
                        </span>
                      ))}
                    </div>
                    {selected.formData.constraints.autresObstacles && (
                      <div className="mt-2">
                        <strong>Autres obstacles:</strong> {selected.formData.constraints.autresObstacles}
                      </div>
                    )}
                  </div>
                  <div><strong>Disposition à changer:</strong> {selected.formData.constraints.pretA}</div>
                </div>
              </div>
            )}

            {/* Section 5: Intention d'adoption */}
            {selected.formData?.adoption && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="text-lg font-bold text-purple-800 mb-4">5. Intention d'Adoption</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Prêt à acheter un foyer amélioré:</strong>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      selected.formData.adoption.pretAcheterFoyer === 'Oui' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selected.formData.adoption.pretAcheterFoyer}
                    </span>
                  </div>
                  <div>
                    <strong>Prêt à utiliser un réchaud GPL:</strong>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      selected.formData.adoption.pretAcheterGPL === 'Oui' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selected.formData.adoption.pretAcheterGPL}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton fermer en bas */}
            <div className="flex justify-center pt-4 border-t">
              <button 
                onClick={() => setSelected(null)} 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 