// Configuration de l'environnement pour le frontend
export interface EnvironmentConfig {
  apiBaseUrl: string;
  apiTimeout: number;
  appName: string;
  appVersion: string;
  enableHttps: boolean;
  enableDebug: boolean;
}

// Fonction pour détecter automatiquement l'environnement et l'URL de l'API
const getApiBaseUrl = (): string => {
  // Vérifier si window est disponible (côté client) pour détecter l'environnement
  let hostname = '';
  if (typeof window !== 'undefined' && window.location) {
    hostname = window.location.hostname;
  }

  // PRIORITÉ 1: Si on est sur localhost/127.0.0.1, FORCER le port 3000 (mode développement local)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    console.log('🏠 Mode développement local détecté (hostname:', hostname, ') - FORCAGE de http://localhost:3000');
    return 'http://localhost:3000';
  }

  // PRIORITÉ 2: Si on est sur le serveur de production (collect.fikiri.co)
  if (hostname.includes('fikiri.co') || hostname.includes('collect.fikiri.co')) {
    console.log('🌐 Mode production détecté (hostname:', hostname, ') - Utilisation de https://api.collect.fikiri.co');
    return 'https://api.collect.fikiri.co';
  }

  // PRIORITÉ 3: Si une variable d'environnement est explicitement définie ET qu'on n'est pas en localhost
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl && envApiUrl.trim() !== '') {
    // Vérifier que ce n'est pas un port de production en localhost
    if (envApiUrl.includes('localhost:8001') && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      console.warn('⚠️ Variable d\'environnement pointe vers localhost:8001 mais on est en local - Utilisation de localhost:3000');
      return 'http://localhost:3000';
    }
    console.log('📌 Utilisation de VITE_API_BASE_URL depuis les variables d\'environnement:', envApiUrl);
    return envApiUrl;
  }

  // PRIORITÉ 4: Détection automatique basée sur le mode Vite
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

  if (isProduction) {
    console.log('🌐 Mode production Vite détecté - Utilisation de https://api.collect.fikiri.co');
    return 'https://api.collect.fikiri.co';
  }

  // Par défaut, utiliser localhost:3000 pour le développement
  console.log('⚠️ Environnement non détecté - Utilisation par défaut de http://localhost:3000');
  return 'http://localhost:3000';
};

// Validation des variables d'environnement
const validateEnvironment = (): EnvironmentConfig => {
  const apiBaseUrl = getApiBaseUrl();
  
  const config: EnvironmentConfig = {
    apiBaseUrl,
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    appName: import.meta.env.VITE_APP_NAME || 'FikiriCollect',
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
      console.log('✅ Mode développement détecté - Utilisation de localhost:3000');
    }
    
    if (config.enableDebug) {
      console.log('🔍 Debug mode enabled');
    }
  }

  return config;
};

// Configuration globale de l'environnement
export const environment: EnvironmentConfig = {
  apiBaseUrl: getApiBaseUrl(),
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  appName: import.meta.env.VITE_APP_NAME || 'FikiriCollect',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  enableHttps: import.meta.env.VITE_ENABLE_HTTPS === 'true',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
};

// Log de la configuration en mode développement
if (import.meta.env.DEV) {
  const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : 'N/A';
  console.log('🔍 Configuration environnement:', {
    apiBaseUrl: environment.apiBaseUrl,
    envVar: import.meta.env.VITE_API_BASE_URL,
    mode: import.meta.env.MODE,
    hostname: hostname,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  });
}

// Configuration par défaut pour le développement
export const defaultConfig: EnvironmentConfig = {
  apiBaseUrl: getApiBaseUrl(),
  apiTimeout: 30000,
  appName: 'FikiriCollect',
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
