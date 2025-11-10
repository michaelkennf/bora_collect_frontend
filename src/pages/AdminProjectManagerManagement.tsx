import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import UserCreationForm from '../components/UserCreationForm';
import ConfirmModal from '../components/ConfirmModal';
import { environment } from '../config/environment';

interface ProjectManager {
  id: string;
  name: string;
  email: string;
  contact?: string;
  province?: string;
  city?: string;
  commune?: string;
  quartier?: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  createdAt: string;
  campaign?: {
    id: string;
    title: string;
    description: string;
  };
}

interface ApprovalStats {
  pending: number;
  active: number;
  rejected: number;
  total: number;
}

const AdminProjectManagerManagement: React.FC = () => {
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedPM, setSelectedPM] = useState<ProjectManager | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const apiBaseUrl = environment.apiBaseUrl;

  useEffect(() => {
    fetchProjectManagers();
    fetchCampaigns();
  }, []);

  // Charger les Project Managers
  const fetchProjectManagers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté pour accéder à cette page');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const allUsers = await response.json();
        // Filtrer seulement les Project Managers (ANALYST)
        const pmUsers = allUsers.filter((user: any) => user.role === 'ANALYST');
        setProjectManagers(pmUsers);
        
        // Calculer les statistiques
        const statsData = {
          pending: pmUsers.filter((pm: any) => pm.status === 'PENDING_APPROVAL').length,
          active: pmUsers.filter((pm: any) => pm.status === 'ACTIVE').length,
          rejected: pmUsers.filter((pm: any) => pm.status === 'REJECTED').length,
          total: pmUsers.length
        };
        setStats(statsData);
      } else if (response.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else if (response.status === 403) {
        toast.error('Accès refusé. Vous devez être administrateur.');
      } else {
        toast.error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Charger les campagnes disponibles
  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/users/campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const campaignsData = await response.json();
        setCampaigns(campaignsData);
      } else {
        console.error('Erreur lors du chargement des campagnes');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Créer un nouveau Project Manager
  const handleCreatePM = async (formData: any) => {
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vous devez être connecté pour créer un Project Manager');
        return;
      }

      // Préparation des données avec le rôle ANALYST
      const cleanData = {
        ...formData,
        role: 'ANALYST' // Force le rôle ANALYST pour les Project Managers
      };

      const response = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success('Project Manager créé avec succès !');
      setShowCreateForm(false);
      await fetchProjectManagers();
      
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du Project Manager');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Approuver ou rejeter un Project Manager
  const handleApproval = async () => {
    if (!selectedPM) return;

    try {
      setApproving(selectedPM.id);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/users/${selectedPM.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          comments: comments.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success(`Project Manager ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès !`);
      setShowApprovalModal(false);
      setSelectedPM(null);
      setComments('');
      await fetchProjectManagers();
      
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la validation');
    } finally {
      setApproving(null);
    }
  };

  // Supprimer un Project Manager
  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      toast.success('Project Manager supprimé avec succès !');
      await fetchProjectManagers();
      
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  // Ouvrir le modal d'approbation
  const openApprovalModal = (pm: ProjectManager, actionType: 'approve' | 'reject') => {
    setSelectedPM(pm);
    setAction(actionType);
    setComments('');
    setShowApprovalModal(true);
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (confirmDeleteId) {
      await handleDelete(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  // Formater la date
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

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'PENDING_APPROVAL':
        return 'En attente';
      case 'REJECTED':
        return 'Rejeté';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des Project Managers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Project Managers
          </h1>
          <p className="text-gray-600">
            Gérez les Project Managers et leurs demandes d'inscription
          </p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejetés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter un Project Manager
            </button>
          </div>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <UserCreationForm
              onSubmit={handleCreatePM}
              onCancel={() => setShowCreateForm(false)}
              isLoading={submitting}
              title="Créer un nouveau Project Manager"
              showRoleSelection={false}
              defaultRole="ANALYST"
              campaigns={campaigns}
              loadingCampaigns={loadingCampaigns}
            />
          </div>
        )}

        {/* Liste des Project Managers */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Project Managers ({projectManagers.length})
            </h2>
          </div>

          {projectManagers.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun Project Manager</h3>
              <p className="mt-1 text-sm text-gray-500">Commencez par ajouter un Project Manager.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectManagers.map((pm) => (
                    <tr key={pm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{pm.name}</div>
                            <div className="text-sm text-gray-500">{pm.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pm.contact || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pm.province ? (
                          <div>
                            <div className="font-medium">{pm.province}</div>
                            {pm.city && <div className="text-gray-500">{pm.city}</div>}
                            {pm.commune && <div className="text-gray-500">{pm.commune}</div>}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pm.status)}`}>
                          {getStatusText(pm.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(pm.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {pm.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => openApprovalModal(pm, 'approve')}
                                disabled={approving === pm.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => openApprovalModal(pm, 'reject')}
                                disabled={approving === pm.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setConfirmDeleteId(pm.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal d'approbation */}
        {showApprovalModal && selectedPM && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">
                {action === 'approve' ? 'Approuver' : 'Rejeter'} le Project Manager
              </h3>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  <strong>Nom:</strong> {selectedPM.name}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Email:</strong> {selectedPM.email}
                </p>
                {selectedPM.contact && (
                  <p className="text-gray-600 mb-2">
                    <strong>Contact:</strong> {selectedPM.contact}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaires {action === 'approve' ? '(optionnel)' : '*'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={action === 'approve' ? 'Commentaires d\'approbation...' : 'Raison du rejet...'}
                  required={action === 'reject'}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleApproval}
                  disabled={approving === selectedPM.id || (action === 'reject' && !comments.trim())}
                  className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === 'approve' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {approving === selectedPM.id ? 'Traitement...' : (action === 'approve' ? 'Approuver' : 'Rejeter')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          show={!!confirmDeleteId}
          message="Voulez-vous vraiment supprimer ce Project Manager ? Cette action est irréversible."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
          confirmText="Supprimer"
          cancelText="Annuler"
        />
      </div>
    </div>
  );
};

export default AdminProjectManagerManagement;
