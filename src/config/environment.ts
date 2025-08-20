// Configuration de l'environnement pour le frontend
export interface EnvironmentConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  appName: string;
  appVersion: string;
  enableHttps: boolean;
  enableDebug: boolean;
}

// Validation des variables d'environnement
const validateEnvironment = (): EnvironmentConfig => {
  const config: EnvironmentConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    appName: import.meta.env.VITE_APP_NAME || 'BoraCollect',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    enableHttps: import.meta.env.VITE_ENABLE_HTTPS === 'true',
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  };

  // Validation des valeurs critiques
  if (!config.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required');
  }

  if (config.apiTimeout < 5000 || config.apiTimeout > 120000) {
    throw new Error('VITE_API_TIMEOUT must be between 5000 and 120000 ms');
  }

  // Avertissements en mode développement
  if (import.meta.env.DEV) {
    if (config.apiBaseUrl.includes('localhost')) {
      console.warn('⚠️ Using localhost API URL in development mode');
    }
    
    if (config.enableDebug) {
      console.log('🔍 Debug mode enabled');
    }
  }

  return config;
};

// Configuration globale de l'environnement
export const environment = {
  production: false,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'FikiriCollect',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE || 'development',
  
  // Configuration des fonctionnalités
  features: {
    gps: true,
    offline: true,
    sync: true,
    export: true,
    charts: true,
    userManagement: true,
    backup: true,
    maintenance: false
  },
  
  // Configuration des limites
  limits: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxRecordsPerSync: 100,
    syncInterval: 10000, // 10 secondes
    gpsTimeout: 30000, // 30 secondes
    gpsMaxAge: 300000 // 5 minutes
  },
  
  // Configuration des messages
  messages: {
    welcome: 'Bienvenue sur FikiriCollect',
    loading: 'Chargement en cours...',
    error: 'Une erreur est survenue',
    success: 'Opération réussie',
    offline: 'Mode hors ligne activé',
    online: 'Connexion rétablie'
  },
  
  // Configuration des couleurs
  colors: {
    primary: '#1e40af',
    secondary: '#7c3aed',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2'
  },
  
  // Configuration par défaut pour le développement
  development: {
    appName: 'FikiriCollect',
    debug: true,
    mockData: false,
    logLevel: 'debug'
  }
};

// Configuration par défaut pour le développement
export const defaultConfig: EnvironmentConfig = {
  apiBaseUrl: 'http://localhost:3000',
  apiTimeout: 30000,
  appName: 'BoraCollect',
  appVersion: '1.0.0',
  enableHttps: false,
  enableDebug: false,
};

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

// Configuration exportée par défaut
export default getConfig(); 