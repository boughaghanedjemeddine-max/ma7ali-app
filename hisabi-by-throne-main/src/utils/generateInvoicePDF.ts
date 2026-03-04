import { Invoice } from '../services/db';

export interface StoreInfo {
  storeName?: string;
  address?: string;
  phone?: string;
  currency?: string;
}

export function generateInvoicePDF(invoice: Invoice, store?: StoreInfo): void {
  // ...existing code...
}

export function shareInvoiceWhatsApp(invoice: Invoice, store?: StoreInfo): void {
  // ...existing code...
}
