// Liste des provinces de la RDC pour validation et mapping
const RDC_PROVINCES = [
  'Kinshasa', 'Kongo-Central', 'Kwango', 'Kwilu', 'Mai-Ndombe',
  'Kasaï', 'Kasaï-Central', 'Kasaï-Oriental', 'Lomami', 'Sankuru',
  'Maniema', 'Sud-Kivu', 'Nord-Kivu', 'Ituri', 'Haut-Uélé', 'Tshopo',
  'Bas-Uélé', 'Nord-Ubangi', 'Mongala', 'Sud-Ubangi', 'Équateur',
  'Tshuapa', 'Tanganyika', 'Haut-Lomami', 'Lualaba', 'Haut-Katanga'
];

// Variable pour gérer le rate limiting de l'API Nominatim
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 seconde entre les requêtes

// Mapping des noms alternatifs vers les provinces officielles
const PROVINCE_MAPPING: Record<string, string> = {
  'Kinshasa': 'Kinshasa',
  'Kongo central': 'Kongo-Central',
  'Bas-Congo': 'Kongo-Central',
  'Bandundu': 'Kwilu', // Ancienne province, maintenant divisée
  'Équateur': 'Équateur',
  'Orientale': 'Tshopo', // Ancienne province, maintenant divisée
  'Katanga': 'Haut-Katanga', // Ancienne province, maintenant divisée
  'Kasaï-Occidental': 'Kasaï-Central', // Ancienne province
  'Kasaï-Oriental': 'Kasaï-Oriental',
  'Maniema': 'Maniema',
  'Sud-Kivu': 'Sud-Kivu',
  'Nord-Kivu': 'Nord-Kivu',
};

// Fonction pour normaliser le nom de la province
function normalizeProvinceName(name: string | undefined): string | null {
  if (!name) return null;
  
  const normalized = name.trim();
  
  // Vérifier si c'est déjà une province officielle
  const exactMatch = RDC_PROVINCES.find(p => p.toLowerCase() === normalized.toLowerCase());
  if (exactMatch) return exactMatch;
  
  // Vérifier le mapping
  const mapped = PROVINCE_MAPPING[normalized];
  if (mapped) return mapped;
  
  // Recherche partielle (pour gérer les variations)
  const partialMatch = RDC_PROVINCES.find(p => 
    p.toLowerCase().includes(normalized.toLowerCase()) || 
    normalized.toLowerCase().includes(p.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  return null;
}

export async function reverseGeocodeProvince(latitude: number, longitude: number): Promise<string | null> {
  try {
    // Gérer le rate limiting de l'API Nominatim (max 1 requête par seconde)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
    
    // Essayer avec un zoom plus élevé pour obtenir plus de détails
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1&accept-language=fr`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'FikiriCollect/1.0', // Requis par Nominatim
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Erreur API Nominatim: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      console.warn('⚠️ Aucune adresse trouvée dans la réponse Nominatim');
      return null;
    }
    
    const address = data.address;
    
    // Essayer différentes clés dans l'ordre de priorité
    const possibleKeys = [
      'state',           // État/Province (standard)
      'region',          // Région
      'province',        // Province (explicite)
      'county',          // Comté
      'state_district',  // District d'état
      'administrative',  // Niveau administratif
    ];
    
    // Chercher dans les clés standard
    for (const key of possibleKeys) {
      const value = address[key];
      if (value && typeof value === 'string') {
        const normalized = normalizeProvinceName(value);
        if (normalized) {
          console.log(`✅ Province trouvée via clé "${key}": ${normalized}`);
          return normalized;
        }
      }
    }
    
    // Si on a un display_name, essayer d'extraire la province
    if (data.display_name && typeof data.display_name === 'string') {
      const displayName = data.display_name.toLowerCase();
      
      // Chercher les noms de provinces dans le display_name
      for (const province of RDC_PROVINCES) {
        if (displayName.includes(province.toLowerCase())) {
          console.log(`✅ Province trouvée dans display_name: ${province}`);
          return province;
        }
      }
    }
    
    // Si on a une ville connue, essayer de mapper vers une province
    const cityName = (address.city || address.town || address.village || '').toLowerCase();
    if (cityName) {
      // Mapping de villes principales vers provinces
      const cityToProvince: Record<string, string> = {
        'kinshasa': 'Kinshasa',
        'matadi': 'Kongo-Central',
        'bandundu': 'Kwilu',
        'kikwit': 'Kwilu',
        'mbuji-mayi': 'Kasaï-Oriental',
        'mbuji mayi': 'Kasaï-Oriental',
        'kananga': 'Kasaï-Central',
        'lubumbashi': 'Haut-Katanga',
        'likasi': 'Haut-Katanga',
        'kolwezi': 'Lualaba',
        'bukavu': 'Sud-Kivu',
        'goma': 'Nord-Kivu',
        'kisangani': 'Tshopo',
        'bunia': 'Ituri',
        'kindu': 'Maniema',
        'kalemie': 'Tanganyika',
        'mbandaka': 'Équateur',
        'gemena': 'Sud-Ubangi',
        'gbadolite': 'Nord-Ubangi',
        'isiro': 'Haut-Uélé',
        'buta': 'Bas-Uélé',
        'kabinda': 'Lomami',
        'lodja': 'Sankuru',
        'tshikapa': 'Kasaï',
        'moanda': 'Kongo-Central',
      };
      
      for (const [city, province] of Object.entries(cityToProvince)) {
        if (cityName.includes(city)) {
          console.log(`✅ Province trouvée via ville "${city}": ${province}`);
          return province;
        }
      }
    }
    
    // Essayer de chercher dans toutes les valeurs de l'adresse
    const allAddressValues = Object.values(address).filter(v => typeof v === 'string') as string[];
    for (const value of allAddressValues) {
      const normalized = normalizeProvinceName(value);
      if (normalized) {
        console.log(`✅ Province trouvée dans valeurs d'adresse: ${normalized}`);
        return normalized;
      }
    }
    
    // Dernier recours : retourner la première valeur non vide trouvée (sans normalisation)
    const fallbackValue = address.state || address.region || address.province || address.county || address.city;
    if (fallbackValue && typeof fallbackValue === 'string') {
      console.warn(`⚠️ Province non normalisée retournée: ${fallbackValue}`);
      return fallbackValue;
    }
    
    console.warn('⚠️ Aucune province trouvée pour les coordonnées:', latitude, longitude);
    console.warn('📋 Données reçues:', JSON.stringify(data, null, 2));
    return null;
  } catch (error) {
    console.error('❌ Erreur lors du géocodage inverse:', error);
    return null;
  }
}


