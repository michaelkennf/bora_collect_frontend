import { useState, useEffect } from 'react';
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
        console.log('🔍 PublicFormPage - Received data:', data);
        console.log('🔍 PublicFormPage - formTemplates:', data?.survey?.formTemplates);
        setLinkData(data);
      } catch (err: any) {
        console.error('🔍 PublicFormPage - Error:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateLink();
    }
  }, [token]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

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
      
      // Traiter les champs ranking pour les convertir en format objet
      if (formTemplate?.fields) {
        formTemplate.fields.forEach((field) => {
          if (field.type === 'ranking' && field.options) {
            const rankingData: Record<string, string> = {};
            let hasRanking = false;
            
            field.options.forEach((option) => {
              const rankKey = `${field.id}_${option}`;
              if (formData[rankKey]) {
                rankingData[option] = formData[rankKey];
                hasRanking = true;
              }
            });
            
            if (hasRanking) {
              // Convertir les rangs en format texte (1er, 2e, 3e, etc.)
              const rankTexts: Record<string, string> = {};
              Object.entries(rankingData).forEach(([option, rank]) => {
                const rankNum = parseInt(rank);
                if (rankNum === 1) rankTexts[option] = '1er';
                else if (rankNum === 2) rankTexts[option] = '2e';
                else if (rankNum === 3) rankTexts[option] = '3e';
                else if (rankNum === 4) rankTexts[option] = '4e';
                else if (rankNum === 5) rankTexts[option] = '5e';
                else rankTexts[option] = `${rankNum}e`;
              });
              transformedFormData[field.id] = rankTexts;
              
              // Supprimer les clés temporaires
              field.options.forEach((option) => {
                delete transformedFormData[`${field.id}_${option}`];
              });
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

      // Log pour debug
      console.log('📤 Données à envoyer:', {
        formDataKeys: Object.keys(transformedFormData),
        formDataCount: Object.keys(transformedFormData).length,
        formData: transformedFormData,
        submitterName,
        submitterContact
      });

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

  const renderField = (field: FormField) => {
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
        const captureGPS = () => {
          if (!navigator.geolocation) {
            alert('La géolocalisation n\'est pas supportée par votre navigateur.');
            return;
          }
          setGpsProvinceStatus('loading');
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              const coordsValue = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              handleInputChange(field.id, coordsValue);
              try {
                const provinceName = await reverseGeocodeProvince(latitude, longitude);
                if (provinceName) {
                  setGpsProvince(provinceName);
                  handleInputChange(`${field.id}_province`, provinceName);
                  setGpsProvinceStatus('success');
                } else {
                  setGpsProvince(null);
                  setGpsProvinceStatus('error');
                }
              } catch (error) {
                console.error('Erreur lors de la récupération de la province:', error);
                setGpsProvince(null);
                setGpsProvinceStatus('error');
              }
            },
            (error) => {
              console.error('GPS error:', error);
              alert('Impossible de capturer la position GPS. Veuillez autoriser l\'accès à la localisation.');
              setGpsProvinceStatus('error');
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 300000 }
          );
        };
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
              onClick={captureGPS}
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
        return (
          <div className="space-y-2">
            {rankOptions.map((option, idx) => (
              <div key={option} className="flex items-center gap-2">
                <select
                  value={formData[`${field.id}_${option}`] || ''}
                  onChange={(e) => handleInputChange(`${field.id}_${option}`, e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Rang</option>
                  {rankOptions.map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <span className="text-slate-700">{option}</span>
              </div>
            ))}
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
  };

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

  const formTemplates = linkData?.survey?.formTemplates;
  const rawFormTemplate =
    Array.isArray(formTemplates) && formTemplates.length > 0 ? formTemplates[0] : null;
  const formTemplate = parseFormTemplate(rawFormTemplate);

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
              {(Array.isArray(formTemplate.fields) ? formTemplate.fields : []).map((field: FormField) => (
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
                    </>
                  )}
                </div>
              ))}
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

