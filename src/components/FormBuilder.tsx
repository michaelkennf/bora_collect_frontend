import React, { useState } from 'react';

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

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const FormBuilder: React.FC = () => {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [currentForm, setCurrentForm] = useState<FormTemplate | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const fieldTypes = [
    { value: 'text', label: 'Texte simple', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'number', label: 'Nombre', icon: '🔢' },
    { value: 'select', label: 'Sélection unique', icon: '📋' },
    { value: 'multiselect', label: 'Sélection multiple', icon: '☑️' },
    { value: 'textarea', label: 'Zone de texte', icon: '📄' },
    { value: 'checkbox', label: 'Case à cocher', icon: '☑️' },
    { value: 'radio', label: 'Boutons radio', icon: '🔘' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'file', label: 'Fichier', icon: '📁' },
    { value: 'gps', label: 'Géolocalisation', icon: '📍' },
    { value: 'section', label: 'Section/Diviseur', icon: '📑' },
  ];

  const createNewForm = () => {
    const newForm: FormTemplate = {
      id: Date.now().toString(),
      name: 'Nouveau formulaire',
      description: 'Description du formulaire',
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    setCurrentForm(newForm);
    setShowBuilder(true);
  };

  const addField = (type: string) => {
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

    setCurrentForm({
      ...currentForm,
      fields: [...currentForm.fields, newField],
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!currentForm) return;

    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    });
  };

  const deleteField = (fieldId: string) => {
    if (!currentForm) return;

    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.filter(field => field.id !== fieldId),
    });
  };

  const saveForm = () => {
    if (!currentForm) return;

    const updatedForm = {
      ...currentForm,
      updatedAt: new Date(),
    };

    setForms(prev => {
      const existingIndex = prev.findIndex(f => f.id === updatedForm.id);
      if (existingIndex >= 0) {
        const newForms = [...prev];
        newForms[existingIndex] = updatedForm;
        return newForms;
      } else {
        return [...prev, updatedForm];
      }
    });

    setShowBuilder(false);
    setCurrentForm(null);
  };

  const renderFieldEditor = (field: FormField) => {
    return (
      <div key={field.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg">{field.label}</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingField(field)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Modifier
            </button>
            <button
              onClick={() => deleteField(field.id)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Type:</span> {fieldTypes.find(t => t.value === field.type)?.label}
          </div>
          <div>
            <span className="font-medium">Obligatoire:</span> {field.required ? 'Oui' : 'Non'}
          </div>
          {field.placeholder && (
            <div>
              <span className="font-medium">Placeholder:</span> {field.placeholder}
            </div>
          )}
          {field.options && field.options.length > 0 && (
            <div className="col-span-2">
              <span className="font-medium">Options:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {field.options.map((option, idx) => (
                  <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {option}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFieldModal = () => {
    if (!editingField) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Modifier le champ</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Label du champ</label>
              <input
                type="text"
                value={editingField.label}
                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Placeholder</label>
              <input
                type="text"
                value={editingField.placeholder || ''}
                onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={editingField.required}
                onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="required">Champ obligatoire</label>
            </div>

            {(editingField.type === 'select' || editingField.type === 'multiselect' || editingField.type === 'radio') && (
              <div>
                <label className="block font-medium mb-2">Options</label>
                <div className="space-y-2">
                  {editingField.options?.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(editingField.options || [])];
                          newOptions[idx] = e.target.value;
                          setEditingField({ ...editingField, options: newOptions });
                        }}
                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                      />
                      <button
                        onClick={() => {
                          const newOptions = editingField.options?.filter((_, i) => i !== idx) || [];
                          setEditingField({ ...editingField, options: newOptions });
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(editingField.options || []), `Option ${(editingField.options?.length || 0) + 1}`];
                      setEditingField({ ...editingField, options: newOptions });
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                  >
                    Ajouter une option
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block font-medium mb-2">Texte d'aide</label>
              <textarea
                value={editingField.helpText || ''}
                onChange={(e) => setEditingField({ ...editingField, helpText: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                placeholder="Texte d'aide pour l'utilisateur"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={() => setEditingField(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (currentForm) {
                  updateField(editingField.id, editingField);
                }
                setEditingField(null);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (showBuilder && currentForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <input
                type="text"
                value={currentForm.name}
                onChange={(e) => setCurrentForm({ ...currentForm, name: e.target.value })}
                className="text-2xl font-bold border-none outline-none bg-transparent"
                placeholder="Nom du formulaire"
              />
              <input
                type="text"
                value={currentForm.description}
                onChange={(e) => setCurrentForm({ ...currentForm, description: e.target.value })}
                className="text-gray-600 border-none outline-none bg-transparent w-full mt-1"
                placeholder="Description du formulaire"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBuilder(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={saveForm}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panneau de champs disponibles */}
            <div className="lg:col-span-1">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-4">Types de champs disponibles</h3>
                <div className="space-y-2">
                  {fieldTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => addField(type.value)}
                      className="w-full text-left p-3 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <span className="text-xl mr-2">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aperçu du formulaire */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-4">Aperçu du formulaire</h3>
                
                {currentForm.fields.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>Aucun champ ajouté</p>
                    <p className="text-sm">Cliquez sur un type de champ à gauche pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentForm.fields.map(renderFieldEditor)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {renderFieldModal()}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestion des Formulaires</h1>
        <button
          onClick={createNewForm}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Créer un nouveau formulaire
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">Aucun formulaire créé</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre premier formulaire personnalisé</p>
          <button
            onClick={createNewForm}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer mon premier formulaire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">{form.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{form.description}</p>
              
              <div className="text-sm text-gray-500 mb-4">
                <div>Champs: {form.fields.length}</div>
                <div>Créé le: {form.createdAt.toLocaleDateString()}</div>
                <div>Modifié le: {form.updatedAt.toLocaleDateString()}</div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentForm(form);
                    setShowBuilder(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    setForms(prev => prev.map(f => 
                      f.id === form.id ? { ...f, isActive: !f.isActive } : f
                    ));
                  }}
                  className={`px-4 py-2 rounded text-sm ${
                    form.isActive 
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {form.isActive ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => {
                    setForms(prev => prev.filter(f => f.id !== form.id));
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormBuilder; 