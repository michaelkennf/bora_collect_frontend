/**
 * Utilitaire pour optimiser les requêtes avec debouncing et throttling
 */

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

/**
 * Debounce une fonction pour éviter les appels répétés
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  } as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Throttle une fonction pour limiter la fréquence d'exécution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Queue pour gérer les requêtes en série
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = false;
  private concurrency: number;

  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process() {
    if (this.running || this.queue.length === 0) {
      return;
    }

    this.running = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      await Promise.all(batch.map(fn => fn()));
    }

    this.running = false;
  }

  clear() {
    this.queue = [];
  }
}

/**
 * Batch les requêtes pour les envoyer ensemble
 */
export class RequestBatcher {
  private batch: Array<{ key: string; fn: () => Promise<any> }> = [];
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private batchDelay: number;

  constructor(batchDelay: number = 100) {
    this.batchDelay = batchDelay;
  }

  async add<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({
        key,
        fn: async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
      });

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.flush();
      }, this.batchDelay);
    });
  }

  private async flush() {
    if (this.batch.length === 0) {
      return;
    }

    const batch = [...this.batch];
    this.batch = [];
    this.timeout = null;

    // Exécuter toutes les requêtes en parallèle
    await Promise.all(batch.map(item => item.fn()));
  }
}

