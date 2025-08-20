/**
 * Utilitaires pour les graphiques temporels
 * Standardisation : 6 mois à partir du mois actuel
 */

export interface MonthData {
  month: string;
  count: number;
}

/**
 * Génère les données pour les 6 mois à partir du mois actuel
 * @param data - Données à agréger (enregistrements, utilisateurs, etc.)
 * @param dateField - Champ contenant la date (ex: 'createdAt')
 * @returns Array de MonthData avec mois et comptage
 */
export function generate6MonthsFromCurrent<T>(
  data: T[],
  dateField: keyof T
): MonthData[] {
  const now = new Date();
  const currentMonth = now.getMonth(); // Mois actuel (0-indexed)
  const currentYear = now.getFullYear();
  const months: MonthData[] = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const count = data.filter((item: any) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= monthStart && itemDate <= monthEnd;
    }).length;
    
    months.push({ month: monthName, count });
  }
  
  return months;
}

/**
 * Génère les labels pour les 6 mois à partir du mois actuel
 * @returns Array de noms de mois
 */
export function get6MonthsLabels(): string[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const months: string[] = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
    months.push(monthName);
  }
  
  return months;
} 