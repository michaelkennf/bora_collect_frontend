// Configuration de l'environnement pour le frontend
export interface EnvironmentConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  appName: string;
  appVersion: string;
  enableHttps: boolean;
  enableDebug: boolean;
  isProduction: boolean;
}

// Configuration par défaut pour le développement local
const defaultLocalConfig: EnvironmentConfig = {
  apiBaseUrl: 'https://api.collect.fikiri.co', // API EN LIGNE - DOMAINE CORRECT
  apiTimeout: 30000,
  appName: 'FikiriCollect',
  appVersion: '1.0.0',
  enableHttps: true, // HTTPS activé
  enableDebug: true,
  isProduction: false,
};

// Configuration pour la production
const defaultProductionConfig: EnvironmentConfig = {
  apiBaseUrl: 'https://api.collect.fikiri.co', // API EN LIGNE - DOMAINE CORRECT
  apiTimeout: 30000,
  appName: 'FikiriCollect',
  appVersion: '1.0.0',
  enableHttps: true, // HTTPS activé
  enableDebug: false,
  isProduction: true,
};

// Validation et configuration de l'environnement
const validateEnvironment = (): EnvironmentConfig => {
  const forceOnlineAPI = true; // FORCER L'API EN LIGNE
  const isProduction = import.meta.env.PROD ||
                      window.location.hostname !== 'localhost' ||
                      import.meta.env.VITE_API_BASE_URL?.includes('api.collect.fikiri.co') ||
                      forceOnlineAPI ||
                      false;

  // Configuration de base
  const baseConfig = isProduction ? defaultProductionConfig : defaultLocalConfig;

  // Surcharge avec les variables d'environnement si disponibles
  const config: EnvironmentConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || baseConfig.apiBaseUrl,
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    appName: import.meta.env.VITE_APP_NAME || baseConfig.appName,
    appVersion: import.meta.env.VITE_APP_VERSION || baseConfig.appVersion,
    enableHttps: import.meta.env.VITE_ENABLE_HTTPS === 'true' || baseConfig.enableHttps,
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true' || baseConfig.enableDebug,
    isProduction: isProduction,
  };

  // Validation des valeurs critiques
  if (!config.apiBaseUrl) {
    console.error('❌ VITE_API_BASE_URL manquant');
    config.apiBaseUrl = 'https://api.collect.fikiri.co'; // Fallback vers l'API en ligne
  }

  if (!config.apiTimeout || config.apiTimeout < 1000) {
    console.warn('⚠️ Timeout API invalide, utilisation de la valeur par défaut');
    config.apiTimeout = 30000;
  }

  console.log('🌍 Configuration environnement:', {
    apiBaseUrl: config.apiBaseUrl,
    isProduction: config.isProduction,
    enableHttps: config.enableHttps,
    enableDebug: config.enableDebug
  });

  return config;
};

// Configuration validée
export const environment = validateEnvironment();

// Fonction utilitaire pour construire les URLs de l'API
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = environment.apiBaseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  
  console.log(`🔗 Construction URL API: ${fullUrl}`);
  return fullUrl;
};

export default environment; 