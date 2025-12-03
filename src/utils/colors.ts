/**
 * Utilitaires de couleurs compatibles avec tous les appareils
 * Fournit des couleurs en formats compatibles avec les anciens navigateurs/appareils mobiles
 */

/**
 * Convertit une couleur rgba en format hex avec opacité séparée
 * Compatible avec tous les appareils mobiles
 */
export function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(a * 255) : ''}`;
}

/**
 * Convertit rgba() en rgb() avec opacité séparée pour compatibilité
 * Retourne un objet avec color (rgb) et opacity
 */
export function rgbaToRgbWithOpacity(r: number, g: number, b: number, a: number = 1) {
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    opacity: a
  };
}

/**
 * Palette de couleurs compatibles (format hex)
 * Toutes les couleurs sont en sRGB standard pour compatibilité maximale
 */
export const CompatibleColors = {
  // Bleus
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // rgb(59, 130, 246)
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Verts
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // rgb(34, 197, 94)
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Rouges
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // rgb(239, 68, 68)
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Oranges
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // rgb(249, 115, 22)
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  // Jaunes
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308', // rgb(234, 179, 8)
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  // Violets
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // rgb(168, 85, 247)
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Gris
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Couleurs spécifiques pour les graphiques (Chart.js)
  chart: {
    blue: '#3b82f6',      // rgb(59, 130, 246)
    green: '#22c55e',      // rgb(34, 197, 94)
    red: '#ef4444',        // rgb(239, 68, 68)
    orange: '#f97316',     // rgb(249, 115, 22)
    yellow: '#eab308',     // rgb(234, 179, 8)
    purple: '#a855f7',     // rgb(168, 85, 247)
    pink: '#ec4899',       // rgb(236, 72, 153)
    cyan: '#06b6d4',       // rgb(6, 182, 212)
    indigo: '#6366f1',     // rgb(99, 102, 241)
    teal: '#14b8a6',       // rgb(20, 184, 166)
  }
};

/**
 * Génère une couleur rgba compatible pour Chart.js
 * Utilise rgb() avec opacité séparée comme fallback
 */
export function getChartColor(color: string, opacity: number = 0.8): string {
  // Si c'est déjà en rgba, le retourner tel quel (Chart.js le gère)
  if (color.startsWith('rgba')) {
    return color;
  }
  
  // Convertir hex en rgba pour compatibilité
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return color;
}

/**
 * Génère un tableau de couleurs pour les graphiques
 * Compatible avec tous les appareils
 */
export function getChartColors(count: number, opacity: number = 0.8): string[] {
  const colors = [
    CompatibleColors.chart.blue,
    CompatibleColors.chart.green,
    CompatibleColors.chart.red,
    CompatibleColors.chart.orange,
    CompatibleColors.chart.yellow,
    CompatibleColors.chart.purple,
    CompatibleColors.chart.pink,
    CompatibleColors.chart.cyan,
    CompatibleColors.chart.indigo,
    CompatibleColors.chart.teal,
  ];
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const baseColor = colors[i % colors.length];
    result.push(getChartColor(baseColor, opacity));
  }
  
  return result;
}

/**
 * Génère des couleurs de bordure pour les graphiques (opacité 1)
 */
export function getChartBorderColors(count: number): string[] {
  return getChartColors(count, 1);
}


