/**
 * PrintButton.tsx
 * ─────────────────
 * Reusable one-tap print button for Sale cards and Invoice cards.
 *
 * Behaviour
 *  • If no printer is configured → toast warning + navigate to /printer
 *  • Otherwise → build ESC/POS receipt → printBytes()
 *
 * Props
 *  type="sale"    → buildSaleReceipt()
 *  type="invoice" → buildInvoiceReceipt()
 *  variant        → "icon" (small icon-only) | "full" (icon + label)
 */

import { useState, useCallback } from "react";
import { Printer, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { loadPrinterConfig, printBytes } from "@/lib/bluetooth";
import { buildSaleReceipt, buildInvoiceReceipt, SaleReceiptData, InvoiceReceiptData, StoreInfo } from "@/lib/escpos";

/* ── Types ─────────────────────────────────────────────────────────── */
type PrintButtonVariant = "icon" | "full";

interface SaleProps {
  type:       "sale";
  data:       SaleReceiptData;
  storeInfo:  StoreInfo;
  variant?:   PrintButtonVariant;
  className?: string;
}

interface InvoiceProps {
  type:       "invoice";
  data:       InvoiceReceiptData;
  storeInfo:  StoreInfo;
  variant?:   PrintButtonVariant;
  className?: string;
}

type PrintButtonProps = SaleProps | InvoiceProps;

/* ── Component ─────────────────────────────────────────────────────── */
export function PrintButton({
  type,
  data,
  storeInfo,
  variant = "icon",
  className,
}: PrintButtonProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "printing" | "done" | "error">("idle");

  const handlePrint = useCallback(async () => {
    const config = loadPrinterConfig();

    if (!config) {
      toast.warning("لا توجد طابعة مرتبطة", {
        description: "اذهب إلى إعدادات الطابعة لإقران جهاز",
        action: {
          label: "إعداد",
          onClick: () => navigate("/printer"),
        },
        duration: 5000,
      });
      return;
    }

    setStatus("printing");

    try {
      const opts = { paperWidth: config.paperWidth, encoding: config.encoding };
      const bytes =
        type === "sale"
          ? buildSaleReceipt(data as SaleReceiptData, storeInfo, opts)
          : buildInvoiceReceipt(data as InvoiceReceiptData, storeInfo, opts);

      await printBytes(config, bytes, (msg) => {
        // Could surface print progress in a toast if desired
        console.log("[PrintButton]", msg);
      });

      setStatus("done");
      toast.success("تمت الطباعة بنجاح");
    } catch (e) {
      setStatus("error");
      toast.error(`فشلت الطباعة: ${(e as Error).message ?? "خطأ غير معروف"}`);
    } finally {
      // Reset status after 2 seconds
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [type, data, storeInfo, navigate]);

  const isPrinting = status === "printing";

  if (variant === "full") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={isPrinting}
        className={cn("gap-2", className)}
      >
        {isPrinting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        {isPrinting ? "جاري الطباعة..." : "طباعة"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handlePrint}
      disabled={isPrinting}
      className={cn(
        "text-muted-foreground hover:text-foreground transition-colors",
        status === "done"  && "text-success",
        status === "error" && "text-destructive",
        className,
      )}
      title="طباعة"
    >
      {isPrinting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
    </Button>
  );
}
