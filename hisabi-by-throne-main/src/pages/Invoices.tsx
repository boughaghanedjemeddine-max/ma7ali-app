import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  ArrowLeft,
  Plus,
  Search,
  Receipt,
  Download,
  Share2,
  Check,
  Clock,
  MoreVertical,
  Printer,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoices, useUpdateInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices";
import { PrintButton } from "@/components/PrintButton";
import { settingsDB, Settings as SettingsType } from "@/lib/appDB";
import { loadPrinterConfig, printBytes } from "@/lib/bluetooth";
import { buildInvoiceReceipt } from "@/lib/escpos";
import { generateInvoicePDF, shareInvoiceWhatsApp } from "@/lib/generateInvoicePDF";
import { Invoice } from "@/lib/appDB";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonList, SkeletonInvoiceCard } from "@/components/SkeletonCards";
import { toast } from "sonner";

export default function Invoices() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [storeInfo, setStoreInfo] = useState<SettingsType | null>(null);

  const { data: invoices = [], isLoading } = useInvoices();
  const updateStatus  = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const { fmt }       = useCurrency();
  const { confirm: confirmDlg, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    settingsDB.get().then(s => { if (s) setStoreInfo(s); });
  }, []);

  const filteredInvoices = invoices
    .filter(inv => 
      (filter === 'all' || inv.status === filter) &&
      (inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
       inv.customerName.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleToggleStatus = async (invoice: Invoice) => {
    const newStatus = invoice.status === 'paid' ? 'pending' : 'paid';
    updateStatus.mutate({ id: invoice.id, status: newStatus });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDlg(t('invoices.deleteConfirm'), { variant: 'destructive', title: t('invoices.deleteTitle'), confirmLabel: t('common.delete') });
    if (ok) deleteInvoice.mutate(id);
  };

  const handleDownload = (invoice: Invoice) => {
    generateInvoicePDF(invoice, storeInfo ?? undefined);
    toast.success(t('invoices.downloading'));
  };

  const handleShare = (invoice: Invoice) => {
    shareInvoiceWhatsApp(invoice, storeInfo ?? undefined);
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    const cfg = loadPrinterConfig();
    if (!cfg) {
      toast.warning(t('invoices.noPrinter'), {
        description: t('invoices.noPrinterDesc'),
        duration: 4000,
      });
      return;
    }
    if (!storeInfo) return;
    try {
      const bytes = buildInvoiceReceipt(invoice, storeInfo, {
        paperWidth: cfg.paperWidth,
        encoding:   cfg.encoding,
      });
      await printBytes(cfg, bytes);
      toast.success(t('invoices.printSuccess'));
    } catch (e) {
      toast.error(t('invoices.printFail', { error: (e as Error).message }));
    }
  };



  const totalPending = invoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.total, 0);

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
              <h1 className="text-xl font-bold">{t('invoices.title')}</h1>
            </div>
            <Button variant="gold" size="sm" asChild>
              <Link to="/sales/new">
                <Plus className="h-4 w-4 ml-1" />
                {t('invoices.new')}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-3 bg-card/50 border-b border-border/30">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('invoices.statPaid')}</p>
            <p className="text-lg font-bold text-success">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('invoices.statPending')}</p>
            <p className="text-lg font-bold text-warning">{fmt(totalPending)}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('invoices.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <div className="flex gap-2">
          {[
            { value: 'all', label: t('invoices.filterAll') },
            { value: 'paid', label: t('invoices.filterPaid') },
            { value: 'pending', label: t('invoices.filterPending') },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f.value as typeof filter)}
              className="flex-1"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <main className="px-4 py-2">
        {isLoading ? (
          <SkeletonList Component={SkeletonInvoiceCard} count={5} />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={t('invoices.emptyTitle')}
            description={t('invoices.emptyDesc')}
            action={{ label: t('invoices.emptyAction'), href: '/sales/new' }}
          />
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="glass-card p-4 overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-primary font-bold">
                        {invoice.invoiceNumber}
                      </span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        invoice.status === 'paid' 
                          ? "bg-success/10 text-success" 
                          : "bg-warning/10 text-warning"
                      )}>
                        {invoice.status === 'paid' ? t('invoices.statusPaid') : t('invoices.statusPending')}
                      </span>
                    </div>
                    
                    <p className="text-foreground font-medium mt-1">
                      {invoice.customerName || t('invoices.cashCustomer')}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(invoice.date).toLocaleDateString('ar-DZ')}</span>
                      <span>{t('invoices.items', { count: invoice.items.length })}</span>
                      <span>{invoice.paymentType === 'cash' ? t('invoices.paymentCash') : t('invoices.paymentCredit')}</span>
                    </div>
                  </div>
                  
                  <div className="text-left shrink-0">
                    <p className="text-lg font-bold text-foreground whitespace-nowrap">
                      {fmt(invoice.total)}
                    </p>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="mt-1">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleStatus(invoice)}>
                          {invoice.status === 'paid' ? (
                            <>
                              <Clock className="h-4 w-4 ml-2" />
                              {t('invoices.markPending')}
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 ml-2" />
                              {t('invoices.markPaid')}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                          <Download className="h-4 w-4 ml-2" />
                          {t('invoices.downloadPDF')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(invoice)}>
                          <Share2 className="h-4 w-4 ml-2" />
                          {t('invoices.shareWhatsapp')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintInvoice(invoice)}>
                          <Printer className="h-4 w-4 ml-2" />
                          {t('invoices.print')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(invoice.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(invoice)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 ml-1" />
                    {t('invoices.downloadPDF')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(invoice)}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 ml-1" />
                    {t('invoices.shareWhatsapp')}
                  </Button>
                  {storeInfo && (
                    <PrintButton
                      type="invoice"
                      data={invoice}
                      storeInfo={storeInfo}
                      variant="full"
                      className="flex-1"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <ConfirmDialog />
    </div>
  );
}
