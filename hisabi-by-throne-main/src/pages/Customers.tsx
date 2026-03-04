import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  ArrowLeft,
  Phone,
  CreditCard,
  Banknote,
  History,
  Trash2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getCurrentDate } from "@/lib/appDB";
import type { Customer, CustomerPayment } from "@/lib/appDB";
import {
  useCustomers,
  useCustomerTotals,
  useCustomerPayments,
  useAddCustomer,
  useDeleteCustomer,
  useAddCustomerPayment,
  useDeleteCustomerPayment,
} from "@/hooks/useCustomers";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [paymentType, setPaymentType] = useState<"debt" | "payment" | null>(null);

  // Add customer form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Payment form
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const { data: customers = [], isLoading } = useCustomers();
  const { data: totals } = useCustomerTotals();
  const { data: payments = [] } = useCustomerPayments(selectedId || "");

  const addCustomer = useAddCustomer();
  const deleteCustomer = useDeleteCustomer();
  const addPayment = useAddCustomerPayment();
  const deletePayment = useDeleteCustomerPayment();

  // Always use fresh data from the query cache
  const selectedCustomer = selectedId
    ? customers.find((c) => c.id === selectedId) ?? null
    : null;

  const filtered = customers.filter(
    (c) => c.name.includes(search) || (c.phone || "").includes(search)
  );

  const resetAddForm = () => {
    setNewName("");
    setNewPhone("");
    setNewAddress("");
    setNewNotes("");
  };

  const handleAddCustomer = async () => {
    if (!newName.trim()) return;
    await addCustomer.mutateAsync({
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      address: newAddress.trim() || undefined,
      notes: newNotes.trim() || undefined,
    });
    resetAddForm();
    setShowAddCustomer(false);
  };

  const handleAddPayment = async () => {
    if (!paymentType || !selectedId) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    await addPayment.mutateAsync({
      customerId: selectedId,
      type: paymentType,
      amount: num,
      description: description.trim() || undefined,
      date: getCurrentDate(),
    });
    setAmount("");
    setDescription("");
    setPaymentType(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-xl font-bold">سجل العملاء</h1>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="gap-2"
              onClick={() => setShowAddCustomer(true)}
            >
              <UserPlus className="h-4 w-4" />
              عميل جديد
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Totals card */}
        {totals && totals.debtorsCount > 0 && (
          <div className="glass-card p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الديون المستحقة</p>
                <p className="text-2xl font-bold text-destructive mt-1">
                  {totals.totalDebt.toLocaleString()} د.ج
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">عدد المدينين</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totals.debtorsCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Customer list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 glass-card animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">
                {search ? "لا توجد نتائج" : "لا يوجد عملاء بعد"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? "جرب بحثاً آخر"
                  : "أضف عميلاً لتتبع الديون والمدفوعات تلقائياً"}
              </p>
            </div>
            {!search && (
              <Button
                variant="primary"
                className="gap-2"
                onClick={() => setShowAddCustomer(true)}
              >
                <Plus className="h-4 w-4" />
                إضافة أول عميل
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((customer) => (
              <button
                key={customer.id}
                className="w-full glass-card p-4 text-right transition-all active:scale-[0.98] hover:border-accent/40"
                onClick={() => setSelectedId(customer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      customer.balance > 0
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-success/10 text-success border-success/30"
                    )}
                  >
                    {customer.balance > 0
                      ? `${customer.balance.toLocaleString()} د.ج`
                      : "✓ مسدَّد"}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ── Customer Detail Sheet ─────────────────────────────────────────────── */}
      <Sheet
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[88vh] overflow-y-auto">
          {selectedCustomer && (
            <div className="pb-6">
              <SheetHeader className="pb-4 border-b border-border/50">
                <div className="flex items-start justify-between">
                  <SheetTitle className="text-xl">{selectedCustomer.name}</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 -mt-1"
                    onClick={async () => {
                      await deleteCustomer.mutateAsync(selectedCustomer.id);
                      setSelectedId(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {selectedCustomer.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedCustomer.phone}
                  </p>
                )}
                {selectedCustomer.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedCustomer.notes}</p>
                )}
              </SheetHeader>

              {/* Balance display */}
              <div
                className={cn(
                  "my-4 p-4 rounded-2xl border text-center",
                  selectedCustomer.balance > 0
                    ? "bg-destructive/10 border-destructive/20"
                    : "bg-success/10 border-success/20"
                )}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  الرصيد الحالي
                </p>
                <p
                  className={cn(
                    "text-4xl font-bold mt-2",
                    selectedCustomer.balance > 0 ? "text-destructive" : "text-success"
                  )}
                >
                  {selectedCustomer.balance.toLocaleString()}
                  <span className="text-lg mr-1 font-normal">د.ج</span>
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {selectedCustomer.balance > 0 ? "مستحق التسديد" : "لا توجد ديون مستحقة"}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <Button
                  variant="outline"
                  className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setPaymentType("debt")}
                >
                  <CreditCard className="h-4 w-4" />
                  تسجيل دين
                </Button>
                <Button
                  variant="primary"
                  className="gap-2"
                  onClick={() => setPaymentType("payment")}
                  disabled={selectedCustomer.balance <= 0}
                >
                  <Banknote className="h-4 w-4" />
                  تسجيل دفعة
                </Button>
              </div>

              {/* Payment history */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
                  <History className="h-4 w-4" />
                  سجل المعاملات
                </h3>

                {payments.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">لا توجد معاملات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p: CustomerPayment) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/40"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                              p.type === "debt"
                                ? "bg-destructive/10"
                                : "bg-success/10"
                            )}
                          >
                            {p.type === "debt" ? (
                              <CreditCard className="h-4 w-4 text-destructive" />
                            ) : (
                              <Banknote className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {p.type === "debt" ? "دين جديد" : "دفعة"}
                            </p>
                            {p.description && (
                              <p className="text-xs text-muted-foreground">{p.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">{p.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-bold text-sm",
                              p.type === "debt" ? "text-destructive" : "text-success"
                            )}
                          >
                            {p.type === "debt" ? "+" : "-"}
                            {p.amount.toLocaleString()} د.ج
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deletePayment.mutateAsync(p.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Add Customer Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>الاسم *</Label>
              <Input
                placeholder="اسم العميل"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomer()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input
                placeholder="0XXX XXX XXX"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input
                placeholder="العنوان (اختياري)"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input
                placeholder="أي ملاحظات..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              className="w-full mt-2"
              onClick={handleAddCustomer}
              disabled={addCustomer.isPending || !newName.trim()}
            >
              {addCustomer.isPending ? "جاري الإضافة..." : "إضافة العميل"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Payment / Debt Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={!!paymentType}
        onOpenChange={(open) => !open && setPaymentType(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {paymentType === "debt" ? "تسجيل دين جديد" : "تسجيل دفعة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>المبلغ *</Label>
              <Input
                placeholder="0"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input
                placeholder={
                  paymentType === "debt" ? "وصف البضاعة أو السبب..." : "سبب الدفع..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              className={cn(
                "w-full mt-2",
                paymentType === "debt" &&
                  "bg-destructive hover:bg-destructive/90 border-destructive"
              )}
              onClick={handleAddPayment}
              disabled={addPayment.isPending || !amount}
            >
              {addPayment.isPending
                ? "جاري الحفظ..."
                : paymentType === "debt"
                ? "تسجيل الدين"
                : "تسجيل الدفعة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
