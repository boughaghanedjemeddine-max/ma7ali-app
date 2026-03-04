import { getDB, settingsDB, Product, Sale, Expense } from './db';

// Types
interface AdvisorConfig {
  slowDays?: number; // days threshold for slow products
  marginThreshold?: number; // %
}

export interface ShopHealthScore {
  score: number;
  details: {
    profit: number;
    expenses: number;
    inventoryTurnover: number;
    rentRatio: number;
  };
}

export async function getSlowProducts(config: AdvisorConfig = {}) {
  const slowDays = config.slowDays ?? 14;
  const db = await getDB();
  const products: Product[] = await db.getAll('products');
  const sales: Sale[] = await db.getAll('sales');
  const now = new Date();
  const lastSold: Record<string, Date | null> = {};
  for (const sale of sales) {
    for (const item of sale.items) {
      const prev = lastSold[item.productId];
      const saleDate = new Date(sale.date);
      if (!prev || saleDate > prev) lastSold[item.productId] = saleDate;
    }
  }
  return products.filter(p => {
    const last = lastSold[p.id];
    if (!last) return true;
    const diff = (now.getTime() - last.getTime()) / (1000 * 3600 * 24);
    return diff >= slowDays;
  });

}

export async function getLossProducts() {
  const db = await getDB();
  const products: Product[] = await db.getAll('products');
  return products.filter(p => p.salePrice < p.costPerUnit);
}


export async function getLowMarginProducts(config: AdvisorConfig = {}) {
  const marginThreshold = config.marginThreshold ?? 10;
  const db = await getDB();
  const products: Product[] = await db.getAll('products');
  return products.filter(p => {
    const margin = p.salePrice > 0 ? ((p.salePrice - p.costPerUnit) / p.salePrice) * 100 : 0;
    return margin < marginThreshold;
  });
}


export async function getFastSellers(topN = 5) {
  const db = await getDB();
  const products: Product[] = await db.getAll('products');
  const sales: Sale[] = await db.getAll('sales');
  const salesCount: Record<string, number> = {};
  for (const sale of sales) {
    for (const item of sale.items) {
      salesCount[item.productId] = (salesCount[item.productId] || 0) + item.quantity;
    }
  }
  return products
    .map(p => ({ ...p, sold: salesCount[p.id] || 0 }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, topN);
}


export function getSuggestedPrice(costPerUnit: number, marginPercent: number) {
  return Math.round(costPerUnit * (1 + marginPercent / 100));
}


export async function getShopHealthScore() {
  const db = await getDB();
  const [products, sales, expenses, settings] = await Promise.all([
    db.getAll('products'),
    db.getAll('sales'),
    db.getAll('expenses'),
    settingsDB.get(),
  ]);
  // Profit
  const totalProfit = sales.reduce((acc, s) => acc + s.totalProfit, 0);
  // Expenses
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  // Inventory Turnover: sales quantity / avg inventory
  const totalSold = sales.reduce((acc, s) => acc + s.items.reduce((a, i) => a + i.quantity, 0), 0);
  const avgInventory = products.reduce((acc, p) => acc + p.quantity, 0) / (products.length || 1);
  const inventoryTurnover = avgInventory > 0 ? totalSold / avgInventory : 0;
  // Rent Ratio
  const rentExpense = expenses.find(e => e.category.toLowerCase().includes('rent'))?.amount || 0;
  const rentRatio = totalProfit > 0 ? rentExpense / totalProfit : 0;
  // Score (simple weighted sum)
  let score = 100;
  if (totalProfit <= 0) score -= 40;
  if (inventoryTurnover < 1) score -= 20;
  if (rentRatio > 0.3) score -= 20;
  if (totalExpenses > totalProfit) score -= 20;
  score = Math.max(0, Math.min(100, score));
  return {
    score,
    details: {
      profit: totalProfit,
      expenses: totalExpenses,
      inventoryTurnover,
      rentRatio,
    },
  };
}


export async function getSmartSuggestions(config: AdvisorConfig = {}) {
  const [slow, loss, lowMargin, fast, health] = await Promise.all([
    getSlowProducts(config),
    getLossProducts(),
    getLowMarginProducts(config),
    getFastSellers(),
    getShopHealthScore(),
  ]);
  const suggestions: string[] = [];
  for (const p of slow) {
    suggestions.push(`منتج «${p.name}» لم يُباع منذ فترة. فكّر في تخفيض سعره بنسبة 10%.`);
  }
  for (const p of loss) {
    suggestions.push(`منتج «${p.name}» يُباع بخسارة. راجع سعر البيع فوراً.`);
  }
  for (const p of lowMargin) {
    suggestions.push(`هامش ربح «${p.name}» ضعيف. فكّر في رفع سعره.`);
  }
  if (health.details.rentRatio > 0.3) {
    suggestions.push(`إيجار المحل يستهلك ${(health.details.rentRatio * 100).toFixed(1)}% من الربح. حاول تخفيض التكاليف الثابتة.`);
  }
  if (health.details.inventoryTurnover < 1) {
    suggestions.push('دوران المخزون بطيء. فكّر في عروض ترويجية لتسريع المبيعات.');
  }
  if (health.details.profit < health.details.expenses) {
    suggestions.push('المصاريف تتجاوز الربح. راجع هيكل التكاليف وأسعار البيع.');
  }
  if (suggestions.length === 0) {
    suggestions.push('متجرك بخير! استمر هكذا.');
  }
  return suggestions;
}
