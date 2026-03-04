import { useState } from 'react';
import {
  BarChart3,
  Package,
  Receipt,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { HisabiLogo } from '@/components/HisabiLogo';

const SLIDES = [
  {
    icon: Package,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    gradientFrom: 'from-blue-500/20',
    gradientTo: 'to-transparent',
    title: 'إدارة المخزون',
    subtitle: 'أضف منتجاتك، تابع الكميات، واحصل على تنبيه فور نفاد المخزون',
    features: ['إضافة وتعديل المنتجات', 'تتبع الكميات تلقائياً', 'تنبيهات نفاد المخزون'],
  },
  {
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    gradientFrom: 'from-green-500/20',
    gradientTo: 'to-transparent',
    title: 'تسجيل المبيعات',
    subtitle: 'سجّل مبيعاتك بسرعة واحسب أرباحك تلقائياً في الوقت الفعلي',
    features: ['تسجيل سريع للمبيعات', 'حساب الربح التلقائي', 'متابعة الأداء اليومي'],
  },
  {
    icon: Receipt,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    gradientFrom: 'from-amber-500/20',
    gradientTo: 'to-transparent',
    title: 'الفواتير الاحترافية',
    subtitle: 'أنشئ فواتير احترافية وأرسلها لعملائك في ثوانٍ',
    features: ['إنشاء فواتير PDF', 'رمز QR لكل فاتورة', 'متابعة حالة الدفع'],
  },
  {
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    gradientFrom: 'from-purple-500/20',
    gradientTo: 'to-transparent',
    title: 'تقارير وتحليلات',
    subtitle: 'احصل على نظرة شاملة على أداء متجرك والأرباح والمصروفات',
    features: ['لوحة تحكم شاملة', 'تقارير ربحية', 'تحليل أداء المنتجات'],
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const finish = async () => {
    await completeOnboarding();
    navigate('/dashboard', { replace: true });
  };

  const goNext = () => {
    if (isLastSlide) {
      finish();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const skip = () => {
    finish();
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div
      className="fixed inset-0 flex flex-col bg-background overflow-hidden"
      dir="rtl"
    >
      {/* Background gradient per slide */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-radial transition-all duration-700',
          `bg-gradient-to-b ${slide.gradientFrom} ${slide.gradientTo}`
        )}
      />

      {/* Skip button */}
      <div className="relative z-10 flex justify-between items-center px-5 pt-safe pt-4">
        <button
          className="text-sm text-muted-foreground py-2 px-3 rounded-lg active:bg-muted"
          onClick={skip}
        >
          تخطي
        </button>
        {/* Slide counter */}
        <span className="text-xs text-muted-foreground font-mono">
          {currentSlide + 1} / {SLIDES.length}
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 gap-8">
        {/* Icon */}
        <div
          key={currentSlide}
          className={cn(
            'w-28 h-28 rounded-3xl flex items-center justify-center animate-fade-in',
            slide.bgColor,
            'border border-border/40'
          )}
        >
          <Icon className={cn('w-14 h-14', slide.color)} strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div className="text-center space-y-3 animate-fade-up" style={{ animationFillMode: 'forwards', opacity: 0, animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-bold text-foreground">{slide.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            {slide.subtitle}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2 w-full max-w-xs animate-fade-up" style={{ animationFillMode: 'forwards', opacity: 0, animationDelay: '0.2s' }}>
          {slide.features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-card/50 border border-border/40 rounded-xl px-4 py-2.5"
            >
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', slide.color.replace('text-', 'bg-'))} />
              <span className="text-sm text-foreground/80">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="relative z-10 flex flex-col items-center gap-5 pb-safe pb-8 px-6">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === currentSlide
                  ? cn('w-6 h-2', slide.color.replace('text-', 'bg-'))
                  : 'w-2 h-2 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 w-full max-w-xs">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12"
              onClick={goPrev}
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>
          )}
          <Button
            size="lg"
            className={cn(
              'h-12 gap-2 transition-all',
              currentSlide === 0 ? 'w-full' : 'flex-1',
              isLastSlide
                ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                : ''
            )}
            onClick={goNext}
          >
            {isLastSlide ? (
              <>
                <HisabiLogo size="sm" showThrone={false} showArabic={false} />
                ابدأ الآن
              </>
            ) : (
              <>
                التالي
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
