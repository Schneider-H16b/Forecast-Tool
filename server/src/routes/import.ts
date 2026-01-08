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

    // Detect delimiter (comma or semicolon)
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have at least a header and one data row' });
    }

    const delimiter = lines[0].includes(';') ? ';' : ',';
    
    // Parse CSV with proper quote handling
    function parseCsvLine(line: string, delim: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = parseCsvLine(lines[0], delimiter).map((h: string) => h.replace(/^"|"$/g, '').trim());
    
    // Column mapping (German -> English)
    const columnMap: Record<string, string> = {
      'Auftrag': 'order_id',
      'Vom': 'order_date',
      'Kd-Nr.': 'customer_id',
      'Kunde': 'customer',
      'Land': 'country',
      'Projekt': 'project',
      'Zahlung': 'payment',
      'Betrag (brutto)': 'amount',
      'Währung': 'currency',
      'Wunsch-Liefertermin': 'forecast_date',
      'Auslieferung Lager': 'delivery_date',
      'Monitor': 'status_monitor',
    };

    const rows = lines.slice(1).map((line: string) => {
      const values = parseCsvLine(line, delimiter);
      const row: Record<string, string> = {};
      headers.forEach((h: string, i: number) => {
        const mappedKey = columnMap[h] || h.toLowerCase().replace(/\s+/g, '_');
        row[mappedKey] = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
      });
      return row;
    }).filter((r: Record<string, string>) => r.order_id); // Filter out empty rows

    console.log(`Parsed ${rows.length} rows from CSV`);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No valid order rows found in CSV' });
    }

    // Convert German date format (DD.MM.YYYY) to ISO (YYYY-MM-DD)
    function parseGermanDate(dateStr: string): string | undefined {
      if (!dateStr) return undefined;
      const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!match) return undefined;
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Parse amount (remove dots for thousands, replace comma with dot for decimals)
    function parseGermanAmount(amountStr: string): string | undefined {
      if (!amountStr) return undefined;
      // "1.234,56" -> "1234.56"
      return amountStr.replace(/\./g, '').replace(',', '.');
    }

    const importService = new ImportService();
    
    // Enrich rows with proper formatting for ImportService
    const enrichedRows = rows.map((r: Record<string, string>) => ({
      order_id: r.order_id,
      ext_id: r.order_id, // Use order_id as external ID
      customer: r.customer,
      customer_id: r.customer_id,
      country: r.country,
      status: r.status_monitor?.includes('Artikel fehlt') ? 'pending' : 
              r.status_monitor?.includes('Vorkasse fehlt') ? 'awaiting_payment' : 'open',
      forecast_date: parseGermanDate(r.forecast_date) || parseGermanDate(r.delivery_date),
      order_date: parseGermanDate(r.order_date),
      amount: parseGermanAmount(r.amount),
      currency: r.currency || 'EUR',
      project: r.project,
      payment: r.payment,
      // Create a simple line item from the order data
      sku: r.project || 'UNKNOWN',
      qty: '1',
      line_amount: parseGermanAmount(r.amount),
    }));

    console.log('Sample enriched row:', enrichedRows[0]);

    const { orders, lines: orderLines } = importService.parseOrdersCsv(enrichedRows);
    const importMeta = importService.createImportMeta(enrichedRows, { source: source || 'csv-upload' });

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
