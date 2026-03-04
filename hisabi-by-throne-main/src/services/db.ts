export const settingsDB = {
  async get(): Promise<Settings> {
    const db = await getDB();
    const settings = await db.get('settings', 'main');
    return settings || {
      id: 'main',
      storeName: 'متجري',
      ownerName: '',
      currency: 'د.ج',
      lowStockThreshold: 5,
      defaultProfitMargin: 30,
      theme: 'system',
      language: 'ar',
    };
  },

  async save(settings: Partial<Settings>): Promise<Settings> {
    const db = await getDB();
    const current = await this.get();
    const updated: Settings = { ...current, ...settings, id: 'main' };
    await db.put('settings', updated);
    return updated;
  },
};
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database types
export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  transportCost: number;
  extraCosts: number;
  costPerUnit: number;
  salePrice: number;
  profitMargin: number;
  paymentType: 'cash' | 'credit';
  supplier?: string;
  barcode?: string;
  expiryDate?: string;  // YYYY-MM-DD
  minStock?: number;    // alert threshold override
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPerUnit: number;
  profit: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  discount?: number;
  totalProfit: number;
  paymentType: 'cash' | 'credit';
  customerId?: string;
  customerName?: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  paymentType: 'cash' | 'credit';
  status: 'paid' | 'pending';
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  type: 'shop' | 'personal';
  category: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Credit {
  id: string;
  type: 'supplier' | 'customer';
  name: string;
  phone?: string;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'partial' | 'paid';
  dueDate?: string;
  description?: string;
  supplierId?: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  storeName: string;
  ownerName: string;
  phone?: string;
  address?: string;
  currency: string;
  lowStockThreshold: number;
  defaultProfitMargin: number;
  theme: 'light' | 'dark' | 'system';
  language: 'ar' | 'en';
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  balance: number;       // amount we owe to this supplier
  totalPurchases: number;
  totalPaid: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: 'purchase' | 'payment';
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number; // amount customer owes the shop
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  type: 'debt' | 'payment'; // debt = new credit purchase, payment = paying off debt
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
}

interface Ma7aliDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-category': string; 'by-name': string };
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { 'by-date': string };
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: { 'by-date': string; 'by-status': string };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-date': string; 'by-type': string };
  };
  credits: {
    key: string;
    value: Credit;
    indexes: { 'by-type': string; 'by-status': string };
  };
  settings: {
    key: string;
    value: Settings;
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-name': string };
  };
  customerPayments: {
    key: string;
    value: CustomerPayment;
    indexes: { 'by-customer': string; 'by-date': string };
  };
  suppliers: {
    key: string;
    value: Supplier;
    indexes: { 'by-name': string };
  };
  supplierTransactions: {
    key: string;
    value: SupplierTransaction;
    indexes: { 'by-supplier': string; 'by-date': string };
  };
}

const DB_NAME = 'ma7ali-db';
const DB_VERSION = 3;

let dbInstance: IDBPDatabase<Ma7aliDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<Ma7aliDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<Ma7aliDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('by-category', 'category');
        productStore.createIndex('by-name', 'name');
      }

      // Sales store
      if (!db.objectStoreNames.contains('sales')) {
        const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
        saleStore.createIndex('by-date', 'date');
      }

      // Invoices store
      if (!db.objectStoreNames.contains('invoices')) {
        const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
        invoiceStore.createIndex('by-date', 'date');
        invoiceStore.createIndex('by-status', 'status');
      }

      // Expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-date', 'date');
        expenseStore.createIndex('by-type', 'type');
      }

      // Credits store
      if (!db.objectStoreNames.contains('credits')) {
        const creditStore = db.createObjectStore('credits', { keyPath: 'id' });
        creditStore.createIndex('by-type', 'type');
        creditStore.createIndex('by-status', 'status');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      // v2: Customer accounts
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('by-name', 'name');
      }
      if (!db.objectStoreNames.contains('customerPayments')) {
        const paymentStore = db.createObjectStore('customerPayments', { keyPath: 'id' });
        paymentStore.createIndex('by-customer', 'customerId');
        paymentStore.createIndex('by-date', 'date');
      }

      // v3: Suppliers
      if (!db.objectStoreNames.contains('suppliers')) {
        const supplierStore = db.createObjectStore('suppliers', { keyPath: 'id' });
        supplierStore.createIndex('by-name', 'name');
      }
      if (!db.objectStoreNames.contains('supplierTransactions')) {
        const txStore = db.createObjectStore('supplierTransactions', { keyPath: 'id' });
        txStore.createIndex('by-supplier', 'supplierId');
        txStore.createIndex('by-date', 'date');
      }
    },
  });

  return dbInstance;
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get current date in YYYY-MM-DD format
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get current time in HH:MM format
export function getCurrentTime(): string {
  return new Date().toTimeString().split(' ')[0].substring(0, 5);
}

// ...existing code for DB APIs and helpers...
