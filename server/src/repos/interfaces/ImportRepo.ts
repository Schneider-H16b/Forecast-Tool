import type { ImportMeta } from '../types';

export interface ImportRepo {
  createImport(meta: ImportMeta): Promise<string>;
  attachImportToOrders(importId: string, orderIds: string[]): Promise<void>;
}
