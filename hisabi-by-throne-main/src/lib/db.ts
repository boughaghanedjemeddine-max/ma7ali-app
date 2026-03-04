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

// Products API
export const productsDB = {
  async getAll(): Promise<Product[]> {
    const db = await getDB();
    return db.getAll('products');
  },

  async getById(id: string): Promise<Product | undefined> {
    const db = await getDB();
    return db.get('products', id);
  },

  async add(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.add('products', newProduct);
    return newProduct;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const db = await getDB();
    const existing = await db.get('products', id);
    if (!existing) return undefined;
    
    const updated: Product = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.put('products', updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    await db.delete('products', id);
    return true;
  },

  async updateStock(id: string, quantityChange: number): Promise<Product | undefined> {
    const db = await getDB();
    const product = await db.get('products', id);
    if (!product) return undefined;
    
    const updated: Product = {
      ...product,
      quantity: Math.max(0, product.quantity + quantityChange),
      updatedAt: new Date().toISOString(),
    };
    await db.put('products', updated);
    return updated;
  },

  async getLowStock(threshold: number = 5): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter(p => p.quantity <= threshold);
  },
};

// Sales API
export const salesDB = {
  async getAll(): Promise<Sale[]> {
    const db = await getDB();
    return db.getAll('sales');
  },

  async getById(id: string): Promise<Sale | undefined> {
    const db = await getDB();
    return db.get('sales', id);
  },

  async getByDate(date: string): Promise<Sale[]> {
    const db = await getDB();
    const index = db.transaction('sales').store.index('by-date');
    return index.getAll(date);
  },

  async add(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const db = await getDB();
    const newSale: Sale = {
      ...sale,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.add('sales', newSale);
    
    // Update stock for each item
    for (const item of sale.items) {
      await productsDB.updateStock(item.productId, -item.quantity);
    }
    
    return newSale;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    const sale = await db.get('sales', id);
    if (sale) {
      // Restore stock
      for (const item of sale.items) {
        await productsDB.updateStock(item.productId, item.quantity);
      }
      // Delete the auto-generated invoice linked to this sale
      const allInvoices = await db.getAll('invoices');
      const linkedInvoice = allInvoices.find(inv => inv.saleId === id);
      if (linkedInvoice) await db.delete('invoices', linkedInvoice.id);
    }
    await db.delete('sales', id);
    return true;
  },

  async getTodayStats(): Promise<{ total: number; profit: number; count: number }> {
    const today = getCurrentDate();
    const sales = await this.getByDate(today);
    return {
      total: sales.reduce((acc, s) => acc + s.total, 0),
      profit: sales.reduce((acc, s) => acc + s.totalProfit, 0),
      count: sales.length,
    };
  },
};

// Invoices API
export const invoicesDB = {
  async getAll(): Promise<Invoice[]> {
    const db = await getDB();
    return db.getAll('invoices');
  },

  async getById(id: string): Promise<Invoice | undefined> {
    const db = await getDB();
    return db.get('invoices', id);
  },

  async add(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Invoice> {
    const db = await getDB();
    const allInvoices = await db.getAll('invoices');
    const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(4, '0')}`;
    
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId(),
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    await db.add('invoices', newInvoice);
    return newInvoice;
  },

  async updateStatus(id: string, status: 'paid' | 'pending'): Promise<Invoice | undefined> {
    const db = await getDB();
    const invoice = await db.get('invoices', id);
    if (!invoice) return undefined;
    
    const updated: Invoice = { ...invoice, status };
    await db.put('invoices', updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    await db.delete('invoices', id);
    return true;
  },

  async countThisMonth(): Promise<number> {
    const all = await this.getAll();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return all.filter(inv => inv.createdAt >= startOfMonth).length;
  },
};

// Expenses API
export const expensesDB = {
  async getAll(): Promise<Expense[]> {
    const db = await getDB();
    return db.getAll('expenses');
  },

  async getByType(type: 'shop' | 'personal'): Promise<Expense[]> {
    const db = await getDB();
    const index = db.transaction('expenses').store.index('by-type');
    return index.getAll(type);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter(e => e.date >= startDate && e.date <= endDate);
  },

  async add(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const db = await getDB();
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.add('expenses', newExpense);
    return newExpense;
  },

  async update(id: string, updates: Partial<Expense>): Promise<Expense | undefined> {
    const db = await getDB();
    const existing = await db.get('expenses', id);
    if (!existing) return undefined;
    
    const updated: Expense = { ...existing, ...updates, id };
    await db.put('expenses', updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    await db.delete('expenses', id);
    return true;
  },

  async getTodayTotal(): Promise<{ shop: number; personal: number }> {
    const today = getCurrentDate();
    const all = await this.getAll();
    const todayExpenses = all.filter(e => e.date === today);
    
    return {
      shop: todayExpenses.filter(e => e.type === 'shop').reduce((acc, e) => acc + e.amount, 0),
      personal: todayExpenses.filter(e => e.type === 'personal').reduce((acc, e) => acc + e.amount, 0),
    };
  },
};

// Credits API
export const creditsDB = {
  async getAll(): Promise<Credit[]> {
    const db = await getDB();
    return db.getAll('credits');
  },

  async getByType(type: 'supplier' | 'customer'): Promise<Credit[]> {
    const db = await getDB();
    const index = db.transaction('credits').store.index('by-type');
    return index.getAll(type);
  },

  async getById(id: string): Promise<Credit | undefined> {
    const db = await getDB();
    return db.get('credits', id);
  },

  async add(credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Credit> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newCredit: Credit = {
      ...credit,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.add('credits', newCredit);
    return newCredit;
  },

  async update(id: string, updates: Partial<Credit>): Promise<Credit | undefined> {
    const db = await getDB();
    const existing = await db.get('credits', id);
    if (!existing) return undefined;
    
    const updated: Credit = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    // Auto-update status based on payment
    if (updated.paidAmount >= updated.amount) {
      updated.status = 'paid';
    } else if (updated.paidAmount > 0) {
      updated.status = 'partial';
    } else {
      updated.status = 'pending';
    }
    
    await db.put('credits', updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    await db.delete('credits', id);
    return true;
  },

  async getTotals(): Promise<{ supplierDebt: number; customerDebt: number }> {
    const all = await this.getAll();
    const pending = all.filter(c => c.status !== 'paid');
    
    return {
      supplierDebt: pending.filter(c => c.type === 'supplier').reduce((acc, c) => acc + (c.amount - c.paidAmount), 0),
      customerDebt: pending.filter(c => c.type === 'customer').reduce((acc, c) => acc + (c.amount - c.paidAmount), 0),
    };
  },
};

// Settings API
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

// ─── Customers API ───────────────────────────────────────────────────────────

export const customersDB = {
  async getAll(): Promise<Customer[]> {
    const db = await getDB();
    return db.getAll('customers');
  },

  async getById(id: string): Promise<Customer | undefined> {
    const db = await getDB();
    return db.get('customers', id);
  },

  async add(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<Customer> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      balance: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.add('customers', newCustomer);
    return newCustomer;
  },

  async update(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const db = await getDB();
    const existing = await db.get('customers', id);
    if (!existing) return undefined;
    const updated: Customer = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.put('customers', updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    await db.delete('customers', id);
    // Also delete all payments for this customer
    const allPayments = await customerPaymentsDB.getAllPayments();
    for (const p of allPayments.filter(p => p.customerId === id)) {
      await db.delete('customerPayments', p.id);
    }
    return true;
  },

  async getTotals(): Promise<{ totalDebt: number; debtorsCount: number }> {
    const all = await this.getAll();
    const debtors = all.filter(c => c.balance > 0);
    return {
      totalDebt: debtors.reduce((acc, c) => acc + c.balance, 0),
      debtorsCount: debtors.length,
    };
  },
};

// ─── CustomerPayments API ────────────────────────────────────────────────────

export const customerPaymentsDB = {
  async getAllPayments(): Promise<CustomerPayment[]> {
    const db = await getDB();
    return db.getAll('customerPayments');
  },

  async getByCustomer(customerId: string): Promise<CustomerPayment[]> {
    const db = await getDB();
    const index = db.transaction('customerPayments').store.index('by-customer');
    const results = await index.getAll(customerId);
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async add(payment: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newPayment: CustomerPayment = {
      ...payment,
      id: generateId(),
      createdAt: now,
    };
    await db.add('customerPayments', newPayment);
    // Update customer balance
    const customer = await customersDB.getById(payment.customerId);
    if (customer) {
      const delta = payment.type === 'debt' ? payment.amount : -payment.amount;
      await customersDB.update(payment.customerId, {
        balance: Math.max(0, customer.balance + delta),
      });
    }
    return newPayment;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    const payment = await db.get('customerPayments', id);
    if (payment) {
      // Reverse the balance change
      const customer = await customersDB.getById(payment.customerId);
      if (customer) {
        const delta = payment.type === 'debt' ? -payment.amount : payment.amount;
        await customersDB.update(payment.customerId, {
          balance: Math.max(0, customer.balance + delta),
        });
      }
    }
    await db.delete('customerPayments', id);
    return true;
  },
};

// ─── Suppliers API ───────────────────────────────────────────────────────────

export const suppliersDB = {
  async getAll(): Promise<Supplier[]> {
    const db = await getDB();
    return db.getAll('suppliers');
  },

  async getById(id: string): Promise<Supplier | undefined> {
    const db = await getDB();
    return db.get('suppliers', id);
  },

  async add(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'balance' | 'totalPurchases' | 'totalPaid'>): Promise<Supplier> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      ...supplier,
      id: generateId(),
      balance: 0,
      totalPurchases: 0,
      totalPaid: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.add('suppliers', newSupplier);
    return newSupplier;
  },

  async update(id: string, updates: Partial<Supplier>): Promise<Supplier | undefined> {
    const db = await getDB();
    const existing = await db.get('suppliers', id);
    if (!existing) return undefined;
    const updated: Supplier = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await db.put('suppliers', updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    await db.delete('suppliers', id);
    // Also delete transactions
    const txs = await supplierTransactionsDB.getBySupplier(id);
    for (const tx of txs) await db.delete('supplierTransactions', tx.id);
    return true;
  },

  async getTotals(): Promise<{ totalOwed: number; count: number }> {
    const all = await this.getAll();
    return {
      totalOwed: all.reduce((acc, s) => acc + s.balance, 0),
      count: all.filter(s => s.balance > 0).length,
    };
  },
};

// ─── SupplierTransactions API ────────────────────────────────────────────────

export const supplierTransactionsDB = {
  async getAll(): Promise<SupplierTransaction[]> {
    const db = await getDB();
    return db.getAll('supplierTransactions');
  },

  async getBySupplier(supplierId: string): Promise<SupplierTransaction[]> {
    const db = await getDB();
    const index = db.transaction('supplierTransactions').store.index('by-supplier');
    const results = await index.getAll(supplierId);
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async add(tx: Omit<SupplierTransaction, 'id' | 'createdAt'>): Promise<SupplierTransaction> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newTx: SupplierTransaction = { ...tx, id: generateId(), createdAt: now };
    await db.add('supplierTransactions', newTx);
    // Update supplier balance
    const supplier = await suppliersDB.getById(tx.supplierId);
    if (supplier) {
      const isPurchase = tx.type === 'purchase';
      await suppliersDB.update(tx.supplierId, {
        balance:        supplier.balance        + (isPurchase ? tx.amount : -tx.amount),
        totalPurchases: supplier.totalPurchases + (isPurchase ? tx.amount : 0),
        totalPaid:      supplier.totalPaid      + (isPurchase ? 0 : tx.amount),
      });
    }
    return newTx;
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    const tx = await db.get('supplierTransactions', id);
    if (tx) {
      const supplier = await suppliersDB.getById(tx.supplierId);
      if (supplier) {
        const isPurchase = tx.type === 'purchase';
        await suppliersDB.update(tx.supplierId, {
          balance:        supplier.balance        - (isPurchase ? tx.amount : -tx.amount),
          totalPurchases: supplier.totalPurchases - (isPurchase ? tx.amount : 0),
          totalPaid:      supplier.totalPaid      - (isPurchase ? 0 : tx.amount),
        });
      }
    }
    await db.delete('supplierTransactions', id);
    return true;
  },
};

// Analytics helpers
export async function getDashboardStats() {
  const today = getCurrentDate();
  const [products, todaySales, expenses, credits, settings] = await Promise.all([
    productsDB.getAll(),
    salesDB.getByDate(today),
    expensesDB.getByDateRange(today, today),
    creditsDB.getTotals(),
    settingsDB.get(),
  ]);

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  const totalSales = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = todaySales.reduce((acc, s) => acc + s.totalProfit, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const shopExpenses = expenses.filter(e => e.type === 'shop').reduce((acc, e) => acc + e.amount, 0);
  const personalExpenses = expenses.filter(e => e.type === 'personal').reduce((acc, e) => acc + e.amount, 0);

  const lowStockProducts = products.filter(p => p.quantity <= lowStockThreshold);
  const belowCostSales = todaySales.filter(s => 
    s.items.some(item => item.unitPrice < item.costPerUnit)
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
    stockValue: products.reduce((acc, p) => acc + (p.quantity * p.salePrice), 0),
    productCount: products.length,
  };
}

export async function getProductPerformance() {
  const products = await productsDB.getAll();
  const sales = await salesDB.getAll();

  const productSales: Record<string, { quantity: number; revenue: number; profit: number }> = {};

  for (const sale of sales) {
    for (const item of sale.items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { quantity: 0, revenue: 0, profit: 0 };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.unitPrice * item.quantity;
      productSales[item.productId].profit += item.profit;
    }
  }

  return products.map(p => ({
    ...p,
    soldQuantity: productSales[p.id]?.quantity || 0,
    revenue: productSales[p.id]?.revenue || 0,
    totalProfit: productSales[p.id]?.profit || 0,
    marginPercent: p.salePrice > 0 ? ((p.salePrice - p.costPerUnit) / p.salePrice) * 100 : 0,
    isProfitable: p.salePrice > p.costPerUnit,
  })).sort((a, b) => b.soldQuantity - a.soldQuantity);
}
