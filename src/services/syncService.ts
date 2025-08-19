import { localStorageService } from './localStorageService';
import type { LocalRecord } from './localStorageService';

// Service de synchronisation automatique des données locales
class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInterval: number | null = null;
  private isSyncing: boolean = false;

  constructor() {
    this.initializeSync();
  }

  // Initialiser le service de synchronisation
  private initializeSync(): void {
    // Écouter les changements de connectivité
    window.addEventListener('online', () => {
      console.log('🌐 Connexion internet rétablie');
      this.isOnline = true;
      this.syncLocalRecords();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Connexion internet perdue');
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
    // Synchroniser toutes les 30 secondes si en ligne
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncLocalRecords();
      }
    }, 30000); // 30 secondes
  }

  // Arrêter la synchronisation périodique
  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Synchroniser les enregistrements locaux
  public async syncLocalRecords(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Début de la synchronisation des enregistrements locaux...');

    try {
      const unsyncedRecords = await localStorageService.getUnsyncedRecords();
      
      if (unsyncedRecords.length === 0) {
        console.log('✅ Aucun enregistrement à synchroniser');
        return;
      }

      console.log(`📤 Synchronisation de ${unsyncedRecords.length} enregistrement(s)...`);

      for (const record of unsyncedRecords) {
        try {
          await this.syncSingleRecord(record);
          console.log(`✅ Enregistrement synchronisé: ${record.id}`);
        } catch (error) {
          console.error(`❌ Erreur lors de la synchronisation de ${record.id}:`, error);
        }
      }

      console.log('🎉 Synchronisation terminée avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Synchroniser un seul enregistrement
  private async syncSingleRecord(record: LocalRecord): Promise<void> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const response = await fetch('http://localhost:3000/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        formData: record.formData
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
    }

    // Marquer comme synchronisé et supprimer du stockage local
    await localStorageService.markAsSynced(record.id);
    await localStorageService.removeSyncedRecord(record.id);
  }

  // Forcer la synchronisation (appelé manuellement)
  public async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Pas de connexion internet');
    }
    
    await this.syncLocalRecords();
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
    console.log(' Simulation: Connexion internet perdue');
  }

  // Simuler une reconnexion (pour les tests)
  public simulateOnline(): void {
    this.isOnline = true;
    console.log(' Simulation: Connexion internet rétablie');
    this.syncLocalRecords();
  }
}

export const syncService = new SyncService();
export default syncService; 