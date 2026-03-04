import { useState } from "react";
import {
  Truck, Plus, Phone, Trash2, DollarSign, ShoppingBag,
  ArrowLeft, Search, TrendingUp, TrendingDown, ChevronDown, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSuppliers, useAddSupplier, useDeleteSupplier,
  useAddSupplierTransaction, useSupplierTransactions, useDeleteSupplierTransaction,
} from "@/hooks/useSuppliers";
import { Supplier, SupplierTransaction } from "@/lib/appDB";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

function SupplierHistory({ supplier }: { supplier: Supplier }) {
  const { data: txs = [] } = useSupplierTransactions(supplier.id);
  const { fmt } = useCurrency();
  const deleteTransaction = useDeleteSupplierTransaction();

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto">
      {txs.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">لا توجد معاملات</p>
      )}
      {txs.map(tx => (
        <div key={tx.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            tx.type === 'purchase' ? "bg-destructive/10" : "bg-success/10"
          )}>
            {tx.type === 'purchase'
              ? <ShoppingBag className="w-4 h-4 text-destructive" />
              : <DollarSign className="w-4 h-4 text-success" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {tx.type === 'purchase' ? 'شراء' : 'دفع'}
            </p>
            {tx.description && (
              <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{tx.date}</p>
          </div>
          <span className={cn(
            "font-bold text-sm",
            tx.type === 'purchase' ? "text-destructive" : "text-success"
          )}>
            {tx.type === 'purchase' ? '+' : '-'}{fmt(tx.amount)}
          </span>
          <Button
            variant="ghost" size="icon-sm"
            className="text-muted-foreground shrink-0"
            onClick={() => deleteTransaction.mutate(tx.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [txSheet, setTxSheet] = useState<{ open: boolean; supplier: Supplier | null; type: 'purchase' | 'payment' }>({
    open: false, supplier: null, type: 'purchase',
  });
  const [historySheet, setHistorySheet] = useState<{ open: boolean; supplier: Supplier | null }>({
    open: false, supplier: null,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [txForm, setTxForm] = useState({ amount: "", description: "", date: new Date().toISOString().split('T')[0] });

  const { data: suppliers = [], isLoading } = useSuppliers();
  const addSupplier          = useAddSupplier();
  const deleteSupplier       = useDeleteSupplier();
  const addTransaction       = useAddSupplierTransaction();
  const { fmt }              = useCurrency();
  const { confirm: confirmDlg, ConfirmDialog } = useConfirmDialog();

  const filtered = suppliers
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.balance - a.balance);

  const totalOwed     = suppliers.reduce((acc, s) => acc + s.balance, 0);
  const totalPaid     = suppliers.reduce((acc, s) => acc + s.totalPaid, 0);
  const totalPurchases = suppliers.reduce((acc, s) => acc + s.totalPurchases, 0);

  const handleAddSupplier = () => {
    if (!addForm.name.trim()) { toast.error("اسم المورد مطلوب"); return; }
    addSupplier.mutate({ name: addForm.name, phone: addForm.phone || undefined, address: addForm.address || undefined, notes: addForm.notes || undefined }, {
      onSuccess: () => { setIsAddOpen(false); setAddForm({ name: "", phone: "", address: "", notes: "" }); },
    });
  };

  const handleAddTransaction = () => {
    if (!txSheet.supplier || !txForm.amount) return;
    addTransaction.mutate({
      supplierId:  txSheet.supplier.id,
      type:        txSheet.type,
      amount:      parseFloat(txForm.amount),
      description: txForm.description || undefined,
      date:        txForm.date,
    }, {
      onSuccess: () => { setTxSheet(prev => ({ ...prev, open: false })); setTxForm({ amount: "", description: "", date: new Date().toISOString().split('T')[0] }); },
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDlg("حذف المورد وكل معاملاته؟", { variant: 'destructive', title: 'حذف المورد', confirmLabel: 'حذف' });
    if (ok) deleteSupplier.mutate(id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">الموردون</h1>
                <p className="text-xs text-muted-foreground">{suppliers.length} مورد • مستحق {fmt(totalOwed)}</p>
              </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" size="icon"><Plus className="h-5 w-5" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-[92%] rounded-2xl">
                <DialogHeader><DialogTitle>مورد جديد</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>اسم المورد *</Label>
                    <Input placeholder="مثال: شركة الأطلس" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input type="tel" placeholder="0555123456" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input placeholder="عنوان المورد" value={addForm.address} onChange={e => setAddForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>ملاحظات</Label>
                    <Input placeholder="ملاحظات اختيارية" value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <Button variant="gold" className="w-full" onClick={handleAddSupplier} disabled={!addForm.name || addSupplier.isPending}>
                    {addSupplier.isPending ? "جاري الإضافة..." : "إضافة المورد"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-4 py-3 bg-card/50 border-b border-border/30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">مستحق</p>
            <p className="font-bold text-destructive text-sm">{fmt(totalOwed)}</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الشراء</p>
            <p className="font-bold text-primary text-sm">{fmt(totalPurchases)}</p>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">مدفوع</p>
            <p className="font-bold text-success text-sm">{fmt(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث عن مورد..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
        </div>
      </div>

      {/* List */}
      <main className="px-4 space-y-3">
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Truck className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد موردون</p>
            <p className="text-xs text-muted-foreground mt-1">أضف أول مورد بالضغط على +</p>
          </div>
        )}

        {filtered.map(supplier => {
          const paymentRatio = supplier.totalPurchases > 0
            ? (supplier.totalPaid / supplier.totalPurchases) * 100
            : 0;
          const expanded = expandedId === supplier.id;

          return (
            <div key={supplier.id} className="glass-card overflow-hidden">
              {/* Top Row */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{supplier.name}</p>
                        {supplier.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />{supplier.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <p className={cn("font-bold text-lg", supplier.balance > 0 ? "text-destructive" : "text-success")}>
                      {fmt(supplier.balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">مستحق</p>
                  </div>
                </div>

                {/* Progress bar */}
                {supplier.totalPurchases > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>مدفوع {Math.round(paymentRatio)}%</span>
                      <span>شراء {fmt(supplier.totalPurchases)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${Math.min(100, paymentRatio)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                  <Button
                    variant="outline" size="sm" className="flex-1 gap-1 text-destructive border-destructive/30"
                    onClick={() => { setTxSheet({ open: true, supplier, type: 'purchase' }); setTxForm({ amount: "", description: "", date: new Date().toISOString().split('T')[0] }); }}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> شراء
                  </Button>
                  {supplier.balance > 0 && (
                    <Button
                      variant="outline" size="sm" className="flex-1 gap-1 text-success border-success/30"
                      onClick={() => { setTxSheet({ open: true, supplier, type: 'payment' }); setTxForm({ amount: "", description: "", date: new Date().toISOString().split('T')[0] }); }}
                    >
                      <DollarSign className="w-3.5 h-3.5" /> دفع
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="sm" className="gap-1"
                    onClick={() => setExpandedId(expanded ? null : supplier.id)}
                  >
                    {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    السجل
                  </Button>
                  <Button
                    variant="ghost" size="icon-sm" className="text-destructive"
                    onClick={() => handleDelete(supplier.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expandable History */}
              {expanded && (
                <div className="border-t border-border/30 p-4">
                  <SupplierHistory supplier={supplier} />
                </div>
              )}
            </div>
          );
        })}
      </main>
      <ConfirmDialog />

      {/* Transaction Sheet */}
      <Sheet open={txSheet.open} onOpenChange={v => setTxSheet(p => ({ ...p, open: v }))}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
          <SheetHeader>
            <SheetTitle>
              {txSheet.type === 'purchase' ? '🛒 تسجيل شراء' : '💰 تسجيل دفع'}
              {txSheet.supplier && ` — ${txSheet.supplier.name}`}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>المبلغ *</Label>
              <Input
                type="number" placeholder="0"
                value={txForm.amount}
                onChange={e => setTxForm(p => ({ ...p, amount: e.target.value }))}
                className="text-2xl font-bold h-14"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input
                placeholder={txSheet.type === 'purchase' ? "مثال: قميص × 50" : "مثال: تسديد جزء من الدين"}
                value={txForm.description}
                onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date" value={txForm.date}
                onChange={e => setTxForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
            <Button
              variant={txSheet.type === 'purchase' ? "destructive" : "primary"}
              className="w-full h-12 text-base font-bold"
              disabled={!txForm.amount || parseFloat(txForm.amount) <= 0 || addTransaction.isPending}
              onClick={handleAddTransaction}
            >
              {txSheet.type === 'purchase' ? 'تأكيد الشراء' : 'تأكيد الدفع'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
