import { settingsDB } from './db';

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
  const settings = await settingsDB.get().catch(() => null);
  const storeName = settings?.storeName || 'محلي';
  const phone     = settings?.phone || '';
  const address   = settings?.address || '';
  const cur       = settings?.currency || 'د.ج';

  const itemsHTML = data.items.map(item => `
    <tr>
      <td class="item-name">${item.name}</td>
      <td class="item-qty">${item.quantity}</td>
      <td class="item-price">${(item.unitPrice * item.quantity).toLocaleString('ar-DZ')} ${cur}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>وصل - ${storeName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Tajawal', sans-serif;
      background: #fff;
      color: #111;
      width: 80mm;
      margin: 0 auto;
      padding: 8px;
      font-size: 13px;
    }

    .store-name {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }
    .store-meta {
      text-align: center;
      font-size: 11px;
      color: #555;
      margin-bottom: 4px;
      line-height: 1.6;
    }

    .divider {
      border: none;
      border-top: 1px dashed #aaa;
      margin: 6px 0;
    }
    .divider-double {
      border: none;
      border-top: 2px solid #111;
      margin: 6px 0;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #444;
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    th {
      font-size: 11px;
      font-weight: 700;
      border-bottom: 1px solid #aaa;
      padding: 3px 0;
    }
    td { padding: 4px 0; vertical-align: top; }
    .item-name { width: 50%; font-size: 12px; }
    .item-qty  { width: 15%; text-align: center; font-size: 12px; color: #555; }
    .item-price{ width: 35%; text-align: left; font-size: 12px; font-weight: 600; }

    .totals {
      margin-top: 4px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 13px;
    }
    .total-row.discount { color: #c00; }
    .total-row.grand {
      font-size: 17px;
      font-weight: 700;
      margin-top: 4px;
    }

    .payment-badge {
      display: inline-block;
      background: #111;
      color: #fff;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 11px;
      margin-top: 4px;
    }

    .footer {
      text-align: center;
      font-size: 11px;
      color: #888;
      margin-top: 8px;
      line-height: 1.8;
    }

    .print-btn {
      display: block;
      width: 100%;
      margin: 16px auto 0;
      padding: 10px;
      background: #111;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-family: 'Tajawal', sans-serif;
      cursor: pointer;
    }
    .print-btn:hover { background: #333; }

    @media print {
      .print-btn { display: none; }
      body { width: 100%; padding: 0; }
    }
  </style>
</head>
<body>

  <div class="store-name">${storeName}</div>
  ${phone || address ? `<div class="store-meta">${[phone, address].filter(Boolean).join(' | ')}</div>` : ''}

  <hr class="divider-double">

  <div class="meta-row">
    <span>التاريخ</span>
    <span>${data.date}</span>
  </div>
  <div class="meta-row">
    <span>الوقت</span>
    <span>${data.time}</span>
  </div>
  ${data.customerName ? `<div class="meta-row"><span>الزبون</span><span>${data.customerName}</span></div>` : ''}

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th style="text-align:right">الصنف</th>
        <th style="text-align:center">الكمية</th>
        <th style="text-align:left">المبلغ</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <hr class="divider">

  <div class="totals">
    ${data.discountAmt > 0 ? `
    <div class="total-row">
      <span>المجموع</span>
      <span>${data.subtotal.toLocaleString('ar-DZ')} ${cur}</span>
    </div>
    <div class="total-row discount">
      <span>الخصم</span>
      <span>- ${data.discountAmt.toLocaleString('ar-DZ')} ${cur}</span>
    </div>` : ''}
    <div class="total-row grand">
      <span>الإجمالي</span>
      <span>${data.total.toLocaleString('ar-DZ')} ${cur}</span>
    </div>
  </div>

  <div>
    <span class="payment-badge">${data.paymentType === 'cash' ? '💵 نقداً' : '📋 آجل'}</span>
  </div>

  <hr class="divider-double">

  <div class="footer">
    شكراً لتسوقكم معنا<br>نتمنى لكم يوماً سعيداً
  </div>

  <button class="print-btn" onclick="window.print();">
    🖨️ طباعة الوصل
  </button>

</body>
</html>`;

  /* ─── إغلاق أي overlay سابق ─────────────────────────── */
  const old = document.getElementById('__pos_print_overlay__');
  if (old) old.remove();

  /* ─── إنشاء overlay داخل نفس التطبيق ─────────────────── */
  const overlay = document.createElement('div');
  overlay.id = '__pos_print_overlay__';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'background:#fff', 'overflow-y:auto',
    '-webkit-overflow-scrolling:touch',
  ].join(';');

  /* ─── زر الرجوع (يُخفى عند الطباعة) ──────────────────── */
  const backBtn = document.createElement('button');
  backBtn.textContent = '← رجوع';
  backBtn.style.cssText = [
    'position:fixed', 'top:12px', 'right:16px', 'z-index:100000',
    'background:#111', 'color:#fff', 'border:none',
    'border-radius:8px', 'padding:8px 18px',
    'font-family:Tajawal,sans-serif', 'font-size:14px', 'cursor:pointer',
  ].join(';');
  backBtn.setAttribute('data-no-print', '');
  backBtn.onclick = () => overlay.remove();

  /* ─── iframe يحمل الـ HTML ────────────────────────────── */
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.setAttribute('scrolling', 'yes');

  overlay.appendChild(backBtn);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);

  /* كتابة HTML بعد إضافة الـ iframe للـ DOM */
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
  }
}
