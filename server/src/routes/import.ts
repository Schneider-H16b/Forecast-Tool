import { Router } from 'express';
import { ImportService } from '../services/ImportService';
import { getDB } from '../db/db';

const router = Router();

// POST /api/import/csv - upload and import CSV orders
router.post('/csv', async (req, res) => {
  try {
    const { csvText, source } = req.body;
    if (!csvText) {
      return res.status(400).json({ error: 'csvText is required' });
    }

    // Simple CSV parser (assumes comma-separated, first row is header)
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have at least a header and one data row' });
    }

    const headers = lines[0].split(',').map((h: string) => h.trim());
    const rows = lines.slice(1).map((line: string) => {
      const values = line.split(',').map((v: string) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h: string, i: number) => {
        row[h] = values[i] || '';
      });
      return row;
    });

    const importService = new ImportService();
    const { orders, lines: orderLines } = importService.parseOrdersCsv(rows);
    const importMeta = importService.createImportMeta(rows, { source: source || 'csv-upload' });

    const db = getDB();
    const importRepo = db.getImportRepo();
    const ordersRepo = db.getOrdersRepo();

    // Create import record
    const importId = await importRepo.createImport(importMeta);
    
    // Import orders and lines (dedupe by ext_id or hash)
    let imported = 0;
    let skipped = 0;
    const importedOrderIds: string[] = [];

    for (const order of orders) {
      // Check if order already exists by ext_id
      const existing = order.ext_id ? await ordersRepo.getOrderByExtId(order.ext_id) : null;
      if (existing) {
        skipped++;
      } else {
        await ordersRepo.createOrder(order);
        importedOrderIds.push(order.id);
        imported++;
      }
    }

    // Attach lines to imported orders
    for (const line of orderLines) {
      if (importedOrderIds.includes(line.order_id)) {
        await ordersRepo.createOrderLine(line);
      }
    }

    // Link import to orders
    if (importedOrderIds.length > 0) {
      await importRepo.attachImportToOrders(importId, importedOrderIds);
    }

    res.json({
      success: true,
      imported,
      skipped,
      importMeta,
      ordersCount: orders.length,
      linesCount: orderLines.length,
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: error.message || 'Import failed' });
  }
});

export default router;
