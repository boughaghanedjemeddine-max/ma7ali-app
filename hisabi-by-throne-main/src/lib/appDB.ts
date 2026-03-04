/**
 * appDB.ts — offline-only data access layer.
 * All data lives in IndexedDB (idb). Firebase / Firestore not imported.
 */

import * as local from './db';

// ─── Core data stores ─────────────────────────────────────────────────────────
export const productsDB   = local.productsDB;
export const salesDB      = local.salesDB;
export const invoicesDB   = local.invoicesDB;
export const expensesDB   = local.expensesDB;
export const creditsDB    = local.creditsDB;
export const settingsDB   = local.settingsDB;

// Customer accounts
export const customersDB        = local.customersDB;
export const customerPaymentsDB = local.customerPaymentsDB;

// Suppliers
export const suppliersDB             = local.suppliersDB;
export const supplierTransactionsDB  = local.supplierTransactionsDB;

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getDashboardStats     = local.getDashboardStats;
export const getProductPerformance = local.getProductPerformance;

// ─── Utilities ────────────────────────────────────────────────────────────────
export { generateId, getCurrentDate, getCurrentTime } from './db';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  Product,
  Sale,
  SaleItem,
  Invoice,
  Expense,
  Credit,
  Settings,
  Customer,
  CustomerPayment,
  Supplier,
  SupplierTransaction,
} from './db';

// ─── Compat constant ─────────────────────────────────────────────────────────
/** Always false — kept for any legacy import sites. */
export const IS_FIREBASE_ENABLED = false as const;

/** No-op stub — kept so any call site compiles without error. */
export const migrateLocalDataToFirestore = async () => {};
