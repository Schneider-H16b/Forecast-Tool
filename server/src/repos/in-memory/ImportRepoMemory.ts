import type { ImportMeta } from '../../types';
import type { ImportRepo } from '../interfaces/ImportRepo';

export class ImportRepoMemory implements ImportRepo {
  private imports: Map<string, ImportMeta> = new Map();
  private importOrderLinks: Map<string, string[]> = new Map();

  async createImport(meta: ImportMeta): Promise<string> {
    this.imports.set(meta.id, meta);
    return meta.id;
  }

  async attachImportToOrders(importId: string, orderIds: string[]): Promise<void> {
    this.importOrderLinks.set(importId, orderIds);
  }
}
