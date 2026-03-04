/**
 * ConfirmDialog.tsx
 * ──────────────────
 * Replaces all `window.confirm()` calls in the app.
 * Styled AlertDialog that fits the app's design system.
 *
 * Usage:
 *   const { open, confirm, ConfirmDialog } = useConfirmDialog();
 *
 *   // Render:
 *   <ConfirmDialog />
 *
 *   // Trigger:
 *   const ok = await confirm("هل أنت متأكد من الحذف؟");
 *   if (ok) deleteSomething();
 */

import { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface ConfirmOptions {
  title?:       string;
  description?: string;
  confirmText?: string;
  /** Alias for confirmText — same effect. */
  confirmLabel?: string;
  cancelText?:  string;
  variant?:     "destructive" | "default";
}

export function useConfirmDialog() {
  const [open, setOpen]       = useState(false);
  const [opts, setOpts]       = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((description: string, options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setOpts({ description, ...options });
      setOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleResponse = (value: boolean) => {
    setOpen(false);
    resolver?.(value);
    setResolver(null);
  };

  const Dialog = () => (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) handleResponse(false); }}>
      <AlertDialogContent className="max-w-[85%] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {opts.title ?? "تأكيد العملية"}
          </AlertDialogTitle>
          {opts.description && (
            <AlertDialogDescription>{opts.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel onClick={() => handleResponse(false)}>
            {opts.cancelText ?? "إلغاء"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleResponse(true)}
            className={
              opts.variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {opts.confirmText ?? opts.confirmLabel ?? "تأكيد"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog: Dialog };
}
