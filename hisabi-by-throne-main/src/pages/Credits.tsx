import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Users,
  Truck,
  Trash2,
  Check,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCredits, useAddCredit, useUpdateCredit, useDeleteCredit } from "@/hooks/useCredits";
import { Credit } from "@/lib/appDB";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonList, SkeletonListItem } from "@/components/SkeletonCards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Credits() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"customer" | "supplier">("customer");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [partialDialog, setPartialDialog] = useState<{ open: boolean; credit: Credit | null; amount: string }>({
    open: false, credit: null, amount: "",
  });
  const [formData, setFormData] = useState({
    name: "", phone: "", amount: "", description: "", dueDate: "",
  });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    credit: Credit | null;
    data: { name: string; phone: string; amount: string; dueDate: string; description: string };
  }>({ open: false, credit: null, data: { name: "", phone: "", amount: "", dueDate: "", description: "" } });

  const { data: credits = [], isLoading } = useCredits();
  const addCredit     = useAddCredit();

  // Overdue detection: fire a toast once per session when overdue credits exist.
  // Using a ref prevents the toast from re-firing on every navigation to this page.
  const overdueToastShown = useRef(false);
  const overdueCount = credits.filter(c =>
    c.status !== 'paid' && c.dueDate && new Date(c.dueDate) < new Date()
  ).length;

  useEffect(() => {
    if (overdueCount > 0 && !overdueToastShown.current) {
      overdueToastShown.current = true;
      toast.warning(t('credits.overdueAlert', { count: overdueCount }), {
        duration: 5000,
        icon: '⚠️',
      });
    }
  }, [overdueCount]);
  const updateCredit  = useUpdateCredit();
  const deleteCredit  = useDeleteCredit();
  const { fmt }       = useCurrency();
  const { confirm: confirmDlg, ConfirmDialog } = useConfirmDialog();

  const filteredCredits = credits
    .filter(c => c.type === activeTab)
    .sort((a, b) => {
      if (a.status === 'paid' && b.status !== 'paid') return 1;
      if (a.status !== 'paid' && b.status === 'paid') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPending = filteredCredits
    .filter(c => c.status !== 'paid')
    .reduce((acc, c) => acc + (c.amount - c.paidAmount), 0);

  const handleSubmit = () => {
    if (!formData.name || !formData.amount) return;
    addCredit.mutate({
      type: activeTab,
      name: formData.name,
      phone: formData.phone || undefined,
      amount: parseFloat(formData.amount),
      paidAmount: 0,
      status: 'pending',
      dueDate: formData.dueDate || undefined,
      description: formData.description || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ name: "", phone: "", amount: "", description: "", dueDate: "" });
      }
    });
  };

  const handleMarkPaid = (credit: Credit) => {
    updateCredit.mutate({ id: credit.id, updates: { paidAmount: credit.amount, status: 'paid' } });
  };

  const handlePartialPay = () => {
    const c = partialDialog.credit;
    if (!c) return;
    const added = parseFloat(partialDialog.amount) || 0;
    if (added <= 0) return;
    const newPaid = Math.min(c.paidAmount + added, c.amount);
    const newStatus: Credit['status'] = newPaid >= c.amount ? 'paid' : 'partial';
    updateCredit.mutate({ id: c.id, updates: { paidAmount: newPaid, status: newStatus } });
    setPartialDialog({ open: false, credit: null, amount: "" });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDlg(t('credits.deleteConfirm'), { variant: 'destructive', title: t('credits.deleteTitle'), confirmLabel: t('common.delete') });
    if (ok) deleteCredit.mutate(id);
  };

  const handleEditSubmit = () => {
    const c = editDialog.credit;
    if (!c || !editDialog.data.name || !editDialog.data.amount) return;
    updateCredit.mutate({
      id: c.id,
      updates: {
        name: editDialog.data.name,
        phone: editDialog.data.phone || undefined,
        amount: parseFloat(editDialog.data.amount),
        dueDate: editDialog.data.dueDate || undefined,
        description: editDialog.data.description || undefined,
      },
    });
    setEditDialog({ open: false, credit: null, data: { name: "", phone: "", amount: "", dueDate: "", description: "" } });
  };

  const getStatusBadge = (status: Credit['status']) => {
    switch (status) {
      case 'paid':
        return <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-full">{t('credits.paid')}</span>;
      case 'partial':
        return <span className="bg-warning/10 text-warning text-xs px-2 py-1 rounded-full">{t('credits.partial')}</span>;
      default:
        return <span className="bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full">{t('credits.pending')}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('credits.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('credits.subtitle', { count: filteredCredits.filter(c => c.status !== 'paid').length, total: fmt(totalPending) })}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90%] rounded-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {activeTab === "customer" ? t('credits.addCreditCustomer') : t('credits.addCreditSupplier')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('credits.name')} *</Label>
                    <Input
                      id="name"
                      placeholder={activeTab === "customer" ? t('credits.namePlaceholder') : t('credits.namePlaceholderSupplier')}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('credits.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0555123456"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('credits.amount')} *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('credits.description')}</Label>
                    <Input
                      id="description"
                      placeholder={t('credits.descPlaceholder')}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">{t('credits.dueDate')}</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <Button 
                    variant="gold" 
                    className="w-full" 
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.amount || addCredit.isPending}
                  >
                    {addCredit.isPending ? t('credits.adding') : t('credits.addBtn')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setActiveTab("customer")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
              activeTab === "customer"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            {t('credits.tabCustomer')}
          </button>
          <button
            onClick={() => setActiveTab("supplier")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
              activeTab === "supplier"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Truck className="h-4 w-4" />
            {t('credits.tabSupplier')}
          </button>
        </div>

        {/* Credits List */}
        <div className="space-y-3">
          {isLoading ? (
            <SkeletonList Component={SkeletonListItem} count={5} />
          ) : filteredCredits.length > 0 ? (
            filteredCredits.map((credit) => (
              <div
                key={credit.id}
                className={cn(
                  "bg-card border rounded-2xl p-4 transition-all",
                  credit.status === 'paid' && "opacity-60 border-border/50",
                  credit.status !== 'paid' && credit.dueDate && new Date(credit.dueDate) < new Date()
                    ? "border-destructive/50 bg-destructive/5"
                    : credit.status !== 'paid' ? "border-border/50" : ""
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{credit.name}</span>
                      {getStatusBadge(credit.status)}
                      {credit.status !== 'paid' && credit.dueDate && new Date(credit.dueDate) < new Date() && (
                        <span className="flex items-center gap-1 bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {t('credits.overdueDays', { days: Math.ceil((new Date().getTime() - new Date(credit.dueDate).getTime()) / 86400000) })}
                        </span>
                      )}
                    </div>
                    {credit.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {credit.phone}
                      </p>
                    )}
                    {credit.description && (
                      <p className="text-sm text-muted-foreground mt-1">{credit.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">
                      {fmt(credit.amount)}
                    </p>
                    {credit.paidAmount > 0 && credit.paidAmount < credit.amount && (
                      <p className="text-xs text-success">
                        {t('credits.paidOf', { paid: fmt(credit.paidAmount), total: fmt(credit.amount) })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  {credit.dueDate && (
                    <p className={cn(
                      "text-xs flex items-center gap-1",
                      credit.status !== 'paid' && new Date(credit.dueDate) < new Date()
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    )}>
                      <Calendar className="h-3 w-3" />
                      {t('credits.dueDate')}: {credit.dueDate}
                    </p>
                  )}
                  {!credit.dueDate && <span />}
                  
                  <div className="flex gap-1">
                    {credit.status !== 'paid' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={t('credits.partialPay')}
                          onClick={() => setPartialDialog({ open: true, credit, amount: "" })}
                          className="text-warning"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={t('credits.markPaid')}
                          onClick={() => handleMarkPaid(credit)}
                          className="text-success"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title={t('common.edit')}
                      onClick={() => setEditDialog({
                        open: true,
                        credit,
                        data: {
                          name: credit.name,
                          phone: credit.phone || "",
                          amount: String(credit.amount),
                          dueDate: credit.dueDate || "",
                          description: credit.description || "",
                        }
                      })}
                      className="text-muted-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(credit.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🤝"
              title={t('credits.emptyTitle')}
              description={t('credits.emptyDesc')}
            />
          )}
        </div>
      </main>
      <ConfirmDialog />

      {/* Partial Payment Dialog */}
      <Dialog
        open={partialDialog.open}
        onOpenChange={(v) => !v && setPartialDialog({ open: false, credit: null, amount: "" })}
      >
        <DialogContent className="max-w-[88%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('credits.partialPayTitle')}</DialogTitle>
          </DialogHeader>
          {partialDialog.credit && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                {partialDialog.credit.name} • {fmt(partialDialog.credit.amount - partialDialog.credit.paidAmount)}
              </p>
              <div className="space-y-2">
                <Label>{t('credits.partialAmount')}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={partialDialog.amount}
                  onChange={(e) => setPartialDialog(p => ({ ...p, amount: e.target.value }))}
                  className="text-xl font-bold"
                  autoFocus
                />
              </div>
              <Button
                variant="gold"
                className="w-full"
                disabled={!partialDialog.amount || parseFloat(partialDialog.amount) <= 0}
                onClick={handlePartialPay}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {t('credits.markPaid')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Credit Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(v) => !v && setEditDialog({ open: false, credit: null, data: { name: "", phone: "", amount: "", dueDate: "", description: "" } })}
      >
        <DialogContent className="max-w-[88%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('credits.editCredit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>{t('credits.name')} *</Label>
              <Input
                value={editDialog.data.name}
                onChange={(e) => setEditDialog(p => ({ ...p, data: { ...p.data, name: e.target.value } }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('credits.phone')}</Label>
              <Input
                type="tel"
                value={editDialog.data.phone}
                onChange={(e) => setEditDialog(p => ({ ...p, data: { ...p.data, phone: e.target.value } }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('credits.amount')} *</Label>
              <Input
                type="number"
                value={editDialog.data.amount}
                onChange={(e) => setEditDialog(p => ({ ...p, data: { ...p.data, amount: e.target.value } }))}
                className="text-lg font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('credits.dueDate')}</Label>
              <Input
                type="date"
                value={editDialog.data.dueDate}
                onChange={(e) => setEditDialog(p => ({ ...p, data: { ...p.data, dueDate: e.target.value } }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('credits.description')}</Label>
              <Input
                value={editDialog.data.description}
                onChange={(e) => setEditDialog(p => ({ ...p, data: { ...p.data, description: e.target.value } }))}
              />
            </div>
            <Button
              variant="gold"
              className="w-full"
              disabled={!editDialog.data.name || !editDialog.data.amount || updateCredit.isPending}
              onClick={handleEditSubmit}
            >
              {t('credits.saveEdit')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
