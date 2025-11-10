import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { syncService } from '../services/syncService';
import { localStorageService } from '../services/localStorageService';
import { environment } from '../config/environment';

interface Record {
  id: string;
  surveyId?: string; // ID de la campagne
  formData: any; // ✅ Données flexibles du formulaire
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
  // Champs pour la demande de modification
  modificationRequested?: boolean;
  modificationRequestReason?: string;
  modificationRequestedAt?: string;
  modificationAccepted?: boolean;
  modificationAcceptedAt?: string;
  modificationRejectedAt?: string;
  modificationRejectedBy?: string;
  hasBeenModified?: boolean;
  modifiedAt?: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  publishedAt: string;
}

export default function RecordsList() {
  const [records, setRecords] = useState<Record[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    pendingCount: number;
    syncedCount: number;
    isOnline: boolean;
  }>({ pendingCount: 0, syncedCount: 0, isOnline: true });
  const [showDetails, setShowDetails] = useState<Record | null>(null);
  const [selectedCampaignForm, setSelectedCampaignForm] = useState<any>(null);
  
  // Fonction utilitaire pour valider la structure des données - VERSION FLEXIBLE
  const isValidRecord = (record: any): record is Record => {
    return record && 
           record.id &&
           record.formData && 
           typeof record.formData === 'object' &&
           Object.keys(record.formData).length > 0 &&
           record.authorId &&
           record.createdAt;
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


  // Obtenir le nom de la campagne à partir de l'ID
  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.title : 'Campagne inconnue';
  };

  // Récupérer les informations du formulaire de la campagne sélectionnée
  const fetchCampaignForm = async (campaignId: string) => {
    if (!campaignId) {
      setSelectedCampaignForm(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('🔍 Récupération du formulaire pour la campagne:', campaignId);
      
      const response = await fetch(`${environment.apiBaseUrl}/forms/by-survey/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const forms = await response.json();
        console.log('✅ Formulaires récupérés:', forms);
        
        // Prendre le premier formulaire actif
        const activeForm = forms.find((form: any) => form.isActive);
        if (activeForm) {
          setSelectedCampaignForm(activeForm);
          console.log('✅ Formulaire sélectionné:', activeForm);
        } else {
          setSelectedCampaignForm(null);
          console.log('⚠️ Aucun formulaire actif trouvé');
        }
      } else {
        console.error('❌ Erreur lors de la récupération du formulaire:', response.status);
        setSelectedCampaignForm(null);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du formulaire:', error);
      setSelectedCampaignForm(null);
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

  // Fonction pour extraire les champs de la structure imbriquée
  const extractFieldsFromForm = (fields: any): any[] => {
    if (!fields || typeof fields !== 'object') return [];
    
    const extractedFields: any[] = [];
    
    // Parcourir les propriétés principales (household, cooking, location, etc.)
    Object.keys(fields).forEach(sectionKey => {
      const section = fields[sectionKey];
      if (section && typeof section === 'object' && section.fields) {
        // Parcourir les champs de chaque section
        Object.keys(section.fields).forEach(fieldKey => {
          const field = section.fields[fieldKey];
          extractedFields.push({
            id: `${sectionKey}.${fieldKey}`,
            label: field.label || field.title || fieldKey,
            type: field.type || 'text',
            required: field.required || false,
            placeholder: field.placeholder || '',
            options: field.options || field.enum || [],
            min: field.min || field.minimum,
            max: field.max || field.maximum,
            section: sectionKey,
            sectionLabel: section.label || section.title || sectionKey
          });
        });
      }
    });
    
    return extractedFields;
  };

  // Générer les colonnes du tableau dynamiquement
  const generateTableColumns = () => {
    // Si aucune campagne n'est sélectionnée, retourner des colonnes vides
    if (!selectedCampaignId) {
      return [];
    }

    if (!selectedCampaignForm || !selectedCampaignForm.fields) {
      // Colonnes par défaut si aucun formulaire sélectionné mais campagne sélectionnée
      return [
        { key: 'campaign', label: 'Campagne', type: 'campaign' },
        { key: 'status', label: 'Statut', type: 'status' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'actions', label: 'Actions', type: 'actions' }
      ];
    }

    // Colonnes basées sur le formulaire
    const columns: any[] = [
      { key: 'campaign', label: 'Campagne', type: 'campaign' },
      { key: 'status', label: 'Statut', type: 'status' },
      { key: 'date', label: 'Date', type: 'date' }
    ];

    // Ajouter les champs du formulaire comme colonnes
    const extractedFields = extractFieldsFromForm(selectedCampaignForm.fields);
    extractedFields.forEach((field: any) => {
      if (field.type !== 'section') { // Exclure les sections
        columns.push({
          key: field.id,
          label: field.label,
          type: 'field',
          fieldType: field.type,
          required: field.required
        });
      }
    });

    // Ajouter les actions à la fin
    columns.push({ key: 'actions', label: 'Actions', type: 'actions' });

    return columns;
  };

  // Rendre le contenu d'une cellule
  const renderCellContent = (record: Record, column: any) => {
    switch (column.type) {
      case 'campaign':
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {getCampaignName(record.surveyId || '')}
              </div>
              <div className="text-xs text-gray-500">
                {record.surveyId ? 'ID: ' + record.surveyId.substring(0, 8) + '...' : 'ID non disponible'}
              </div>
            </div>
          </div>
        );

      case 'status':
        const syncStatus = getSyncStatusDisplay(record);
        return (
          <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-full ${syncStatus.color}`}>
            {syncStatus.label === 'Synchronisé' ? (
              <>✅ {syncStatus.label}</>
            ) : (
              <>{syncStatus.label}</>
            )}
          </span>
        );

      case 'date':
        return (
          <div className="text-sm text-gray-900">
            {new Date(record.createdAt).toLocaleDateString('fr-FR')}
          </div>
        );

      case 'field':
        const fieldValue = record.formData?.[column.key];
        if (!fieldValue) {
          return <span className="text-gray-400 text-sm">-</span>;
        }

        // Rendre selon le type de champ
        if (Array.isArray(fieldValue)) {
          return (
            <div className="flex flex-wrap gap-1">
              {fieldValue.map((item, index) => (
                <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {item}
                </span>
              ))}
            </div>
          );
        }

        return (
          <div className="text-sm text-gray-900">
            {fieldValue}
          </div>
        );

      case 'actions':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => viewDetails(record)}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              Voir
            </button>
          </div>
        );

      default:
        return <span className="text-gray-400 text-sm">-</span>;
    }
  };

  // Récupérer l'ID de l'utilisateur connecté et charger les campagnes
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);
    }
    fetchCampaigns();
  }, []);

  // Charger les campagnes approuvées de l'utilisateur
  const fetchCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch(`${environment.apiBaseUrl}/users/enumerator-campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const applicationsData = await response.json();
        console.log('✅ Applications approuvées chargées:', applicationsData);
        
        // Extraire les campagnes des applications
        const campaignsFromApplications = applicationsData.map((app: any) => ({
          id: app.survey.id,
          title: app.survey.title,
          description: app.survey.description,
          status: app.survey.status,
          publishedAt: app.survey.publishedAt,
          publisher: app.survey.publisher
        }));
        
        setCampaigns(campaignsFromApplications);
        console.log('✅ Campagnes extraites:', campaignsFromApplications);
      } else {
        console.error('❌ Erreur lors du chargement des campagnes:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur de connexion au serveur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Charger les enregistrements depuis le serveur ET le stockage local
  const loadRecords = async (campaignId?: string) => {
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
      let apiUrl = `${environment.apiBaseUrl}/records`;
      
      if (user) {
        const userData = JSON.parse(user);
        if (userData.role === 'CONTROLLER') {
          apiUrl = `${environment.apiBaseUrl}/records/controller`;
        }
      }

      // Ajouter le filtre de campagne si sélectionné
      if (campaignId) {
        apiUrl += `?campaignId=${campaignId}`;
      }
      
      console.log('🔍 Chargement des enregistrements:', { apiUrl, campaignId, currentUserId });
      
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('🔍 Réponse du serveur:', res.status, res.statusText);
      
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des enregistrements');
      }
      
      const serverRecords = await res.json();
      console.log('✅ Enregistrements serveur chargés:', serverRecords.length, serverRecords);
      
      // Charger les enregistrements locaux
      const localRecords = await localStorageService.getLocalRecords();
      console.log('✅ Enregistrements locaux chargés:', localRecords.length);
      
      // Filtrer par l'utilisateur connecté (seulement pour les enquêteurs)
      if (user) {
        const userData = JSON.parse(user);
        
        if (userData.role === 'CONTROLLER') {
          
          // Pour les enquêteurs : enregistrements serveur + enregistrements locaux
          const userServerRecords = serverRecords.filter((record: any) => record.authorId === currentUserId);
          console.log('🔍 Enregistrements serveur filtrés par utilisateur:', userServerRecords.length, userServerRecords);
          
          // Les enregistrements locaux sont toujours visibles pour l'enquêteur qui les a créés
          const userLocalRecords = localRecords.filter(lr => !lr.synced);
          console.log('🔍 Enregistrements locaux non synchronisés:', userLocalRecords.length);
          
          // Si une campagne est sélectionnée, filtrer aussi par campagne
          let filteredRecords = [...userServerRecords, ...userLocalRecords];
          
          if (campaignId) {
            console.log('🔍 Filtrage par campagne:', campaignId);
            filteredRecords = filteredRecords.filter((record: any) => {
              // Essayer différentes propriétés pour trouver l'ID de campagne
              const recordCampaignId = record.surveyId || record.campaignId || record.survey?.id;
              console.log('🔍 Comparaison campagne:', { 
                recordCampaignId, 
                campaignId, 
                match: recordCampaignId === campaignId,
                recordSurveyId: record.surveyId,
                recordCampaignIdProp: record.campaignId,
                recordSurveyObject: record.survey
              });
              return recordCampaignId === campaignId;
            });
            console.log('✅ Enregistrements filtrés par campagne:', filteredRecords.length, filteredRecords);
          }
          
          // ✅ VALIDATION DES ENREGISTREMENTS AVANT AFFICHAGE
          console.log('🔍 Validation des enregistrements avant affichage...');
          const validRecords = filteredRecords.filter(record => {
            const isValid = isValidRecord(record);
            if (!isValid) {
              console.log('❌ Enregistrement invalide ignoré:', record.id, record);
            }
            return isValid;
          });
          
          console.log(`✅ ${validRecords.length} enregistrements valides sur ${filteredRecords.length} total`);
          setRecords(validRecords);
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
      loadRecords(selectedCampaignId); // Recharger les enregistrements
    };

    // S'abonner aux mises à jour de synchronisation
    syncService.onSync(handleSyncUpdate);

    // Charger les enregistrements au montage
    if (currentUserId) {
      loadRecords(selectedCampaignId);
    }

    // Nettoyer l'abonnement
    return () => {
      // Note: syncService n'a pas de méthode unsubscribe, mais c'est OK pour ce cas d'usage
    };
  }, [currentUserId, selectedCampaignId]);

  // Fonction de filtrage des enregistrements (simplifiée - seulement validation de structure)
  const filteredRecords = records.filter((record) => {
    // Vérifier que l'enregistrement a la structure attendue
    return isValidRecord(record);
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
        <h1 className="text-3xl font-bold">Mes Sondages</h1>
      </div>

      {/* Sélection de campagne */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sélectionner une campagne</h2>
          <p className="text-sm text-gray-600">
            Choisissez une campagne pour voir vos sondages liés à cette campagne
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <label htmlFor="campaign-select" className="block text-sm font-medium text-gray-700 mb-2">
            Campagne
          </label>
          <select
            id="campaign-select"
            value={selectedCampaignId}
            onChange={(e) => {
              setSelectedCampaignId(e.target.value);
              loadRecords(e.target.value);
              fetchCampaignForm(e.target.value);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            disabled={campaignsLoading}
          >
            <option value="">-- Toutes les campagnes --</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
        </div>

        {selectedCampaignId && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">Campagne sélectionnée:</span>
              <span className="font-semibold">{getCampaignName(selectedCampaignId)}</span>
            </div>
          </div>
        )}

        {campaignsLoading ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-sm text-gray-600">Chargement des campagnes...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-500 mb-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Aucune campagne approuvée disponible</p>
            <p className="text-sm text-gray-500 mt-1">Contactez votre administrateur pour obtenir l'accès à des campagnes</p>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              {selectedCampaignId 
                ? `Affichage des sondages pour la campagne: ${getCampaignName(selectedCampaignId)}`
                : `${campaigns.length} campagne(s) disponible(s) - Sélectionnez une campagne pour voir vos sondages`
              }
            </div>
          </div>
        )}
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


      {/* Tableau des enregistrements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {generateTableColumns().length > 0 ? (
                  generateTableColumns().map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.label}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))
                ) : (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sélectionnez une campagne
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!selectedCampaignId ? (
                <tr>
                  <td colSpan={1} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une campagne</p>
                      <p className="text-sm text-gray-500">
                        Choisissez une campagne dans la liste déroulante ci-dessus pour voir vos sondages
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={generateTableColumns().length} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">Aucun enregistrement trouvé</p>
                      <p className="text-sm text-gray-500">
                        Aucune soumission trouvée pour la campagne "{getCampaignName(selectedCampaignId)}"
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    {generateTableColumns().map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        {renderCellContent(record, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔄 Modal de détails - Version structurée identique à l'analyste */}
      {showDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Détails du sondage - {showDetails.formData?.household?.nomOuCode || 'Ménage'}
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
                {showDetails.formData ? (
                  <>
                    {/* 1. Identification du ménage - Version mise à jour */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">1</span>
                        Identification du ménage
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Nom ou code du ménage :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData?.['identification.nomOuCode'] || showDetails.formData?.household?.nomOuCode || 'N/A'}</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Âge :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData?.['identification.age'] || showDetails.formData?.household?.age || 'N/A'} ans</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Sexe :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData?.['identification.sexe'] || showDetails.formData?.household?.sexe || 'N/A'}</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Taille du ménage :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData?.['identification.tailleMenage'] || showDetails.formData?.household?.tailleMenage || 'N/A'} personnes</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Commune/Quartier :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData?.['identification.communeQuartier'] || showDetails.formData?.household?.communeQuartier || 'N/A'}</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Géolocalisation :</span>
                          <div className="mt-1 text-gray-900 font-semibold font-mono text-sm">{showDetails.formData?.['household.geolocalisation'] || showDetails.formData?.household?.geolocalisation || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Mode de cuisson actuelle */}
                    {(showDetails.formData?.['modeCuisson.combustibles'] || showDetails.formData?.['modeCuisson.equipements'] || showDetails.formData?.['modeCuisson.autresCombustibles'] || showDetails.formData?.['modeCuisson.autresEquipements'] || showDetails.formData?.cooking) && (
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold mr-2">2</span>
                          Mode de cuisson actuelle
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700">2.1.1. Combustibles utilisés (par ordre d'importance) :</span>
                            <div className="mt-2">
                              {showDetails.formData?.['modeCuisson.combustibles'] ? (
                                typeof showDetails.formData['modeCuisson.combustibles'] === 'object' 
                                  ? Object.entries(showDetails.formData['modeCuisson.combustibles'])
                                      .sort(([,a], [,b]) => {
                                        const order = ['1er', '2e', '3e', '4e', '5e'];
                                        return order.indexOf(a as string) - order.indexOf(b as string);
                                      })
                                      .map(([combustible, rang]) => (
                                        <div key={combustible} className="flex items-center gap-2 mb-1">
                                          <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold">{String(rang)}</span>
                                          <span className="text-gray-900 font-medium">{combustible}</span>
                                        </div>
                                      ))
                                  : showDetails.formData['modeCuisson.combustibles']
                              ) : (
                                Array.isArray(showDetails.formData?.cooking?.combustibles) 
                                  ? showDetails.formData.cooking.combustibles.join(', ') 
                                  : 'N/A'
                              )}
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700">2.1.2. Principal équipement de cuisson :</span>
                            <div className="mt-1 text-gray-900 font-semibold">
                              {showDetails.formData?.['modeCuisson.equipements'] || (
                                Array.isArray(showDetails.formData?.cooking?.equipements) 
                                  ? showDetails.formData.cooking.equipements.join(', ') 
                                  : 'N/A'
                              )}
                            </div>
                          </div>
                          {showDetails.formData?.['modeCuisson.autresCombustibles'] && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <span className="font-medium text-gray-700">Autres combustibles :</span>
                              <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData['modeCuisson.autresCombustibles']}</div>
                            </div>
                          )}
                          {showDetails.formData?.['modeCuisson.autresEquipements'] && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <span className="font-medium text-gray-700">Autres équipements :</span>
                              <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData['modeCuisson.autresEquipements']}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. Connaissance des solutions de cuisson propres */}
                    {(showDetails.formData?.['connaissance.connaissanceSolutions'] || showDetails.formData?.['connaissance.solutionsConnaissances'] || showDetails.formData?.['connaissance.avantages'] || showDetails.formData?.['connaissance.autresAvantages'] || showDetails.formData?.knowledge) && (
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold mr-2">3</span>
                          Connaissance des solutions de cuisson propres
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700">3.1. Connaissance des solutions propres :</span>
                            <div className="mt-1">
                              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                (showDetails.formData?.['connaissance.connaissanceSolutions'] || showDetails.formData?.knowledge?.connaissanceSolutions) === 'Oui' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {showDetails.formData?.['connaissance.connaissanceSolutions'] || showDetails.formData?.knowledge?.connaissanceSolutions || 'N/A'}
                              </span>
                            </div>
                          </div>
                          {showDetails.formData?.['connaissance.solutionsConnaissances'] && (
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <span className="font-medium text-gray-700">Solutions connues :</span>
                              <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData['connaissance.solutionsConnaissances']}</div>
                            </div>
                          )}
                          {showDetails.formData?.['connaissance.avantages'] && (
                            <div className="bg-purple-50 p-3 rounded-lg md:col-span-2">
                              <span className="font-medium text-gray-700">3.2. Avantages perçus :</span>
                              <div className="mt-2">
                                {Array.isArray(showDetails.formData['connaissance.avantages']) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {showDetails.formData['connaissance.avantages'].map((avantage, index) => (
                                      <span key={index} className="inline-block bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                        ✓ {avantage}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-900 font-semibold">{showDetails.formData['connaissance.avantages']}</span>
                                )}
                              </div>
                            </div>
                          )}
                          {showDetails.formData?.['connaissance.autresAvantages'] && (
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <span className="font-medium text-gray-700">Autres avantages :</span>
                              <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData['connaissance.autresAvantages']}</div>
                            </div>
                          )}
                          {!showDetails.formData?.['connaissance.avantages'] && showDetails.formData?.knowledge?.avantages && (
                            <div className="bg-purple-50 p-3 rounded-lg md:col-span-2">
                              <span className="font-medium text-gray-700">Avantages :</span>
                              <div className="mt-1 text-gray-900 font-semibold">
                                {Array.isArray(showDetails.formData.knowledge.avantages) 
                                  ? showDetails.formData.knowledge.avantages.join(', ') 
                                  : 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. Perceptions et contraintes */}
                    {(showDetails.formData?.['perceptions.obstacles'] || showDetails.formData?.['perceptions.autresObstacles'] || showDetails.formData?.['perceptions.pretA'] || showDetails.formData?.constraints) && (
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold mr-2">4</span>
                          Perceptions et contraintes
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {showDetails.formData?.['perceptions.obstacles'] && (
                            <div className="bg-orange-50 p-3 rounded-lg md:col-span-2">
                              <span className="font-medium text-gray-700">4.1. Obstacles perçus :</span>
                              <div className="mt-2">
                                {Array.isArray(showDetails.formData['perceptions.obstacles']) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {showDetails.formData['perceptions.obstacles'].map((obstacle, index) => (
                                      <span key={index} className="inline-block bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                        ⚠️ {obstacle}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-900 font-semibold">{showDetails.formData['perceptions.obstacles']}</span>
                                )}
                              </div>
                            </div>
                          )}
                          {showDetails.formData?.['perceptions.autresObstacles'] && (
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <span className="font-medium text-gray-700">Autres obstacles :</span>
                              <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData['perceptions.autresObstacles']}</div>
                            </div>
                          )}
                          {showDetails.formData?.['perceptions.pretA'] && (
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <span className="font-medium text-gray-700">Je suis prêt(e) à :</span>
                              <div className="mt-1 text-gray-900 font-semibold">{showDetails.formData['perceptions.pretA']}</div>
                            </div>
                          )}
                          {!showDetails.formData?.['perceptions.obstacles'] && showDetails.formData?.constraints?.obstacles && (
                            <div className="bg-orange-50 p-3 rounded-lg md:col-span-2">
                              <span className="font-medium text-gray-700">Obstacles :</span>
                              <div className="mt-1 text-gray-900 font-semibold">
                                {Array.isArray(showDetails.formData.constraints.obstacles) 
                                  ? showDetails.formData.constraints.obstacles.join(', ') 
                                  : 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. Intention d'adoption */}
                    {(showDetails.formData?.['intentionAdoption.pretAcheterFoyer'] || showDetails.formData?.['intentionAdoption.pretAcheterGPL'] || showDetails.formData?.adoption) && (
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-bold mr-2">5</span>
                          Intention d'adoption
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-indigo-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700">5.1. Prêt(e) à acheter un foyer amélioré :</span>
                            <div className="mt-1">
                              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                (showDetails.formData?.['intentionAdoption.pretAcheterFoyer'] || showDetails.formData?.adoption?.pretAcheterFoyer) === 'Oui' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {showDetails.formData?.['intentionAdoption.pretAcheterFoyer'] || showDetails.formData?.adoption?.pretAcheterFoyer || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="bg-indigo-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-700">5.2. Prêt(e) à utiliser un réchaud GPL :</span>
                            <div className="mt-1">
                              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                (showDetails.formData?.['intentionAdoption.pretAcheterGPL'] || showDetails.formData?.adoption?.pretAcheterGPL) === 'Oui' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {showDetails.formData?.['intentionAdoption.pretAcheterGPL'] || showDetails.formData?.adoption?.pretAcheterGPL || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Informations générales */}
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold mr-2">ℹ️</span>
                        Informations générales
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Date et heure de soumission :</span>
                          <div className="mt-1 text-gray-900 font-semibold">
                            {showDetails.createdAt ? new Date(showDetails.createdAt).toLocaleString('fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }) : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Statut :</span>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(showDetails.status)}`}>
                              {getStatusLabel(showDetails.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">Données non disponibles</p>
                      <p className="text-sm text-gray-500">
                        Les données du formulaire ne sont pas disponibles pour cet enregistrement.
                      </p>
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
