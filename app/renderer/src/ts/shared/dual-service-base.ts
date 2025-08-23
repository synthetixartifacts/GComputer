/**
 * Base class for dual service pattern (Electron + Browser)
 * Eliminates duplication of environment checking logic
 */
import { isElectronEnvironment } from '@features/environment/service';

export abstract class DualServiceBase<TElectron, TBrowser> {
  protected electronService: TElectron;
  protected browserService: TBrowser;

  constructor(electronService: TElectron, browserService: TBrowser) {
    this.electronService = electronService;
    this.browserService = browserService;
  }

  /**
   * Get the appropriate service based on environment
   */
  protected get service(): TElectron | TBrowser {
    return isElectronEnvironment() ? this.electronService : this.browserService;
  }

  /**
   * Execute a method on the appropriate service
   */
  protected async execute<T>(
    methodName: keyof (TElectron & TBrowser),
    ...args: any[]
  ): Promise<T> {
    const service = this.service as any;
    if (typeof service[methodName] !== 'function') {
      throw new Error(`Method ${String(methodName)} not found on service`);
    }
    return service[methodName](...args);
  }
}