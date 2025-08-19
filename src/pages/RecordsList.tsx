import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { syncService } from '../services/syncService';

interface Record {
  id: string;
  formData: {
    household: {
      nomOuCode: string;
      age: number;
      sexe: string;
      tailleMenage: number;
      communeQuartier: string;
      geolocalisation: string;
    };
    cooking: {
      combustibles: string[];
      equipements: string[];
      frequence: string;
      coutMensuel: number;
    };
    knowledge: {
      niveau: string;
      sources: string[];
      avantages: string[];
      inconvenients: string[];
    };
    constraints: {
      financieres: boolean;
      techniques: boolean;
      culturelles: boolean;
      disponibilite: boolean;
    };
    adoption: {
      solutionsAdoptees: string[];
      intentionAdoption: string;
      facteursDecision: string[];
    };
  };
  status: 'PENDING' | 'SENT' | 'PENDING_VALIDATION' | 'TO_CORRECT';
  authorId: string;
  createdAt: string;
  syncedAt?: string;
  comments?: any;
  validatedById?: string;
  author?: {
    name: string;
    email: string;
  };
}

interface RecordsListProps {
  onSyncComplete?: () => void;
}

export default function RecordsList({ onSyncComplete }: RecordsListProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    pendingCount: number;
    syncedCount: number;
    isOnline: boolean;
  }>({ pendingCount: 0, syncedCount: 0, isOnline: true });
  const [showDetails, setShowDetails] = useState<Record | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCommune, setFilterCommune] = useState<string>('');
  const navigate = useNavigate();

  // Communes de Kinshasa
  const communes = [
    'Gombe', 'Kinshasa', 'Kintambo', 'Ngaliema', 'Mont-Ngafula', 
    'Selembao', 'Bumbu', 'Makala', 'Ngiri-Ngiri', 'Kalamu', 
    'Kasa-Vubu', 'Bandalungwa', 'Lingwala', 'Barumbu', 'Matete', 
    'Lemba', 'Ngaba', 'Kisenso', 'Limete', 'Masina', 'Nsele', 
    'Maluku', 'Kimbaseke', 'Ndjili'
  ];

  // Récupérer l'ID de l'utilisateur connecté
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);
    }
  }, []);

  // Charger les enregistrements depuis le serveur
  const loadRecords = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const res = await fetch('http://localhost:3000/records', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des enregistrements');
      }
      
      const data = await res.json();
      
      // Filtrer par l'utilisateur connecté (seulement pour les contrôleurs)
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        if (userData.role === 'CONTROLLER') {
          const userRecords = data.filter((record: Record) => record.authorId === currentUserId);
          setRecords(userRecords);
        } else {
          // Les analystes et admins voient tous les enregistrements
          setRecords(data);
        }
      } else {
        setRecords(data);
      }
      
      // Mettre à jour le statut de synchronisation
      const status = await syncService.getSyncStatus();
      setSyncStatus({
        pendingCount: status.unsyncedCount,
        syncedCount: status.unsyncedCount === 0 ? records.length : records.length - status.unsyncedCount,
        isOnline: status.isOnline
      });
    } catch (err: any) {
      console.error('Erreur lors du chargement des enregistrements:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      loadRecords();
    }
  }, [currentUserId]);

  // Synchroniser les données locales
  const syncLocalData = async () => {
    if (!currentUserId) return;
    
    setSyncing(true);
    setError('');
    
    try {
      await syncService.syncLocalRecords();
      toast.success('Synchronisation terminée avec succès !');
      
      // Recharger les enregistrements
      await loadRecords();
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de synchronisation');
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  // Filtrer les enregistrements
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.formData.household.nomOuCode.toLowerCase().includes(search.toLowerCase()) ||
      record.formData.household.communeQuartier.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !filterStatus || record.status === filterStatus;
    const matchesCommune = !filterCommune || record.formData.household.communeQuartier === filterCommune;
    
    return matchesSearch && matchesStatus && matchesCommune;
  });

  // Obtenir le statut en français
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'SENT': return 'Envoyé';
      case 'PENDING_VALIDATION': return 'En validation';
      case 'TO_CORRECT': return 'À corriger';
      default: return status;
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-green-100 text-green-800';
      case 'PENDING_VALIDATION': return 'bg-blue-100 text-blue-800';
      case 'TO_CORRECT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Voir les détails d'un enregistrement
  const viewDetails = (record: Record) => {
    setShowDetails(record);
  };

  // Fermer le modal de détails
  const closeDetails = () => {
    setShowDetails(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Chargement des enregistrements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Liste des Enquêtes</h1>
        <div className="flex gap-4">
          <button
            onClick={syncLocalData}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {syncing ? '🔄 Synchronisation...' : '🔄 Synchroniser'}
          </button>
          <button
            onClick={() => navigate('/form')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            ➕ Nouvelle Enquête
          </button>
        </div>
      </div>

      {/* Statut de synchronisation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`w-3 h-3 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-blue-800">
              {syncStatus.isOnline ? '🌐 En ligne' : '📱 Hors ligne'}
            </span>
            <span className="text-sm text-blue-600">
              {syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} en attente de synchronisation` : 'Tout synchronisé'}
            </span>
          </div>
          <div className="text-sm text-blue-600">
            Total: {records.length} enquêtes
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              type="text"
              placeholder="Nom du ménage ou commune..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="SENT">Envoyé</option>
              <option value="PENDING_VALIDATION">En validation</option>
              <option value="TO_CORRECT">À corriger</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commune</label>
            <select
              value={filterCommune}
              onChange={(e) => setFilterCommune(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Toutes les communes</option>
              {communes.map(commune => (
                <option key={commune} value={commune}>{commune}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des enregistrements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ménage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commune/Quartier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Combustibles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-800 font-semibold text-sm">
                            {record.formData.household.nomOuCode[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.formData.household.nomOuCode}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.formData.household.age} ans, {record.formData.household.sexe}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.formData.household.communeQuartier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {record.formData.cooking.combustibles.slice(0, 2).map((combustible, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {combustible}
                        </span>
                      ))}
                      {record.formData.cooking.combustibles.length > 2 && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          +{record.formData.cooking.combustibles.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewDetails(record)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun enregistrement trouvé</p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Détails de l'Enquête</h3>
              <button
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Informations du ménage */}
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Informations du Ménage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Nom/Code:</span> {showDetails.formData.household.nomOuCode}
                  </div>
                  <div>
                    <span className="font-medium">Âge:</span> {showDetails.formData.household.age} ans
                  </div>
                  <div>
                    <span className="font-medium">Sexe:</span> {showDetails.formData.household.sexe}
                  </div>
                  <div>
                    <span className="font-medium">Taille du ménage:</span> {showDetails.formData.household.tailleMenage} personnes
                  </div>
                  <div>
                    <span className="font-medium">Commune/Quartier:</span> {showDetails.formData.household.communeQuartier}
                  </div>
                  <div>
                    <span className="font-medium">Géolocalisation:</span> {showDetails.formData.household.geolocalisation}
                  </div>
                </div>
              </div>

              {/* Solutions de cuisson */}
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Solutions de Cuisson</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Combustibles:</span>
                    <div className="mt-1">
                      {showDetails.formData.cooking.combustibles.map((combustible, index) => (
                        <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                          {combustible}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Équipements:</span>
                    <div className="mt-1">
                      {showDetails.formData.cooking.equipements.map((equipement, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                          {equipement}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Fréquence:</span> {showDetails.formData.cooking.frequence}
                  </div>
                  <div>
                    <span className="font-medium">Coût mensuel:</span> {showDetails.formData.cooking.coutMensuel} FC
                  </div>
                </div>
              </div>

              {/* Connaissances et perceptions */}
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">Connaissances et Perceptions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Niveau de connaissance:</span> {showDetails.formData.knowledge.niveau}
                  </div>
                  <div>
                    <span className="font-medium">Sources d'information:</span>
                    <div className="mt-1">
                      {showDetails.formData.knowledge.sources.map((source, index) => (
                        <span key={index} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contraintes */}
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">Contraintes Identifiées</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Financières:</span> {showDetails.formData.constraints.financieres ? 'Oui' : 'Non'}
                  </div>
                  <div>
                    <span className="font-medium">Techniques:</span> {showDetails.formData.constraints.techniques ? 'Oui' : 'Non'}
                  </div>
                  <div>
                    <span className="font-medium">Culturelles:</span> {showDetails.formData.constraints.culturelles ? 'Oui' : 'Non'}
                  </div>
                  <div>
                    <span className="font-medium">Disponibilité:</span> {showDetails.formData.constraints.disponibilite ? 'Oui' : 'Non'}
                  </div>
                </div>
              </div>

              {/* Adoption */}
              <div>
                <h4 className="font-semibold text-indigo-600 mb-2">Adoption des Solutions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Solutions adoptées:</span>
                    <div className="mt-1">
                      {showDetails.formData.adoption.solutionsAdoptees.map((solution, index) => (
                        <span key={index} className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                          {solution}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Intention d'adoption:</span> {showDetails.formData.adoption.intentionAdoption}
                  </div>
                </div>
              </div>

              {/* Métadonnées */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-600 mb-2">Informations Système</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Statut:</span> {getStatusLabel(showDetails.status)}
                  </div>
                  <div>
                    <span className="font-medium">Créé le:</span> {new Date(showDetails.createdAt).toLocaleString('fr-FR')}
                  </div>
                  {showDetails.syncedAt && (
                    <div>
                      <span className="font-medium">Synchronisé le:</span> {new Date(showDetails.syncedAt).toLocaleString('fr-FR')}
                    </div>
                  )}
                  {showDetails.author && (
                    <div>
                      <span className="font-medium">Auteur:</span> {showDetails.author.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeDetails}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 