import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { syncService } from '../services/syncService';
import { localStorageService } from '../services/localStorageService';

interface Record {
  id: string;
  formData: {
    household: {
      nomOuCode: string;
      age: string;
      sexe: 'Homme' | 'Femme';
      tailleMenage: string;
      communeQuartier: string;
      geolocalisation: string;
    };
    cooking: {
      combustibles: string[];
      equipements: string[];
      autresCombustibles?: string;
      autresEquipements?: string;
    };
    knowledge: {
      connaissanceSolutions: 'Oui' | 'Non';
      solutionsConnaissances?: string;
      avantages: string[];
      autresAvantages?: string;
    };
    constraints: {
      obstacles: string[];
      autresObstacles?: string;
      pretA: string;
    };
    adoption: {
      pretAcheterFoyer: 'Oui' | 'Non';
      pretAcheterGPL: 'Oui' | 'Non';
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
  synced?: boolean; // Added for local records
}

interface RecordsListProps {
}

export default function RecordsList() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Communes de Kinshasa
  const communes = [
    'Gombe', 'Kinshasa', 'Kintambo', 'Ngaliema', 'Mont-Ngafula', 
    'Selembao', 'Bumbu', 'Makala', 'Ngiri-Ngiri', 'Kalamu', 
    'Kasa-Vubu', 'Bandalungwa', 'Lingwala', 'Barumbu', 'Matete', 
    'Lemba', 'Ngaba', 'Kisenso', 'Limete', 'Masina', 'Nsele', 
    'Maluku', 'Kimbaseke', 'Ndjili'
  ];

  // Fonction utilitaire pour valider la structure des données
  const isValidRecord = (record: any): record is Record => {
    return record && 
           record.formData && 
           record.formData.household && 
           record.formData.cooking && 
           record.formData.knowledge && 
           record.formData.constraints && 
           record.formData.adoption;
  };

  // Fonction de vérification de cohérence des données
  const verifyDataConsistency = (record: Record) => {
    if (!record || !record.formData) return false;
    
    // Vérifier que l'ID de l'enregistrement correspond
    if (record.id !== showDetails?.id) return false;
    
    // Vérifier que les données de base correspondent
    if (record.formData.household?.nomOuCode !== showDetails?.formData?.household?.nomOuCode) return false;
    
    return true;
  };

  // Fonction utilitaire pour déterminer le statut de synchronisation (LOGIQUE SIMPLIFIÉE ET FONCTIONNELLE)
  const getRecordSyncStatus = (record: any) => {
    // CAS 1: Enregistrement local (commence par 'local_')
    if (record.id && record.id.toString().startsWith('local_')) {
      // Pour les enregistrements locaux, vérifier le flag synced
      if (record.synced === true) {
        return 'SYNCED';
      } else {
        return 'UNSYNCED';
      }
    }
    
    // CAS 2: Enregistrement du serveur (ne commence PAS par 'local_')
    // Tous les enregistrements serveur sont considérés comme synchronisés
    return 'SYNCED';
  };

  // Fonction pour obtenir le statut de synchronisation (version simplifiée)
  const getSyncStatusDisplay = (record: any) => {
    const syncStatus = getRecordSyncStatus(record);
    
    if (syncStatus === 'SYNCED') {
      return { label: 'Synchronisé', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Non synchronisé', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // Obtenir le statut en français (maintenant basé sur la synchronisation)
  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Statut inconnu';
    
    // Vérifier si l'enregistrement a été synchronisé avec le serveur
    if (status === 'SENT') {
      return 'Synchronisé';
    } else {
      // Tous les autres statuts sont considérés comme non synchronisés
      return 'Non synchronisé';
    }
  };

  // Obtenir la couleur du statut (maintenant basé sur la synchronisation)
  const getStatusColor = (status: string) => {
    if (status === 'SENT') {
      return 'bg-green-100 text-green-800'; // Synchronisé
    } else {
      return 'bg-yellow-100 text-yellow-800'; // Non synchronisé
    }
  };

  // Voir les détails d'un enregistrement
  const viewDetails = (record: Record) => {
    // Vérifier que l'enregistrement a la structure attendue
    if (isValidRecord(record)) {
      setShowDetails(record);
    } else {
      toast.error('Structure de données invalide pour cet enregistrement');
      console.error('Enregistrement invalide:', record);
    }
  };

  // Fermer le modal de détails
  const closeDetails = () => {
    setShowDetails(null);
  };

  // Récupérer l'ID de l'utilisateur connecté
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);
    }
  }, []);

  // Charger les enregistrements depuis le serveur ET le stockage local
  const loadRecords = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      // Charger les enregistrements du serveur
      const user = localStorage.getItem('user');
      let apiUrl = 'http://localhost:3000/records';
      
      if (user) {
        const userData = JSON.parse(user);
        if (userData.role === 'CONTROLLER') {
          apiUrl = 'http://localhost:3000/records/controller';
        }
      }
      
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des enregistrements');
      }
      
      const serverRecords = await res.json();
      
      // Charger les enregistrements locaux
      const localRecords = await localStorageService.getLocalRecords();
      
      // Filtrer par l'utilisateur connecté (seulement pour les contrôleurs)
      if (user) {
        const userData = JSON.parse(user);
        
        if (userData.role === 'CONTROLLER') {
          
          // Pour les contrôleurs : enregistrements serveur + enregistrements locaux
          const userServerRecords = serverRecords.filter((record: any) => record.authorId === currentUserId);
          
          // Les enregistrements locaux sont toujours visibles pour le contrôleur qui les a créés
          const userLocalRecords = localRecords.filter(lr => !lr.synced);
          
          // Combiner les deux types d'enregistrements
          const allUserRecords = [...userServerRecords, ...userLocalRecords];
          
          setRecords(allUserRecords);
        } else {
          // Les analystes et admins voient tous les enregistrements
          const allRecords = [...serverRecords, ...localRecords.filter(lr => !lr.synced)];
          setRecords(allRecords);
        }
      } else {
        setRecords([...serverRecords, ...localRecords.filter(lr => !lr.synced)]);
      }
      
      // Mettre à jour le statut de synchronisation
      const status = await syncService.getSyncStatus();
      setSyncStatus({
        pendingCount: status.unsyncedCount,
        syncedCount: status.unsyncedCount === 0 ? records.length : records.length - status.unsyncedCount,
        isOnline: status.isOnline
      });
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des enregistrements:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Écouter les changements de synchronisation
  useEffect(() => {
    const handleSyncUpdate = () => {
      loadRecords(); // Recharger les enregistrements
    };

    // S'abonner aux mises à jour de synchronisation
    syncService.onSync(handleSyncUpdate);

    // Charger les enregistrements au montage
    if (currentUserId) {
      loadRecords();
    }

    // Nettoyer l'abonnement
    return () => {
      // Note: syncService n'a pas de méthode unsubscribe, mais c'est OK pour ce cas d'usage
    };
  }, [currentUserId]);

  // Fonction de filtrage des enregistrements
  const filteredRecords = records.filter((record) => {
    // Vérifier que l'enregistrement a la structure attendue
    if (!isValidRecord(record)) {
      return false;
    }
    
    const matchesSearch = 
      (record.formData.household.nomOuCode?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (record.formData.household.communeQuartier?.toLowerCase() || '').includes(search.toLowerCase());
    
    // Logique de filtrage basée sur la synchronisation (CORRIGÉE)
    let matchesStatus = true;
    if (filterStatus) {
      if (filterStatus === 'SENT') {
        // Synchronisé : enregistrements serveur OU enregistrements locaux avec synced = true
        matchesStatus = getRecordSyncStatus(record) === 'SYNCED';
      } else if (filterStatus === 'PENDING') {
        // Non synchronisé : enregistrements locaux avec synced = false
        matchesStatus = getRecordSyncStatus(record) === 'UNSYNCED';
      }
    }
    
    const matchesCommune = !filterCommune || record.formData.household.communeQuartier === filterCommune;
    
    return matchesSearch && matchesStatus && matchesCommune;
  });

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
      </div>

      {/* Statut de synchronisation */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Statut de Synchronisation</h3>
            <p className="text-sm text-gray-600">
              {syncStatus.pendingCount > 0 
                ? `${syncStatus.pendingCount} enregistrement(s) en attente de synchronisation`
                : 'Tous les enregistrements sont synchronisés'
              }
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">Connexion:</span>
            <span className="font-medium">{syncStatus.isOnline ? 'Connecté' : 'Déconnecté'}</span>
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
              <option value="SENT">Synchronisé</option>
              <option value="PENDING">Non synchronisé</option>
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
                            {record.formData?.household?.nomOuCode?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.formData?.household?.nomOuCode || 'Nom non spécifié'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.formData?.household?.age ? `${record.formData.household.age} ans` : 'Âge non spécifié'}, {record.formData?.household?.sexe || 'Sexe non spécifié'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.formData?.household?.communeQuartier || 'Commune non spécifiée'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {record.formData?.cooking?.combustibles?.map((combustible, index) => (
                        <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {combustible}
                        </span>
                      )) || <span className="text-gray-500 text-xs">Aucun combustible</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const syncStatus = getSyncStatusDisplay(record);
                      return (
                        <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-full ${syncStatus.color}`}>
                          {syncStatus.label === 'Synchronisé' ? (
                            <>
                              <span>✅</span>
                              {syncStatus.label}
                            </>
                          ) : (
                            <>
                              {syncStatus.label}
                            </>
                          )}
                        </span>
                      );
                    })()}
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
      {showDetails && showDetails.formData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails de l'enquête - {showDetails.formData?.household?.nomOuCode || 'Ménage'}
                </h3>
                <button
                  onClick={closeDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="max-h-96 overflow-y-auto">
                {/* Informations générales */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                    Informations générales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Ménage :</span>
                      <span className="ml-2 text-gray-900">{showDetails.formData?.household?.nomOuCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Commune/Quartier :</span>
                      <span className="ml-2 text-gray-900">{showDetails.formData?.household?.communeQuartier || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date de création :</span>
                      <span className="ml-2 text-gray-900">
                        {showDetails.createdAt ? new Date(showDetails.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Données du ménage */}
                {showDetails.formData?.household && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Données du ménage
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Age :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.household.age || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Sexe :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.household.sexe || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Taille du ménage :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.household.tailleMenage || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Géolocalisation :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.household.geolocalisation || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Solutions de cuisson actuelles */}
                {showDetails.formData?.cooking && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Solutions de cuisson actuelles
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Combustibles :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(showDetails.formData.cooking.combustibles) 
                            ? showDetails.formData.cooking.combustibles.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Équipements :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(showDetails.formData.cooking.equipements) 
                            ? showDetails.formData.cooking.equipements.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                      {showDetails.formData.cooking.autresCombustibles && (
                        <div>
                          <span className="font-medium text-gray-700">Autres combustibles :</span>
                          <span className="ml-2 text-gray-900">{showDetails.formData.cooking.autresCombustibles}</span>
                        </div>
                      )}
                      {showDetails.formData.cooking.autresEquipements && (
                        <div>
                          <span className="font-medium text-gray-700">Autres équipements :</span>
                          <span className="ml-2 text-gray-900">{showDetails.formData.cooking.autresEquipements}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Connaissance des solutions propres */}
                {showDetails.formData?.knowledge && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Connaissance des solutions propres
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Connaissance :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.knowledge.connaissanceSolutions || 'N/A'}</span>
                      </div>
                      {showDetails.formData.knowledge.solutionsConnaissances && (
                        <div>
                          <span className="font-medium text-gray-700">Solutions connues :</span>
                          <span className="ml-2 text-gray-900">{showDetails.formData.knowledge.solutionsConnaissances}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Avantages :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(showDetails.formData.knowledge.avantages) 
                            ? showDetails.formData.knowledge.avantages.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                      {showDetails.formData.knowledge.autresAvantages && (
                        <div>
                          <span className="font-medium text-gray-700">Autres avantages :</span>
                          <span className="ml-2 text-gray-900">{showDetails.formData.knowledge.autresAvantages}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contraintes d'adoption */}
                {showDetails.formData?.constraints && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Contraintes d'adoption
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Obstacles :</span>
                        <span className="ml-2 text-gray-900">
                          {Array.isArray(showDetails.formData.constraints.obstacles) 
                            ? showDetails.formData.constraints.obstacles.join(', ') 
                            : 'N/A'}
                        </span>
                      </div>
                      {showDetails.formData.constraints.autresObstacles && (
                        <div>
                          <span className="font-medium text-gray-700">Autres obstacles :</span>
                          <span className="ml-2 text-gray-900">{showDetails.formData.constraints.autresObstacles}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Prêt à :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.constraints.pretA || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Intention d'adoption */}
                {showDetails.formData?.adoption && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                      Intention d'adoption
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">Prêt à acheter foyer :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.adoption.pretAcheterFoyer || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Prêt à acheter GPL :</span>
                        <span className="ml-2 text-gray-900">{showDetails.formData.adoption.pretAcheterGPL || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={closeDetails}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
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