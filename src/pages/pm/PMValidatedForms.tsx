import React, { useState, useEffect } from 'react';
import { environment } from '../../config/environment';
import { toast } from 'react-toastify';
import { extractFormEntries, flattenFormDataToObject } from '../../utils/formDataUtils';
import { exportEnquetesToExcel } from '../../utils/excelExport';

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
`;

interface ValidatedForm {
  id: string;
  formData: any;
  createdAt: string;
  updatedAt: string;
  status: string;
  analystValidationStatus: string | null; // Statut de validation par l'analyste
  surveyId: string | null;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  survey: {
    id: string;
    title: string;
  } | null;
  analystValidator?: {
    id: string;
    name: string;
    email: string;
  } | null; // Analyste qui a validé le formulaire
}

const PMValidatedForms: React.FC = () => {
  const [validatedForms, setValidatedForms] = useState<ValidatedForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<ValidatedForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ValidatedForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'VALIDATED' | 'NEEDS_REVIEW'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});

  // Fonction pour gérer le retournement des cartes
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  useEffect(() => {
    fetchValidatedForms();
  }, []);

  useEffect(() => {
    filterForms();
  }, [validatedForms, filterStatus, searchTerm]);

  const fetchValidatedForms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Aucun token trouvé');
        return;
      }

      const response = await fetch(`${environment.apiBaseUrl}/surveys/pm-validated-forms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        console.log('⚠️ Token expiré ou invalide, déconnexion');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Formulaires validés récupérés:', data);
      setValidatedForms(data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des formulaires validés:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterForms = () => {
    let filtered = [...validatedForms];

    // Filtrer par statut de validation de l'analyste
    if (filterStatus !== 'all') {
      filtered = filtered.filter(form => form.analystValidationStatus === filterStatus);
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(form => 
        form.author.name.toLowerCase().includes(searchLower) ||
        form.survey?.title.toLowerCase().includes(searchLower) ||
        form.formData?.identification?.nom?.toLowerCase().includes(searchLower) ||
        form.formData?.nom?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredForms(filtered);
  };

  // Convertir les formulaires validés au format attendu par exportEnquetesToExcel
  const convertFormsToEnquetes = (forms: ValidatedForm[]) => {
    return forms.map((form) => {
      // Ajouter authorName pour la compatibilité avec exportEnquetesToExcel
      return {
        ...form,
        authorName: form.author?.name || 'N/A',
        formData: form.formData || {}
      };
    });
  };

  const handleExportAll = () => {
    const formsToExport = filteredForms.length ? filteredForms : validatedForms;
    if (formsToExport.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    try {
      const enquetes = convertFormsToEnquetes(formsToExport);
      const success = exportEnquetesToExcel(enquetes, 'formulaires_pm');
      if (success) {
        toast.success('Export Excel généré avec succès');
      } else {
        toast.error('Erreur lors de l\'export Excel');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const handleExportSingle = (form: ValidatedForm) => {
    try {
      const enquetes = convertFormsToEnquetes([form]);
      const success = exportEnquetesToExcel(enquetes, `formulaire_${form.id}`);
      if (success) {
        toast.success('Export Excel généré avec succès');
      } else {
        toast.error('Erreur lors de l\'export Excel');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Validé
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            À revoir
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            En attente
          </span>
        );
    }
  };

  const renderFormDetails = (formData: any) => {
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
                {entry.chips.map((chip, index) => (
                  <span
                    key={`${entry.key}-${index}`}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des formulaires...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Styles CSS pour les animations */}
      <style>{flipCardStyles}</style>
      
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Formulaires Validés par l'Analyste
        </h1>
        <p className="text-gray-600">
          Visualisez et consultez les formulaires validés ou nécessitant une révision
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par enquêteur, campagne ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="VALIDATED">Validés</option>
              <option value="NEEDS_REVIEW">À revoir</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Exporter en Excel
          </button>
        </div>
      </div>

      {/* Statistiques de validation avec animations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-6xl mx-auto">
        {/* Carte Total */}
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
              <div className="text-center text-white">
                <div className="text-2xl font-bold mb-1 animate-bounce">
                  {validatedForms.length}
                </div>
                <div className="text-xs font-semibold">Formulaires totaux</div>
                <div className="text-xs opacity-80 mt-1">
                  Formulaire{validatedForms.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  {validatedForms.filter(f => f.analystValidationStatus === 'VALIDATED').length}
                </div>
                <div className="text-xs font-semibold">Formulaires validés</div>
                <div className="text-xs opacity-80 mt-1">
                  {validatedForms.length > 0 
                    ? `${((validatedForms.filter(f => f.analystValidationStatus === 'VALIDATED').length / validatedForms.length) * 100).toFixed(1)}% du total`
                    : '0% du total'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte À revoir */}
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
                    <path d="M11,9H13V7H11M13,20H11V12H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
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
                  {validatedForms.filter(f => f.analystValidationStatus === 'NEEDS_REVIEW').length}
                </div>
                <div className="text-xs font-semibold">Nécessitent révision</div>
                <div className="text-xs opacity-80 mt-1">
                  {validatedForms.length > 0 
                    ? `${((validatedForms.filter(f => f.analystValidationStatus === 'NEEDS_REVIEW').length / validatedForms.length) * 100).toFixed(1)}% du total`
                    : '0% du total'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des formulaires */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Liste des Formulaires ({filteredForms.length})
        </h2>

        {filteredForms.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-600">Aucun formulaire trouvé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredForms.map((form) => (
              <div
                key={form.id}
                onClick={() => setSelectedForm(form)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold">
                          {form.author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{form.author.name}</div>
                        <div className="text-sm text-gray-600">{form.author.email}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Campagne: <span className="font-medium">{form.survey?.title || 'Non spécifiée'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Soumis le: <span className="font-medium">
                        {new Date(form.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(form.analystValidationStatus || form.status)}
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Voir les détails →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Détails du Formulaire</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedForm.author.name} - {selectedForm.survey?.title || 'Sans campagne'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExportSingle(selectedForm)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Exporter ce formulaire
                </button>
                <button
                  onClick={() => setSelectedForm(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Enquêteur</div>
                    <div className="font-medium text-gray-800">{selectedForm.author.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <div className="font-medium text-gray-800">{selectedForm.author.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Date de soumission</div>
                    <div className="font-medium text-gray-800">
                      {new Date(selectedForm.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Statut de validation</div>
                    {getStatusBadge(selectedForm.analystValidationStatus || selectedForm.status)}
                  </div>
                  {selectedForm.survey && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Campagne</div>
                      <div className="font-medium text-gray-800">{selectedForm.survey.title}</div>
                    </div>
                  )}
                  {selectedForm.analystValidator && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Validé par l'analyste</div>
                      <div className="font-medium text-gray-800">{selectedForm.analystValidator.name}</div>
                      <div className="text-xs text-gray-500">{selectedForm.analystValidator.email}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contenu du formulaire */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contenu du formulaire</h3>
                {renderFormDetails(selectedForm.formData)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMValidatedForms;
