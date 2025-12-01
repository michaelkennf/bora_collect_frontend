import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Send, ArrowLeft } from 'lucide-react';
import { environment } from '../config/environment';
import logo2 from '../assets/images/logo2.jpg';
import { reverseGeocodeProvince } from '../utils/geocoding';

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  section?: string; // Pour les champs dans des sections
  fieldKey?: string; // Clé originale du champ
  conditional?: {
    field: string;
    value: any;
    operator?: string;
  };
  helpText?: string; // Pour l'explication quand la réponse est "Non"
  rankingOptions?: string[]; // Options de rang pour les champs ranking (ex: ["1er", "2e", "3e"])
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
}

interface Survey {
  id: string;
  title: string;
  description: string;
  formTemplates: FormTemplate[];
}

interface LinkData {
  linkId: string;
  survey: Survey;
  enumerator: {
    id: string;
    name: string;
  };
}

const parseFormTemplate = (template: FormTemplate | null): FormTemplate | null => {
  if (!template) return null;

  let fields: any = template.fields;
  if (typeof fields === 'string') {
    try {
      fields = JSON.parse(fields);
    } catch (error) {
      console.error('Error parsing fields JSON:', error);
      return { ...template, fields: [] };
    }
  }

  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    const flatFields: FormField[] = [];
    Object.entries(fields).forEach(([sectionKey, section]: [string, any]) => {
      if (section.type === 'object' && section.fields) {
        flatFields.push({
          id: `section_${sectionKey}`,
          label: section.label || sectionKey,
          type: 'section',
          required: false,
        });
        Object.entries(section.fields).forEach(([fieldKey, field]: [string, any]) => {
          const fieldType = fieldKey === 'communeQuartier' ? 'text' : field.type || 'text';
          // Utiliser le format sectionKey.fieldKey pour correspondre au format attendu
          flatFields.push({
            id: `${sectionKey}.${fieldKey}`, // Format: identification.nomOuCode, modeCuisson.combustibles, etc.
            label: field.label || fieldKey,
            type: fieldType,
            required: field.required || false,
            options: fieldType === 'text' ? undefined : field.options,
            placeholder: fieldKey === 'communeQuartier'
              ? 'Entrez votre commune/quartier'
              : field.placeholder,
            description: field.helpText,
            section: sectionKey, // Garder la section pour la transformation
            fieldKey: fieldKey, // Garder le fieldKey original
            conditional: field.conditional, // Garder la logique conditionnelle
            helpText: field.helpText, // Garder le texte d'aide
            rankingOptions: field.rankingOptions, // Garder les options de rang
          });
        });
      }
    });
    return { ...template, fields: flatFields };
  }

  return { ...template, fields: Array.isArray(fields) ? fields : [] };
};

const PublicFormPage = () => {
  const { token } = useParams<{ token: string }>();
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitterName, setSubmitterName] = useState('');
  const [submitterContact, setSubmitterContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gpsProvince, setGpsProvince] = useState<string | null>(null);
  const [gpsProvinceStatus, setGpsProvinceStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const validateLink = async () => {
      try {
        const response = await fetch(`${environment.apiBaseUrl}/public-links/form/${token}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Lien invalide ou expiré');
        }
        const data = await response.json();
        // Logs réduits pour améliorer les performances
        setLinkData(data);
      } catch (err: any) {
        // Logs réduits pour améliorer les performances
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateLink();
    }
  }, [token]);

  // Optimiser handleInputChange avec useCallback
  const handleInputChange = useCallback((fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  // Fonction pour vérifier si un champ doit être affiché selon les conditions (mémorisée)
  const shouldShowField = useCallback((field: FormField): boolean => {
    if (!field.conditional) return true;
    
    const { field: conditionalField, value: conditionalValue, operator = 'equals' } = field.conditional;
    
    // Construire l'ID complet du champ conditionnel
    const conditionalFieldId = conditionalField.includes('.') 
      ? conditionalField 
      : field.section 
        ? `${field.section}.${conditionalField}` 
        : conditionalField;
    
    const fieldValue = formData[conditionalFieldId];
    
    switch (operator) {
      case 'equals':
        return fieldValue === conditionalValue;
      case 'not_equals':
        return fieldValue !== conditionalValue;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(conditionalValue) : fieldValue?.includes(conditionalValue);
      default:
        return fieldValue === conditionalValue;
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Transformer les données pour correspondre au format attendu (avec clés pointées)
      // Les données sont déjà dans le format sectionKey.fieldKey grâce à parseFormTemplate
      // Mais pour les champs ranking et autres cas spéciaux, on doit les transformer
      const transformedFormData: Record<string, any> = { ...formData };
      
      // Nettoyer les clés temporaires (comme les clés de province GPS)
      Object.keys(transformedFormData).forEach(key => {
        if (key.endsWith('_province')) {
          delete transformedFormData[key];
        }
      });
      
      // Traiter les champs ranking - les données sont déjà dans le format { option: rank }
      // Pas besoin de transformation car elles sont déjà stockées correctement
      if (formTemplate?.fields) {
        formTemplate.fields.forEach((field) => {
          if (field.type === 'ranking') {
            // Les données de ranking sont déjà dans le format { "Bois": "1er", "Charbon de bois": "2e" }
            // On s'assure juste que le champ existe dans transformedFormData
            if (formData[field.id] && typeof formData[field.id] === 'object') {
              transformedFormData[field.id] = formData[field.id];
            }
          }
          
          // Traiter les champs checkbox pour s'assurer qu'ils sont des tableaux
          if (field.type === 'checkbox') {
            if (!transformedFormData[field.id]) {
              transformedFormData[field.id] = [];
            } else if (!Array.isArray(transformedFormData[field.id])) {
              transformedFormData[field.id] = [transformedFormData[field.id]];
            }
          }
        });
      }

      // Logs réduits pour améliorer les performances

      const response = await fetch(`${environment.apiBaseUrl}/public-links/form/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: transformedFormData,
          submitterName: submitterName || undefined,
          submitterContact: submitterContact || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la soumission');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  // Mémoriser le formTemplate pour éviter les recalculs
  const formTemplate = useMemo(() => {
    const formTemplates = linkData?.survey?.formTemplates;
    const rawFormTemplate =
      Array.isArray(formTemplates) && formTemplates.length > 0 ? formTemplates[0] : null;
    return parseFormTemplate(rawFormTemplate);
  }, [linkData]);

  // Mémoriser les champs visibles pour éviter les recalculs
  const visibleFields = useMemo(() => {
    if (!formTemplate || !Array.isArray(formTemplate.fields)) return [];
    return formTemplate.fields.filter((field: FormField) => shouldShowField(field));
  }, [formTemplate, shouldShowField]);

  // Optimiser captureGPS avec useCallback
  const captureGPS = useCallback((fieldId: string) => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    setGpsProvinceStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordsValue = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        handleInputChange(fieldId, coordsValue);
        try {
          const provinceName = await reverseGeocodeProvince(latitude, longitude);
          if (provinceName) {
            setGpsProvince(provinceName);
            handleInputChange(`${fieldId}_province`, provinceName);
            setGpsProvinceStatus('success');
          } else {
            setGpsProvince(null);
            setGpsProvinceStatus('error');
          }
        } catch (error) {
          setGpsProvince(null);
          setGpsProvinceStatus('error');
        }
      },
      (error) => {
        alert('Impossible de capturer la position GPS. Veuillez autoriser l\'accès à la localisation.');
        setGpsProvinceStatus('error');
      },
      { enableHighAccuracy: false, timeout: 2400000, maximumAge: 60000 } // 40 minutes
    );
  }, [handleInputChange]);

  const renderField = useCallback((field: FormField) => {
    const commonClasses =
      'w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

    switch (field.type) {
      case 'section':
        return (
          <div className="border-t-2 border-blue-200 pt-4 mt-6">
            <h3 className="text-lg font-semibold text-blue-700">{field.label}</h3>
          </div>
        );
      
      case 'info':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm">
            {field.label}
          </div>
        );
      
      case 'gps':
        return (
          <div className="space-y-3">
            <input
              type="text"
              id={field.id}
              placeholder="Latitude, Longitude"
              value={formData[field.id] || ''}
              readOnly
              required={field.required}
              className={`${commonClasses} bg-slate-50`}
            />
            <button
              type="button"
              onClick={() => captureGPS(field.id)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="4"/>
                <line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="4" y2="12"/>
                <line x1="20" y1="12" x2="22" y2="12"/>
              </svg>
              {gpsProvinceStatus === 'loading' ? 'Capture en cours...' : 'Capturer ma position GPS'}
            </button>
            {gpsProvinceStatus === 'success' && gpsProvince && (
              <p className="text-sm text-green-600">Province détectée : {gpsProvince}</p>
            )}
            {gpsProvinceStatus === 'error' && (
              <p className="text-sm text-red-600">Impossible de déterminer la province. Veuillez réessayer.</p>
            )}
          </div>
        );
      
      case 'ranking':
        const rankOptions = field.options || [];
        const rankingOptions = field.rankingOptions || ['1er', '2e', '3e', '4e', '5e'];
        
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 mb-3">
              Sélectionnez les combustibles utilisés et classez-les par ordre d'importance (1er, 2e, 3e, etc.)
            </p>
            {rankOptions.map((option: string, optIndex: number) => {
              // Obtenir les rangs déjà utilisés
              const currentRankings = formData[field.id] || {};
              const usedRanks = Object.values(currentRankings).filter((rank: any) => rank !== '');
              const currentRank = currentRankings[option] || '';
              
              return (
                <div key={optIndex} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={currentRank !== ''}
                    onChange={(e) => {
                      const currentRankings = formData[field.id] || {};
                      let newRankings = { ...currentRankings };
                      
                      if (e.target.checked) {
                        // Si on coche, assigner le premier rang disponible
                        const availableRanks = rankingOptions.filter((rank: string) => !usedRanks.includes(rank));
                        if (availableRanks.length > 0) {
                          newRankings[option] = availableRanks[0];
                        }
                      } else {
                        // Si on décoche, retirer le rang
                        newRankings[option] = '';
                      }
                      
                      handleInputChange(field.id, newRankings);
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 flex-1">{option}</span>
                  <select
                    value={currentRank}
                    onChange={(e) => {
                      const newRank = e.target.value;
                      const currentRankings = formData[field.id] || {};
                      
                      // Si on sélectionne un rang déjà utilisé par un autre combustible, on le retire d'abord
                      let newRankings = { ...currentRankings };
                      if (newRank !== '') {
                        // Retirer ce rang de tous les autres combustibles
                        Object.keys(newRankings).forEach(key => {
                          if (key !== option && newRankings[key] === newRank) {
                            newRankings[key] = '';
                          }
                        });
                      }
                      
                      // Assigner le nouveau rang au combustible actuel
                      newRankings[option] = newRank;
                      handleInputChange(field.id, newRankings);
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    disabled={currentRank === ''}
                  >
                    <option value="">-- Non utilisé --</option>
                    {rankingOptions.map((rank: string, rankIndex: number) => {
                      const isUsed = usedRanks.includes(rank) && rank !== currentRank;
                      return (
                        <option 
                          key={rankIndex} 
                          value={rank}
                          disabled={isUsed}
                          style={{ color: isUsed ? '#999' : 'inherit' }}
                        >
                          {rank} {isUsed ? '(déjà utilisé)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              );
            })}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 Astuce : Cochez les combustibles que vous utilisez, puis classez-les par ordre d'importance en sélectionnant un rang pour chacun.
              </p>
            </div>
          </div>
        );
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <input
            type={field.type}
            id={field.id}
            placeholder={field.placeholder || ''}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={commonClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            placeholder={field.placeholder || ''}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            rows={4}
            className={commonClasses}
          />
        );

      case 'select':
        return (
          <select
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={commonClasses}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(formData[field.id] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = formData[field.id] || [];
                    if (e.target.checked) {
                      handleInputChange(field.id, [...currentValues, option]);
                    } else {
                      handleInputChange(
                        field.id,
                        currentValues.filter((v: string) => v !== option)
                      );
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={commonClasses}
          />
        );

      default:
        return (
          <input
            type="text"
            id={field.id}
            placeholder={field.placeholder || ''}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={commonClasses}
          />
        );
    }
  }, [formData, handleInputChange, gpsProvince, gpsProvinceStatus, captureGPS]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  if (error && !linkData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Lien invalide</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Merci !</h1>
          <p className="text-slate-600 mb-6">
            Votre formulaire a été soumis avec succès. Vos réponses ont été enregistrées.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({});
              setSubmitterName('');
              setSubmitterContact('');
            }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Soumettre un autre formulaire
          </button>
        </div>
      </div>
    );
  }

  // formTemplate et visibleFields sont maintenant mémorisés avec useMemo plus haut

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo2} alt="Fikiri Collect" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-600">Fikiri Collect</p>
              <p className="text-sm font-semibold text-slate-900">Formulaire public</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Survey Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{linkData?.survey?.title}</h1>
          <p className="text-slate-600 mb-4">{linkData?.survey?.description}</p>
          <p className="text-sm text-slate-500">
            Enquête partagée par <span className="font-medium text-blue-600">{linkData?.enumerator?.name}</span>
          </p>
        </div>

        {/* Form */}
        {formTemplate ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{formTemplate.name}</h2>
            <p className="text-slate-600 text-sm mb-6">{formTemplate.description}</p>

            {/* Submitter Info (optional) */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">Informations (optionnel)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Votre nom</label>
                  <input
                    type="text"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Contact</label>
                  <input
                    type="text"
                    value={submitterContact}
                    onChange={(e) => setSubmitterContact(e.target.value)}
                    placeholder="Téléphone ou email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {visibleFields.map((field: FormField) => {

                // Vérifier si on doit afficher l'explication pour "Non"
                // L'explication s'affiche si :
                // 1. Le champ a un helpText
                // 2. Le champ est de type radio/select avec des options Oui/Non
                // 3. La valeur sélectionnée est "Non"
                const fieldValue = formData[field.id];
                const showNonExplanation = field.helpText && 
                  fieldValue === 'Non' && 
                  (field.type === 'radio' || field.type === 'select') &&
                  field.options?.includes('Non');

                return (
                  <div key={field.id}>
                    {field.type === 'section' || field.type === 'info' ? (
                      renderField(field)
                    ) : (
                      <>
                        <label htmlFor={field.id} className="block text-sm font-medium text-slate-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.description && (
                          <p className="text-xs text-slate-500 mb-2">{field.description}</p>
                        )}
                        {renderField(field)}
                        {/* Afficher l'explication si la réponse est "Non" */}
                        {showNonExplanation && (
                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm">
                            <p className="font-medium mb-1">Explication pour l'enquêteur :</p>
                            <p>{field.helpText}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-8 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Soumettre le formulaire
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600">Aucun formulaire disponible pour cette campagne.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white mt-12 py-6 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Fikiri Collect — Collecte de données fiables</p>
      </footer>
    </div>
  );
};

export default PublicFormPage;

