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
      
      return {
      'ID Enquête': enquete.id || 'N/A',
      'Nom/Code Ménage': enquete.formData?.household?.nomOuCode || 'N/A',
      'Âge': enquete.formData?.household?.age || 'N/A',
      'Sexe': enquete.formData?.household?.sexe || 'N/A',
      'Taille du Ménage': enquete.formData?.household?.tailleMenage || 'N/A',
      'Commune/Quartier': enquete.formData?.household?.communeQuartier || 'N/A',
      'Géolocalisation': enquete.formData?.household?.geolocalisation || 'N/A',
      'Date de Création': enquete.createdAt ? new Date(enquete.createdAt).toLocaleDateString('fr-FR') : 'N/A',
      'Enquêteur': enquete.authorName || 'N/A',
      'Combustibles Utilisés': Array.isArray(enquete.formData?.cooking?.combustibles) 
        ? enquete.formData.cooking.combustibles.join(', ') 
        : 'N/A',
      'Équipements Utilisés': Array.isArray(enquete.formData?.cooking?.equipements) 
        ? enquete.formData.cooking.equipements.join(', ') 
        : 'N/A',
      'Connaissance Solutions Propres': enquete.formData?.knowledge?.connaissanceSolutions || 'N/A',
      'Avantages Perçus': Array.isArray(enquete.formData?.knowledge?.avantages) 
        ? enquete.formData.knowledge.avantages.join(', ') 
        : 'N/A',
      'Obstacles à l\'Adoption': Array.isArray(enquete.formData?.constraints?.obstacles) 
        ? enquete.formData.constraints.obstacles.join(', ') 
        : 'N/A',
      'Prêt à Acheter Foyer': enquete.formData?.adoption?.pretAcheterFoyer || 'N/A',
      'Prêt à Acheter GPL': enquete.formData?.adoption?.pretAcheterGPL || 'N/A'
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
