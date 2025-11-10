export interface FormEntry {
  key: string;
  label: string;
  displayValue: string;
  chips?: string[];
}

const IGNORED_KEY_PARTS = ['formId', 'surveyId', 'submittedAt', 'isOnline', 'createdAt', 'updatedAt'];

const formatSegment = (segment: string) => {
  if (!segment) return '';
  const cleaned = segment
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const shouldIgnoreKey = (key: string) => {
  return IGNORED_KEY_PARTS.some((part) => key === part || key.endsWith(`.${part}`));
};

const toChips = (value: any[]): string[] => {
  return value.map((item) => {
    if (item === null || item === undefined) return 'Non renseigné';
    if (typeof item === 'object') return JSON.stringify(item);
    return String(item);
  });
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'Non renseigné';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (value instanceof Date) return value.toLocaleString('fr-FR');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const traverseFormData = (data: any, parentKey = ''): FormEntry[] => {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const entries: FormEntry[] = [];

  Object.entries(data).forEach(([key, value]) => {
    const path = parentKey ? `${parentKey}.${key}` : key;

    if (shouldIgnoreKey(path)) {
      return;
    }

    if (value === null || value === undefined) {
      entries.push({
        key: path,
        label: path.split('.').map(formatSegment).join(' › '),
        displayValue: 'Non renseigné',
      });
      return;
    }

    if (Array.isArray(value)) {
      const allPrimitive = value.every((item) => item === null || item === undefined || typeof item !== 'object');
      if (allPrimitive) {
        entries.push({
          key: path,
          label: path.split('.').map(formatSegment).join(' › '),
          displayValue: '',
          chips: toChips(value),
        });
      } else {
        entries.push({
          key: path,
          label: path.split('.').map(formatSegment).join(' › '),
          displayValue: JSON.stringify(value),
        });
      }
      return;
    }

    if (typeof value === 'object') {
      entries.push(...traverseFormData(value, path));
      return;
    }

    entries.push({
      key: path,
      label: path.split('.').map(formatSegment).join(' › '),
      displayValue: formatValue(value),
    });
  });

  return entries;
};

export const extractFormEntries = (formData: any): FormEntry[] => {
  return traverseFormData(formData);
};

export const flattenFormDataToObject = (formData: any): Record<string, string> => {
  const entries = traverseFormData(formData);
  return entries.reduce<Record<string, string>>((acc, entry) => {
    if (entry.chips && entry.chips.length) {
      acc[entry.label] = entry.chips.join(', ');
    } else {
      acc[entry.label] = entry.displayValue;
    }
    return acc;
  }, {});
};
