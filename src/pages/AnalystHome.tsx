import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../utils/debounce';
import { useNavigate } from 'react-router-dom';
import logo2 from '../assets/images/logo2.jpg';
import { Bar, Doughnut } from 'react-chartjs-2';
import Settings from './Settings';
import { exportEnquetesToExcel, exportStatsToExcel, exportStatsSexeToExcel } from '../utils/excelExport';
import { Download, RefreshCw } from 'lucide-react';
import EnumeratorListWithDailyStats from '../components/EnumeratorListWithDailyStats';
import ExportNotification from '../components/ExportNotification';
import SuccessNotification from '../components/SuccessNotification';
import PNUDFooter from '../components/PNUDFooter';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-toastify';
import { environment } from '../config/environment';
import { getChartColor, getChartColors, CompatibleColors } from '../utils/colors';
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

const communesKinshasa = [
  'Gombe', 'Kinshasa', 'Kintambo', 'Ngaliema', 'Mont-Ngafula',
  'Selembao', 'Bumbu', 'Makala', 'Ngiri-Ngiri', 'Kalamu',
  'Kasa-Vubu', 'Bandalungwa', 'Lingwala', 'Barumbu', 'Matete',
  'Lemba', 'Ngaba', 'Kisenso', 'Limete', 'Masina',
  'Nsele', 'Maluku', 'Kimbaseke', 'Ndjili'
];

export default function AnalystHome() {
  // Logs réduits pour améliorer les performances
  
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard'|'enquetes'|'statistiques'|'parametres'>('dashboard');
  const [selectedEnumeratorId, setSelectedEnumeratorId] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [validationStats, setValidationStats] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [search, setSearch] = useState('');
  // Debounce pour optimiser les recherches (300ms de délai)
  const debouncedSearch = useDebounce(search, 300);
  const [reviewComment, setReviewComment] = useState('');
  const [showCommentField, setShowCommentField] = useState(false);
const [recordActionLocked, setRecordActionLocked] = useState(false);
const [recordActionMessage, setRecordActionMessage] = useState<string | null>(null);
  const [communeFilter, setCommuneFilter] = useState('');
  const [campaignData, setCampaignData] = useState<any>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [enumeratorStats, setEnumeratorStats] = useState<any[]>([]);
  const [enumeratorStatsLoading, setEnumeratorStatsLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [enumeratorSubmissions, setEnumeratorSubmissions] = useState<any>(null);
  const [enumeratorSubmissionsLoading, setEnumeratorSubmissionsLoading] = useState(false);
  const [analystStats, setAnalystStats] = useState<any>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportNotification, setExportNotification] = useState<{
    isVisible: boolean;
    isSuccess: boolean;
    message: string;
  }>({
    isVisible: false,
    isSuccess: false,
    message: ''
  });
  const [successNotification, setSuccessNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // États pour l'effet de retournement des cartes
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  
  // Styles CSS pour les animations de retournement
  const flipCardStyles = `
    .perspective-1000 {
      perspective: 1000px;
    }
    
    .transform-style-preserve-3d {
      transform-style: preserve-3d;
    }
    
    .backface-hidden {
      backface-visibility: hidden;
    }
    
    .rotate-y-180 {
      transform: rotateY(180deg);
    }
    
    .hover\\:scale-105:hover {
      transform: scale(1.05);
    }
    
    .transition-transform {
      transition: transform 0.3s ease;
    }
    
    .transition-shadow {
      transition: box-shadow 0.3s ease;
    }
    
    .duration-300 {
      transition-duration: 300ms;
    }
    
    .duration-700 {
      transition-duration: 700ms;
    }
  `;
  
  // Fonction pour basculer l'état de retournement
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Charger les données utilisateur depuis le serveur pour avoir les données fraîches
        const response = await fetch(`${environment.apiBaseUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          // Logs réduits pour améliorer les performances
          setUser(userData.user);
          localStorage.setItem('user', JSON.stringify(userData.user));
        } else {
          // Fallback sur localStorage si l'API échoue
          const u = localStorage.getItem('user');
          if (u) setUser(JSON.parse(u));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        // Fallback sur localStorage en cas d'erreur
        const u = localStorage.getItem('user');
        if (u) setUser(JSON.parse(u));
      }
    };

    loadUserData();

    // Écouter les événements de mise à jour du profil
    const handleProfileUpdate = (event: CustomEvent) => {
      const updatedUser = event.detail;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  // Récupérer les statistiques du tableau de bord - DÉSACTIVÉ (non utilisé)
  // useEffect(() => {
  //   setDashboardLoading(true);
  //   setDashboardError('');
  //   
  //   fetch('http://localhost:3000/records/stats/overview', { 
  //     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
  //   })
  //   .then(r => r.json())
  //   .then(stats => {
  //     // setDashboardStats(stats); // This line was removed as per the edit hint
  //   })
  //   .catch(e => {
  //     setDashboardError('Erreur lors du chargement des statistiques');
  //   })
  //   .finally(() => setDashboardLoading(false));
  // }, []); // Chargement automatique au montage du composant

  // Fonction pour récupérer les données de campagne de l'analyste (optimisée - logs réduits)
  const fetchAnalystCampaignData = useCallback(async () => {
    setCampaignLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const res = await fetch(`${environment.apiBaseUrl}/users/analyst-campaign-data`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      setCampaignData(data);
    } catch (err: any) {
      setCampaignData(null);
    } finally {
      setCampaignLoading(false);
    }
  }, []);

  const fetchAnalystStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const res = await fetch(`${environment.apiBaseUrl}/records/analyst-stats`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur HTTP: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log('📊 AnalystStats reçues:', {
        totalRecords: data.totalRecords,
        totalByApplication: data.totalByApplication,
        totalByPublicLink: data.totalByPublicLink,
        totalEnumerators: data.totalEnumerators
      });
      setAnalystStats(data);
    } catch (err: any) {
      console.error('❌ Erreur lors de la récupération des statistiques:', err.message);
      console.error('❌ Stack trace:', err.stack);
      setAnalystStats(null);
    } finally {
      setStatsLoading(false);
      console.log('🔍 fetchAnalystStats: Terminé');
    }
  };

  // Fonction pour charger toutes les données
  const loadAllData = useCallback(async () => {
    console.log('🔍 AnalystHome: Début du chargement des données');
    try {
      await Promise.all([
        fetchRecords(1),
        fetchAnalystCampaignData(),
        fetchAnalystStats(),
        fetchValidationStats()
      ]);
      console.log('🔍 AnalystHome: Chargement des données terminé');
    } catch (error) {
      console.error('❌ AnalystHome: Erreur lors du chargement des données:', error);
    }
  }, []); // Dépendances vides = ne change jamais

  // Charger les stats des enquêteurs quand on arrive sur la page enquetes
  useEffect(() => {
    if (view === 'enquetes' && !selectedEnumeratorId) {
      // Utiliser la campagne de campaignData si disponible
      if (campaignData?.campaign?.id) {
        const campaignId = campaignData.campaign.id;
        if (!selectedCampaignId) {
          setSelectedCampaignId(campaignId);
          fetchEnumeratorStats(campaignId);
        } else if (selectedCampaignId === campaignId && enumeratorStats.length === 0) {
          // Recharger les stats si la campagne est déjà sélectionnée mais qu'il n'y a pas de stats
          fetchEnumeratorStats(campaignId);
        }
      } else if (records.length > 0 && !selectedCampaignId) {
        // Fallback: utiliser la première campagne trouvée dans les records
        const firstRecordWithSurvey = records.find((r: any) => r.surveyId);
        if (firstRecordWithSurvey?.surveyId) {
          setSelectedCampaignId(firstRecordWithSurvey.surveyId);
          fetchEnumeratorStats(firstRecordWithSurvey.surveyId);
        }
      }
    }
  }, [view, campaignData, records, selectedCampaignId, selectedEnumeratorId, enumeratorStats.length]);

  // Récupérer les enquêtes (chargement automatique dès la connexion)
  useEffect(() => {
    console.log('🔍 AnalystHome: useEffect déclenché - chargement initial');
    console.log('🔍 AnalystHome: Token dans localStorage:', !!localStorage.getItem('token'));
    console.log('🔍 AnalystHome: User dans localStorage:', localStorage.getItem('user'));
    
    loadAllData();
  }, []); // Charger uniquement une fois au montage du composant

  // Fonction pour récupérer les informations d'un utilisateur
  const fetchUserInfo = async (userId: string): Promise<string> => {
    try {
      console.log(`🔍 Tentative de récupération de l'utilisateur: ${userId}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ Aucun token trouvé dans le localStorage');
        return 'Token manquant';
      }

      const userRes = await fetch(`${environment.apiBaseUrl}/users/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log(`📡 Réponse du serveur: ${userRes.status} ${userRes.statusText}`);
      
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log(`✅ Données utilisateur récupérées:`, userData);
        
        // Retourner le nom complet, sinon l'email, sinon un message par défaut
        const displayName = userData.name || userData.email || 'Utilisateur inconnu';
        console.log(`📝 Nom d'affichage: ${displayName}`);
        return displayName;
      } else {
        const errorText = await userRes.text();
        console.warn(`❌ Erreur HTTP ${userRes.status} pour l'utilisateur ${userId}:`, errorText);
        
        if (userRes.status === 404) {
          return `Utilisateur ${userId} non trouvé`;
        } else if (userRes.status === 403) {
          return 'Accès refusé';
        } else {
          return `Erreur ${userRes.status}`;
        }
      }
    } catch (error) {
      console.error(`💥 Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
      return 'Erreur de récupération';
    }
  };

  // Fonction pour récupérer les statistiques de validation
  const fetchValidationStats = async () => {
    console.log('🔍 fetchValidationStats: Début');
    setValidationLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      const res = await fetch(`${environment.apiBaseUrl}/validation/analyst-stats`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('📊 Stats de validation reçues:', data);
      setValidationStats(data);
    } catch (err: any) {
      console.error('❌ Erreur lors de la récupération des stats de validation:', err);
      setValidationStats(null);
    } finally {
      setValidationLoading(false);
      console.log('🔍 fetchValidationStats: Terminé');
    }
  };

  // Fermer la modal de détails
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRecord(null);
    setReviewComment('');
    setShowCommentField(false);
    setRecordActionLocked(false);
    setRecordActionMessage(null);
  };

  // Fonction pour valider un formulaire
  const handleValidate = async (recordId: string, status: 'VALIDATED' | 'NEEDS_REVIEW') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token d\'authentification manquant');
        return;
      }

      // Pour "À revoir", vérifier qu'un commentaire est fourni
      if (status === 'NEEDS_REVIEW' && !reviewComment.trim()) {
        toast.warning('Veuillez fournir un commentaire pour marquer ce formulaire comme "À revoir"');
        return;
      }

      const response = await fetch(
        `${environment.apiBaseUrl}/records/${recordId}/validate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
            comment: status === 'NEEDS_REVIEW' ? reviewComment : null
          })
        }
      );

      if (response.ok) {
        setSuccessNotification({
          show: true,
          message: status === 'VALIDATED' 
            ? '✅ Formulaire validé avec succès !' 
            : '⚠️ Formulaire marqué comme "À revoir". Le Project Manager sera notifié.',
          type: status === 'VALIDATED' ? 'success' : 'warning'
        });
        setRecordActionLocked(true);
        setRecordActionMessage(
          status === 'VALIDATED'
            ? 'Le formulaire a été validé avec succès.'
            : 'Le formulaire a été marqué "À revoir". Le Project Manager sera notifié pour une analyse approfondie.'
        );
        setSelectedRecord((prev: any) =>
          prev
            ? {
                ...prev,
                analystValidationStatus: status,
                status: status === 'VALIDATED' ? 'SENT' : 'TO_CORRECT',
                modificationRequested: false,
                modificationAccepted: status === 'VALIDATED' ? prev.modificationAccepted : null,
              }
            : prev
        );
        fetchRecords(currentPage);
        fetchValidationStats();
        setReviewComment('');
        setShowCommentField(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast.error('Erreur de connexion au serveur');
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Récupérer les enquêtes - AVEC PAGINATION (optimisé pour 15 000+ enregistrements)
  const fetchRecords = async (page: number = 1) => {
    console.log('🔍 fetchRecords: Début', { page, pageSize });
    setRecordsLoading(true);
    setRecordsError('');
    try {
      const res = await fetch(`${environment.apiBaseUrl}/records/analyst?page=${page}&limit=${pageSize}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const response = await res.json();
      
      // Gérer la réponse paginée ou l'ancien format (rétrocompatibilité)
      const data = response.data || response;
      const pagination = response.pagination;
      
      if (pagination) {
        setTotalRecords(pagination.total);
        setTotalPages(pagination.totalPages);
        setCurrentPage(pagination.page);
      }
      
      console.log('📊 Récupération des enquêtes:', data.length, 'enregistrements trouvés', pagination ? `(page ${pagination.page}/${pagination.totalPages})` : '');
      
      // Les données incluent déjà l'author depuis le backend - Plus besoin de requêtes N+1
      const enrichedRecords = data.map((record: any) => ({
        ...record,
        authorName: record.author?.name || 'N/A'
      }));
      
      console.log('✅ Enregistrements chargés (optimisé - pas de requêtes N+1)');
      setRecords(enrichedRecords);
    } catch (err: any) {
      console.error('❌ Erreur lors de la récupération des enquêtes:', err);
      setRecordsError(err.message || 'Erreur inconnue');
    } finally {
      setRecordsLoading(false);
      console.log('🔍 fetchRecords: Terminé');
    }
  };

  // Appliquer les filtres aux records (utilise debouncedSearch pour éviter trop de re-renders)
  const filteredRecords = records.filter(record => {
    // Filtre par nom du ménage (utilise la valeur debounced)
    const nomOuCode = record.formData?.['identification.nomOuCode'] || record.formData?.household?.nomOuCode || '';
    const matchesSearch = !debouncedSearch || nomOuCode.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    // Filtre par commune
    const communeQuartier = record.formData?.['identification.communeQuartier'] || record.formData?.household?.communeQuartier || '';
    const matchesCommune = !communeFilter || communeQuartier === communeFilter;
    
    // Filtre par enquêteur sélectionné
    const matchesEnumerator = !selectedEnumeratorId || record.authorId === selectedEnumeratorId;
    
    return matchesSearch && matchesCommune && matchesEnumerator;
  });

  // Fonction pour afficher les notifications d'export
  const showExportNotification = (isSuccess: boolean, message: string) => {
    setExportNotification({
      isVisible: true,
      isSuccess,
      message
    });
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
      setExportNotification(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  // Fonction pour fermer la notification
  const closeExportNotification = () => {
    setExportNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Fonction pour récupérer les statistiques des enquêteurs par campagne
  // Fonction pour exporter tous les formulaires de tous les enquêteurs
  const exportAllEnumeratorsSubmissions = async (campaignId: string) => {
    try {
      setExportNotification({
        isVisible: true,
        isSuccess: false,
        message: 'Récupération des formulaires en cours...'
      });

      // Récupérer tous les enquêteurs de la campagne
      const statsResponse = await fetch(
        `${environment.apiBaseUrl}/records/campaign/${campaignId}/enumerators/stats`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!statsResponse.ok) {
        throw new Error('Erreur lors de la récupération des enquêteurs');
      }

      const enumerators = await statsResponse.json();

      // Récupérer les soumissions de chaque enquêteur
      const allSubmissions: any[] = [];
      
      for (const enumerator of enumerators) {
        try {
          const submissionsResponse = await fetch(
            `${environment.apiBaseUrl}/records/campaign/${campaignId}/enumerator/${enumerator.id}/submissions`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );

          if (submissionsResponse.ok) {
            const submissions = await submissionsResponse.json();
            
            // Ajouter les soumissions par application
            if (submissions.appSubmissions && submissions.appSubmissions.length > 0) {
              allSubmissions.push(...submissions.appSubmissions.map((s: any) => ({
                ...s,
                authorName: s.author?.name || 'N/A',
                source: 'application'
              })));
            }
            
            // Ajouter les soumissions par lien public
            if (submissions.publicSubmissions && submissions.publicSubmissions.length > 0) {
              allSubmissions.push(...submissions.publicSubmissions.map((s: any) => ({
                ...s,
                authorName: s.author?.name || s.submitterName || 'N/A',
                source: 'public_link'
              })));
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des soumissions pour ${enumerator.name}:`, error);
        }
      }

      // Exporter en Excel
      const campaignTitle = campaignData?.campaign?.title || 'campagne';
      const fileName = `tous_formulaires_${campaignTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;
      const success = exportEnquetesToExcel(allSubmissions, fileName);

      if (success) {
        setExportNotification({
          isVisible: true,
          isSuccess: true,
          message: `✅ Export réussi ! ${allSubmissions.length} formulaire(s) exporté(s)`
        });
      } else {
        throw new Error('Erreur lors de l\'export Excel');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export de tous les formulaires:', error);
      setExportNotification({
        isVisible: true,
        isSuccess: false,
        message: `❌ Erreur: ${error.message || 'Impossible d\'exporter les formulaires'}`
      });
    }
  };

  const fetchEnumeratorStats = async (campaignId: string) => {
    setEnumeratorStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${environment.apiBaseUrl}/records/campaign/${campaignId}/enumerators/stats`, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setEnumeratorStats(data);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des stats des enquêteurs:', err);
    } finally {
      setEnumeratorStatsLoading(false);
    }
  };

  // Fonction pour récupérer les soumissions d'un enquêteur
  const fetchEnumeratorSubmissions = async (enumeratorId: string, campaignId: string) => {
    setEnumeratorSubmissionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${environment.apiBaseUrl}/records/campaign/${campaignId}/enumerator/${enumeratorId}/submissions`, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setEnumeratorSubmissions(data);
    setSelectedEnumeratorId(enumeratorId);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des soumissions:', err);
    } finally {
      setEnumeratorSubmissionsLoading(false);
    }
  };

  // Fonction pour gérer le clic sur un enquêteur
  const handleEnumeratorClick = async (enumeratorId: string, campaignId: string) => {
    await fetchEnumeratorSubmissions(enumeratorId, campaignId);
  };

  // Fonction d'export des enquêtes avec gestion d'erreur
  const handleExportEnquetes = () => {
    try {
      if (records.length > 0) {
        const success = exportEnquetesToExcel(records, 'enquetes_analyste');
        if (success) {
          showExportNotification(true, 'Export des enquêtes réussi !');
        } else {
          showExportNotification(false, 'Erreur lors de l\'export des enquêtes');
        }
      }
    } catch (error) {
      showExportNotification(false, 'Erreur lors de l\'export des enquêtes');
    }
  };

  // Fonction d'export des statistiques avec gestion d'erreur
  const handleExportStats = () => {
    try {
      if (cookingStats) {
        // Préparer les données pour l'export
        const statsCommune = Object.entries(cookingStats.communes).map(([commune, count]) => {
          const totalEnquetes = cookingStats.totalEnquetes;
          const pourcentage = totalEnquetes > 0 ? ((count / totalEnquetes) * 100).toFixed(1) : '0.0';
          return {
            commune,
            nombreEnquetes: count,
            typesCombustibles: Object.keys(cookingStats.combustiblesParCommune[commune] || {}).length,
            typesEquipements: Object.keys(cookingStats.equipementsParCommune[commune] || {}).length,
            pourcentageTotal: `${pourcentage}%`
          };
        });
        
        const statsCombustibles = Object.entries(cookingStats.combustibles).map(([combustible, count]) => ({
          combustible,
          nombreEnquetes: count
        }));
        
        const statsEquipements = Object.entries(cookingStats.equipements).map(([equipement, count]) => ({
          combustible: equipement, // Réutiliser la même interface
          nombreEnquetes: count
        }));
        
        const success = exportStatsToExcel(statsCommune, statsCombustibles, statsEquipements, 'statistiques_detaillees_analyste');
        if (success) {
          showExportNotification(true, 'Export des statistiques réussi !');
        } else {
          showExportNotification(false, 'Erreur lors de l\'export des statistiques');
        }
      }
    } catch (error) {
      showExportNotification(false, 'Erreur lors de l\'export des statistiques');
    }
  };

  // Fonction utilitaire pour extraire le sexe depuis différents formats
  const getSexeFromRecord = (record: any): string | null => {
    if (!record?.formData) return null;
    const formData = record.formData;
    
    // Chercher dans plusieurs emplacements possibles
    const sexe = 
      formData['identification.sexe'] || 
      formData['household.sexe'] ||
      formData.sexe || 
      formData.household?.sexe ||
      formData.identification?.sexe ||
      null;
    
    return sexe;
  };

  // Fonction d'export des statistiques par sexe avec gestion d'erreur
  const handleExportStatsSexe = (filename: string = 'statistiques_sexe_analyste') => {
    try {
      const statsHommes = records.filter(r => {
        const sexe = getSexeFromRecord(r);
        return sexe === 'Homme' || sexe === 'Masculin' || sexe === 'masculin' || sexe === 'male' || sexe === 'MALE';
      }).length;

      const statsFemmes = records.filter(r => {
        const sexe = getSexeFromRecord(r);
        return sexe === 'Femme' || sexe === 'Féminin' || sexe === 'feminin' || sexe === 'female' || sexe === 'FEMALE';
      }).length;

      const statsAutre = records.filter(r => {
        const sexe = getSexeFromRecord(r);
        return sexe === 'Autre' || sexe === 'autre' || sexe === 'other' || sexe === 'OTHER';
      }).length;
      
      const success = exportStatsSexeToExcel(
        statsHommes,
        statsFemmes,
        statsAutre,
        analystStats?.totalRecords || 0,
        filename
      );
      
      if (success) {
        showExportNotification(true, 'Export des statistiques par sexe réussi !');
      } else {
        showExportNotification(false, 'Erreur lors de l\'export des statistiques par sexe');
      }
    } catch (error) {
      showExportNotification(false, 'Erreur lors de l\'export des statistiques par sexe');
    }
  };

  // Calcul des statistiques des solutions de cuisson (version améliorée avec répartition par commune)
  const calculateCookingStats = () => {
    if (!records.length) return null;

    const stats = {
      combustibles: {} as Record<string, number>,
      equipements: {} as Record<string, number>,
      communes: {} as Record<string, number>,
      status: {} as Record<string, number>,
      totalEnquetes: records.length,
      totalEnqueteurs: 0, // NOUVEAU : Nombre total d'enquêteurs
      // NOUVEAU : Statistiques détaillées par commune
      equipementsParCommune: {} as Record<string, Record<string, number>>,
      combustiblesParCommune: {} as Record<string, Record<string, number>>
    };

    // Set pour compter les enquêteurs uniques
    const enqueteursUniques = new Set<string>();

    records.forEach(record => {
      // Compter les enquêteurs uniques
      if (record.authorId) {
        enqueteursUniques.add(record.authorId);
      }

      // Stats par statut
      const status = record.status || 'Inconnu';
      stats.status[status] = (stats.status[status] || 0) + 1;

      // Stats par commune
      const commune = record.formData?.household?.communeQuartier || 'Non spécifiée';
      stats.communes[commune] = (stats.communes[commune] || 0) + 1;

      // Initialiser les objets pour cette commune si nécessaire
      if (!stats.equipementsParCommune[commune]) {
        stats.equipementsParCommune[commune] = {};
        stats.combustiblesParCommune[commune] = {};
      }

      // Stats par combustible (global et par commune)
      if (record.formData?.cooking?.combustibles) {
        record.formData.cooking.combustibles.forEach((combustible: string) => {
          // Global
          stats.combustibles[combustible] = (stats.combustibles[combustible] || 0) + 1;
          // Par commune
          stats.combustiblesParCommune[commune][combustible] = 
            (stats.combustiblesParCommune[commune][combustible] || 0) + 1;
        });
      }

      // Stats par équipement (global et par commune)
      if (record.formData?.cooking?.equipements) {
        record.formData.cooking.equipements.forEach((equipement: string) => {
          // Global
          stats.equipements[equipement] = (stats.equipements[equipement] || 0) + 1;
          // Par commune
          stats.equipementsParCommune[commune][equipement] = 
            (stats.equipementsParCommune[commune][equipement] || 0) + 1;
        });
      }
    });

    // Calculer le nombre total d'enquêteurs uniques
    stats.totalEnqueteurs = enqueteursUniques.size;

    return stats;
  };

  const cookingStats = calculateCookingStats();

  // Données pour les graphiques (version améliorée avec répartition par commune)
  const getChartData = () => {
    if (!analystStats) return null;

    // Préparer les données pour les graphiques basés sur les champs du formulaire
    const communesAvecDonnees = Object.keys(analystStats.communes || {}).filter(commune => 
      (analystStats.communes || {})[commune] > 0
    );

    // Créer des graphiques dynamiques basés sur les champs du formulaire
    const chartData: any = {
      communes: {
        labels: Object.keys(analystStats.communes || {}),
        datasets: [{
          label: 'Nombre d\'enquêtes',
          data: Object.values(analystStats.communes || {}),
          backgroundColor: getChartColor(CompatibleColors.chart.blue, 0.8),
        }]
      }
    };

    // Générer les données pour les graphiques par commune (combustibles et équipements)
    if (records && records.length > 0) {
      // Analyser les combustibles par commune
      const combustiblesParCommune: any = {};
      const equipementsParCommune: any = {};
      
      // Initialiser toutes les communes de Kinshasa
      communesKinshasa.forEach(commune => {
        combustiblesParCommune[commune] = {};
        equipementsParCommune[commune] = {};
      });

      // Analyser chaque record
      records.forEach(record => {
        const formData = record.formData as any;
        const commune = formData?.['identification.communeQuartier'] || formData?.household?.communeQuartier || 'Non spécifiée';
        
        // Analyser les combustibles (format ranking)
        const combustibles = formData?.['modeCuisson.combustibles'];
        if (combustibles && typeof combustibles === 'object') {
          Object.keys(combustibles).forEach(combustible => {
            if (!combustiblesParCommune[commune]) {
              combustiblesParCommune[commune] = {};
            }
            combustiblesParCommune[commune][combustible] = (combustiblesParCommune[commune][combustible] || 0) + 1;
          });
        }
        
        // Analyser les équipements
        const equipements = formData?.['modeCuisson.equipements'];
        if (equipements) {
          if (!equipementsParCommune[commune]) {
            equipementsParCommune[commune] = {};
          }
          equipementsParCommune[commune][equipements] = (equipementsParCommune[commune][equipements] || 0) + 1;
        }
      });

      // Créer les datasets pour les graphiques par commune
      const combustiblesTypes = ['Électricité', 'Charbon de bois (Makala)', 'Bois', 'Gaz (butane/propane)', 'Charbon de bois'];
      const equipementsTypes = ['Cuisinière électrique', 'Réchaud à gaz (GPL)', 'Foyer trois pierres traditionnel', 'Foyer classique au charbon/bois', 'Foyer amélioré au charbon/bois', 'Foyer traditionnel', 'Marmite en fonte'];

      chartData.combustiblesParCommune = {
        labels: communesKinshasa,
        datasets: combustiblesTypes.map((type, index) => ({
          label: type,
          data: communesKinshasa.map(commune => combustiblesParCommune[commune]?.[type] || 0),
          backgroundColor: [
            getChartColor('#f97316', 0.8),   // Orange pour Électricité
            getChartColor('#6b7280', 0.8),   // Gris pour Charbon de bois (Makala)
            getChartColor(CompatibleColors.chart.blue, 0.8),   // Bleu pour Bois
            getChartColor('#14b8a6', 0.8),   // Vert pour Gaz
            getChartColor(CompatibleColors.chart.purple, 0.8),  // Violet pour Charbon de bois
          ][index]
        }))
      };

      chartData.equipementsParCommune = {
        labels: communesKinshasa,
        datasets: equipementsTypes.map((type, index) => ({
          label: type,
          data: communesKinshasa.map(commune => equipementsParCommune[commune]?.[type] || 0),
          backgroundColor: [
            getChartColor(CompatibleColors.chart.red, 0.8),   // Rouge pour Cuisinière électrique
            getChartColor(CompatibleColors.chart.blue, 0.8),    // Bleu pour Réchaud à gaz
            getChartColor(CompatibleColors.chart.yellow, 0.8),    // Jaune pour Foyer trois pierres
            getChartColor('#14b8a6', 0.8),    // Cyan pour Foyer classique
            getChartColor(CompatibleColors.chart.purple, 0.8),   // Violet pour Foyer amélioré
            getChartColor(CompatibleColors.chart.green, 0.8),     // Vert pour Foyer traditionnel
            getChartColor('#f97316', 0.8),    // Orange pour Marmite en fonte
          ][index]
        }))
      };
    }

    // Ajouter des graphiques pour les champs de type select/radio/checkbox
    if (analystStats.formFields) {
      Object.entries(analystStats.formFields || {}).forEach(([fieldName, fieldData]: [string, any]) => {
        if (['select', 'radio', 'checkbox', 'ranking'].includes(fieldData.type) && Object.keys(fieldData.values || {}).length > 0) {
          const valueCount = Object.keys(fieldData.values).length;
          chartData[fieldName] = {
            labels: Object.keys(fieldData.values),
            datasets: [{
              label: fieldData.label || fieldName,
              data: Object.values(fieldData.values),
              backgroundColor: getChartColors(valueCount, 0.8),
            }]
          };
        }
      });
    }

    return chartData;
  };

  // Utiliser useMemo pour éviter le recalcul inutile et forcer la mise à jour
  const chartData = useMemo(() => getChartData(), [analystStats, records]);

  // Gestionnaire d'erreur global
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('❌ Erreur globale capturée:', event.error);
      setError(event.error?.message || 'Erreur inconnue');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ Promesse rejetée:', event.reason);
      setError(event.reason?.message || 'Erreur de promesse');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Affichage d'erreur si une erreur critique s'est produite
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-bold text-red-800">Erreur Critique</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Styles CSS pour les cartes 3D flip */}
      <style dangerouslySetInnerHTML={{ __html: flipCardStyles }} />
      
      {/* Indicateur de chargement global */}
      {(statsLoading || campaignLoading || recordsLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-700">
              <p className="font-semibold">Chargement des données...</p>
              <p className="text-sm text-gray-500">
                {statsLoading && 'Statistiques • '}
                {campaignLoading && 'Campagne • '}
                {recordsLoading && 'Enregistrements'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation responsive avec couleur bleue d'origine */}
      {/* Navigation responsive */}
      <nav className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg border-b border-blue-700">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-20">
          {/* Logo et titre */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="relative">
                <img src={logo2} alt="Logo" className="h-8 sm:h-10 w-auto object-contain bg-white rounded-lg shadow-md p-1" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-white">Analyste</span>
                <span className="text-xs text-blue-200 hidden sm:block">FikiriCollect</span>
              </div>
          </div>
          
          {/* Bouton menu mobile */}
          <button 
              className="md:hidden p-2 rounded-lg hover:bg-blue-700/50 transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
              <svg className="w-6 h-6 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Menu desktop */}
            <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
            <button 
              onClick={() => setView('dashboard')} 
                className={`px-2 lg:px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 whitespace-nowrap ${
                  view === 'dashboard' 
                    ? 'bg-white text-blue-900 shadow-lg transform scale-105' 
                    : 'text-white hover:bg-blue-700/50 hover:scale-105'
                }`}
              >
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
              Tableau de bord
                </div>
            </button>
            <button 
              onClick={() => setView('enquetes')} 
                className={`px-2 lg:px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 whitespace-nowrap ${
                  view === 'enquetes' 
                    ? 'bg-white text-blue-900 shadow-lg transform scale-105' 
                    : 'text-white hover:bg-blue-700/50 hover:scale-105'
                }`}
              >
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
              Les enquêtes
                </div>
            </button>
            <button 
              onClick={() => setView('statistiques')} 
                className={`px-2 lg:px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 whitespace-nowrap ${
                  view === 'statistiques' 
                    ? 'bg-white text-blue-900 shadow-lg transform scale-105' 
                    : 'text-white hover:bg-blue-700/50 hover:scale-105'
                }`}
              >
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
              Statistiques Détaillées
                </div>
            </button>
            <button 
              onClick={() => setView('parametres')} 
                className={`px-2 lg:px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 whitespace-nowrap ${
                  view === 'parametres' 
                    ? 'bg-white text-blue-900 shadow-lg transform scale-105' 
                    : 'text-white hover:bg-blue-700/50 hover:scale-105'
                }`}
              >
                <div className="flex items-center gap-0.5 lg:gap-1">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                  </svg>
              Paramètres
                </div>
            </button>
            
            {/* Profil utilisateur et déconnexion */}
              <div className="flex items-center gap-1 ml-1 pl-1">
              {user && (
                  <div className="relative">
                    {user?.profilePhoto ? (
                      <img 
                        src={`${environment.apiBaseUrl}${user.profilePhoto}`} 
                        alt="Photo de profil" 
                        className="w-5 h-5 rounded-full object-cover shadow-md hover:shadow-lg transition-shadow duration-200"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold text-xs shadow-md hover:shadow-lg transition-shadow duration-200">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full border border-white"></div>
                </div>
              )}
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }} 
                  className="bg-white text-blue-900 px-1.5 py-1 rounded-lg font-semibold text-xs hover:bg-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                Déconnexion
              </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-blue-800/50 backdrop-blur-sm border-t border-blue-700">
            <div className="px-4 py-4 space-y-2">
            <button 
              onClick={() => setView('dashboard')} 
                className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  view === 'dashboard' 
                    ? 'bg-white text-blue-900 shadow-lg' 
                    : 'text-white hover:bg-blue-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
              Tableau de bord
                </div>
            </button>
            <button 
              onClick={() => setView('enquetes')} 
                className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  view === 'enquetes' 
                    ? 'bg-white text-blue-900 shadow-lg' 
                    : 'text-white hover:bg-blue-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
              Les enquêtes
                </div>
            </button>
            <button 
              onClick={() => setView('statistiques')} 
                className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  view === 'statistiques' 
                    ? 'bg-white text-blue-900 shadow-lg' 
                    : 'text-white hover:bg-blue-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
              Statistiques Détaillées
                </div>
            </button>
            <button 
              onClick={() => setView('parametres')} 
                className={`w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  view === 'parametres' 
                    ? 'bg-white text-blue-900 shadow-lg' 
                    : 'text-white hover:bg-blue-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                  </svg>
              Paramètres
                </div>
            </button>
            
            {/* Profil et déconnexion mobile */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-blue-700">
              {user && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user?.profilePhoto ? (
                        <img 
                          src={`${environment.apiBaseUrl}${user.profilePhoto}`} 
                          alt="Photo de profil" 
                          className="w-8 h-8 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold shadow-md">
                          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{user?.name || 'Analyste'}</span>
                      <span className="text-xs text-blue-200">{user?.email}</span>
                    </div>
                </div>
              )}
              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); }} 
                  className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Déconnexion
              </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Contenu principal */}
      <main className="p-4 sm:p-8">
        {/* Tableau de bord */}
        {view === 'dashboard' && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Tableau de Bord - Interface Analyste</h1>
            
            {/* Chargement */}
            {validationLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Chargement des statistiques de validation...</p>
              </div>
            ) : (
              <>
                {/* Styles CSS pour les animations */}
                <style>{flipCardStyles}</style>
                
                {/* Statistiques de validation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-6xl mx-auto">
                  {/* Carte Validés */}
                  <div 
                    className="relative w-full h-24 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
                    onClick={() => toggleCardFlip('validated')}
                  >
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                      flippedCards.validated ? 'rotate-y-180' : ''
                    }`}>
                      {/* Recto */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                        <div className="text-center text-white">
                          <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                            <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                            <svg className="w-6 h-6 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                          <div className="text-xs font-semibold">Validés</div>
                          <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                        </div>
                      </div>
                      {/* Verso */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                        <div className="text-center text-white">
                          <div className="text-2xl font-bold mb-1 animate-bounce">
                            {validationStats?.totalValidated || 0}
                          </div>
                          <div className="text-xs font-semibold">Formulaires validés</div>
                          <div className="text-xs opacity-80 mt-1">
                            {validationStats && validationStats.totalRecords > 0 
                              ? `${((validationStats.totalValidated / validationStats.totalRecords) * 100).toFixed(1)}% du total`
                              : '0% du total'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte En attente */}
                  <div 
                    className="relative w-full h-24 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
                    onClick={() => toggleCardFlip('pending')}
                  >
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                      flippedCards.pending ? 'rotate-y-180' : ''
                    }`}>
                      {/* Recto */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                        <div className="text-center text-white">
                          <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                            <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                            <svg className="w-6 h-6 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2M13,17h-2v-6h2v6zM13,9h-2V7h2v2z"/>
                            </svg>
                          </div>
                          <div className="text-xs font-semibold">En attente</div>
                          <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                        </div>
                      </div>
                      {/* Verso */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                        <div className="text-center text-white">
                          <div className="text-2xl font-bold mb-1 animate-bounce">
                            {validationStats?.totalPending || 0}
                          </div>
                          <div className="text-xs font-semibold">En attente de validation</div>
                          <div className="text-xs opacity-80 mt-1">
                            {validationStats && validationStats.totalRecords > 0 
                              ? `${((validationStats.totalPending / validationStats.totalRecords) * 100).toFixed(1)}% du total`
                              : '0% du total'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte Demandes de correction */}
                  <div 
                    className="relative w-full h-24 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
                    onClick={() => toggleCardFlip('needsReview')}
                  >
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                      flippedCards.needsReview ? 'rotate-y-180' : ''
                    }`}>
                      {/* Recto */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                        <div className="text-center text-white">
                          <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                            <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                            <svg className="w-6 h-6 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
                            </svg>
                          </div>
                          <div className="text-xs font-semibold">À revoir</div>
                          <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                        </div>
                      </div>
                      {/* Verso */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                        <div className="text-center text-white">
                          <div className="text-2xl font-bold mb-1 animate-bounce">
                            {validationStats?.totalNeedsReview || 0}
                          </div>
                          <div className="text-xs font-semibold">Nécessitent révision</div>
                          <div className="text-xs opacity-80 mt-1">
                            {validationStats && validationStats.totalRecords > 0 
                              ? `${((validationStats.totalNeedsReview / validationStats.totalRecords) * 100).toFixed(1)}% du total`
                              : '0% du total'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Carte Total formulaires */}
                  <div 
                    className="relative w-full h-24 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
                    onClick={() => toggleCardFlip('total')}
                  >
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                      flippedCards.total ? 'rotate-y-180' : ''
                    }`}>
                      {/* Recto */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                        <div className="text-center text-white">
                          <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                            <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                            <svg className="w-6 h-6 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                            </svg>
                          </div>
                          <div className="text-xs font-semibold">Total</div>
                          <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                        </div>
                      </div>
                      {/* Verso */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                        <div className="text-center text-white px-2">
                          <div className="text-2xl font-bold mb-1 animate-bounce">
                            {analystStats?.totalRecords || 0}
                          </div>
                          <div className="text-xs font-semibold mb-2">Formulaires totaux</div>
                          <div className="text-xs opacity-90 space-y-1">
                            <div>📱 Application: {analystStats?.totalByApplication || 0}</div>
                            <div>🔗 Lien public: {analystStats?.totalByPublicLink || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Graphique en cercle - Répartition des statuts */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Répartition des Formulaires par Statut de Validation</h3>
                  <div className="flex justify-center">
                    <div style={{ width: '300px', height: '300px' }} className="sm:w-96 sm:h-96">
                      <Doughnut
                        data={{
                          labels: ['Validés', 'En attente', 'Demandes de correction'],
                          datasets: [{
                            data: [
                              validationStats?.totalValidated || 0,
                              validationStats?.totalPending || 0,
                              validationStats?.totalNeedsReview || 0
                            ],
                            backgroundColor: [
                              getChartColor(CompatibleColors.chart.green, 0.8),
                              getChartColor(CompatibleColors.chart.blue, 0.8),
                              getChartColor('#f97316', 0.8),
                            ],
                            borderColor: [
                              getChartColor(CompatibleColors.chart.green, 1),
                              getChartColor(CompatibleColors.chart.blue, 1),
                              getChartColor('#f97316', 1),
                            ],
                            borderWidth: 2,
                          }]
                        }}
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
                                label: function(context) {
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
                {validationStats?.pendingByEnumerator && validationStats.pendingByEnumerator.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h3 className="text-lg font-bold mb-4 text-center">Formulaires en Attente par Enquêteur</h3>
                    <div style={{ height: '400px' }}>
                      <Bar
                        data={{
                          labels: validationStats.pendingByEnumerator.map((e: any) => e.enumeratorName),
                          datasets: [{
                            label: 'Nombre de formulaires en attente',
                            data: validationStats.pendingByEnumerator.map((e: any) => e.count),
                            backgroundColor: getChartColor(CompatibleColors.chart.blue, 0.8),
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
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
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Bouton pour aller aux enquêtes */}
                <div className="text-center mt-8">
                  <button
                    onClick={() => setView('enquetes')}
                    className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
                  >
                    Voir toutes les enquêtes
                  </button>
                </div>
                </>
            )}
          </div>
        )}

        {/* Page des enquêtes */}
        {view === 'enquetes' && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">
              {selectedEnumeratorId ? 'Formulaires de l\'enquêteur' : 'Liste des Enquêteurs'}
            </h1>

            {/* Compteurs globaux - affichés seulement si aucun enquêteur n'est sélectionné */}
            {!selectedEnumeratorId && analystStats && (
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg font-semibold mb-4 text-center">Statistiques globales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {analystStats.totalByApplication || 0}
                    </div>
                    <div className="text-blue-800 font-medium">Formulaires par enquêteur (Application)</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analystStats.totalByPublicLink || 0}
                    </div>
                    <div className="text-green-800 font-medium">Formulaires par lien public</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton pour supprimer les doublons */}
            {!selectedEnumeratorId && selectedCampaignId && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => {
                    if (!selectedCampaignId) return;
                    setShowDeleteConfirmModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer les doublons
                </button>
              </div>
            )}
            
            {/* Bouton de retour si un enquêteur est sélectionné */}
            {selectedEnumeratorId && enumeratorSubmissions && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setSelectedEnumeratorId(null);
                    setEnumeratorSubmissions(null);
                    setSearch('');
                    setCommuneFilter('');
                    // Recharger les stats des enquêteurs
                    if (selectedCampaignId) {
                      fetchEnumeratorStats(selectedCampaignId);
                    }
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour à la liste des enquêteurs
                </button>
              </div>
            )}
            
            {/* Si un enquêteur est sélectionné, afficher ses formulaires */}
            {selectedEnumeratorId && enumeratorSubmissions ? (
                <div>
                {/* Statistiques de l'enquêteur */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {enumeratorSubmissions.appSubmissions?.length || 0}
                </div>
                        <div className="text-blue-800 font-medium">Par application</div>
                </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {enumeratorSubmissions.publicSubmissions?.length || 0}
              </div>
                        <div className="text-green-800 font-medium">Par lien public</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-2">
                          {enumeratorSubmissions.total || 0}
                        </div>
                        <div className="text-purple-800 font-medium">Total</div>
                      </div>
                    </div>
                    {/* Bouton d'export Excel */}
                 <button
                   onClick={() => {
                        const allSubmissions = [
                          ...(enumeratorSubmissions.appSubmissions || []).map((s: any) => ({
                            ...s,
                            authorName: s.author?.name || 'N/A',
                            source: 'application'
                          })),
                          ...(enumeratorSubmissions.publicSubmissions || []).map((s: any) => ({
                            ...s,
                            authorName: s.author?.name || s.submitterName || 'N/A',
                            source: 'public_link'
                          }))
                        ];
                        const fileName = `formulaires_${enumeratorSubmissions.enumeratorName || 'enqueteur'}_${new Date().toISOString().split('T')[0]}`;
                        const success = exportEnquetesToExcel(allSubmissions, fileName);
                        if (success) {
                          setExportNotification({
                            isVisible: true,
                            isSuccess: true,
                            message: 'Export Excel réussi !'
                          });
                        }
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                 >
                   <Download className="h-4 w-4" />
                   Exporter en Excel
                 </button>
               </div>
            </div>

                {/* Liste des formulaires par application */}
                {enumeratorSubmissions.appSubmissions && enumeratorSubmissions.appSubmissions.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">
                      Formulaires soumis par application ({
                        enumeratorSubmissions.appSubmissions.filter((s: any) => {
                          if (!search) return true;
                          const nomOuCode = s.formData?.['identification.nomOuCode'] || s.formData?.household?.nomOuCode || '';
                          return nomOuCode.toLowerCase().includes(search.toLowerCase());
                        }).length
                      })
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enumeratorSubmissions.appSubmissions.filter((s: any) => {
                        if (!search) return true;
                        const nomOuCode = s.formData?.['identification.nomOuCode'] || s.formData?.household?.nomOuCode || '';
                        return nomOuCode.toLowerCase().includes(search.toLowerCase());
                      }).map((submission: any) => (
                        <div
                          key={submission.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedRecord(submission);
                            setShowDetailModal(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Application</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              submission.analystValidationStatus === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                              submission.analystValidationStatus === 'NEEDS_REVIEW' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {submission.analystValidationStatus === 'VALIDATED' ? 'Validé' :
                               submission.analystValidationStatus === 'NEEDS_REVIEW' ? 'À revoir' :
                               'En attente'}
                            </span>
                      </div>
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            {submission.formData?.['identification.nomOuCode'] || submission.formData?.household?.nomOuCode || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(submission.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                      </div>
                      ))}
                    </div>
                      </div>
                )}

                {/* Liste des formulaires par lien public */}
                {enumeratorSubmissions.publicSubmissions && enumeratorSubmissions.publicSubmissions.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-800">
                      Formulaires soumis par lien public ({
                        enumeratorSubmissions.publicSubmissions.filter((s: any) => {
                          if (!search) return true;
                          const nomOuCode = s.formData?.['identification.nomOuCode'] || s.formData?.household?.nomOuCode || '';
                          return nomOuCode.toLowerCase().includes(search.toLowerCase());
                        }).length
                      })
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enumeratorSubmissions.publicSubmissions.filter((s: any) => {
                        if (!search) return true;
                        const nomOuCode = s.formData?.['identification.nomOuCode'] || s.formData?.household?.nomOuCode || '';
                        return nomOuCode.toLowerCase().includes(search.toLowerCase());
                      }).map((submission: any) => (
                        <div
                          key={submission.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedRecord(submission);
                            setShowDetailModal(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Lien public</span>
                            {submission.submitterName && (
                              <span className="text-xs text-gray-600">{submission.submitterName}</span>
                            )}
                      </div>
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            {submission.formData?.['identification.nomOuCode'] || submission.formData?.household?.nomOuCode || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(submission.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                      </div>
                      ))}
                    </div>
              </div>
            )}

                {enumeratorSubmissionsLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Chargement des formulaires...</p>
                  </div>
                )}
              </div>
            ) : (
              /* Liste des enquêteurs avec leurs stats */
              <div>
                {/* Afficher la campagne actuelle */}
                {selectedCampaignId && campaignData?.campaign && (
                  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Campagne : {campaignData.campaign.title}
                  </h3>
                        <p className="text-sm text-gray-600">
                          {campaignData.campaign.description}
                        </p>
                </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                        onClick={() => {
                            if (selectedCampaignId) {
                              fetchEnumeratorStats(selectedCampaignId);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Actualiser
                        </button>
                          </div>
                        </div>
                          </div>
                )}

                {/* Bouton d'export global - visible même si la campagne n'est pas chargée */}
                {selectedCampaignId && enumeratorStats.length > 0 && (
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={() => {
                        if (selectedCampaignId) {
                          exportAllEnumeratorsSubmissions(selectedCampaignId);
                        }
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <Download className="h-5 w-5" />
                      <span className="hidden sm:inline">Exporter tous les formulaires</span>
                      <span className="sm:hidden">Exporter tout</span>
                    </button>
                          </div>
                )}

                {/* Filtres de recherche */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-4">Filtres de recherche</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Recherche par nom d'enquêteur */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rechercher par nom d'enquêteur
                      </label>
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nom de l'enquêteur..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {/* Recherche par nom de personne (pour les formulaires) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rechercher par nom de personne (formulaires)
                      </label>
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nom de la personne concernée..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {/* Filtre par commune */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtrer par commune
                      </label>
                      <select
                        value={communeFilter}
                        onChange={(e) => setCommuneFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Toutes les communes</option>
                        {communesKinshasa.map((commune) => (
                          <option key={commune} value={commune}>
                            {commune}
                          </option>
                        ))}
                      </select>
                          </div>
                          </div>
                        </div>

                {/* Chargement des stats */}
                {enumeratorStatsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Chargement des enquêteurs...</p>
                  </div>
                ) : enumeratorStats.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <h3 className="text-lg font-semibold mb-4">Enquêteurs ({enumeratorStats.filter((e: any) => {
                      const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
                      return matchesSearch;
                    }).length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enumeratorStats.filter((enumerator: any) => {
                        const matchesSearch = !search || enumerator.name.toLowerCase().includes(search.toLowerCase()) || enumerator.email.toLowerCase().includes(search.toLowerCase());
                        return matchesSearch;
                      }).map((enumerator: any) => (
                        <div
                          key={enumerator.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => {
                            if (selectedCampaignId) {
                              handleEnumeratorClick(enumerator.id, selectedCampaignId);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-bold">
                                  {enumerator.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{enumerator.name}</p>
                                <p className="text-xs text-gray-500">{enumerator.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-lg font-bold text-blue-600">{enumerator.appSubmissionsCount || 0}</div>
                              <div className="text-xs text-blue-800">Par app</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="text-lg font-bold text-green-600">{enumerator.publicLinkSubmissionsCount || 0}</div>
                              <div className="text-xs text-green-800">Par lien</div>
                            </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                ) : selectedCampaignId ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun enquêteur trouvé pour cette campagne
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Veuillez sélectionner une campagne pour voir les enquêteurs
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Page des statistiques détaillées */}
        {view === 'statistiques' && (
          <div>
            <EnumeratorListWithDailyStats 
              onViewForms={(enumeratorId) => {
                setSelectedEnumeratorId(enumeratorId);
                setSearch('');
                setCommuneFilter('');
                setView('enquetes');
              }}
            />
          </div>
        )}

        {/* Page des paramètres */}
        {view === 'parametres' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-center">Paramètres du Compte Analyste</h1>
            <Settings />
          </div>
        )}
      </main>

      {/* Notification d'export */}
      <ExportNotification
        show={exportNotification.isVisible}
        message={exportNotification.message}
        type={exportNotification.isSuccess ? 'success' : 'error'}
        onClose={closeExportNotification}
      />

      {/* Modal de détails de l'enquête */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* En-tête du modal */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Détails de l'enquête - {selectedRecord.formData?.['identification.nomOuCode'] || selectedRecord.formData?.household?.nomOuCode || 'Ménage'}
                </h3>
                  <p className="text-sm text-gray-600">
                    Enquêteur : {selectedRecord.author?.name || selectedRecord.submitterName || 'N/A'} - Campagne : {selectedRecord.survey?.title || 'N/A'}
                  </p>
                  {selectedRecord.source === 'public_link' && selectedRecord.submitterName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Soumis par : {selectedRecord.submitterName} {selectedRecord.submitterContact ? `(${selectedRecord.submitterContact})` : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRecord(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenu du modal */}
              <div className="max-h-96 overflow-y-auto">
                {/* 1. Identification du ménage */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">1</span>
                    Identification du ménage
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Nom ou code du ménage :</span>
                      <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData?.['identification.nomOuCode'] || selectedRecord.formData?.household?.nomOuCode || 'N/A'}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Âge :</span>
                      <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData?.['identification.age'] || selectedRecord.formData?.household?.age || 'N/A'} ans</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Sexe :</span>
                      <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData?.['identification.sexe'] || selectedRecord.formData?.household?.sexe || 'N/A'}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Taille du ménage :</span>
                      <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData?.['identification.tailleMenage'] || selectedRecord.formData?.household?.tailleMenage || 'N/A'} personnes</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Commune/Quartier :</span>
                      <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData?.['identification.communeQuartier'] || selectedRecord.formData?.household?.communeQuartier || 'N/A'}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Géolocalisation :</span>
                      <div className="mt-1 text-gray-900 font-semibold font-mono text-sm">{selectedRecord.formData?.['household.geolocalisation'] || selectedRecord.formData?.household?.geolocalisation || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Mode de cuisson actuelle */}
                {(selectedRecord.formData?.['modeCuisson.combustibles'] || selectedRecord.formData?.['modeCuisson.equipements'] || selectedRecord.formData?.['modeCuisson.autresCombustibles'] || selectedRecord.formData?.['modeCuisson.autresEquipements'] || selectedRecord.formData?.cooking) && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold mr-2">2</span>
                      Mode de cuisson actuelle
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">2.1.1. Combustibles utilisés (par ordre d'importance) :</span>
                        <div className="mt-2">
                          {selectedRecord.formData?.['modeCuisson.combustibles'] ? (
                            typeof selectedRecord.formData['modeCuisson.combustibles'] === 'object' 
                              ? Object.entries(selectedRecord.formData['modeCuisson.combustibles'])
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
                              : selectedRecord.formData['modeCuisson.combustibles']
                          ) : (
                            Array.isArray(selectedRecord.formData?.cooking?.combustibles) 
                              ? selectedRecord.formData.cooking.combustibles.join(', ') 
                              : 'N/A'
                          )}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">2.1.2. Principal équipement de cuisson :</span>
                        <div className="mt-1 text-gray-900 font-semibold">
                          {selectedRecord.formData?.['modeCuisson.equipements'] || (
                            Array.isArray(selectedRecord.formData?.cooking?.equipements) 
                              ? selectedRecord.formData.cooking.equipements.join(', ') 
                              : 'N/A'
                          )}
                        </div>
                      </div>
                      {selectedRecord.formData?.['modeCuisson.autresCombustibles'] && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Autres combustibles :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData['modeCuisson.autresCombustibles']}</div>
                        </div>
                      )}
                      {selectedRecord.formData?.['modeCuisson.autresEquipements'] && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Autres équipements :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData['modeCuisson.autresEquipements']}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Connaissance des solutions de cuisson propres */}
                {(selectedRecord.formData?.['connaissance.connaissanceSolutions'] || selectedRecord.formData?.['connaissance.solutionsConnaissances'] || selectedRecord.formData?.['connaissance.avantages'] || selectedRecord.formData?.['connaissance.autresAvantages'] || selectedRecord.formData?.knowledge) && (
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
                            (selectedRecord.formData?.['connaissance.connaissanceSolutions'] || selectedRecord.formData?.knowledge?.connaissanceSolutions) === 'Oui' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedRecord.formData?.['connaissance.connaissanceSolutions'] || selectedRecord.formData?.knowledge?.connaissanceSolutions || 'N/A'}
                          </span>
                        </div>
                      </div>
                      {selectedRecord.formData?.['connaissance.solutionsConnaissances'] && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Solutions connues :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData['connaissance.solutionsConnaissances']}</div>
                        </div>
                      )}
                      {selectedRecord.formData?.['connaissance.avantages'] && (
                        <div className="bg-purple-50 p-3 rounded-lg md:col-span-2">
                          <span className="font-medium text-gray-700">3.2. Avantages perçus :</span>
                          <div className="mt-2">
                            {Array.isArray(selectedRecord.formData['connaissance.avantages']) ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedRecord.formData['connaissance.avantages'].map((avantage, index) => (
                                  <span key={index} className="inline-block bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                    ✓ {avantage}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-900 font-semibold">{selectedRecord.formData['connaissance.avantages']}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedRecord.formData?.['connaissance.autresAvantages'] && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Autres avantages :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData['connaissance.autresAvantages']}</div>
                        </div>
                      )}
                      {!selectedRecord.formData?.['connaissance.avantages'] && selectedRecord.formData?.knowledge?.avantages && (
                        <div className="bg-purple-50 p-3 rounded-lg md:col-span-2">
                          <span className="font-medium text-gray-700">Avantages :</span>
                          <div className="mt-1 text-gray-900 font-semibold">
                            {Array.isArray(selectedRecord.formData.knowledge.avantages) 
                              ? selectedRecord.formData.knowledge.avantages.join(', ') 
                              : 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Perceptions et contraintes */}
                {(selectedRecord.formData?.['perceptions.obstacles'] || selectedRecord.formData?.['perceptions.autresObstacles'] || selectedRecord.formData?.['perceptions.pretA'] || selectedRecord.formData?.constraints) && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold mr-2">4</span>
                      Perceptions et contraintes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRecord.formData?.['perceptions.obstacles'] && (
                        <div className="bg-orange-50 p-3 rounded-lg md:col-span-2">
                          <span className="font-medium text-gray-700">4.1. Obstacles perçus :</span>
                          <div className="mt-2">
                            {Array.isArray(selectedRecord.formData['perceptions.obstacles']) ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedRecord.formData['perceptions.obstacles'].map((obstacle, index) => (
                                  <span key={index} className="inline-block bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                    ⚠️ {obstacle}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-900 font-semibold">{selectedRecord.formData['perceptions.obstacles']}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedRecord.formData?.['perceptions.autresObstacles'] && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Autres obstacles :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData['perceptions.autresObstacles']}</div>
                        </div>
                      )}
                      {selectedRecord.formData?.['perceptions.pretA'] && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <span className="font-medium text-gray-700">Je suis prêt(e) à :</span>
                          <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.formData['perceptions.pretA']}</div>
                        </div>
                      )}
                      {!selectedRecord.formData?.['perceptions.obstacles'] && selectedRecord.formData?.constraints?.obstacles && (
                        <div className="bg-orange-50 p-3 rounded-lg md:col-span-2">
                          <span className="font-medium text-gray-700">Obstacles :</span>
                          <div className="mt-1 text-gray-900 font-semibold">
                            {Array.isArray(selectedRecord.formData.constraints.obstacles) 
                              ? selectedRecord.formData.constraints.obstacles.join(', ') 
                              : 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Intention d'adoption */}
                {(selectedRecord.formData?.['intentionAdoption.pretAcheterFoyer'] || selectedRecord.formData?.['intentionAdoption.pretAcheterGPL'] || selectedRecord.formData?.adoption) && (
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
                            (selectedRecord.formData?.['intentionAdoption.pretAcheterFoyer'] || selectedRecord.formData?.adoption?.pretAcheterFoyer) === 'Oui' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedRecord.formData?.['intentionAdoption.pretAcheterFoyer'] || selectedRecord.formData?.adoption?.pretAcheterFoyer || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">5.2. Prêt(e) à utiliser un réchaud GPL :</span>
                        <div className="mt-1">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                            (selectedRecord.formData?.['intentionAdoption.pretAcheterGPL'] || selectedRecord.formData?.adoption?.pretAcheterGPL) === 'Oui' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedRecord.formData?.['intentionAdoption.pretAcheterGPL'] || selectedRecord.formData?.adoption?.pretAcheterGPL || 'N/A'}
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
                      <span className="font-medium text-gray-700">Enquêteur :</span>
                      <div className="mt-1 text-gray-900 font-semibold">
                        {selectedRecord.author?.name || selectedRecord.authorName || selectedRecord.submitterName || selectedRecord.authorId || 'N/A'}
                      </div>
                      {selectedRecord.author?.email && (
                        <div className="mt-1 text-xs text-gray-600">{selectedRecord.author.email}</div>
                      )}
                      {selectedRecord.source === 'public_link' && selectedRecord.submitterContact && (
                        <div className="mt-1 text-xs text-gray-600">Contact soumetteur : {selectedRecord.submitterContact}</div>
                      )}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="font-medium text-gray-700">Date et heure de soumission :</span>
                      <div className="mt-1 text-gray-900 font-semibold">
                        {selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) : 'N/A'}
                      </div>
                    </div>
                    {selectedRecord.survey && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">Campagne :</span>
                        <div className="mt-1 text-gray-900 font-semibold">{selectedRecord.survey.title}</div>
                        {selectedRecord.survey.description && (
                          <div className="mt-1 text-xs text-gray-600">{selectedRecord.survey.description}</div>
                        )}
                      </div>
                    )}
                    {selectedRecord.source && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">Source :</span>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            selectedRecord.source === 'public_link' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedRecord.source === 'public_link' ? 'Lien public' : 'Application'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
                {/* Boutons de validation */}
                <div className="flex flex-col gap-3">
                  {!recordActionLocked && showCommentField && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-orange-800 mb-2">
                        Commentaire pour le Project Manager (obligatoire):
                      </label>
                      <p className="text-xs text-orange-700 mb-2">
                        Ce formulaire sera marqué "À revoir" et attirera l'attention du Project Manager pour une analyse approfondie.
                      </p>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Expliquez pourquoi ce formulaire doit être revu..."
                        className="w-full h-24 px-3 py-2 border border-orange-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}

                  {!recordActionLocked ? (
                    <div className="flex justify-end gap-3">
                      {!showCommentField ? (
                        <>
                          <button
                            onClick={() => handleValidate(selectedRecord.id, 'VALIDATED')}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                          >
                            ✓ Valider
                          </button>
                          <button
                            onClick={() => setShowCommentField(true)}
                            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                          >
                            ⚠ À revoir
                          </button>
                          <button
                            onClick={closeDetailModal}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleValidate(selectedRecord.id, 'NEEDS_REVIEW')}
                            disabled={!reviewComment.trim()}
                            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            ✓ Confirmer "À revoir"
                          </button>
                          <button
                            onClick={() => {
                              setShowCommentField(false);
                              setReviewComment('');
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {recordActionMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                          {recordActionMessage}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button
                          onClick={closeDetailModal}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          Fermer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour la suppression des doublons */}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={async () => {
          if (!selectedCampaignId) return;
          setIsDeletingDuplicates(true);
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(
              `${environment.apiBaseUrl}/records/detect-and-remove-duplicates?campaignId=${selectedCampaignId}`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            if (response.ok) {
              const result = await response.json();
              toast.success(
                `${result.duplicatesRemoved} doublon${result.duplicatesRemoved > 1 ? 's' : ''} supprimé${result.duplicatesRemoved > 1 ? 's' : ''} sur ${result.duplicatesFound} détecté${result.duplicatesFound > 1 ? 's' : ''}`,
                { autoClose: 5000 }
              );
              setShowDeleteConfirmModal(false);
              // Recharger les données
              if (selectedCampaignId) {
                fetchEnumeratorStats(selectedCampaignId);
              }
              fetchAnalystStats();
            } else {
              const error = await response.json();
              toast.error(error.message || 'Erreur lors de la suppression des doublons');
            }
          } catch (error: any) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la suppression des doublons');
          } finally {
            setIsDeletingDuplicates(false);
          }
        }}
        title="Supprimer les doublons"
        message="Êtes-vous sûr de vouloir détecter et supprimer les doublons ? Cette action est irréversible et supprimera définitivement les formulaires en double."
        confirmText="Supprimer les doublons"
        cancelText="Annuler"
        type="danger"
        isLoading={isDeletingDuplicates}
      />
      
      <PNUDFooter />
    </div>
  );
} 
