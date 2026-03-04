/**
 * generateMonthlySummaryPDF.ts
 * Generates a printable monthly financial summary PDF.
 */

import type { Sale, Expense } from './db';

interface SummaryInput {
  sales: Sale[];
  expenses: Expense[];
  period: string;
  storeName?: string;
  currency?: string;
}

export function generateMonthlySummaryPDF({ sales, expenses, period, storeName = 'المحل', currency = 'د.ج' }: SummaryInput) {
  const fmt = (n: number) => `${Math.round(n).toLocaleString('ar')} ${currency}`;

  const totalSales   = sales.reduce((a, s) => a + s.total, 0);
  const totalProfit  = sales.reduce((a, s) => a + s.totalProfit, 0);
  const totalCost    = totalSales - totalProfit;
  const totalExp     = expenses.reduce((a, e) => a + e.amount, 0);
  const shopExp      = expenses.filter(e => e.type === 'shop').reduce((a, e) => a + e.amount, 0);
  const personalExp  = expenses.filter(e => e.type === 'personal').reduce((a, e) => a + e.amount, 0);
  const netProfit    = totalProfit - totalExp;
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0';

  const periodLabel: Record<string, string> = {
    today: 'اليوم',
    week:  'الأسبوع',
    month: 'الشهر',
    all:   'كامل التاريخ',
  };

  // Group expenses by category
  const expByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.category || (e.type === 'shop' ? 'مصاريف المحل' : 'مصاريف شخصية');
    expByCategory[cat] = (expByCategory[cat] || 0) + e.amount;
  });
  const expRows = Object.entries(expByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `<tr><td>${cat}</td><td class="num">${fmt(amt)}</td></tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>خلاصة مالية - ${storeName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', sans-serif; background: #fff; color: #1a1a2e; padding: 24px; max-width: 700px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 28px; font-weight: 900; color: #1e3a5f; }
    .subtitle { font-size: 14px; color: #888; margin-top: 4px; }
    .badge { display: inline-block; background: #c9a227; color: #fff; font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 20px; margin-top: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
    .card .label { font-size: 11px; color: #888; margin-bottom: 4px; }
    .card .value { font-size: 20px; font-weight: 700; }
    .card.accent { border-color: #c9a227; background: #fffbf0; }
    .card.accent .value { color: #c9a227; }
    .card.profit .value { color: #16a34a; }
    .card.loss   .value { color: #dc2626; }
    .section-title { font-size: 14px; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; border-right: 3px solid #c9a227; padding-right: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: right; }
    td { padding: 7px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .num { font-weight: 700; }
    .green { color: #16a34a; font-weight: 700; }
    .red   { color: #dc2626; font-weight: 700; }
    .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">${storeName}</div>
    <div class="subtitle">الخلاصة المالية · فترة: ${periodLabel[period] ?? period}</div>
    <span class="badge">نسخة Pro</span>
  </div>

  <div class="grid">
    <div class="card"><div class="label">إجمالي المبيعات</div><div class="value">${fmt(totalSales)}</div></div>
    <div class="card profit"><div class="label">الربح الإجمالي</div><div class="value">${fmt(totalProfit)}</div></div>
    <div class="card ${netProfit >= 0 ? 'accent' : 'loss'}"><div class="label">الربح الصافي</div><div class="value">${fmt(netProfit)}</div></div>
    <div class="card"><div class="label">إجمالي المصاريف</div><div class="value">${fmt(totalExp)}</div></div>
    <div class="card"><div class="label">تكلفة البضاعة</div><div class="value">${fmt(totalCost)}</div></div>
    <div class="card"><div class="label">هامش الربح</div><div class="value">${profitMargin}%</div></div>
  </div>

  <div class="section-title">ملخص المصاريف</div>
  <table>
    <thead><tr><th>التصنيف</th><th>المبلغ</th></tr></thead>
    <tbody>
      <tr><td>مصاريف المحل</td><td class="num">${fmt(shopExp)}</td></tr>
      <tr><td>مصاريف شخصية</td><td class="num">${fmt(personalExp)}</td></tr>
      ${expRows}
    </tbody>
  </table>

  <div class="section-title">ملخص المبيعات (آخر ${Math.min(sales.length, 10)} عمليات)</div>
  <table>
    <thead><tr><th>التاريخ</th><th>الإجمالي</th><th>الربح</th><th>الدفع</th></tr></thead>
    <tbody>
      ${sales.slice(-10).map(s => `<tr>
        <td>${s.date}</td>
        <td class="num">${fmt(s.total)}</td>
        <td class="num ${s.totalProfit >= 0 ? 'green' : 'red'}">${fmt(s.totalProfit)}</td>
        <td>${s.paymentType === 'cash' ? 'نقدي' : 'آجل'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    صدر بواسطة تطبيق محلي · ${new Date().toLocaleDateString('ar-DZ')} · نسخة Pro
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 600);
}
