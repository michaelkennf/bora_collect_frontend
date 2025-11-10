import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { environment } from '../config/environment';
import { extractFormEntries } from '../utils/formDataUtils';
import { exportEnquetesToExcel } from '../utils/excelExport';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  targetProvince?: string;
  selectedODD?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  publisher?: {
    id: string;
    name: string;
  };
}

interface CampaignResponse {
  id: string;
  surveyId: string;
  formData: { [key: string]: any };
  status: string;
  analystValidationStatus?: string | null; // Statut de validation par l'analyste
  createdAt: string;
  updatedAt: string;
  authorId: string;
  validatedBy: string | null;
  isSystemForm: boolean;
  author: {
    id: string;
    name: string;
    email: string;
  };
  survey: {
    id: string;
    title: string;
    description: string;
  };
}

interface AdminCampaignDataProps {
  onBack?: () => void;
}

const AdminCampaignData: React.FC<AdminCampaignDataProps> = ({ onBack }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [responses, setResponses] = useState<CampaignResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [selectedResponse, setSelectedResponse] = useState<CampaignResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Styles CSS pour les animations 3D
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
  `;

  // Fonction pour gérer le retournement des cartes
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignResponses(selectedCampaign);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${environment.apiBaseUrl}/surveys/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignResponses = async (campaignId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${environment.apiBaseUrl}/records/campaign/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setResponses(data);
      } else {
        setResponses([]);
        toast.info('Aucune donnée trouvée pour cette campagne');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réponses:', error);
      toast.error('Erreur lors du chargement des données');
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  // Convertir les réponses au format attendu par exportEnquetesToExcel
  const convertResponsesToEnquetes = (responses: CampaignResponse[]) => {
    return responses.map((response) => {
      return {
        ...response,
        authorName: response.author?.name || 'N/A',
        formData: response.formData || {}
      };
    });
  };

  const exportToCSV = async () => {
    if (!selectedCampaign || responses.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    setExporting(true);
    try {
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      const fileName = `donnees_campagne_${campaign?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'campagne'}_${new Date().toISOString().split('T')[0]}`;
      
      const enquetes = convertResponsesToEnquetes(responses);
      const success = exportEnquetesToExcel(enquetes, fileName);
      
      if (success) {
        toast.success('Export Excel généré avec succès');
      } else {
        toast.error('Erreur lors de l\'export Excel');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'PENDING': return 'En attente';
      default: return status;
    }
  };

  const getAnalystValidationStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'NEEDS_REVIEW': return 'bg-orange-100 text-orange-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case null:
      case undefined:
        return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnalystValidationStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'VALIDATED': return 'Validé';
      case 'NEEDS_REVIEW': return 'À revoir';
      case 'PENDING': return 'En attente';
      case null:
      case undefined:
        return 'En attente';
      default: return status || 'Non défini';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const renderResponseDetails = (formData: any) => {
    if (!formData) {
      return <p className="text-gray-500">Aucune donnée disponible pour ce formulaire.</p>;
    }

    const entries = extractFormEntries(formData);

    if (!entries.length) {
      return <p className="text-gray-500">Aucune donnée disponible pour ce formulaire.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((entry) => (
          <div key={entry.key} className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">{entry.label}</div>
            {entry.chips && entry.chips.length ? (
              <div className="flex flex-wrap gap-2">
                {entry.chips.map((chip, idx) => (
                  <span
                    key={`${entry.key}-${idx}`}
                    className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-base text-gray-800 whitespace-pre-wrap break-words">
                {entry.displayValue || 'Non renseigné'}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Fonction pour voir les détails d'une réponse
  const viewResponseDetails = (response: CampaignResponse) => {
    setSelectedResponse(response);
    setShowDetailModal(true);
  };

  // Fonction pour fermer le modal de détails
  const closeDetailModal = () => {
    setSelectedResponse(null);
    setShowDetailModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Styles CSS pour les animations 3D */}
      <style dangerouslySetInnerHTML={{ __html: flipCardStyles }} />
      
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-semibold">Retour</span>
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Données des Campagnes
              </h1>
              <p className="text-gray-600">
                Visualisez et exportez les données des répondants par campagne
              </p>
            </div>
          </div>
        </div>

        {/* Sélection de campagne */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sélectionner une campagne</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campagne
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Sélectionnez une campagne</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title} - {getStatusLabel(campaign.status)}
                  </option>
                ))}
              </select>
            </div>
            {selectedCampaign && (
              <button
                onClick={exportToCSV}
                disabled={exporting || responses.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 hover:scale-105 active:scale-95"
              >
                {exporting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Export en cours...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Exporter en Excel</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Statistiques avec cartes animées */}
        {selectedCampaign && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Carte Total Réponses */}
            <div 
              className="relative w-full h-32 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
              onClick={() => toggleCardFlip('totalResponses')}
            >
              <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                flippedCards.totalResponses ? 'rotate-y-180' : ''
              }`}>
                {/* Recto */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                  <div className="text-center text-white">
                    <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                      <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                      <svg className="w-8 h-8 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold">Total Réponses</div>
                    <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                  </div>
                </div>
                {/* Verso */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                  <div className="text-center text-white">
                    <div className="text-3xl font-bold mb-2">
                      {loading ? (
                        <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto"></div>
                      ) : (
                        <span className="animate-bounce hover:animate-pulse transition-all duration-300 hover:scale-110 hover:text-yellow-200">
                          {responses.length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div>Campagne sélectionnée</div>
                      <div className="font-semibold mt-1">
                        {campaigns.find(c => c.id === selectedCampaign)?.title || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Réponses Valides */}
            <div 
              className="relative w-full h-32 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
              onClick={() => toggleCardFlip('validResponses')}
            >
              <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                flippedCards.validResponses ? 'rotate-y-180' : ''
              }`}>
                {/* Recto */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                  <div className="text-center text-white">
                    <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                      <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                      <svg className="w-8 h-8 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold">Réponses Valides</div>
                    <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                  </div>
                </div>
                {/* Verso */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                  <div className="text-center text-white">
                    <div className="text-3xl font-bold mb-2">
                      {loading ? (
                        <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto"></div>
                      ) : (
                        <span className="animate-bounce hover:animate-pulse transition-all duration-300 hover:scale-110 hover:text-yellow-200">
                          {responses.filter(r => r.analystValidationStatus === 'VALIDATED').length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div>Statut: Validés</div>
                      <div className="font-semibold mt-1">
                        {responses.length > 0 ? 
                          `${Math.round((responses.filter(r => r.analystValidationStatus === 'VALIDATED').length / responses.length) * 100)}%` : 
                          '0%'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte En Attente */}
            <div 
              className="relative w-full h-32 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
              onClick={() => toggleCardFlip('pendingResponses')}
            >
              <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                flippedCards.pendingResponses ? 'rotate-y-180' : ''
              }`}>
                {/* Recto */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow duration-300">
                  <div className="text-center text-white">
                    <div className="mb-2 hover:scale-110 transition-transform duration-200 relative">
                      <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm"></div>
                      <svg className="w-8 h-8 mx-auto relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold">En Attente</div>
                    <div className="text-xs opacity-80 mt-1 animate-pulse">Cliquez pour voir</div>
                  </div>
                </div>
                {/* Verso */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg flex items-center justify-center rotate-y-180">
                  <div className="text-center text-white">
                    <div className="text-3xl font-bold mb-2">
                      {loading ? (
                        <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto"></div>
                      ) : (
                        <span className="animate-bounce hover:animate-pulse transition-all duration-300 hover:scale-110 hover:text-yellow-200">
                          {responses.filter(r => r.analystValidationStatus === 'PENDING' || r.analystValidationStatus === null || r.analystValidationStatus === undefined).length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div>Statut: En attente</div>
                      <div className="font-semibold mt-1">
                        {responses.length > 0 ? 
                          `${Math.round((responses.filter(r => r.analystValidationStatus === 'PENDING' || r.analystValidationStatus === null || r.analystValidationStatus === undefined).length / responses.length) * 100)}%` : 
                          '0%'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des réponses */}
        {selectedCampaign && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Réponses ({responses.length})
              </h2>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des données...</p>
              </div>
            ) : responses.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune réponse trouvée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cette campagne n'a pas encore de réponses ou les données ne sont pas disponibles.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enquêteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localisation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de soumission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {responses.map((response) => (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{response.author?.name || response.authorId || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{response.author?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {response.formData?.['identification.communeQuartier'] || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAnalystValidationStatusColor(response.analystValidationStatus)}`}>
                            {getAnalystValidationStatusLabel(response.analystValidationStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(response.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewResponseDetails(response)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 🔄 Modal de détails de la réponse - Version structurée identique à l'analyste */}
        {showDetailModal && selectedResponse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* En-tête du modal */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Détails de la réponse - {selectedResponse.author?.name || selectedResponse.authorId || 'N/A'}
                  </h3>
                  <button
                    onClick={closeDetailModal}
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
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold mr-2">ℹ️</span>
                      Informations générales
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">Enquêteur :</span>
                        <div className="mt-1 text-gray-900 font-semibold">{selectedResponse.author?.name || selectedResponse.authorId || 'N/A'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700">Date et heure de soumission :</span>
                        <div className="mt-1 text-gray-900 font-semibold">
                          {selectedResponse.createdAt ? new Date(selectedResponse.createdAt).toLocaleString('fr-FR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">📋</span>
                      Contenu du formulaire
                    </h4>
                    {renderResponseDetails(selectedResponse.formData)}
                  </div>

                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={closeDetailModal}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCampaignData;
