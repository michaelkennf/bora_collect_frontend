import { localStorageService } from './localStorageService';
import type { LocalRecord } from './localStorageService';
import { environment } from '../config/environment';

// Service de synchronisation automatique des données locales
class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInterval: number | null = null;
  private isSyncing: boolean = false;
  private syncCallbacks: Array<() => void> = [];

  constructor() {
    this.initializeSync();
  }

  // Initialiser le service de synchronisation
  private initializeSync(): void {
    // Écouter les changements de connectivité
    window.addEventListener('online', () => {
      console.log('Connexion internet rétablie');
      this.isOnline = true;
      this.syncLocalRecords();
    });

    window.addEventListener('offline', () => {
      console.log('Connexion internet perdue');
      this.isOnline = false;
    });

    // Démarrer la synchronisation périodique
    this.startPeriodicSync();

    // Synchroniser immédiatement si en ligne
    if (this.isOnline) {
      this.syncLocalRecords();
    }
  }

  // Démarrer la synchronisation périodique
  private startPeriodicSync(): void {
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncLocalRecords();
      }
    }, 10000); // 10 secondes
  }

  // Arrêter la synchronisation périodique
  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Ajouter un callback de synchronisation
  public onSync(callback: () => void): void {
    this.syncCallbacks.push(callback);
  }

  // Notifier tous les callbacks de synchronisation
  private notifySyncCallbacks(): void {
    this.syncCallbacks.forEach(callback => callback());
  }



  // Synchroniser un seul enregistrement
  private async syncSingleRecord(record: LocalRecord): Promise<void> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    console.log(`Synchronisation de l'enregistrement: ${record.id}`);
    
    // Vérifier la structure des données
    const dataToSend = {
      formData: record.formData.formData || record.formData
    };
    
    // Pour les formulaires système, utiliser l'endpoint /system
    const endpoint = record.formData.surveyId ? '/records' : '/records/system';
    console.log('Structure des données à envoyer:', dataToSend);
    console.log('Endpoint utilisé:', endpoint);

    const response = await fetch(`${environment.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Enregistrement synchronisé avec l'ID serveur: ${result.id}`);

    // Marquer comme synchronisé et supprimer du stockage local
    await localStorageService.markAsSynced(record.id, result.id);
    await localStorageService.removeSyncedRecord(record.id);
  }

  // Forcer la synchronisation (appelé manuellement)
  public async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Pas de connexion internet');
    }
    
    console.log('🚀 Synchronisation forcée demandée...');
    await this.syncLocalRecords();
  }

  // Méthode publique pour synchroniser (utilisée par les composants)
  public async syncLocalRecords(): Promise<void> {
    if (!this.isOnline) {
      console.log('📱 Pas de connexion internet, synchronisation impossible');
      return;
    }
    
    if (this.isSyncing) {
      console.log('Synchronisation déjà en cours, ignorée');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Début de la synchronisation des enregistrements locaux...');

    try {
      const unsyncedRecords = await localStorageService.getUnsyncedRecords();
      console.log(`📊 Enregistrements locaux trouvés: ${unsyncedRecords.length}`);
      
      if (unsyncedRecords.length === 0) {
        console.log('✅ Aucun enregistrement à synchroniser - tout est à jour');
        return;
      }

      console.log(`🚀 Synchronisation de ${unsyncedRecords.length} enregistrement(s)...`);

      let syncedCount = 0;
      let errorCount = 0;
      
      for (const record of unsyncedRecords) {
        try {
          console.log(`📤 Synchronisation de l'enregistrement: ${record.id}`);
          await this.syncSingleRecord(record);
          syncedCount++;
          console.log(`✅ Enregistrement synchronisé avec succès: ${record.id}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Erreur lors de la synchronisation de ${record.id}:`, error);
        }
      }

      console.log(`🎯 Synchronisation terminée: ${syncedCount}/${unsyncedRecords.length} enregistrements synchronisés`);
      if (errorCount > 0) {
        console.warn(`⚠️ ${errorCount} enregistrement(s) en erreur`);
      }
      
      // Notifier les composants que la synchronisation est terminée
      this.notifySyncCallbacks();

    } catch (error) {
      console.error('💥 Erreur lors de la synchronisation:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Vérifier le statut de la synchronisation
  public async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    unsyncedCount: number;
    lastSync?: Date;
  }> {
    const unsyncedCount = await localStorageService.getUnsyncedCount();
    const stats = await localStorageService.getLocalStats();
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      unsyncedCount,
      lastSync: stats.newestRecord
    };
  }

  // Obtenir les statistiques de synchronisation
  public async getSyncStats(): Promise<{
    total: number;
    synced: number;
    unsynced: number;
    syncProgress: number;
  }> {
    const stats = await localStorageService.getLocalStats();
    const syncProgress = stats.total > 0 ? (stats.synced / stats.total) * 100 : 100;

    return {
      total: stats.total,
      synced: stats.synced,
      unsynced: stats.unsynced,
      syncProgress: Math.round(syncProgress)
    };
  }

  // Nettoyer les anciens enregistrements
  public async cleanup(): Promise<void> {
    await localStorageService.cleanupOldRecords();
  }

  // Vérifier la connectivité
  public checkConnectivity(): boolean {
    return this.isOnline;
  }

  // Simuler une perte de connexion (pour les tests)
  public simulateOffline(): void {
    this.isOnline = false;
    console.log('Simulation: Connexion internet perdue');
  }

  // Simuler une reconnexion (pour les tests)
  public simulateOnline(): void {
    this.isOnline = true;
    console.log('Simulation: Connexion internet rétablie');
    this.syncLocalRecords();
  }
}

export const syncService = new SyncService();
export default syncService; 
