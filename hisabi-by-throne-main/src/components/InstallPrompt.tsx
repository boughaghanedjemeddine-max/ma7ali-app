import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap, WifiOff, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'ma7ali-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing to not interrupt initial navigation
      setTimeout(() => setVisible(true), 4000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also detect if app is already installed
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setTimeout(() => setVisible(false), 2000);
    } else {
      setInstalling(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!deferredPrompt && !installed) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-[9990] transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div
        dir="rtl"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[9991] transition-transform duration-400 ease-out',
          visible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="bg-card border-t border-border/60 rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 max-w-lg mx-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg text-2xl">
                🏪
              </div>
              <div>
                <h3 className="font-bold text-base">ثبّت محلّي على هاتفك</h3>
                <p className="text-xs text-muted-foreground">تجربة أفضل وأسرع</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: <WifiOff className="h-4 w-4" />, text: 'يعمل بدون نت' },
              { icon: <Zap className="h-4 w-4" />,    text: 'أسرع بكثير' },
              { icon: <Smartphone className="h-4 w-4" />, text: 'على شاشتك' },
            ].map(b => (
              <div key={b.text} className="flex flex-col items-center gap-1.5 bg-muted/40 rounded-xl p-3 text-center">
                <span className="text-primary">{b.icon}</span>
                <span className="text-xs font-medium">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {installed ? (
            <div className="flex items-center justify-center gap-2 py-3 text-green-500 font-semibold">
              <span>✓</span>
              <span>تم التثبيت بنجاح!</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={handleDismiss}
              >
                لاحقاً
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent text-white border-0 gap-2 shadow-md"
                onClick={handleInstall}
                disabled={installing}
              >
                <Download className="h-4 w-4" />
                {installing ? 'جاري التثبيت...' : 'تثبيت'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
