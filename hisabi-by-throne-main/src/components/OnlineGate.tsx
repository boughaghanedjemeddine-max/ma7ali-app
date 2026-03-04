import { ReactNode } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OnlineGate({ children }: { children: ReactNode }) {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return <>{children}</>;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-6 text-center"
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center gap-5 max-w-xs">
        {/* Icon */}
        <div className="w-24 h-24 rounded-3xl bg-orange-500/10 border-2 border-dashed border-orange-500/30 flex items-center justify-center">
          <WifiOff className="h-10 w-10 text-orange-400" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-black text-foreground">لا يوجد اتصال</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            التطبيق يحتاج إلى اتصال بالإنترنت للعمل.
            <br />
            تحقق من الشبكة ثم أعد المحاولة.
          </p>
        </div>

        {/* Retry */}
        <Button
          variant="outline"
          className="gap-2 border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>

        <p className="text-xs text-muted-foreground/50">
          سيفتح التطبيق تلقائياً عند الاتصال
        </p>
      </div>
    </div>
  );
}
