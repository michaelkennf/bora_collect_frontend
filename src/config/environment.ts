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
  apiBaseUrl: 'https://api.fikiri.collect.co', // RESTAURER HTTPS
  apiTimeout: 30000,
  appName: 'FikiriCollect',
  appVersion: '1.0.0',
  enableHttps: true, // RESTAURER HTTPS
  enableDebug: true,
  isProduction: false,
};

// Configuration par défaut pour la production
const defaultProductionConfig: EnvironmentConfig = {
  apiBaseUrl: 'https://api.fikiri.collect.co', // RESTAURER HTTPS
  apiTimeout: 30000,
  appName: 'FikiriCollect',
  appVersion: '1.0.0',
  enableHttps: true, // RESTAURER HTTPS
  enableDebug: false,
  isProduction: true,
};

// Validation des variables d'environnement
const validateEnvironment = (): EnvironmentConfig => {
  // FORCER L'UTILISATION DE L'API EN LIGNE
  const forceOnlineAPI = true; // CHANGER CETTE VALEUR POUR FORCER L'API EN LIGNE
  
  // Détecter l'environnement de manière plus fiable
  const isProduction = import.meta.env.PROD || 
                      window.location.hostname !== 'localhost' ||
                      import.meta.env.VITE_API_BASE_URL?.includes('fikiri.collect.co') ||
                      forceOnlineAPI || // FORCER L'API EN LIGNE
                      false;
  
  const config: EnvironmentConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 
                (isProduction ? defaultProductionConfig.apiBaseUrl : defaultLocalConfig.apiBaseUrl),
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    appName: import.meta.env.VITE_APP_NAME || 'FikiriCollect',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    enableHttps: import.meta.env.VITE_ENABLE_HTTPS === 'true' || isProduction,
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true' && !isProduction,
    isProduction,
  };

  // Validation des valeurs critiques
  if (!config.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required');
  }

  if (config.apiTimeout < 5000 || config.apiTimeout > 120000) {
    throw new Error('VITE_API_TIMEOUT must be between 5000 and 120000 ms');
  }

  // Logs selon l'environnement
  if (config.isProduction) {
    console.log('🚀 Production mode: API at', config.apiBaseUrl);
  } else {
    console.log('🔧 Development mode: API at', config.apiBaseUrl);
    if (config.enableDebug) {
      console.log('🔍 Debug mode enabled');
    }
  }

  return config;
};

// Configuration globale de l'environnement
export const environment: EnvironmentConfig = validateEnvironment();

// Configuration par défaut
export const defaultConfig: EnvironmentConfig = environment.isProduction 
  ? defaultProductionConfig 
  : defaultLocalConfig;

// Fonction utilitaire pour obtenir la configuration
export const getConfig = (): EnvironmentConfig => {
  try {
    return environment;
  } catch (error) {
    console.error('❌ Error loading environment configuration:', error);
    console.warn('⚠️ Falling back to default configuration');
    return defaultConfig;
  }
};

// Fonction pour obtenir l'URL de l'API avec endpoint
export const getApiUrl = (endpoint: string = ''): string => {
  const baseUrl = environment.apiBaseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Configuration exportée par défaut
export default getConfig(); 