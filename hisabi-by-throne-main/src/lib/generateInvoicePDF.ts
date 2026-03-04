import { Invoice } from './db';

export interface StoreInfo {
  storeName?: string;
  address?: string;
  phone?: string;
  currency?: string;
}

export function generateInvoicePDF(invoice: Invoice, store?: StoreInfo): void {
  const brandName = store?.storeName || 'محلي';
  const cur       = store?.currency  || 'د.ج';

  // Create printable HTML content
  const printContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة ${invoice.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Tajawal', sans-serif;
          background: #fff;
          color: #1a1a2e;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .invoice-header {
          text-align: center;
          border-bottom: 3px solid #1e3a5f;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .brand-name {
          font-size: 32px;
          font-weight: 700;
          color: #1e3a5f;
          margin-bottom: 5px;
        }

        .store-meta {
          font-size: 13px;
          color: #555;
          margin-top: 4px;
        }
        
        .invoice-title {
          font-size: 24px;
          color: #c9a227;
          margin-top: 10px;
        }
        
        .invoice-number {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        
        .invoice-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 20px;
        }
        
        .meta-section {
          flex: 1;
        }
        
        .meta-section h3 {
          font-size: 14px;
          color: #c9a227;
          margin-bottom: 10px;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        .meta-section p {
          font-size: 14px;
          margin: 5px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .items-table th {
          background: #1e3a5f;
          color: white;
          padding: 12px;
          text-align: right;
          font-weight: 500;
        }
        
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        
        .items-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .totals {
          margin-top: 20px;
          text-align: left;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          max-width: 300px;
          margin-left: auto;
        }
        
        .total-row.grand-total {
          border-top: 2px solid #1e3a5f;
          border-bottom: none;
          margin-top: 10px;
          padding-top: 15px;
          font-size: 18px;
          font-weight: 700;
          color: #1e3a5f;
        }
        
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-paid {
          background: #10b981;
          color: white;
        }
        
        .status-pending {
          background: #f59e0b;
          color: white;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 12px;
        }
        
        .qr-section {
          text-align: center;
          margin-top: 30px;
        }
        
        .qr-code {
          width: 100px;
          height: 100px;
          margin: 0 auto;
          border: 1px solid #eee;
          padding: 10px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          @page {
            margin: 20mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="brand-name">${brandName}</div>
        ${store?.address || store?.phone ? `<div class="store-meta">${[store?.address, store?.phone].filter(Boolean).join(' | ')}</div>` : ''}
        <div class="invoice-title">فاتورة</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
      </div>
      
      <div class="invoice-meta">
        <div class="meta-section">
          <h3>معلومات العميل</h3>
          <p><strong>الاسم:</strong> ${invoice.customerName || 'عميل نقدي'}</p>
          <p><strong>طريقة الدفع:</strong> ${invoice.paymentType === 'cash' ? 'نقداً' : 'آجل'}</p>
        </div>
        <div class="meta-section">
          <h3>معلومات الفاتورة</h3>
          <p><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleDateString('ar-DZ')}</p>
          <p><strong>الحالة:</strong> 
            <span class="status-badge ${invoice.status === 'paid' ? 'status-paid' : 'status-pending'}">
              ${invoice.status === 'paid' ? 'مدفوعة' : 'معلقة'}
            </span>
          </p>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>${item.unitPrice.toLocaleString()} ${cur}</td>
              <td>${(item.quantity * item.unitPrice).toLocaleString()} ${cur}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row grand-total">
          <span>المجموع الكلي:</span>
          <span>${invoice.total.toLocaleString()} ${cur}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>شكراً لتعاملكم معنا</p>
        <p style="margin-top: 5px; color: #c9a227;">محلي - Ma7ali</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for fonts to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

export function shareInvoiceWhatsApp(invoice: Invoice, store?: StoreInfo): void {
  const cur = store?.currency || 'د.ج';
  const brandName = store?.storeName || 'محلي';

  const itemsList = invoice.items
    .map((item, i) => `${i + 1}. ${item.productName} × ${item.quantity} = ${(item.quantity * item.unitPrice).toLocaleString()} ${cur}`)
    .join('\n');

  const storeHeader = store?.storeName
    ? `🏪 *${store.storeName}*${store.phone ? `\n📞 ${store.phone}` : ''}${store.address ? `\n📍 ${store.address}` : ''}\n`
    : '';

  const message = `
${storeHeader}📄 *فاتورة ${invoice.invoiceNumber}*
━━━━━━━━━━━━━━━
👤 العميل: ${invoice.customerName || 'عميل نقدي'}
📅 التاريخ: ${new Date(invoice.date).toLocaleDateString('ar-DZ')}
💳 الدفع: ${invoice.paymentType === 'cash' ? 'نقداً' : 'آجل'}
━━━━━━━━━━━━━━━
📦 *المنتجات:*
${itemsList}
━━━━━━━━━━━━━━━
💰 *المجموع: ${invoice.total.toLocaleString()} ${cur}*
${invoice.status === 'paid' ? '✅ مدفوعة' : '⏳ معلقة'}
━━━━━━━━━━━━━━━
_${brandName} - Ma7ali_
  `.trim();

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}
