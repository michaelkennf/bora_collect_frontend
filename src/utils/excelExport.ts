import * as XLSX from 'xlsx';

// Interface pour les données d'enquête
export interface EnqueteData {
  id: string;
  nomOuCode: string;
  age: string;
  sexe: string;
  tailleMenage: string;
  communeQuartier: string;
  geolocalisation: string;
  dateCreation: string;
  authorName: string;
  combustibles: string[];
  equipements: string[];
  connaissanceSolutions: string;
  avantages: string[];
  obstacles: string[];
  pretAcheterFoyer: string;
  pretAcheterGPL: string;
}

// Interface pour les statistiques par commune
export interface StatsCommune {
  commune: string;
  nombreEnquetes: number;
  typesCombustibles: number;
  typesEquipements: number;
  pourcentageTotal: string;
}

// Interface pour les statistiques globales
export interface StatsGlobales {
  combustible: string;
  nombreEnquetes: number;
}

// Fonction pour exporter les enquêtes en Excel
export const exportEnquetesToExcel = (enquetes: any[], filename: string = 'enquetes') => {
  try {
    console.log('📊 Début de l\'export Excel des enquêtes...');
    console.log('📋 Nombre d\'enquêtes à exporter:', enquetes.length);
    
    // Préparer les données pour l'export
    const exportData = enquetes.map((enquete, index) => {
      const authorName = enquete.authorName || 'N/A';
      console.log(`🔍 Enquête ${index + 1}: ID=${enquete.id}, Enquêteur=${authorName}, AuthorID=${enquete.authorId}`);
      
      // Fonction helper pour obtenir une valeur avec fallback
      const getValue = (newKey: string, oldKey?: string, oldSubKey?: string) => {
        // Vérifier d'abord le nouveau format
        if (enquete.formData?.[newKey] !== undefined && enquete.formData?.[newKey] !== null) {
          const value = enquete.formData[newKey];
          // Si c'est une chaîne vide, retourner 'N/A'
          if (typeof value === 'string' && value.trim() === '') {
            return 'N/A';
          }
          return value;
        }
        // Fallback vers l'ancien format
        if (oldKey && oldSubKey && enquete.formData?.[oldKey]) {
          const value = enquete.formData[oldKey]?.[oldSubKey];
          if (typeof value === 'string' && value.trim() === '') {
            return 'N/A';
          }
          return value;
        }
        return 'N/A';
      };
      
      // Fonction helper pour les tableaux
      const getArrayValue = (newKey: string, oldKey?: string, oldSubKey?: string) => {
        const value = getValue(newKey, oldKey, oldSubKey);
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : '0';
        }
        // Pour les avantages spécifiquement, retourner "0" au lieu de "N/A"
        if (newKey === 'connaissance.avantages' || oldSubKey === 'avantages') {
          return '0';
        }
        return value || 'N/A';
      };
      
      // Fonction helper pour les objets de classement
      const getRankingValue = (key: string) => {
        try {
          const value = enquete.formData?.[key];
          if (typeof value === 'object' && value !== null) {
            return Object.entries(value)
              .sort(([,a], [,b]) => {
                const order = ['1er', '2e', '3e', '4e', '5e'];
                return order.indexOf(a as string) - order.indexOf(b as string);
              })
              .map(([item, rank]) => `${item} (${rank})`)
              .join(', ');
          }
          return value || 'N/A';
        } catch (error) {
          console.error('Erreur dans getRankingValue:', error);
          return 'N/A';
        }
      };
      
      return {
      'ID Enquête': enquete.id || 'N/A',
      'Nom/Code Ménage': getValue('identification.nomOuCode', 'household', 'nomOuCode'),
      'Âge': getValue('identification.age', 'household', 'age'),
      'Sexe': getValue('identification.sexe', 'household', 'sexe'),
      'Taille du Ménage': getValue('identification.tailleMenage', 'household', 'tailleMenage'),
      'Commune/Quartier': getValue('identification.communeQuartier', 'household', 'communeQuartier'),
      'Géolocalisation': (() => {
        // Essayer plusieurs formats possibles pour la géolocalisation
        const formData = enquete.formData || {};
        
        // Format 1: identification.geolocalisation (nouveau format pour soumissions publiques)
        const gps1 = formData['identification.geolocalisation'];
        if (gps1 && typeof gps1 === 'string' && gps1.trim() !== '' && gps1 !== 'N/A') {
          return gps1;
        }
        
        // Format 2: household.geolocalisation (ancien format pour soumissions via application)
        const gps2 = formData['household.geolocalisation'];
        if (gps2 && typeof gps2 === 'string' && gps2.trim() !== '' && gps2 !== 'N/A') {
          return gps2;
        }
        
        // Format 3: identification.geolocalisation (format imbriqué)
        const gps3 = formData?.identification?.geolocalisation;
        if (gps3 && typeof gps3 === 'string' && gps3.trim() !== '' && gps3 !== 'N/A') {
          return gps3;
        }
        
        // Format 4: household.geolocalisation (format imbriqué)
        const gps4 = formData?.household?.geolocalisation;
        if (gps4 && typeof gps4 === 'string' && gps4.trim() !== '' && gps4 !== 'N/A') {
          return gps4;
        }
        
        // Format 5: Utiliser getValue avec fallback
        const gps5 = getValue('identification.geolocalisation', 'identification', 'geolocalisation');
        if (gps5 !== 'N/A' && gps5 && typeof gps5 === 'string' && gps5.trim() !== '') {
          return gps5;
        }
        
        const gps6 = getValue('household.geolocalisation', 'household', 'geolocalisation');
        if (gps6 !== 'N/A' && gps6 && typeof gps6 === 'string' && gps6.trim() !== '') {
          return gps6;
        }
        
        // Log pour déboguer si aucune valeur GPS n'est trouvée
        if (index === 0) {
          console.log('🔍 Debug GPS - Clés disponibles dans formData:', Object.keys(formData));
          console.log('🔍 Debug GPS - Exemples de valeurs:', {
            'identification.geolocalisation': formData['identification.geolocalisation'],
            'household.geolocalisation': formData['household.geolocalisation'],
            'identification': formData?.identification,
            'household': formData?.household
          });
        }
        
        return 'N/A';
      })(),
      'Date de Création': enquete.createdAt ? new Date(enquete.createdAt).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : 'N/A',
      'Enquêteur': enquete.authorName || 'N/A',
      'Combustibles Utilisés': getRankingValue('modeCuisson.combustibles'),
      'Équipements Utilisés': getValue('modeCuisson.equipements', 'cooking', 'equipements'),
      'Connaissance Solutions Propres': getValue('connaissance.connaissanceSolutions', 'knowledge', 'connaissanceSolutions'),
      'Avantages Perçus': getArrayValue('connaissance.avantages', 'knowledge', 'avantages'),
      'Obstacles à l\'Adoption': getArrayValue('perceptions.obstacles', 'constraints', 'obstacles'),
      'Prêt à Acheter Foyer': getValue('intentionAdoption.pretAcheterFoyer', 'adoption', 'pretAcheterFoyer'),
      'Prêt à Acheter GPL': getValue('intentionAdoption.pretAcheterGPL', 'adoption', 'pretAcheterGPL')
    };
    });
    
    console.log('✅ Données préparées pour l\'export:', exportData.length, 'lignes');

    // Créer le workbook et la feuille
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 15 }, // ID Enquête
      { wch: 20 }, // Nom/Code Ménage
      { wch: 10 }, // Âge
      { wch: 10 }, // Sexe
      { wch: 15 }, // Taille du Ménage
      { wch: 20 }, // Commune/Quartier
      { wch: 20 }, // Géolocalisation
      { wch: 15 }, // Date de Création
      { wch: 20 }, // Enquêteur
      { wch: 30 }, // Combustibles Utilisés
      { wch: 30 }, // Équipements Utilisés
      { wch: 25 }, // Connaissance Solutions Propres
      { wch: 30 }, // Avantages Perçus
      { wch: 30 }, // Obstacles à l'Adoption
      { wch: 20 }, // Prêt à Acheter Foyer
      { wch: 20 }  // Prêt à Acheter GPL
    ];
    worksheet['!cols'] = columnWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquêtes');

    // Générer le fichier et le télécharger
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log('✅ Export Excel des enquêtes réussi');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel des enquêtes:', error);
    return false;
  }
};

// Fonction pour exporter les statistiques en Excel
export const exportStatsToExcel = (
  statsCommune: StatsCommune[], 
  statsCombustibles: StatsGlobales[], 
  statsEquipements: StatsGlobales[],
  filename: string = 'statistiques'
) => {
  try {
    // Créer le workbook
    const workbook = XLSX.utils.book_new();

    // 1. Feuille des statistiques par commune
    const worksheetCommune = XLSX.utils.json_to_sheet(statsCommune.map(stat => ({
      'Commune': stat.commune,
      'Nombre d\'Enquêtes': stat.nombreEnquetes,
      'Types de Combustibles': stat.typesCombustibles,
      'Types d\'Équipements': stat.typesEquipements,
      '% du Total': stat.pourcentageTotal
    })));

    // Ajuster la largeur des colonnes pour la feuille commune
    worksheetCommune['!cols'] = [
      { wch: 20 }, // Commune
      { wch: 20 }, // Nombre d'Enquêtes
      { wch: 20 }, // Types de Combustibles
      { wch: 20 }, // Types d'Équipements
      { wch: 15 }  // % du Total
    ];

    // 2. Feuille des statistiques des combustibles
    const worksheetCombustibles = XLSX.utils.json_to_sheet(statsCombustibles.map(stat => ({
      'Type de Combustible': stat.combustible,
      'Nombre d\'Enquêtes': stat.nombreEnquetes
    })));

    // Ajuster la largeur des colonnes pour la feuille combustibles
    worksheetCombustibles['!cols'] = [
      { wch: 25 }, // Type de Combustible
      { wch: 20 }  // Nombre d'Enquêtes
    ];

    // 3. Feuille des statistiques des équipements
    const worksheetEquipements = XLSX.utils.json_to_sheet(statsEquipements.map(stat => ({
      'Type d\'Équipement': stat.combustible, // Réutiliser la même interface
      'Nombre d\'Enquêtes': stat.nombreEnquetes
    })));

    // Ajuster la largeur des colonnes pour la feuille équipements
    worksheetEquipements['!cols'] = [
      { wch: 25 }, // Type d'Équipement
      { wch: 20 }  // Nombre d'Enquêtes
    ];

    // Ajouter toutes les feuilles au workbook
    XLSX.utils.book_append_sheet(workbook, worksheetCommune, 'Statistiques par Commune');
    XLSX.utils.book_append_sheet(workbook, worksheetCombustibles, 'Combustibles');
    XLSX.utils.book_append_sheet(workbook, worksheetEquipements, 'Équipements');

    // Générer le fichier et le télécharger
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log('✅ Export Excel des statistiques réussi');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel des statistiques:', error);
    return false;
  }
};

// Fonction pour exporter les statistiques par sexe
export const exportStatsSexeToExcel = (
  statsHommes: number,
  statsFemmes: number,
  statsAutre: number,
  totalEnquetes: number,
  filename: string = 'statistiques_sexe'
) => {
  try {
    // Créer le workbook
    const workbook = XLSX.utils.book_new();

    // Données des statistiques par sexe
    const statsSexe = [
      {
        'Sexe': 'Hommes',
        'Nombre d\'Enquêtes': statsHommes,
        'Pourcentage': totalEnquetes > 0 ? `${((statsHommes / totalEnquetes) * 100).toFixed(1)}%` : '0%'
      },
      {
        'Sexe': 'Femmes',
        'Nombre d\'Enquêtes': statsFemmes,
        'Pourcentage': totalEnquetes > 0 ? `${((statsFemmes / totalEnquetes) * 100).toFixed(1)}%` : '0%'
      },
      {
        'Sexe': 'Autre',
        'Nombre d\'Enquêtes': statsAutre,
        'Pourcentage': totalEnquetes > 0 ? `${((statsAutre / totalEnquetes) * 100).toFixed(1)}%` : '0%'
      },
      {
        'Sexe': 'Total',
        'Nombre d\'Enquêtes': totalEnquetes,
        'Pourcentage': '100%'
      }
    ];

    // Créer la feuille
    const worksheet = XLSX.utils.json_to_sheet(statsSexe);

    // Ajuster la largeur des colonnes
    worksheet['!cols'] = [
      { wch: 15 }, // Sexe
      { wch: 20 }, // Nombre d'Enquêtes
      { wch: 15 }  // Pourcentage
    ];

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques par Sexe');

    // Générer le fichier et le télécharger
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log('✅ Export Excel des statistiques par sexe réussi');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'export Excel des statistiques par sexe:', error);
    return false;
  }
};
