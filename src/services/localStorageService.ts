// Service de stockage local pour les formulaires hors ligne
export interface LocalRecord {
  id: string;
  formData: any;
  createdAt: Date;
  synced: boolean;
  syncedAt?: Date;
  serverId?: string; // ID de l'enregistrement sur le serveur après synchronisation
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'local_records';
  private readonly SYNC_STATUS_KEY = 'sync_status';

  // Sauvegarder un enregistrement en local
  async saveRecord(formData: any): Promise<string> {
    const record: LocalRecord = {
      id: this.generateId(),
      formData,
      createdAt: new Date(),
      synced: false
    };

    const records = await this.getLocalRecords();
    records.push(record);
    await this.saveLocalRecords(records);

    console.log('Enregistrement sauvegardé en local:', record.id);
    return record.id;
  }

  // Récupérer tous les enregistrements locaux
  async getLocalRecords(): Promise<LocalRecord[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des enregistrements locaux:', error);
      return [];
    }
  }

  // Sauvegarder les enregistrements locaux
  private async saveLocalRecords(records: LocalRecord[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des enregistrements locaux:', error);
    }
  }

  // Marquer un enregistrement comme synchronisé
  async markAsSynced(recordId: string, serverId?: string): Promise<void> {
    const records = await this.getLocalRecords();
    const record = records.find(r => r.id === recordId);
    if (record) {
      record.synced = true;
      record.syncedAt = new Date();
      if (serverId) {
        record.serverId = serverId;
      }
      await this.saveLocalRecords(records);
      console.log('Enregistrement marqué comme synchronisé:', recordId, serverId ? `(ID serveur: ${serverId})` : '');
    }
  }

  // Supprimer un enregistrement synchronisé
  async removeSyncedRecord(recordId: string): Promise<void> {
    const records = await this.getLocalRecords();
    const filteredRecords = records.filter(r => r.id !== recordId);
    await this.saveLocalRecords(filteredRecords);
    console.log('Enregistrement synchronisé supprimé du stockage local:', recordId);
  }

  // Récupérer les enregistrements non synchronisés
  async getUnsyncedRecords(): Promise<LocalRecord[]> {
    const records = await this.getLocalRecords();
    return records.filter(r => !r.synced);
  }

  // Vérifier s'il y a des enregistrements non synchronisés
  async hasUnsyncedRecords(): Promise<boolean> {
    const records = await this.getLocalRecords();
    return records.some(r => !r.synced);
  }

  // Obtenir le nombre d'enregistrements non synchronisés
  async getUnsyncedCount(): Promise<number> {
    const records = await this.getLocalRecords();
    return records.filter(r => !r.synced).length;
  }

  // Nettoyer les anciens enregistrements synchronisés (plus de 7 jours)
  async cleanupOldRecords(): Promise<void> {
    const records = await this.getLocalRecords();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const filteredRecords = records.filter(r => {
      if (!r.synced) return true; // Garder les non synchronisés
      if (!r.syncedAt) return true; // Garder si pas de date de sync
      return r.syncedAt > sevenDaysAgo; // Garder si moins de 7 jours
    });

    if (filteredRecords.length !== records.length) {
      await this.saveLocalRecords(filteredRecords);
      console.log('Nettoyage des anciens enregistrements terminé');
    }
  }

  // Générer un ID unique pour les enregistrements locaux
  private generateId(): string {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obtenir les statistiques du stockage local
  async getLocalStats(): Promise<{
    total: number;
    synced: number;
    unsynced: number;
    oldestRecord?: Date;
    newestRecord?: Date;
  }> {
    const records = await this.getLocalRecords();
    const synced = records.filter(r => r.synced).length;
    const unsynced = records.filter(r => !r.synced).length;
    
    let oldestRecord: Date | undefined;
    let newestRecord: Date | undefined;

    if (records.length > 0) {
      const dates = records.map(r => r.createdAt).filter(d => d);
      if (dates.length > 0) {
        oldestRecord = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
        newestRecord = new Date(Math.max(...dates.map(d => new Date(d).getTime())));
      }
    }

    return {
      total: records.length,
      synced,
      unsynced,
      oldestRecord,
      newestRecord
    };
  }

  // Sauvegarder le statut de synchronisation
  async saveSyncStatus(status: any): Promise<void> {
    try {
      localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du statut de synchronisation:', error);
    }
  }

  // Récupérer le statut de synchronisation
  async getSyncStatus(): Promise<any> {
    try {
      const data = localStorage.getItem(this.SYNC_STATUS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de synchronisation:', error);
      return null;
    }
  }
}

export const localStorageService = new LocalStorageService();
export default localStorageService; 