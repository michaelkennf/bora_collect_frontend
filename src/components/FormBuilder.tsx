import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { environment } from '../config/environment';
import ConfirmationModal from './ConfirmationModal';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file' | 'gps' | 'section';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    field: string;
    value: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  helpText?: string;
  order: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';
  publishedAt?: string;
  createdAt: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  surveyId: string; // ID de l'enquête liée
  survey?: Survey; // Informations de l'enquête
  fields: any; // Peut être un tableau de FormField[] ou un schéma objet imbriqué
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVisibleToControllers: boolean; // Visibilité pour les contrôleurs
}

const FormBuilder: React.FC = () => {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [currentForm, setCurrentForm] = useState<FormTemplate | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showSurveySelector, setShowSurveySelector] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteFormModal, setShowDeleteFormModal] = useState(false);
  const [formToDelete, setFormToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Référence pour synchroniser les données des champs
  const fieldDataRef = useRef<Map<string, Partial<FormField>>>(new Map());

  const apiBaseUrl = environment.apiBaseUrl;

  // Normalise un schéma de champs (objet imbriqué) en tableau de FormField pour l'éditeur
  const normalizeFormFields = useCallback((fields: any): FormField[] => {
    if (!fields) return [];
    if (Array.isArray(fields)) return fields as FormField[];

    // Schéma objet: parcourir sections puis champs
    const normalized: FormField[] = [];
    let order = 0;

    Object.keys(fields).forEach((sectionKey) => {
      const section = fields[sectionKey];
      if (section && typeof section === 'object' && section.fields) {
        Object.keys(section.fields).forEach((fieldKey) => {
          const f = section.fields[fieldKey] || {};
          // Mapper les types système vers les types de l'éditeur
          const typeMap: Record<string, FormField['type']> = {
            text: 'text',
            number: 'number',
            select: 'select',
            checkbox: 'checkbox',
            radio: 'radio',
            textarea: 'textarea'
          };
          const mappedType = typeMap[(f.type as string) || 'text'] || 'text';

          const options: string[] | undefined = Array.isArray(f.options)
            ? f.options
            : Array.isArray(f.enum)
            ? f.enum
            : undefined;

          normalized.push({
            id: `${sectionKey}.${fieldKey}`,
            type: mappedType,
            label: (f.label as string) || (f.title as string) || fieldKey,
            placeholder: (f.placeholder as string) || '',
            required: Boolean(f.required),
            options,
            order: order++,
          });
        });
      }
    });

    return normalized;
  }, []);

  // Charger les enquêtes publiées et les formulaires existants au démarrage
  useEffect(() => {
    fetchPublishedSurveys();
    fetchExistingForms();
  }, []);

  const fetchPublishedSurveys = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Vérifier le rôle de l'utilisateur
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      
      // Utiliser l'endpoint approprié selon le rôle
      const endpoint = user.role === 'PROJECT_MANAGER' 
        ? `${apiBaseUrl}/forms/pm-campaigns`
        : `${apiBaseUrl}/surveys/published`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSurveys(data);
        console.log(`✅ ${data.length} campagnes chargées pour ${user.role}`);
      } else {
        console.error('Erreur lors du chargement des campagnes:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
    }
  }, [apiBaseUrl]);

  const fetchExistingForms = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token d\'authentification manquant');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Convertir les dates string en objets Date
        const formsWithDates = data.map((form: any) => ({
          ...form,
          createdAt: new Date(form.createdAt),
          updatedAt: new Date(form.updatedAt),
          // Normaliser le champ fields pour l'éditeur
          fields: normalizeFormFields(form.fields),
        }));
        setForms(formsWithDates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formulaires:', error);
    }
  }, [apiBaseUrl, normalizeFormFields]);

  const fieldTypes = [
    { value: 'text', label: 'Texte simple', icon: 'text' },
    { value: 'email', label: 'Email', icon: 'email' },
    { value: 'number', label: 'Nombre', icon: 'number' },
    { value: 'select', label: 'Sélection unique', icon: 'select' },
    { value: 'multiselect', label: 'Sélection multiple', icon: 'multiselect' },
    { value: 'textarea', label: 'Zone de texte', icon: 'textarea' },
    { value: 'checkbox', label: 'Case à cocher', icon: 'checkbox' },
    { value: 'radio', label: 'Boutons radio', icon: 'radio' },
    { value: 'date', label: 'Date', icon: 'date' },
    { value: 'file', label: 'Fichier', icon: 'file' },
    { value: 'gps', label: 'Géolocalisation', icon: 'gps' },
    { value: 'section', label: 'Section/Diviseur', icon: 'section' },
  ];

  const renderFieldIcon = (iconType: string) => {
    const iconClass = "w-4 h-4";
    switch (iconType) {
      case 'text':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
      case 'email':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case 'number':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
      case 'select':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
      case 'multiselect':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'textarea':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
      case 'checkbox':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'radio':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'date':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case 'file':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      case 'gps':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
      case 'section':
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
      default:
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
  };

  const createNewForm = useCallback(async () => {
    // Recharger les enquêtes publiées juste avant d'afficher le sélecteur
    await fetchPublishedSurveys();
    setShowSurveySelector(true);
  }, [fetchPublishedSurveys]);

  const startFormCreation = useCallback((surveyId: string) => {
    const selectedSurvey = surveys.find(s => s.id === surveyId);
    if (!selectedSurvey) return;

    const newForm: FormTemplate = {
       id: `temp_${Date.now()}`, // ID temporaire clairement identifié
       name: `Formulaire - ${selectedSurvey.title}`,
       description: `Formulaire pour l'enquête: ${selectedSurvey.description}`,
       surveyId: surveyId,
       survey: selectedSurvey,
      fields: [], // l'éditeur travaille toujours avec un tableau normalisé
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
       isVisibleToControllers: false, // Par défaut non visible
    };
    
    setCurrentForm(newForm);
    setShowSurveySelector(false);
    setShowBuilder(true);
  }, [surveys]);

  const addField = useCallback((type: string) => {
    if (!currentForm) return;

    const newField: FormField = {
      id: Date.now().toString(),
      type: type as FormField['type'],
      label: `Nouveau champ ${type}`,
      required: false,
      order: currentForm.fields.length,
    };

    if (type === 'select' || type === 'multiselect' || type === 'radio') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    setCurrentForm(prevForm => {
      if (!prevForm) return null;
      
      return {
        ...prevForm,
        fields: [...prevForm.fields, newField],
      };
    });
  }, [currentForm]);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    // Mettre à jour immédiatement l'état local pour éviter la perte de données
    setCurrentForm(prevForm => {
      if (!prevForm) return null;
      
      return {
        ...prevForm,
        fields: prevForm.fields.map((field: any) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
      };
    });
    
    // Stocker aussi dans la référence pour la synchronisation finale
    fieldDataRef.current.set(fieldId, {
      ...fieldDataRef.current.get(fieldId),
      ...updates
    });
  }, []);

  const removeField = useCallback((fieldId: string) => {
    if (!currentForm) return;

    setCurrentForm(prevForm => {
      if (!prevForm) return null;
      
      return {
        ...prevForm,
        fields: prevForm.fields.filter((field: any) => field.id !== fieldId),
      };
    });
  }, [currentForm]);

  const saveForm = useCallback(async () => {
    if (!currentForm) return;

    if (!currentForm.surveyId) {
      toast.error('Veuillez sélectionner une enquête pour ce formulaire');
      return;
    }

    if (currentForm.fields.length === 0) {
      toast.error('Veuillez ajouter au moins un champ au formulaire');
      return;
    }

    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token d\'authentification manquant');
        return;
      }

      console.log('Début de la sauvegarde:', {
        formId: currentForm.id,
        isExistingForm: currentForm.id && currentForm.id !== Date.now().toString() && !currentForm.id.startsWith('temp_'),
        fieldsCount: currentForm.fields.length,
        surveyId: currentForm.surveyId
      });

      // Synchroniser les données des champs avant la sauvegarde
      const synchronizedFields = currentForm.fields.map((field: any) => {
        const updates = fieldDataRef.current.get(field.id);
        if (updates) {
          return { ...field, ...updates };
        }
        return field;
      });

      // L'API attend un JSON dans fields. Nous envoyons le tableau normalisé tel quel.
      const formData = {
         name: currentForm.name,
         description: currentForm.description,
         surveyId: currentForm.surveyId,
         fields: synchronizedFields,
         isActive: currentForm.isActive,
         isVisibleToControllers: currentForm.isVisibleToControllers,
       };

       console.log('Données à envoyer:', formData);

      let response;
      // Vérifier si c'est un formulaire existant (avec un ID qui n'est pas un timestamp récent)
      const isExistingForm = currentForm.id && 
        currentForm.id !== Date.now().toString() && 
        !currentForm.id.startsWith('temp_');
      
      if (isExistingForm) {
        // Mise à jour d'un formulaire existant
        response = await fetch(`${apiBaseUrl}/forms/${currentForm.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Création d'un nouveau formulaire
        response = await fetch(`${apiBaseUrl}/forms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const savedForm = await response.json();
        toast.success('Formulaire sauvegardé avec succès !');
        
        // Recharger les formulaires depuis le serveur
        await fetchExistingForms();

    setShowBuilder(false);
    setCurrentForm(null);
      } else {
        const errorData = await response.json();
        console.error('Erreur de sauvegarde:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          formData: formData
        });
        toast.error(`Erreur ${response.status}: ${errorData.message || 'Erreur lors de la sauvegarde du formulaire'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du formulaire');
    } finally {
      setLoading(false);
    }
  }, [currentForm, apiBaseUrl, fetchExistingForms]);

  const toggleFormVisibility = useCallback(async (formId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token d\'authentification manquant');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/forms/${formId}/toggle-visibility`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const updatedForm = await response.json();
        toast.success('Visibilité du formulaire mise à jour');
        
        // Mettre à jour l'état local
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId 
              ? { ...form, isVisibleToControllers: updatedForm.isVisibleToControllers }
              : form
          )
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de la mise à jour de la visibilité');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la visibilité:', error);
      toast.error('Erreur lors de la mise à jour de la visibilité');
    }
  }, [apiBaseUrl]);

  // Fonction de test pour vérifier la visibilité d'un formulaire
  const testFormVisibility = useCallback(async (formId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token d\'authentification manquant');
        return;
      }

      const form = forms.find(f => f.id === formId);
      if (!form) {
        toast.error('Formulaire non trouvé');
        return;
      }

      console.log('🧪 Test de visibilité pour le formulaire:', {
        id: form.id,
        name: form.name,
        surveyId: form.surveyId,
        isActive: form.isActive,
        isVisibleToControllers: form.isVisibleToControllers
      });

      // Test de l'endpoint des formulaires disponibles
      const response = await fetch(`${apiBaseUrl}/forms/available-for-controller`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const availableForms = await response.json();
        console.log('Formulaires disponibles pour test:', availableForms);
        
        const isVisible = availableForms.some((f: any) => f.id === formId);
        if (isVisible) {
          toast.success(`✅ Le formulaire "${form.name}" est visible pour les contrôleurs`);
        } else {
          toast.warning(`⚠️ Le formulaire "${form.name}" n'est PAS visible pour les contrôleurs`);
        }
      } else {
        toast.error('Erreur lors du test de visibilité');
      }
    } catch (error) {
      console.error('Erreur lors du test de visibilité:', error);
      toast.error('Erreur lors du test de visibilité');
    }
  }, [apiBaseUrl, forms]);

  const deleteForm = useCallback(async (formId: string, formName?: string) => {
    // Cette fonction sera appelée depuis le modal de confirmation

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token d\'authentification manquant');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Formulaire supprimé');
        
        // Mettre à jour l'état local
        setForms(prevForms => prevForms.filter(form => form.id !== formId));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du formulaire');
    }
  }, [apiBaseUrl]);

  const getSurveyTitle = useCallback((surveyId: string) => {
    const survey = surveys.find(s => s.id === surveyId);
    return survey ? survey.title : 'Enquête inconnue';
  }, [surveys]);

  const getSurveyStatus = useCallback((surveyId: string) => {
    const survey = surveys.find(s => s.id === surveyId);
    return survey ? survey.status : 'UNKNOWN';
  }, [surveys]);

  // Fonction pour obtenir la description des types de champs
  const getFieldTypeDescription = useCallback((type: string) => {
    const descriptions: Record<string, string> = {
      text: 'Champ de texte simple pour saisir du texte libre',
      email: 'Champ pour saisir une adresse email valide',
      number: 'Champ pour saisir des valeurs numériques',
      select: 'Menu déroulant avec une seule option sélectionnable',
      multiselect: 'Liste avec plusieurs options sélectionnables',
      textarea: 'Zone de texte étendue pour des réponses longues',
      checkbox: 'Case à cocher pour des réponses oui/non',
      radio: 'Boutons radio pour choisir une seule option',
      date: 'Sélecteur de date avec calendrier',
      file: 'Upload de fichiers (images, documents)',
      gps: 'Capture automatique de la géolocalisation',
      section: 'Séparateur visuel pour organiser le formulaire'
    };
    return descriptions[type] || 'Type de champ personnalisable';
  }, []);

  // Composant optimisé pour éditer un champ de formulaire
  const FormFieldEditor = React.memo(({ field, index, onUpdate, onRemove }: {
    field: FormField;
    index: number;
    onUpdate: (fieldId: string, updates: Partial<FormField>) => void;
    onRemove: (fieldId: string) => void;
  }) => {
    // Utiliser des états locaux pour éviter les re-renders
    const [localLabel, setLocalLabel] = useState(field.label);
    const [localPlaceholder, setLocalPlaceholder] = useState(field.placeholder || '');
    const [localOptions, setLocalOptions] = useState(field.options?.join('\n') || '');
    const [localRequired, setLocalRequired] = useState(field.required);

    // Mettre à jour les états locaux quand le field change
    useEffect(() => {
      setLocalLabel(field.label);
      setLocalPlaceholder(field.placeholder || '');
      setLocalOptions(field.options?.join('\n') || '');
      setLocalRequired(field.required);
    }, [field.label, field.placeholder, field.options, field.required]); // Synchroniser avec toutes les propriétés

    // Fonctions locales optimisées - pas de debounce pour une meilleure réactivité
    const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalLabel(newValue);
      // Mettre à jour immédiatement l'état local, synchroniser plus tard
    }, []);

    const handlePlaceholderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalPlaceholder(newValue);
      // Mettre à jour immédiatement l'état local, synchroniser plus tard
    }, []);

    const handleOptionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalOptions(newValue);
      // Mettre à jour immédiatement l'état local, synchroniser plus tard
    }, []);

    const handleRequiredChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.checked;
      setLocalRequired(newValue);
      // Mettre à jour immédiatement l'état local, synchroniser plus tard
    }, []);

    const handleRemove = useCallback(() => {
      onRemove(field.id);
    }, [field.id, onRemove]);

    return (
       <div className="border rounded-lg p-4 bg-gray-50">
         {/* En-tête du champ avec label et options */}
         <div className="flex justify-between items-start mb-3">
           <div className="flex-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Label du champ *
             </label>
             <input
               type="text"
               value={localLabel}
               onChange={handleLabelChange}
               className="w-full p-2 border rounded font-medium"
               placeholder="Ex: Nom complet, Âge, Profession..."
             />
             <p className="text-xs text-gray-500 mt-1">
               Ce texte sera affiché aux utilisateurs du formulaire
             </p>
           </div>
          <div className="flex items-center gap-2 ml-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localRequired}
                onChange={handleRequiredChange}
                className="rounded"
              />
              <span className="text-sm">Requis</span>
            </label>
            <button
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800 p-1"
            >
              🗑️
            </button>
          </div>
        </div>

                 {/* Options pour les champs de sélection */}
         {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio') && (
           <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
             <label className="block text-sm font-medium text-blue-800 mb-2">
               🔘 Options de sélection *
             </label>
             <textarea
               value={localOptions}
               onChange={handleOptionsChange}
               className="w-full p-2 border rounded text-sm"
               rows={3}
               placeholder="Option 1&#10;Option 2&#10;Option 3"
             />
             <p className="text-xs text-blue-600 mt-1">
               Saisissez une option par ligne. Exemple : "Étudiant", "Employé", "Retraité"
             </p>
          </div>
         )}

         {/* Placeholder pour les champs de texte */}
         {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
           <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
             <label className="block text-sm font-medium text-green-800 mb-2">
               💡 Texte d'aide (optionnel)
             </label>
             <input
               type="text"
               value={localPlaceholder}
               onChange={handlePlaceholderChange}
               className="w-full p-2 border rounded text-sm"
               placeholder="Ex: Entrez votre nom complet..."
             />
             <p className="text-xs text-green-600 mt-1">
               Ce texte apparaîtra en gris dans le champ pour guider l'utilisateur
             </p>
            </div>
          )}

                 {/* Informations du champ */}
         <div className="mt-4 p-3 bg-gray-100 rounded-lg">
           <div className="flex justify-between items-center text-xs text-gray-600">
             <div className="flex items-center gap-3">
               <span className="font-medium">Type:</span>
               <span className="px-2 py-1 bg-gray-200 rounded">{field.type}</span>
               <span className="font-medium">Ordre:</span>
               <span className="px-2 py-1 bg-gray-200 rounded">{index + 1}</span>
             </div>
             <div className="flex items-center gap-2">
               <span className={`px-2 py-1 rounded text-xs font-medium ${
                 localRequired ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
               }`}>
                 {localRequired ? '🔴 Requis' : '⚪ Optionnel'}
                  </span>
              </div>
            </div>
        </div>
      </div>
    );
  });

  // Composant de sélection d'enquête
  const SurveySelector = useCallback(() => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Sélectionner une Enquête</h2>
          <button
            onClick={() => setShowSurveySelector(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
            </div>

        <p className="text-gray-600 mb-6">
          Sélectionnez l'enquête à laquelle ce formulaire sera lié. 
          Seules les enquêtes publiées sont disponibles.
        </p>

        {surveys.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucune enquête publiée disponible</p>
            <p className="text-sm text-gray-400">
              Publiez d'abord une enquête dans la section "Publication d'enquêtes"
            </p>
            </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => startFormCreation(survey.id)}
              >
                <div className="flex justify-between items-start">
              <div>
                    <h3 className="font-semibold text-lg text-gray-800">{survey.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{survey.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        survey.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {survey.status === 'PUBLISHED' ? 'Publiée' : survey.status}
                      </span>
                      {survey.publishedAt && (
                        <span className="text-xs text-gray-500">
                          Publiée le {new Date(survey.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Sélectionner
                  </button>
                </div>
              </div>
            ))}
              </div>
            )}
            </div>
          </div>
  ), [surveys, startFormCreation]);

  // Composant de construction de formulaire
  const FormBuilderInterface = useCallback(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {currentForm?.name || 'Nouveau Formulaire'}
            </h2>
            {currentForm?.survey && (
              <div className="mt-2">
                <span className="text-sm text-gray-600">Enquête liée : </span>
                <span className="font-medium text-blue-600">{currentForm.survey.title}</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  currentForm.survey.status === 'PUBLISHED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentForm.survey.status === 'PUBLISHED' ? 'Publiée' : currentForm.survey.status}
                </span>
          </div>
            )}
            </div>
              <button
                onClick={() => setShowBuilder(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
              </button>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Panneau de gauche - Champs disponibles */}
            <div className="lg:col-span-1">
                           <h3 className="font-semibold text-lg mb-4">Champs disponibles</h3>
             <p className="text-sm text-gray-600 mb-4">
               Cliquez sur un type de champ pour l'ajouter à votre formulaire. 
               Chaque champ peut être personnalisé avec un label, des options et des validations.
             </p>
                <div className="space-y-2">
               {fieldTypes.map((fieldType) => (
                    <button
                   key={fieldType.value}
                   onClick={() => addField(fieldType.value)}
                   className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                 >
                   <span className="text-gray-600">{renderFieldIcon(fieldType.icon)}</span>
                   <div className="text-left">
                     <span className="font-medium">{fieldType.label}</span>
                     <div className="text-xs text-gray-500 mt-1">
                       {getFieldTypeDescription(fieldType.value)}
                     </div>
                   </div>
                    </button>
                  ))}
                </div>
           </div>

                     {/* Panneau central - Construction du formulaire */}
           <div className="lg:col-span-2">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-lg">Construction du Formulaire</h3>
               <div className="flex gap-2">
                 <button
                   onClick={saveForm}
                   disabled={loading}
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                 >
                   {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                 </button>
              </div>
            </div>

             {/* Instructions de construction */}
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
               <h4 className="font-medium text-blue-800 mb-2">Comment construire votre formulaire :</h4>
               <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                 <li><strong>Ajoutez des champs</strong> : Cliquez sur les types de champs à gauche</li>
                 <li><strong>Personnalisez chaque champ</strong> : Modifiez le label, ajoutez des options si nécessaire</li>
                 <li><strong>Organisez l'ordre</strong> : Les champs s'affichent dans l'ordre d'ajout</li>
                 <li><strong>Sauvegardez</strong> : Cliquez sur "Sauvegarder" quand vous avez terminé</li>
               </ol>
                                <p className="text-xs text-blue-600 mt-2">
                   <strong>Astuce</strong> : Vous pouvez modifier les champs à tout moment avant la sauvegarde
                 </p>
             </div>

                         {currentForm?.fields.length === 0 ? (
               <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                 <div className="flex justify-center mb-4">
                   <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                 </div>
                 <h4 className="text-lg font-medium text-gray-700 mb-2">Commencez par ajouter des champs</h4>
                 <p className="text-gray-500 mb-4">
                   Votre formulaire est vide. Ajoutez des champs depuis le panneau de gauche pour commencer.
                 </p>
                 <div className="bg-white p-4 rounded-lg border max-w-md mx-auto">
                   <p className="text-sm text-gray-600">
                     <strong>Exemple de formulaire :</strong><br/>
                     • Nom et prénom (texte)<br/>
                     • Email (email)<br/>
                     • Âge (nombre)<br/>
                     • Profession (sélection)
                   </p>
                 </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                {currentForm?.fields.map((field: any, index: number) => (
                  <FormFieldEditor
                    key={field.id}
                    field={field}
                    index={index}
                    onUpdate={updateField}
                    onRemove={removeField}
                  />
                ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  ), [currentForm, addField, updateField, removeField, saveForm, loading, fieldTypes]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Formulaires</h1>
        <button
          onClick={createNewForm}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Créer un nouveau formulaire
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Aucun formulaire créé</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre premier formulaire personnalisé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">{form.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{form.description}</p>
                  
                  {/* Informations sur l'enquête liée */}
                  <div className="mb-3">
                    <span className="text-xs text-gray-500">Enquête liée : </span>
                    <span className="text-sm font-medium text-blue-600">
                      {getSurveyTitle(form.surveyId)}
                    </span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      getSurveyStatus(form.surveyId) === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getSurveyStatus(form.surveyId) === 'PUBLISHED' ? 'Publiée' : getSurveyStatus(form.surveyId)}
                </span>
              </div>
              
                  <div className="text-sm text-gray-500">
                    {form.fields.length} champ(s) | Créé le {form.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => toggleFormVisibility(form.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.isVisibleToControllers
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {form.isVisibleToControllers ? '👁️ Visible' : '🙈 Masqué'}
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  form.isActive
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {form.isActive ? '✅ Actif' : '❌ Inactif'}
                </span>
                <button
                  onClick={() => testFormVisibility(form.id)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                  title="Tester la visibilité du formulaire"
                >
                  🧪 Test
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentForm(form);
                    setShowBuilder(true);
                  }}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => {
                    setFormToDelete({ id: form.id, name: form.name });
                    setShowDeleteFormModal(true);
                  }}
                  className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showSurveySelector && <SurveySelector />}
      {showBuilder && currentForm && <FormBuilderInterface />}

      {/* Modal de confirmation pour la suppression de formulaire */}
      <ConfirmationModal
        isOpen={showDeleteFormModal}
        onClose={() => {
          setShowDeleteFormModal(false);
          setFormToDelete(null);
        }}
        onConfirm={async () => {
          if (formToDelete) {
            await deleteForm(formToDelete.id, formToDelete.name);
            setShowDeleteFormModal(false);
            setFormToDelete(null);
          }
        }}
        title="Supprimer le formulaire"
        message={`Êtes-vous sûr de vouloir supprimer le formulaire "${formToDelete?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default FormBuilder; 
