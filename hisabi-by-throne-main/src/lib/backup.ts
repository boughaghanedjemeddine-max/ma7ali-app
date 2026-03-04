/**
 * backup.ts
 * ──────────
 * Unified backup / restore / CSV export logic for Ma7ali.
 *
 * Backup file format (v2):
 * {
 *   version: 2,
 *   app: "ma7ali",
 *   exportedAt: ISO string,
 *   storeName: string,
 *   data: { products, sales, invoices, expenses, credits,
 *           customers, customerPayments, suppliers, supplierTransactions, settings }
 * }
 */

import { getDB, settingsDB } from './db';

export const BACKUP_VERSION = 2;

const ALL_STORES = [
  'products', 'sales', 'invoices', 'expenses', 'credits',
  'customers', 'customerPayments', 'suppliers', 'supplierTransactions',
] as const;

type StoreName = typeof ALL_STORES[number];

const AUTO_BACKUP_KEY = 'ma7ali-auto-backup';
const AUTO_BACKUP_DATE_KEY = 'ma7ali-auto-backup-date';

// ─── Export full backup as JSON file ─────────────────────────────────────────
export async function exportBackup(): Promise<{ size: string; rows: number }> {
  const db = await getDB();
  const storeData: Record<string, unknown[]> = {};
  let totalRows = 0;

  for (const store of ALL_STORES) {
    const rows = await db.getAll(store as StoreName);
    storeData[store] = rows;
    totalRows += rows.length;
  }
  const settings = await settingsDB.get();

  const backup = {
    version: BACKUP_VERSION,
    app: 'ma7ali',
    exportedAt: new Date().toISOString(),
    storeName: settings?.storeName ?? 'محلي',
    data: { ...storeData, settings },
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ma7ali-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const size = blob.size > 1024 * 1024
    ? `${(blob.size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(blob.size / 1024)} KB`;

  return { size, rows: totalRows };
}

// ─── Import / restore from JSON file ─────────────────────────────────────────
export async function importBackup(file: File): Promise<{ rows: number }> {
  const text = await file.text();
  const backup = JSON.parse(text);

  if (!backup.data) throw new Error('ملف النسخة الاحتياطية تالف أو غير مدعوم');

  const db = await getDB();

  // Clear then re-populate each store
  const tx = db.transaction(
    ALL_STORES as unknown as StoreName[],
    'readwrite'
  );
  for (const store of ALL_STORES) {
    await tx.objectStore(store).clear();
  }

  let totalRows = 0;
  for (const store of ALL_STORES) {
    const rows: unknown[] = backup.data[store] ?? [];
    for (const row of rows) {
      tx.objectStore(store).put(row as never);
    }
    totalRows += rows.length;
  }
  await tx.done;

  if (backup.data.settings) {
    await settingsDB.save(backup.data.settings);
  }

  return { rows: totalRows };
}

// ─── Auto daily backup (saved to localStorage) ───────────────────────────────
export async function runAutoBackupIfNeeded(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = localStorage.getItem(AUTO_BACKUP_DATE_KEY);
  if (lastDate === today) return false; // already backed up today

  try {
    const db = await getDB();
    const storeData: Record<string, unknown[]> = {};
    for (const store of ALL_STORES) {
      storeData[store] = await db.getAll(store as StoreName);
    }
    const settings = await settingsDB.get();
    const backup = {
      version: BACKUP_VERSION,
      app: 'ma7ali',
      exportedAt: new Date().toISOString(),
      data: { ...storeData, settings },
    };
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backup));
    localStorage.setItem(AUTO_BACKUP_DATE_KEY, today);
    return true;
  } catch {
    return false;
  }
}

export function getAutoBackupInfo(): { date: string | null; sizeKB: number } {
  const date = localStorage.getItem(AUTO_BACKUP_DATE_KEY);
  const raw = localStorage.getItem(AUTO_BACKUP_KEY) ?? '';
  const sizeKB = Math.round(new Blob([raw]).size / 1024);
  return { date, sizeKB };
}

export function downloadAutoBackup(): void {
  const raw = localStorage.getItem(AUTO_BACKUP_KEY);
  if (!raw) return;
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ma7ali-auto-backup-${localStorage.getItem(AUTO_BACKUP_DATE_KEY) ?? 'local'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CSV export (sales) ───────────────────────────────────────────────────────
export async function exportSalesCSV(): Promise<{ rows: number }> {
  const db = await getDB();
  const sales = await db.getAll('sales');
  if (!sales.length) throw new Error('لا توجد مبيعات للتصدير');

  const headers = ['التاريخ', 'الوقت', 'المجموع', 'الربح', 'نوع الدفع', 'العميل', 'عدد الأصناف'];
  const rows = sales.map(s => [
    s.date,
    s.time ?? '',
    s.total,
    s.totalProfit,
    s.paymentType === 'cash' ? 'نقدي' : 'آجل',
    s.customerName ?? '',
    s.items.length,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel Arabic support
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ma7ali-sales-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  return { rows: sales.length };
}

// ─── CSV export (products) ────────────────────────────────────────────────────
export async function exportProductsCSV(): Promise<{ rows: number }> {
  const db = await getDB();
  const products = await db.getAll('products');
  if (!products.length) throw new Error('لا توجد منتجات للتصدير');

  const headers = ['الاسم', 'الفئة', 'الكمية', 'سعر التكلفة', 'سعر البيع', 'هامش الربح %', 'تاريخ الإضافة'];
  const rows = products.map(p => [
    p.name,
    p.category,
    p.quantity,
    p.costPerUnit,
    p.salePrice,
    p.profitMargin,
    p.createdAt?.slice(0, 10) ?? '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ma7ali-products-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  return { rows: products.length };
}
