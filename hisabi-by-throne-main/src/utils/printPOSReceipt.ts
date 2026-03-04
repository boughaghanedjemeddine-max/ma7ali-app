import { settingsDB } from '../services/db';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  discountAmt: number;
  total: number;
  paymentType: 'cash' | 'credit';
  customerName?: string;
  date: string;
  time: string;
}

export async function printPOSReceipt(data: ReceiptData): Promise<void> {
  // ...existing code...
}
