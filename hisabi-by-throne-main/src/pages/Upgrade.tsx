import { useState } from 'react';
import { ArrowRight, Crown, Check, Zap, KeyRound, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/UpgradeModal';
import { usePlan } from '@/hooks/usePlan';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '+213 55 808 8314';
const WHATSAPP_URL = 'https://wa.me/213558088314';

const PLANS = [
  {
    key: 'M1',
    name: 'شهر واحد',
    price: '1,500 دج',
    period: 'اشتراك شهري',
    highlight: false,
    badge: undefined as string | undefined,
  },
  {
    key: 'M3',
    name: '٣ أشهر',
    price: '3,000 دج',
    period: 'وفّر 1,500 دج',
    highlight: false,
    badge: undefined as string | undefined,
  },
  {
    key: 'M6',
    name: '٦ أشهر',
    price: '5,000 دج',
    period: 'وفّر 4,000 دج',
    highlight: false,
    badge: undefined as string | undefined,
  },
  {
    key: 'Y1',
    name: 'سنة كاملة',
    price: '9,000 دج',
    period: 'وفّر 9,000 دج',
    highlight: true,
    badge: 'الأوفر' as string | undefined,
  },
  {
    key: 'LF',
    name: 'مدى الحياة',
    price: '12,000 دج',
    period: 'دفعة واحدة للأبد',
    highlight: false,
    badge: '🔥' as string | undefined,
  },
];

const COMPARISON = [
  { feature: 'عدد المنتجات',                  free: '١٠ منتجات', pro: 'غير محدود' },
  { feature: 'الفواتير الشهرية',              free: '٥٠ فاتورة', pro: 'غير محدود' },
  { feature: 'الموردون',                       free: '٣ موردين', pro: 'غير محدود' },
  { feature: 'تحليلات ذكية',                   free: false,        pro: true },
  { feature: 'تنبيهات ذكية',                   free: false,        pro: true },
  { feature: 'ربحية كل منتج',                 free: false,        pro: true },
  { feature: 'مقارنة الفترات',                 free: false,        pro: true },
  { feature: 'تصدير CSV',                      free: false,        pro: true },
  { feature: 'ملخص مالي شهري PDF',            free: false,        pro: true },
  { feature: 'عرض كل التاريخ في التقارير',    free: false,        pro: true },
];

export default function Upgrade() {
  const { isPro } = usePlan();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-32" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-base font-bold">الترقية إلى Pro</h1>
      </div>

      <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-xl">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black">ارفع مستوى متجرك</h2>
          <p className="text-sm text-muted-foreground">
            ميزات احترافية تساعدك على تتبع أرباحك وتنمية مبيعاتك
          </p>
        </div>

        {/* Already Pro banner */}
        {isPro && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-amber-600">✅ أنت بالفعل على خطة Pro!</p>
            <p className="text-xs text-muted-foreground mt-1">
              يمكنك تجديد أو تغيير الكود في أي وقت
            </p>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-2 gap-3">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={cn(
                'relative rounded-2xl border p-4 space-y-1 text-center transition-all',
                plan.key === 'LF' && 'col-span-2',
                plan.highlight
                  ? 'border-amber-500/60 bg-amber-500/10 shadow-md shadow-amber-500/10'
                  : 'border-border/60 bg-card'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <p className="font-bold text-sm">{plan.name}</p>
              <p className="text-xl font-black text-amber-500 leading-tight">{plan.price}</p>
              <p className="text-[11px] text-muted-foreground">{plan.period}</p>
            </div>
          ))}
        </div>

        <Button
          className="w-full h-12 text-base bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 gap-2 shadow-lg shadow-amber-500/30"
          onClick={() => setShowModal(true)}
        >
          <KeyRound className="h-5 w-5" />
          أدخل كود التفعيل
        </Button>

        {/* Comparison table */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-center text-muted-foreground">مقارنة الباقات</h3>
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-muted/40 px-3 py-2 text-xs font-bold text-center">
              <span className="text-right">الميزة</span>
              <span>مجاني</span>
              <span className="text-amber-600 flex items-center justify-center gap-1">
                <Crown className="h-3 w-3" />Pro
              </span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={cn(
                  'grid grid-cols-3 px-3 py-2.5 text-xs text-center items-center',
                  i % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                <span className="text-right font-medium">{row.feature}</span>
                <span className="text-muted-foreground">
                  {typeof row.free === 'boolean'
                    ? (row.free ? <Check className="h-3.5 w-3.5 text-green-500 mx-auto" /> : <span className="text-destructive/60 font-bold">—</span>)
                    : row.free}
                </span>
                <span className="text-amber-600 font-semibold">
                  {typeof row.pro === 'boolean'
                    ? (row.pro ? <Check className="h-3.5 w-3.5 text-amber-500 mx-auto" /> : '—')
                    : row.pro}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How to get a code */}
        <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            كيف تشترك؟
          </h3>
          <div className="flex items-start gap-3 text-sm">
            <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 font-semibold underline underline-offset-2 break-all"
            >
              واتساب: {WHATSAPP_NUMBER}
            </a>
          </div>
          {[
            'اختر المدة التي تناسبك',
            'ادفع وستصلك الكود فوراً',
            'أدخل الكود واستمتع بكل ميزات Pro',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 2}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#25D366] text-white font-bold text-base shadow-lg shadow-green-500/30 active:scale-95 transition-transform"
        >
          <MessageCircle className="h-5 w-5" />
          تواصل للشراء عبر واتساب
        </a>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowModal(true)}
        >
          <KeyRound className="h-4 w-4" />
          لديّ كود — فعّل الآن
        </Button>
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        defaultTab="code"
      />
    </div>
  );
}
