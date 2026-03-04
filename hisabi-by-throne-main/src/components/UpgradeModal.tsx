import { useState, useEffect } from 'react';
import { Crown, Zap, KeyRound, CheckCircle2, Loader2, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
  /** Open directly on the code-entry tab */
  defaultTab?: 'code' | 'features';
}

const PRO_FEATURES = [
  { icon: '📦', text: 'منتجات غير محدودة (مجاني: 10 فقط)' },
  { icon: '🧠', text: 'تحليلات ذكية للمتجر' },
  { icon: '🔔', text: 'تنبيهات ذكية فورية' },
  { icon: '📊', text: 'ربحية كل منتج بالتفصيل' },
  { icon: '📈', text: 'مقارنة الفترات الشهرية' },
  { icon: '📄', text: 'تصدير التقارير CSV' },
  { icon: '🗂️', text: 'خلاصة مالية شهرية PDF' },
  { icon: '🏭', text: 'موردون غير محدودون (مجاني: 3)' },
  { icon: '📅', text: 'عرض كامل التاريخ في التقارير' },
];

type Step = 'idle' | 'loading' | 'success' | 'error';

export function UpgradeModal({ open, onClose, reason, defaultTab = 'features' }: UpgradeModalProps) {
  const { activateCode } = useAuth();
  const [tab, setTab] = useState<'code' | 'features'>(defaultTab);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successLabel, setSuccessLabel] = useState('');

  // Auto-close 4 s after success so the user sees the celebration screen
  useEffect(() => {
    if (step !== 'success') return;
    const t = setTimeout(handleClose, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Auto-format: inject dashes as user types
  const handleCodeChange = (val: string) => {
    const raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formatted = raw;
    if (raw.startsWith('THRONE')) {
      const rest = raw.slice(6);
      const parts = [rest.slice(0,4), rest.slice(4,8), rest.slice(8,12)].filter(Boolean);
      formatted = 'THRONE-' + parts.join('-');
    }
    setCode(formatted);
    setStep('idle');
    setErrorMsg('');
  };

  const handleActivate = async () => {
    if (!code.trim()) return;
    setStep('loading');
    setErrorMsg('');
    const result = await activateCode(code);
    if (result.success) {
      setStep('success');
      setSuccessLabel(result.durationLabel ?? '');
    } else {
      setStep('error');
      setErrorMsg(result.error ?? 'حدث خطأ غير متوقع');
    }
  };

  const handleClose = () => {
    if (step !== 'success') {
      setCode('');
      setStep('idle');
      setErrorMsg('');
    } else {
      setTimeout(() => { setCode(''); setStep('idle'); setSuccessLabel(''); }, 300);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl overflow-hidden p-0" dir="rtl">

        {/* ── Success state ── */}
        {step === 'success' ? (
          <div className="flex flex-col items-center gap-5 p-8 text-center bg-gradient-to-b from-amber-500/10 to-background">
            {/* Animated crown */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                <Crown className="w-12 h-12 text-white drop-shadow" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">مبروك! 🎉</h2>
              <p className="text-sm text-muted-foreground">
                أصبحت الآن عضواً في{' '}
                <span className="text-amber-500 font-bold">Pro</span>
              </p>
            </div>

            {/* Duration badge */}
            {successLabel && (
              <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-5 py-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-600">{successLabel}</span>
              </div>
            )}

            {/* Features unlocked */}
            <div className="w-full bg-card border border-border/50 rounded-2xl p-4 text-sm text-right space-y-2">
              {['منتجات غير محدودة', 'تحليلات وتقارير كاملة', 'تنبيهات ذكية فورية', 'تصدير CSV و PDF'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 h-11 text-base font-bold shadow-lg shadow-amber-500/20"
              onClick={handleClose}
            >
              ابدأ الاستخدام ✨
            </Button>
            <p className="text-xs text-muted-foreground/50">يُغلق تلقائياً بعد لحظات…</p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="bg-gradient-to-br from-amber-500/20 to-card p-5 pb-3 text-center space-y-1">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-md">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>
              <DialogTitle className="text-lg font-bold">ترقية إلى Pro</DialogTitle>
              {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
            </div>

            {/* ── Tabs ── */}
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setTab('code')}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5',
                  tab === 'code'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-500/5'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <KeyRound className="h-3.5 w-3.5" />
                أدخل كود التفعيل
              </button>
              <button
                onClick={() => setTab('features')}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5',
                  tab === 'features'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-500/5'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Zap className="h-3.5 w-3.5" />
                مميزات Pro
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* ── Code tab ── */}
              {tab === 'code' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">كود التفعيل</label>
                    <Input
                      dir="ltr"
                      placeholder="THRONE-XXXX-XXXX-XXXX"
                      value={code}
                      onChange={e => handleCodeChange(e.target.value)}
                      maxLength={22}
                      className={cn(
                        'font-mono text-center tracking-widest text-sm h-11',
                        step === 'error' && 'border-destructive focus-visible:ring-destructive'
                      )}
                      onKeyDown={e => e.key === 'Enter' && handleActivate()}
                    />
                    {step === 'error' && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errorMsg}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 gap-2 h-11"
                    onClick={handleActivate}
                    disabled={step === 'loading' || code.length < 10}
                  >
                    {step === 'loading' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />جاري التحقق...</>
                    ) : (
                      <><KeyRound className="h-4 w-4" />تفعيل الكود</>
                    )}
                  </Button>

                  <div className="bg-muted/40 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">كيف تحصل على كود؟</p>
                    {[
                      'تواصل مع المطور عبر واتساب أو تليجرام',
                      'اختر مدة الاشتراك (شهر / 3 أشهر / سنة)',
                      'ادفع وستصلك الكود فوراً',
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Features tab ── */}
              {tab === 'features' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    {PRO_FEATURES.map(f => (
                      <div key={f.text} className="flex items-center gap-2.5 text-sm py-0.5">
                        <span className="text-base">{f.icon}</span>
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold text-amber-600">تفعيل بكود — بدون اشتراك تلقائي</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ادفع مرة واحدة واحصل على الكود</p>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 gap-2"
                    onClick={() => setTab('code')}
                  >
                    <KeyRound className="h-4 w-4" />
                    لديّ كود تفعيل
                    <ChevronRight className="h-4 w-4 mr-auto" />
                  </Button>

                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleClose}>
                    لاحقاً
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
