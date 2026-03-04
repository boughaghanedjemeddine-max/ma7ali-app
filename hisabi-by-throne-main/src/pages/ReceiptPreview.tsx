/**
 * ReceiptPreview.tsx
 * ─────────────────────────────────────────────────────────────────
 * معاينة الوصل الحراري باستخدام بيانات المتجر الحقيقية من الإعدادات.
 * تعرض آخر عملية بيع حقيقية إذا وُجدت، وإلا تستخدم عيّنة توضيحية.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Printer,
  Receipt,
  Store,
  Phone,
  MapPin,
  Tag,
  RefreshCw,
  Settings as SettingsIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { settingsDB, salesDB } from "@/lib/appDB";

/* ══════════════════════════════════════════════════════════════════
   أنواع البيانات
══════════════════════════════════════════════════════════════════ */
type ReceiptMode = "sale" | "invoice";

interface ReceiptData {
  storeName: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  currency: string;
  date: string;
  time?: string;
  invNumber?: string;
  customerName?: string;
  paymentType: "cash" | "credit";
  items: { productName: string; quantity: number; unitPrice: number }[];
  total: number;
  discount?: number;
  isRealSale?: boolean;
}

/* ══════════════════════════════════════════════════════════════════
   عيّنة توضيحية (تُستخدم فقط إذا لا توجد مبيعات حقيقية)
══════════════════════════════════════════════════════════════════ */
const DEMO_ITEMS_CASH = [
  { productName: "قميص رجالي", quantity: 2, unitPrice: 2500 },
  { productName: "بنطلون جينز", quantity: 1, unitPrice: 4800 },
  { productName: "حزام جلدي", quantity: 1, unitPrice: 1200 },
];
const DEMO_ITEMS_CREDIT = [
  { productName: "تلفاز 43 بوصة", quantity: 1, unitPrice: 45_000 },
  { productName: "ستاند تلفاز", quantity: 1, unitPrice: 3_200 },
];

function twoCol(right: string, left: string, total = 32): string {
  const l = left.slice(0, Math.floor(total / 3));
  const r = right.slice(0, total - l.length - 1);
  return r.padEnd(total - l.length, " ") + l;
}

function ThermalReceipt({ data, mode }: { data: ReceiptData; mode: ReceiptMode }) {
  const cols = 32;
  const sep  = "=".repeat(cols);
  const dash = "-".repeat(cols);
  const subtotal = data.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const discount = data.discount ?? 0;
  const payLabel = data.paymentType === "cash" ? "نقدي  ✓" : "آجل (دين)  ⌛";
  const invNum = data.invNumber ?? "INV-0001";

  return (
    <div dir="ltr" className="bg-white text-black w-[280px] mx-auto select-none"
      style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "11.5px", lineHeight: "1.55" }}>
      <div className="px-3 py-4">
        <p className="text-center font-black leading-tight" style={{ fontSize: "18px" }}>{data.storeName}</p>
        {data.ownerName && <p className="text-center text-gray-500" style={{ fontSize: "10px" }}>{data.ownerName}</p>}
        {data.address && <p className="text-center text-gray-500" style={{ fontSize: "10px" }}>{data.address}</p>}
        {data.phone && <p className="text-center text-gray-500" style={{ fontSize: "10px" }}>{data.phone}</p>}
        <p className="text-gray-300 leading-none mt-0.5">{sep}</p>
        {mode === "invoice" && <p className="text-right font-bold text-gray-700" style={{ fontSize: "10px" }}># {invNum}</p>}
        <p className="text-right text-gray-600" style={{ fontSize: "10px" }}>{data.date}{data.time ? `  ${data.time}` : ""}</p>
        {data.customerName && <p className="text-right font-semibold" style={{ fontSize: "10.5px" }}>{data.customerName}</p>}
        <p className="text-gray-300 leading-none">{dash}</p>
        <div>
          {data.items.map((item, i) => {
            const name = item.productName.slice(0, cols - 11);
            const price = `${item.quantity}x${item.unitPrice.toLocaleString()}=${(item.quantity * item.unitPrice).toLocaleString()}`;
            return <p key={i} className="whitespace-pre" style={{ fontSize: "10.5px" }}>{twoCol(name, price, cols)}</p>;
          })}
        </div>
        {discount > 0 && (<>
          <p className="text-gray-300 leading-none">{dash}</p>
          <p className="whitespace-pre text-gray-600" style={{ fontSize: "10.5px" }}>{twoCol("المجموع الفرعي", subtotal.toLocaleString(), cols)}</p>
          <p className="whitespace-pre text-gray-500" style={{ fontSize: "10.5px" }}>{twoCol("خصم", `- ${discount.toLocaleString()}`, cols)}</p>
        </>)}
        <p className="text-gray-300 leading-none">{sep}</p>
        <p className="text-right font-black" style={{ fontSize: "17px" }}>{data.total.toLocaleString()}&nbsp;{data.currency}</p>
        <p className="text-right text-gray-600" style={{ fontSize: "10.5px" }}>{payLabel}</p>
        {mode === "invoice" && <p className="text-right text-gray-500" style={{ fontSize: "10px" }}>{data.paymentType === "cash" ? "مدفوعة ✓" : "معلقة ⌛"}</p>}
        <p className="text-gray-300 leading-none">{dash}</p>
        <p className="text-center mt-1" style={{ fontSize: "10.5px" }}>{mode === "invoice" ? "شكراً لثقتكم بنا" : "شكراً لتسوقكم معنا"}</p>
        <p className="text-center font-bold tracking-widest text-gray-400" style={{ fontSize: "10px" }}>Ma7ali POS</p>
        <div className="mt-3 pt-2 border-t border-dashed border-gray-200" />
        <p className="text-center text-gray-200 tracking-widest" style={{ fontSize: "9px" }}>✂ ─── ─── ─── ─── ─── ───</p>
      </div>
    </div>
  );
}

export default function ReceiptPreview() {
  const [mode, setMode] = useState<ReceiptMode>("sale");
  const [payFilter, setPayFilter] = useState<"cash" | "credit">("cash");
  const navigate = useNavigate();

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsDB.get(),
    staleTime: 0,
  });

  const { data: allSales = [], isLoading: loadingSales, refetch } = useQuery({
    queryKey: ["sales", "receipt-preview"],
    queryFn: () => salesDB.getAll(),
    staleTime: 0,
  });

  const isLoading = loadingSettings || loadingSales;

  const matchedSale = [...allSales]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find(s => s.paymentType === payFilter);

  const storeName = settings?.storeName || "متجري";
  const currency = settings?.currency || "د.ج";
  const nowDate = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  let receiptData: ReceiptData;
  if (matchedSale) {
    receiptData = {
      storeName,
      ownerName: settings?.ownerName || undefined,
      address: settings?.address || undefined,
      phone: settings?.phone || undefined,
      currency,
      date: matchedSale.date,
      time: matchedSale.time,
      customerName: matchedSale.customerName || undefined,
      paymentType: matchedSale.paymentType as "cash" | "credit",
      items: matchedSale.items.map(it => ({ productName: it.productName, quantity: it.quantity, unitPrice: it.unitPrice })),
      total: matchedSale.total,
      discount: matchedSale.discount ?? 0,
      isRealSale: true,
    };
  } else {
    const demoItems = payFilter === "cash" ? DEMO_ITEMS_CASH : DEMO_ITEMS_CREDIT;
    receiptData = {
      storeName,
      ownerName: settings?.ownerName || undefined,
      address: settings?.address || undefined,
      phone: settings?.phone || undefined,
      currency,
      date: nowDate,
      time: nowTime,
      customerName: payFilter === "credit" ? "زبون تجريبي" : undefined,
      paymentType: payFilter,
      items: demoItems,
      total: payFilter === "cash" ? 10_000 : 48_200,
      discount: payFilter === "cash" ? 500 : 0,
      isRealSale: false,
    };
  }

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 safe-top bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">معاينة الوصل الحراري</h1>
            <p className="text-xs text-muted-foreground">بيانات متجرك الفعلية من الإعدادات</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="تحديث">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="إغلاق">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-5 space-y-4">
        {/* Store info card */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Store className="h-4 w-4 text-accent" />
              معلومات المتجر في الوصل
            </h2>
            <Button variant="ghost" size="sm" className="text-accent h-7 px-2 text-xs gap-1" asChild>
              <Link to="/settings">
                <SettingsIcon className="h-3 w-3" />
                تعديل
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Store, label: "اسم المتجر", value: settings?.storeName },
              { icon: Tag, label: "العملة", value: settings?.currency },
              { icon: Phone, label: "الهاتف", value: settings?.phone },
              { icon: MapPin, label: "العنوان", value: settings?.address },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 min-w-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
                  <p className={cn("font-semibold text-xs truncate", !value && "text-muted-foreground/50 font-normal")}>
                    {value || "غير محدد"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {(!settings?.phone || !settings?.address) && (
            <p className="text-[11px] text-warning flex items-center gap-1.5 bg-warning/10 rounded-lg px-3 py-2">
              ⚠ أضف الهاتف والعنوان في الإعدادات لتظهر على الوصل
            </p>
          )}
        </div>

        {/* Mode toggles */}
        <div className="flex gap-2">
          {(["sale", "invoice"] as ReceiptMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all",
                mode === m ? "bg-accent/15 border-accent text-accent" : "bg-card border-border text-muted-foreground"
              )}>
              {m === "sale" ? <><Printer className="h-4 w-4" />وصل بيع</> : <><Receipt className="h-4 w-4" />فاتورة</>}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(["cash", "credit"] as const).map(p => (
            <button key={p} onClick={() => setPayFilter(p)}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                payFilter === p
                  ? (p === "cash" ? "bg-success/15 border-success text-success" : "bg-warning/15 border-warning text-warning")
                  : "bg-card border-border text-muted-foreground"
              )}>
              {p === "cash" ? "نقدي" : "آجل (دين)"}
            </button>
          ))}
        </div>

        {/* Data source badge */}
        {receiptData.isRealSale ? (
          <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-xl px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <p className="text-xs text-success font-medium">
              يعرض آخر عملية بيع {payFilter === "cash" ? "نقدية" : "آجلة"} حقيقية من سجلّك
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5">
            <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              لا توجد مبيعات {payFilter === "cash" ? "نقدية" : "آجلة"} بعد — عيّنة توضيحية مع بيانات متجرك
            </p>
          </div>
        )}

        {/* Receipt */}
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/8"
          style={{ background: "linear-gradient(180deg, #fafafa 0%, #eeede9 100%)" }}>
          <div className="h-2.5 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300" />
          <ThermalReceipt data={receiptData} mode={mode} />
          <div className="h-4 bg-gradient-to-b from-transparent to-gray-300" />
        </div>

        {/* Legend */}
        <div className="glass-card p-4 space-y-2.5">
          <h3 className="font-semibold text-sm">مكوّنات الوصل</h3>
          {[
            { color: "bg-blue-500", label: "ترويسة المتجر", desc: "الاسم + صاحب المحل + العنوان + الهاتف" },
            { color: "bg-accent", label: "بيانات العملية", desc: "التاريخ + الوقت + اسم الزبون" },
            { color: "bg-success", label: "الأصناف", desc: "المنتج × الكمية = المبلغ الجزئي" },
            { color: "bg-warning", label: "الإجمالي", desc: "المبلغ الكلي + طريقة الدفع + الخصم" },
            { color: "bg-gray-400", label: "التذييل", desc: "رسالة الشكر + Ma7ali POS + خط القص" },
          ].map(i => (
            <div key={i.label} className="flex items-start gap-2.5">
              <span className={cn("w-2.5 h-2.5 rounded-full mt-0.5 shrink-0", i.color)} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <b className="text-foreground">{i.label}</b> — {i.desc}
              </p>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full gap-2" asChild>
          <Link to="/printer">
            <Printer className="h-4 w-4" />
            إعداد الطابعة الحرارية عبر Bluetooth
          </Link>
        </Button>
      </main>
    </div>
  );
}
