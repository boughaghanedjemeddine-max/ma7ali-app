import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Download, Upload, FileJson, FileSpreadsheet, Shield, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  exportBackup,
  importBackup,
  exportSalesCSV,
  exportProductsCSV,
  getAutoBackupInfo,
  downloadAutoBackup,
} from '@/lib/backup';

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - then) / 86_400_000);
}

function formatArabicDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('ar-DZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Backup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingProductsCSV, setExportingProductsCSV] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [lastExport, setLastExport] = useState<{ size: string; rows: number } | null>(null);
  const [autoBackupInfo, setAutoBackupInfo] = useState<{ date: string | null; sizeKB: number }>({
    date: null, sizeKB: 0,
  });

  useEffect(() => {
    setAutoBackupInfo(getAutoBackupInfo());
  }, []);

  // ── Export full JSON ──
  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportBackup();
      setLastExport(result);
      toast({ title: t('backup.exportSuccess'), description: t('backup.exportSuccessDesc', { rows: result.rows, size: result.size }) });
      setAutoBackupInfo(getAutoBackupInfo());
    } catch (e) {
      toast({ title: t('backup.exportFail'), description: String(e), variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  // ── Export Sales CSV ──
  async function handleSalesCSV() {
    setExportingCSV(true);
    try {
      const result = await exportSalesCSV();
      toast({ title: t('backup.salesExported'), description: t('backup.rowsCount', { count: result.rows }) });
    } catch (e) {
      toast({ title: t('backup.exportFail'), description: String(e), variant: 'destructive' });
    } finally {
      setExportingCSV(false);
    }
  }

  // ── Export Products CSV ──
  async function handleProductsCSV() {
    setExportingProductsCSV(true);
    try {
      const result = await exportProductsCSV();
      toast({ title: t('backup.productsExported'), description: t('backup.productsCount', { count: result.rows }) });
    } catch (e) {
      toast({ title: t('backup.exportFail'), description: String(e), variant: 'destructive' });
    } finally {
      setExportingProductsCSV(false);
    }
  }

  // ── File chosen → show confirm dialog ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowImportDialog(true);
    e.target.value = '';
  }

  // ── Confirmed restore ──
  async function handleImportConfirm() {
    if (!pendingFile) return;
    setImporting(true);
    setShowImportDialog(false);
    try {
      const result = await importBackup(pendingFile);
      toast({ title: t('backup.restoreSuccess'), description: t('backup.restoreSuccessDesc', { rows: result.rows }) });
      setPendingFile(null);
    } catch (e) {
      toast({ title: t('backup.restoreFail'), description: String(e), variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }

  const days = autoBackupInfo.date ? daysSince(autoBackupInfo.date) : null;

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{t('backup.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('backup.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* ── Auto Backup Status ── */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2 mt-0.5">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-semibold text-sm">{t('backup.lastBackup')}</h2>
                {days !== null ? (
                  <Badge
                    variant="outline"
                    className={
                      days === 0
                        ? 'border-emerald-500 text-emerald-600'
                        : days <= 7
                        ? 'border-amber-500 text-amber-600'
                        : 'border-red-500 text-red-600'
                    }
                  >
                    days === 0 ? t('common.today') : `${t('common.since') ?? 'منذ'} ${days} يوم`
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                    {t('backup.noBackup')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {autoBackupInfo.date
                  ? `${formatArabicDate(autoBackupInfo.date)} — ${autoBackupInfo.sizeKB} KB (${t('backup.localBackup')})`
                  : t('backup.noBackup')}
              </p>
              {autoBackupInfo.date && (
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-6 text-xs mt-1"
                  onClick={downloadAutoBackup}
                >
                  <Download className="h-3 w-3 me-1" />
                  {t('backup.downloadLocal')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* ── Export Full JSON ── */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{t('backup.fullExport')}</h2>
              <p className="text-xs text-muted-foreground">{t('backup.fullExportDesc')}</p>
            </div>
            {lastExport && (
              <div className="ms-auto flex items-center gap-1 text-xs text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                {lastExport.size}
              </div>
            )}
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5 me-12">
            {[t('backup.products'), t('backup.salesInvoices'), t('backup.expensesDebts'), t('backup.customersSuppliers'), t('backup.settingsCat')].map(item => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Button
            className="w-full"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <RefreshCw className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 me-2" />
            )}
            {exporting ? t('backup.exporting') : t('backup.exportFullBtn')}
          </Button>
        </Card>

        {/* ── CSV Exports ── */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-full bg-violet-100 dark:bg-violet-900/30 p-2">
              <FileSpreadsheet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{t('backup.excelExport')}</h2>
              <p className="text-xs text-muted-foreground">{t('backup.excelExportDesc')}</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSalesCSV}
            disabled={exportingCSV}
          >
            {exportingCSV ? (
              <RefreshCw className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 me-2 text-green-600" />
            )}
            {t('backup.exportSalesCsv')}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleProductsCSV}
            disabled={exportingProductsCSV}
          >
            {exportingProductsCSV ? (
              <RefreshCw className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 me-2 text-orange-600" />
            )}
            {t('backup.exportProductsCsv')}
          </Button>
        </Card>

        {/* ── Restore ── */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
              <Upload className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{t('backup.restore')}</h2>
              <p className="text-xs text-muted-foreground">{t('backup.restoreDesc')}</p>
            </div>
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              <strong>{t('common.warning')}:</strong> {t('backup.restoreWarning')}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <RefreshCw className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 me-2" />
            )}
            {importing ? t('backup.restoring') : t('backup.chooseFile')}
          </Button>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground px-4">
          {t('backup.footerNote')}
        </p>
      </div>

      {/* ── Confirm Import Dialog ── */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('backup.confirmRestore')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {t('backup.confirmRestoreDesc')}
              </span>
              <span className="block font-mono text-xs bg-muted rounded px-2 py-1 text-foreground">
                {pendingFile?.name}
              </span>
              <span className="block text-red-600 dark:text-red-400 font-medium">
                {t('backup.confirmRestoreWarning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel onClick={() => setPendingFile(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('backup.confirmRestoreBtn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
