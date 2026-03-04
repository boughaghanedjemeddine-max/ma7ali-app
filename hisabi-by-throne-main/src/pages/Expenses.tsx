import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Store,
  User,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExpenses, useAddExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { getCurrentDate } from "@/lib/appDB";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
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

export default function Expenses() {
  const { t } = useTranslation();
  const expenseCategories = {
    shop: t('expenses.shopCategories').split(','),
    personal: t('expenses.personalCategories').split(','),
  };
  const [activeTab, setActiveTab] = useState<"shop" | "personal">("shop");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    date: getCurrentDate(),
  });

  const { data: expenses = [], isLoading } = useExpenses();
  const addExpense    = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const { fmt }       = useCurrency();
  const { confirm: confirmDlg, ConfirmDialog } = useConfirmDialog();

  const filteredExpenses = expenses
    .filter(e => e.type === activeTab)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleSubmit = () => {
    if (!formData.category || !formData.amount) return;

    addExpense.mutate({
      type: activeTab,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ category: "", description: "", amount: "", date: getCurrentDate() });
      }
    });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDlg(t('expenses.deleteConfirm'), { variant: 'destructive', title: t('expenses.deleteTitle'), confirmLabel: t('common.delete') });
    if (ok) deleteExpense.mutate(id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('expenses.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('expenses.subtitle', { count: filteredExpenses.length, total: fmt(totalAmount) })}
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
                  <DialogTitle>{t('expenses.addExpense')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t('expenses.category')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {expenseCategories[activeTab].map((cat) => (
                        <Button
                          key={cat}
                          variant={formData.category === cat ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('expenses.amount')} *</Label>
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
                    <Label htmlFor="description">{t('expenses.description')}</Label>
                    <Input
                      id="description"
                      placeholder={t('expenses.descPlaceholder')}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('expenses.date')}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <Button 
                    variant="gold" 
                    className="w-full" 
                    onClick={handleSubmit}
                    disabled={!formData.category || !formData.amount || addExpense.isPending}
                  >
                    {addExpense.isPending ? t('expenses.adding') : t('expenses.addBtn')}
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
            onClick={() => setActiveTab("shop")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
              activeTab === "shop"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Store className="h-4 w-4" />
            {t('expenses.tabShop')}
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
              activeTab === "personal"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <User className="h-4 w-4" />
            {t('expenses.tabPersonal')}
          </button>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {isLoading ? (
            <SkeletonList Component={SkeletonListItem} count={5} />
          ) : filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-card border border-border/50 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block bg-muted px-2 py-1 rounded-lg text-xs font-medium mb-2">
                      {expense.category}
                    </span>
                    {expense.description && (
                      <p className="text-sm text-foreground">{expense.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {expense.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-lg">
                      {fmt(expense.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(expense.id)}
                      className="text-destructive mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="💸"
              title={t('expenses.emptyTitle')}
              description={t('expenses.emptyDesc')}
            />
          )}
        </div>
      </main>
      <ConfirmDialog />
    </div>
  );
}
