/**
 * firestoreDB.ts
 * Complete Firestore data layer — mirrors the same API as db.ts
 * but stores data per-user in Firestore with built-in offline persistence.
 *
 * Collection layout:
 *   /users/{uid}/products/{productId}
 *   /users/{uid}/sales/{saleId}
 *   /users/{uid}/invoices/{invoiceId}
 *   /users/{uid}/expenses/{expenseId}
 *   /users/{uid}/credits/{creditId}
 *   /users/{uid}/profile  (settings + plan)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type {
  Product,
  Sale,
  Invoice,
  Expense,
  Credit,
  Settings,
} from './db';

export type { Product, Sale, Invoice, Expense, Credit, Settings };

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns current user UID. Throws if not authenticated. */
function uid(): string {
  const u = auth.currentUser?.uid;
  if (!u) throw new Error('User not authenticated');
  return u;
}

/** Returns a sub-collection reference for the current user. */
const col = (name: string) => collection(db, 'users', uid(), name);

/** Returns a document reference for the current user. */
const docRef = (name: string, id: string) =>
  doc(db, 'users', uid(), name, id);

/** Generate a unique ID (same format as db.ts). */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Current date as YYYY-MM-DD. */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/** Current time as HH:MM. */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

// ─── Products ───────────────────────────────────────────────────────────────

export const productsDB = {
  async getAll(): Promise<Product[]> {
    const snap = await getDocs(col('products'));
    return snap.docs.map((d) => d.data() as Product);
  },

  async getById(id: string): Promise<Product | undefined> {
    const snap = await getDoc(docRef('products', id));
    return snap.exists() ? (snap.data() as Product) : undefined;
  },

  async add(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef('products', newProduct.id), newProduct);
    return newProduct;
  },

  async update(
    id: string,
    updates: Partial<Product>
  ): Promise<Product | undefined> {
    const ref = docRef('products', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;

    const updated: Product = {
      ...(snap.data() as Product),
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await deleteDoc(docRef('products', id));
    return true;
  },

  async updateStock(
    id: string,
    quantityChange: number
  ): Promise<Product | undefined> {
    const ref = docRef('products', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;

    const product = snap.data() as Product;
    const updated: Product = {
      ...product,
      quantity: Math.max(0, product.quantity + quantityChange),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, updated);
    return updated;
  },

  async getLowStock(threshold = 5): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.quantity <= threshold);
  },

  /** Batch write for data migration from IndexedDB. */
  async batchWrite(products: Product[]): Promise<void> {
    const batch = writeBatch(db);
    products.forEach((p) => {
      batch.set(docRef('products', p.id), p);
    });
    await batch.commit();
  },
};

// ─── Sales ──────────────────────────────────────────────────────────────────

export const salesDB = {
  async getAll(): Promise<Sale[]> {
    const snap = await getDocs(col('sales'));
    return snap.docs.map((d) => d.data() as Sale);
  },

  async getById(id: string): Promise<Sale | undefined> {
    const snap = await getDoc(docRef('sales', id));
    return snap.exists() ? (snap.data() as Sale) : undefined;
  },

  async getByDate(date: string): Promise<Sale[]> {
    const q = query(col('sales'), where('date', '==', date));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Sale);
  },

  async add(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const newSale: Sale = {
      ...sale,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef('sales', newSale.id), newSale);

    // Update stock for each item
    for (const item of sale.items) {
      await productsDB.updateStock(item.productId, -item.quantity);
    }

    return newSale;
  },

  async delete(id: string): Promise<boolean> {
    const ref = docRef('sales', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const sale = snap.data() as Sale;
      // Restore stock
      for (const item of sale.items) {
        await productsDB.updateStock(item.productId, item.quantity);
      }
    }
    await deleteDoc(ref);
    return true;
  },

  async getTodayStats(): Promise<{
    total: number;
    profit: number;
    count: number;
  }> {
    const sales = await this.getByDate(getCurrentDate());
    return {
      total: sales.reduce((acc, s) => acc + s.total, 0),
      profit: sales.reduce((acc, s) => acc + s.totalProfit, 0),
      count: sales.length,
    };
  },

  async batchWrite(sales: Sale[]): Promise<void> {
    const batch = writeBatch(db);
    sales.forEach((s) => {
      batch.set(docRef('sales', s.id), s);
    });
    await batch.commit();
  },
};

// ─── Invoices ───────────────────────────────────────────────────────────────

export const invoicesDB = {
  async getAll(): Promise<Invoice[]> {
    const snap = await getDocs(col('invoices'));
    return snap.docs.map((d) => d.data() as Invoice);
  },

  async getById(id: string): Promise<Invoice | undefined> {
    const snap = await getDoc(docRef('invoices', id));
    return snap.exists() ? (snap.data() as Invoice) : undefined;
  },

  async add(
    invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>
  ): Promise<Invoice> {
    const allInvoices = await this.getAll();
    const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(
      4,
      '0'
    )}`;

    const newInvoice: Invoice = {
      ...invoice,
      id: generateId(),
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef('invoices', newInvoice.id), newInvoice);
    return newInvoice;
  },

  async updateStatus(
    id: string,
    status: 'paid' | 'pending'
  ): Promise<Invoice | undefined> {
    const ref = docRef('invoices', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;

    const updated: Invoice = { ...(snap.data() as Invoice), status };
    await setDoc(ref, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await deleteDoc(docRef('invoices', id));
    return true;
  },

  /** Count invoices created this month (for Freemium limit). */
  async countThisMonth(): Promise<number> {
    const all = await this.getAll();
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return all.filter((inv) => new Date(inv.createdAt) >= start).length;
  },

  async batchWrite(invoices: Invoice[]): Promise<void> {
    const batch = writeBatch(db);
    invoices.forEach((inv) => {
      batch.set(docRef('invoices', inv.id), inv);
    });
    await batch.commit();
  },
};

// ─── Expenses ───────────────────────────────────────────────────────────────

export const expensesDB = {
  async getAll(): Promise<Expense[]> {
    const snap = await getDocs(col('expenses'));
    return snap.docs.map((d) => d.data() as Expense);
  },

  async getByType(type: 'shop' | 'personal'): Promise<Expense[]> {
    const q = query(col('expenses'), where('type', '==', type));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Expense);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter((e) => e.date >= startDate && e.date <= endDate);
  },

  async add(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef('expenses', newExpense.id), newExpense);
    return newExpense;
  },

  async update(
    id: string,
    updates: Partial<Expense>
  ): Promise<Expense | undefined> {
    const ref = docRef('expenses', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;

    const updated: Expense = { ...(snap.data() as Expense), ...updates, id };
    await setDoc(ref, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await deleteDoc(docRef('expenses', id));
    return true;
  },

  async getTodayTotal(): Promise<{ shop: number; personal: number }> {
    const today = getCurrentDate();
    const all = await this.getAll();
    const todayExpenses = all.filter((e) => e.date === today);

    return {
      shop: todayExpenses
        .filter((e) => e.type === 'shop')
        .reduce((acc, e) => acc + e.amount, 0),
      personal: todayExpenses
        .filter((e) => e.type === 'personal')
        .reduce((acc, e) => acc + e.amount, 0),
    };
  },

  async batchWrite(expenses: Expense[]): Promise<void> {
    const batch = writeBatch(db);
    expenses.forEach((e) => {
      batch.set(docRef('expenses', e.id), e);
    });
    await batch.commit();
  },
};

// ─── Credits ────────────────────────────────────────────────────────────────

export const creditsDB = {
  async getAll(): Promise<Credit[]> {
    const snap = await getDocs(col('credits'));
    return snap.docs.map((d) => d.data() as Credit);
  },

  async getByType(type: 'supplier' | 'customer'): Promise<Credit[]> {
    const q = query(col('credits'), where('type', '==', type));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Credit);
  },

  async getById(id: string): Promise<Credit | undefined> {
    const snap = await getDoc(docRef('credits', id));
    return snap.exists() ? (snap.data() as Credit) : undefined;
  },

  async add(
    credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Credit> {
    const now = new Date().toISOString();
    const newCredit: Credit = {
      ...credit,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef('credits', newCredit.id), newCredit);
    return newCredit;
  },

  async update(
    id: string,
    updates: Partial<Credit>
  ): Promise<Credit | undefined> {
    const ref = docRef('credits', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;

    const existing = snap.data() as Credit;
    const updated: Credit = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    // Auto-update status
    if (updated.paidAmount >= updated.amount) {
      updated.status = 'paid';
    } else if (updated.paidAmount > 0) {
      updated.status = 'partial';
    } else {
      updated.status = 'pending';
    }

    await setDoc(ref, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await deleteDoc(docRef('credits', id));
    return true;
  },

  async getTotals(): Promise<{
    supplierDebt: number;
    customerDebt: number;
  }> {
    const all = await this.getAll();
    const pending = all.filter((c) => c.status !== 'paid');

    return {
      supplierDebt: pending
        .filter((c) => c.type === 'supplier')
        .reduce((acc, c) => acc + (c.amount - c.paidAmount), 0),
      customerDebt: pending
        .filter((c) => c.type === 'customer')
        .reduce((acc, c) => acc + (c.amount - c.paidAmount), 0),
    };
  },

  async batchWrite(credits: Credit[]): Promise<void> {
    const batch = writeBatch(db);
    credits.forEach((c) => {
      batch.set(docRef('credits', c.id), c);
    });
    await batch.commit();
  },
};

// ─── Settings/Profile ───────────────────────────────────────────────────────

/** Default settings */
const defaultSettings: Settings = {
  id: 'main',
  storeName: 'متجري',
  ownerName: '',
  currency: 'د.ج',
  lowStockThreshold: 5,
  defaultProfitMargin: 30,
  theme: 'system',
  language: 'ar',
};

export const settingsDB = {
  async get(): Promise<Settings> {
    const ref = doc(db, 'users', uid(), 'profile', 'settings');
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as Settings) : defaultSettings;
  },

  async save(settings: Partial<Settings>): Promise<Settings> {
    const ref = doc(db, 'users', uid(), 'profile', 'settings');
    const current = await this.get();
    const updated: Settings = { ...current, ...settings, id: 'main' };
    await setDoc(ref, updated);
    return updated;
  },
};

// ─── Analytics (Dashboard) ──────────────────────────────────────────────────

export async function getDashboardStats() {
  const today = getCurrentDate();
  const [products, todaySales, expenses, credits] = await Promise.all([
    productsDB.getAll(),
    salesDB.getByDate(today),
    expensesDB.getByDateRange(today, today),
    creditsDB.getTotals(),
  ]);

  const totalSales = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = todaySales.reduce((acc, s) => acc + s.totalProfit, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const shopExpenses = expenses
    .filter((e) => e.type === 'shop')
    .reduce((acc, e) => acc + e.amount, 0);
  const personalExpenses = expenses
    .filter((e) => e.type === 'personal')
    .reduce((acc, e) => acc + e.amount, 0);

  const lowStockProducts = products.filter((p) => p.quantity <= 5);
  const belowCostSales = todaySales.filter((s) =>
    s.items.some((item) => item.unitPrice < item.costPerUnit)
  );

  return {
    sales: totalSales,
    profit: totalProfit,
    profitAfterShopExpenses: totalProfit - shopExpenses,
    profitAfterAllExpenses: totalProfit - totalExpenses,
    transactions: todaySales.length,
    expenses: totalExpenses,
    shopExpenses,
    personalExpenses,
    lowStockProducts,
    belowCostSales,
    credits,
    stockValue: products.reduce(
      (acc, p) => acc + p.quantity * p.salePrice,
      0
    ),
    productCount: products.length,
  };
}

export async function getProductPerformance() {
  const [products, sales] = await Promise.all([
    productsDB.getAll(),
    salesDB.getAll(),
  ]);

  const productSales: Record<
    string,
    { quantity: number; revenue: number; profit: number }
  > = {};

  for (const sale of sales) {
    for (const item of sale.items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue +=
        item.unitPrice * item.quantity;
      productSales[item.productId].profit += item.profit;
    }
  }

  return products
    .map((p) => ({
      ...p,
      soldQuantity: productSales[p.id]?.quantity || 0,
      revenue: productSales[p.id]?.revenue || 0,
      totalProfit: productSales[p.id]?.profit || 0,
      marginPercent:
        p.salePrice > 0
          ? ((p.salePrice - p.costPerUnit) / p.salePrice) * 100
          : 0,
      isProfitable: p.salePrice > p.costPerUnit,
    }))
    .sort((a, b) => b.soldQuantity - a.soldQuantity);
}

// ─── Migration helper (IndexedDB → Firestore) ───────────────────────────────

/**
 * Migrates all local IndexedDB data to the current user's Firestore.
 * Call this once after the user's first sign-in if local data exists.
 */
export async function migrateLocalDataToFirestore(localData: {
  products: Product[];
  sales: Sale[];
  invoices: Invoice[];
  expenses: Expense[];
  credits: Credit[];
  settings?: Settings;
}): Promise<void> {
  const operations: Promise<void>[] = [];

  if (localData.products.length)
    operations.push(productsDB.batchWrite(localData.products));
  if (localData.sales.length)
    operations.push(salesDB.batchWrite(localData.sales));
  if (localData.invoices.length)
    operations.push(invoicesDB.batchWrite(localData.invoices));
  if (localData.expenses.length)
    operations.push(expensesDB.batchWrite(localData.expenses));
  if (localData.credits.length)
    operations.push(creditsDB.batchWrite(localData.credits));
  if (localData.settings)
    operations.push(settingsDB.save(localData.settings).then(() => void 0));

  await Promise.all(operations);
}
