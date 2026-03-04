/**
 * escpos.ts
 * ─────────
 * ESC/POS command builder for BLE thermal printers.
 *
 * Features
 *  • Chainable API (EscPos class)
 *  • Arabic text via Windows-1256 code page OR UTF-8 (select per printer)
 *  • 58 mm (32 cols) and 80 mm (48 cols) paper support
 *  • Pre-built receipt formatters for Sales & Invoices
 */

/* ── ESC/POS control bytes ─────────────────────────────────────────── */
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;

/* ── Windows-1256 encoding table (Arabic subset) ────────────────────── */
const W1256: Record<number, number> = {
  0x060c: 0xac, 0x061b: 0xbb, 0x061f: 0xbf,
  0x0621: 0xc1, 0x0622: 0xc2, 0x0623: 0xc3, 0x0624: 0xc4,
  0x0625: 0xc5, 0x0626: 0xc6, 0x0627: 0xc7, 0x0628: 0xc8,
  0x0629: 0xc9, 0x062a: 0xca, 0x062b: 0xcb, 0x062c: 0xcc,
  0x062d: 0xcd, 0x062e: 0xce, 0x062f: 0xcf, 0x0630: 0xd0,
  0x0631: 0xd1, 0x0632: 0xd2, 0x0633: 0xd3, 0x0634: 0xd4,
  0x0635: 0xd5, 0x0636: 0xd6, 0x0637: 0xd7, 0x0638: 0xd8,
  0x0639: 0xd9, 0x063a: 0xda,
  0x0641: 0xe1, 0x0642: 0xe2, 0x0643: 0xe3, 0x0644: 0xe4,
  0x0645: 0xe5, 0x0646: 0xe6, 0x0647: 0xe7, 0x0648: 0xe8,
  0x0649: 0xe9, 0x064a: 0xea,
  0x064b: 0xeb, 0x064c: 0xec, 0x064d: 0xed, 0x064e: 0xee,
  0x064f: 0xef, 0x0650: 0xf0, 0x0651: 0xf1, 0x0652: 0xf2,
  0x0660: 0xb0, 0x0661: 0xb1, 0x0662: 0xb2, 0x0663: 0xb3,
  0x0664: 0xb4, 0x0665: 0xb5, 0x0666: 0xb6, 0x0667: 0xb7,
  0x0668: 0xb8, 0x0669: 0xb9, 0x066a: 0xba,
  0xfb50: 0xff, 0xfb51: 0xff,
  // Lam-Alef ligatures
  0xfefb: 0xc7, 0xfefc: 0xc7,
};

/* ── Types ───────────────────────────────────────────────────────────── */
export type PrintEncoding = 'utf8' | 'w1256';

/* ── Main builder class ─────────────────────────────────────────────── */
export class EscPos {
  private buf: number[] = [];

  /** Reset printer to default state */
  init(): this {
    this.buf.push(ESC, 0x40);
    return this;
  }

  /**
   * Activate code page.
   *  w1256 → CP 40 (Windows-1256 Arabic, Epson-compatible printers)
   *  utf8  → no command: UTF-8 printers accept raw bytes without a code-page switch.
   *           Sending 0xFF to a UTF-8 printer often resets it to an incorrect single-byte
   *           mode and causes garbled Arabic output.
   */
  codePage(enc: PrintEncoding): this {
    if (enc === 'w1256') {
      this.buf.push(ESC, 0x74, 0x28); // Code page 40 = Windows-1256
    }
    // UTF-8: skip — printer receives raw UTF-8 bytes and handles them natively
    return this;
  }

  /* ── Alignment ──────────────────────────────────────────────────── */
  left():   this { this.buf.push(ESC, 0x61, 0x00); return this; }
  center(): this { this.buf.push(ESC, 0x61, 0x01); return this; }
  right():  this { this.buf.push(ESC, 0x61, 0x02); return this; }

  /* ── Style ──────────────────────────────────────────────────────── */
  bold(on = true): this      { this.buf.push(ESC, 0x45, on ? 1 : 0); return this; }
  underline(on = true): this { this.buf.push(ESC, 0x2d, on ? 1 : 0); return this; }

  /**
   * Scale text: width × height (1 or 2)
   *  size(2,2) = 2× bigger in both directions
   */
  size(w: 1 | 2 = 1, h: 1 | 2 = 1): this {
    this.buf.push(GS, 0x21, ((w - 1) << 4) | (h - 1));
    return this;
  }

  /* ── Text output ────────────────────────────────────────────────── */

  /** Append raw bytes directly */
  raw(bytes: number[] | Uint8Array): this {
    for (const b of bytes) this.buf.push(b);
    return this;
  }

  /** Append text as UTF-8 bytes */
  utf8(str: string): this {
    new TextEncoder().encode(str).forEach(b => this.buf.push(b));
    return this;
  }

  /** Append text encoded as Windows-1256 (Arabic) */
  w1256(str: string): this {
    for (const ch of str) {
      const cp = ch.codePointAt(0) ?? 0x3f;
      if (cp < 0x80) {
        this.buf.push(cp);                      // ASCII pass-through
      } else {
        this.buf.push(W1256[cp] ?? 0x3f);       // '?' for unmapped
      }
    }
    return this;
  }

  /** Append text using the selected encoding */
  text(str: string, enc: PrintEncoding = 'utf8'): this {
    return enc === 'w1256' ? this.w1256(str) : this.utf8(str);
  }

  /** Feed (newline) N times */
  feed(n = 1): this {
    for (let i = 0; i < n; i++) this.buf.push(LF);
    return this;
  }

  /** Print a horizontal separator line of `cols` characters */
  separator(char = '-', cols = 32): this {
    this.utf8(char.repeat(cols));
    return this.feed();
  }

  /** Full paper cut */
  cut(): this {
    this.buf.push(GS, 0x56, 0x41, 0x10);
    return this;
  }

  /** Audible beep (some printers support this) */
  beep(): this {
    this.buf.push(ESC, 0x42, 0x01, 0x02);
    return this;
  }

  /** Return the assembled byte array */
  getBytes(): Uint8Array {
    return new Uint8Array(this.buf);
  }
}

/* ── Receipt formatters ─────────────────────────────────────────────── */

export interface ReceiptOptions {
  paperWidth: 58 | 80;
  encoding: PrintEncoding;
}

const COLS: Record<58 | 80, number> = { 58: 32, 80: 48 };

/**
 * Reverse a string character-by-character for LTR-printing of RTL (Arabic) text.
 * Use with W1256 mode only — UTF-8 printers with Arabic firmware handle bidi natively.
 */
function reverseRTL(s: string): string {
  return [...s].reverse().join('');
}

/**
 * Two-column row for an Arabic RTL receipt on a LTR thermal printer.
 *
 * Layout: value (LTR — price/qty numbers) on the LEFT, name on the RIGHT.
 * This mirrors the Arabic reading direction: reader scans right-to-left,
 * sees the product name first, then the price.
 *
 * reverseNameChars=true  (W1256): reverse Arabic chars so they read correctly
 *                                  right-to-left once printed left-to-right.
 * reverseNameChars=false (UTF-8): Arabic firmware on the printer handles
 *                                  glyph shaping and bidi reversal internally.
 *
 * Value occupies at most half the line width so it is never truncated for
 * typical price strings (e.g. "10x45000=450000" = 15 chars fits in 24 of 48).
 */
function twoCol(name: string, value: string, total: number, reverseNameChars = false): string {
  // Allow value up to half the line; only truncate the name to fit
  const maxV = Math.min(value.length, Math.floor(total / 2));
  const v = value.slice(0, maxV);
  const n = name.slice(0, total - v.length - 1);
  const nameOut = reverseNameChars ? reverseRTL(n) : n;
  const padding = Math.max(0, total - v.length - nameOut.length);
  return v + ' '.repeat(padding) + nameOut;
}

/* ─────────────────────────────────────────────────────────────────────
   Sale Receipt
   ───────────────────────────────────────────────────────────────────── */
export interface SaleReceiptData {
  id:            string;
  items:         Array<{ productName: string; quantity: number; unitPrice: number }>;
  total:         number;
  totalProfit:   number;
  discount?:     number;
  paymentType:   string;
  customerName?: string;
  date:          string;
  time:          string;
}

export interface StoreInfo {
  storeName:  string;
  ownerName?: string;
  phone?:     string;
  address?:   string;
  currency:   string;
}

export function buildSaleReceipt(
  sale:     SaleReceiptData,
  store:    StoreInfo,
  opts:     ReceiptOptions = { paperWidth: 58, encoding: 'utf8' },
): Uint8Array {
  const { paperWidth, encoding: enc } = opts;
  const cols = COLS[paperWidth];
  const sep  = '='.repeat(cols);
  const dash = '-'.repeat(cols);
  // W1256 printers have no Arabic firmware — reverse chars for correct RTL visual output.
  // UTF-8 printers with Arabic firmware handle bidi internally; leave text as-is.
  const rtl = enc === 'w1256';

  const p = new EscPos().init().codePage(enc);
  /** Emit one Arabic text run, reversing chars when in W1256 mode. */
  const ar = (s: string): EscPos => p.text(rtl ? reverseRTL(s) : s, enc);

  // ── Header ────────────────────────────────────────────────────────
  p.center().bold().size(2, 2); ar(store.storeName); p.feed();
  p.size(1, 1).bold(false);
  if (store.ownerName) { p.center(); ar(store.ownerName); p.feed(); }
  if (store.address)   { p.center(); ar(store.address);   p.feed(); }
  if (store.phone)     { p.center().utf8(store.phone).feed(); }
  p.left().utf8(sep).feed();

  // ── Date / customer ───────────────────────────────────────────────
  p.right().utf8(`${sale.date}  ${sale.time}`).feed();
  if (sale.customerName) { p.right(); ar(sale.customerName); p.feed(); }
  p.left().utf8(dash).feed();

  // ── Items ─────────────────────────────────────────────────────────
  p.left();
  const subtotal = sale.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  for (const item of sale.items) {
    const price = `${item.quantity}x${item.unitPrice.toLocaleString('en-US')}=${(item.quantity * item.unitPrice).toLocaleString('en-US')}`;
    p.text(twoCol(item.productName, price, cols, rtl), enc).feed();
  }

  // ── Discount (if any) ─────────────────────────────────────────────
  const discount = sale.discount ?? 0;
  if (discount > 0) {
    p.utf8(dash).feed();
    p.text(twoCol(rtl ? reverseRTL('المجموع') : 'المجموع', `${subtotal.toLocaleString('en-US')} ${store.currency}`, cols, false), enc).feed();
    p.text(twoCol(rtl ? reverseRTL('خصم') : 'خصم', `-${discount.toLocaleString('en-US')} ${store.currency}`, cols, false), enc).feed();
  }
  p.utf8(sep).feed();

  // ── Grand total ───────────────────────────────────────────────────
  p.bold().size(1, 2);
  p.right().utf8(`${sale.total.toLocaleString('en-US')} ${store.currency}`).feed();
  p.size(1, 1).bold(false);
  const payLabel = sale.paymentType === 'cash' ? 'نقدي ✓' : 'دين ⌛';
  p.right(); ar(payLabel); p.feed();
  p.utf8(dash).feed();

  // ── Footer ────────────────────────────────────────────────────────
  p.center(); ar('شكراً لتسوقكم معنا'); p.feed();
  p.center().utf8('Ma7ali POS').feed(3);
  p.cut();

  return p.getBytes();
}

/* ─────────────────────────────────────────────────────────────────────
   Invoice Receipt
   ───────────────────────────────────────────────────────────────────── */
export interface InvoiceReceiptData {
  invoiceNumber: string;
  customerName:  string;
  items:         Array<{ productName: string; quantity: number; unitPrice: number }>;
  total:         number;
  paymentType:   string;
  status:        string;
  date:          string;
}

export function buildInvoiceReceipt(
  inv:   InvoiceReceiptData,
  store: StoreInfo,
  opts:  ReceiptOptions = { paperWidth: 58, encoding: 'utf8' },
): Uint8Array {
  const { paperWidth, encoding: enc } = opts;
  const cols = COLS[paperWidth];
  const sep  = '='.repeat(cols);
  const dash = '-'.repeat(cols);
  const rtl = enc === 'w1256';

  const p = new EscPos().init().codePage(enc);
  const ar = (s: string): EscPos => p.text(rtl ? reverseRTL(s) : s, enc);

  // ── Header ────────────────────────────────────────────────────────
  p.center().bold().size(2, 2); ar(store.storeName); p.feed();
  p.size(1, 1).bold(false);
  if (store.ownerName) { p.center(); ar(store.ownerName); p.feed(); }
  if (store.address)   { p.center(); ar(store.address);   p.feed(); }
  if (store.phone)     { p.center().utf8(store.phone).feed(); }
  p.left().utf8(sep).feed();

  // ── Invoice meta ──────────────────────────────────────────────────
  p.right().utf8(`#${inv.invoiceNumber}`).feed();
  p.right().utf8(inv.date).feed();
  p.right(); ar(inv.customerName); p.feed();
  p.left().utf8(dash).feed();

  // ── Items ─────────────────────────────────────────────────────────
  p.left();
  for (const item of inv.items) {
    const price = `${item.quantity}x${item.unitPrice.toLocaleString('en-US')}=${(item.quantity * item.unitPrice).toLocaleString('en-US')}`;
    p.text(twoCol(item.productName, price, cols, rtl), enc).feed();
  }
  p.utf8(sep).feed();

  // ── Total & status ────────────────────────────────────────────────
  p.bold().size(1, 2);
  p.right().utf8(`${inv.total.toLocaleString('en-US')} ${store.currency}`).feed();
  p.size(1, 1).bold(false);
  const st = inv.status === 'paid' ? 'مدفوع ✓' : 'معلق ⌛';
  p.right(); ar(st); p.feed();
  p.utf8(dash).feed();

  // ── Footer ────────────────────────────────────────────────────────
  p.center(); ar('شكراً لثقتكم بنا'); p.feed();
  p.center().utf8('Ma7ali POS').feed(3);
  p.cut();

  return p.getBytes();
}

/* ─────────────────────────────────────────────────────────────────────
   Test Page
   ───────────────────────────────────────────────────────────────────── */
export function buildTestPage(
  store: StoreInfo,
  opts:  ReceiptOptions = { paperWidth: 58, encoding: 'utf8' },
): Uint8Array {
  const { paperWidth, encoding: enc } = opts;
  const cols = COLS[paperWidth];

  const p = new EscPos().init().codePage(enc);

  p.center().bold().size(2, 2).utf8('Ma7ali').feed();
  p.size(1, 1).bold(false);
  p.center().text('اختبار الطباعة', enc).feed();
  p.utf8('='.repeat(cols)).feed();
  p.left().text(`المتجر: ${store.storeName}`, enc).feed();
  if (store.phone)   p.left().utf8(`هاتف: ${store.phone}`).feed();
  if (store.address) p.left().text(`عنوان: ${store.address}`, enc).feed();
  p.utf8('-'.repeat(cols)).feed();
  p.center().text('الطابعة تعمل بشكل ممتاز', enc).feed();
  p.center().utf8(new Date().toLocaleString('ar-DZ')).feed();
  p.utf8('='.repeat(cols)).feed();
  p.center().bold().text('شكراً', enc).feed();
  p.bold(false).feed(3);
  p.cut();

  return p.getBytes();
}
