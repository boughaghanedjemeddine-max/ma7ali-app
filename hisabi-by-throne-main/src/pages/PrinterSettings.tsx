/**
 * PrinterSettings.tsx
 * ─────────────────────
 * Full printer management page:
 *  • Show saved printer card (name, UUIDs, status)
 *  • Scan & pair button → scanAndConnect()
 *  • Paper-width toggle: 58 mm / 80 mm
 *  • Encoding toggle: UTF-8 / Windows-1256 (Arabic)
 *  • Test print button
 *  • Remove printer button
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Printer,
  RefreshCw,
  Trash2,
  Zap,
  Info,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  loadPrinterConfig,
  savePrinterConfig,
  clearPrinterConfig,
  scanAndConnect,
  testPrint,
  PrinterConfig,
} from "@/lib/bluetooth";
import { settingsDB } from "@/lib/appDB";

export default function PrinterSettings() {
  const [config, setConfig]       = useState<PrinterConfig | null>(null);
  const [status, setStatus]       = useState("");
  const [isScanning, setIsScanning]  = useState(false);
  const [isTesting, setIsTesting]    = useState(false);
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo]    = useState<{
    storeName: string; phone?: string; address?: string; currency: string;
  } | null>(null);

  /* ── Load saved config & store info on mount ── */
  useEffect(() => {
    setConfig(loadPrinterConfig());
    settingsDB.get().then(s => {
      if (s) setStoreInfo(s);
    });
  }, []);

  /* ── Scan & pair ── */
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setStatus("جاري البحث...");
    try {
      const cfg = await scanAndConnect(setStatus);
      setConfig(cfg);
      toast.success(`✓ تم الاتصال بـ ${cfg.deviceName}`);
    } catch (e) {
      toast.error((e as Error).message);
      setStatus("");
    } finally {
      setIsScanning(false);
    }
  }, []);

  /* ── Test print ── */
  const handleTest = useCallback(async () => {
    if (!config) return;
    setIsTesting(true);
    try {
      await testPrint(
        config,
        storeInfo ?? { storeName: "متجري", currency: "د.ج" },
        setStatus,
      );
      toast.success("تمت طباعة الصفحة التجريبية");
    } catch (e) {
      toast.error((e as Error).message ?? "فشلت الطباعة");
    } finally {
      setIsTesting(false);
      setStatus("");
    }
  }, [config, storeInfo]);

  /* ── Remove printer ── */
  const handleRemove = () => {
    clearPrinterConfig();
    setConfig(null);
    toast.info("تم إزالة الطابعة");
  };

  /* ── Update a single field in config ── */
  const updateConfig = <K extends keyof PrinterConfig>(key: K, value: PrinterConfig[K]) => {
    if (!config) return;
    const updated = { ...config, [key]: value };
    setConfig(updated);
    savePrinterConfig(updated);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">الطابعة الحرارية</h1>
              <p className="text-xs text-muted-foreground">إعداد طابعة Bluetooth</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="إغلاق">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">

        {/* ── Connected printer card ── */}
        {config ? (
          <section className="glass-card p-4 space-y-4">
            {/* Status bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-success/10">
                  <BluetoothConnected className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{config.deviceName}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {config.deviceId}
                  </p>
                </div>
              </div>
              <Badge className="bg-success/10 text-success border-success/30">
                مرتبطة
              </Badge>
            </div>

            {/* Technical details */}
            <div className="bg-muted/30 rounded-xl p-3 space-y-1">
              <p className="text-xs text-muted-foreground">خدمة BLE</p>
              <p className="text-[11px] font-mono text-foreground/80 break-all">{config.serviceUUID}</p>
              <p className="text-xs text-muted-foreground mt-2">Characteristic</p>
              <p className="text-[11px] font-mono text-foreground/80 break-all">{config.charUUID}</p>
            </div>

            {/* Paper width */}
            <div className="space-y-2">
              <p className="text-sm font-medium">عرض الورق</p>
              <div className="grid grid-cols-2 gap-2">
                {([58, 80] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => updateConfig('paperWidth', w)}
                    className={cn(
                      "py-3 rounded-xl border-2 font-semibold text-sm transition-all",
                      config.paperWidth === w
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/40",
                    )}
                  >
                    {w} mm
                  </button>
                ))}
              </div>
            </div>

            {/* Encoding */}
            <div className="space-y-2">
              <p className="text-sm font-medium">ترميز النص</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'utf8',  label: 'UTF-8',        hint: 'للطابعات الحديثة'     },
                  { value: 'w1256', label: 'Windows-1256', hint: 'للطابعات القديمة (عربي)' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateConfig('encoding', opt.value)}
                    className={cn(
                      "py-2 px-3 rounded-xl border-2 text-right transition-all",
                      config.encoding === opt.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/40",
                    )}
                  >
                    <p className={cn(
                      "text-sm font-semibold",
                      config.encoding === opt.value ? "text-accent" : "text-foreground",
                    )}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1 gap-2"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isTesting ? "جاري الطباعة..." : "طباعة تجريبية"}
              </Button>
              <Button variant="outline" size="icon" onClick={handleScan} disabled={isScanning}>
                <RefreshCw className={cn("h-4 w-4", isScanning && "animate-spin")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Live status */}
            {status && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                {status}
              </p>
            )}
          </section>
        ) : (
          /* ── No printer paired ── */
          <section className="glass-card p-8 flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-muted/40">
              <BluetoothOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">لا توجد طابعة مرتبطة</p>
              <p className="text-sm text-muted-foreground mt-1">
                اضغط على "بحث عن طابعة" لإقران طابعة حرارية BLE
              </p>
            </div>
            <Button
              variant="primary"
              className="w-full gap-2"
              onClick={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {status || "جاري البحث..."}
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4" />
                  بحث عن طابعة
                </>
              )}
            </Button>
          </section>
        )}

        {/* ── How-to guide ── */}
        <section className="glass-card p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            كيفية الإقران
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>شغّل الطابعة الحرارية وتأكد أن البلوتوث فعّال</li>
            <li>اضغط على "بحث عن طابعة" للبدء</li>
            <li>اختر اسم الطابعة من القائمة</li>
            <li>انتظر حتى يتم اكتشاف الخدمات تلقائياً</li>
            <li>اضغط "طباعة تجريبية" للتأكد من عمل الطابعة</li>
          </ol>
        </section>

        {/* ── Compatibility note ── */}
        <section className="glass-card p-4 space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Printer className="h-4 w-4 text-accent" />
            الطابعات المدعومة
          </h2>
          <p className="text-sm text-muted-foreground">
            يدعم التطبيق معظم الطابعات الحرارية البلوتوث التي تعمل ببروتوكول ESC/POS
            بما في ذلك: طابعات 58 مم و 80 مم.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              'Xprinter / بلييرد',
              'GOOJPRT / PeriPage',
              'ZJiang / Rongta',
              'فئة TP / JP series',
              'طابعات مع تطبيق BT',
              'Generic ESC/POS',
            ].map(name => (
              <div key={name} className="flex items-center gap-1 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                {name}
              </div>
            ))}
          </div>
        </section>

        {/* ── Arabic printing note ── */}
        <section className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <p className="text-xs text-warning-foreground text-muted-foreground leading-relaxed">
            <span className="font-semibold text-warning">ملاحظة حول الطباعة بالعربية: </span>
            اختر "Windows-1256" إذا ظهرت الحروف العربية بشكل خاطئ مع UTF-8.
            بعض الطابعات الرخيصة لا تدعم يونيكود وتحتاج إلى كود الصفحة العربي.
          </p>
        </section>

      </main>

    </div>
  );
}
