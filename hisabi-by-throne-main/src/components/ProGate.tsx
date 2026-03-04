/**
 * ProGate.tsx
 * ───────────
 * Wraps any content/page and shows a Pro lock screen for free users.
 * Usage:
 *   <ProGate feature="canUseInsights">
 *     <InsightsContent />
 *   </ProGate>
 */

import { type ReactNode } from 'react';
import { Crown, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/hooks/usePlan';
import { useState } from 'react';
import { UpgradeModal } from '@/components/UpgradeModal';
import { cn } from '@/lib/utils';

type ProFeature =
  | 'canUseInsights'
  | 'canExportReports'
  | 'canViewAllPeriods'
  | 'canComparePeriods'
  | 'canUseSmartAlerts'
  | 'canViewProductProfitability'
  | 'canExportMonthlySummary';

interface ProGateProps {
  /** The feature flag from PlanLimits to check */
  feature: ProFeature;
  /** Content to render when user has access */
  children: ReactNode;
  /** Optional: show inline (smaller lock badge) instead of full page */
  inline?: boolean;
  /** Optional custom reason text shown in the UpgradeModal */
  reason?: string;
}

const FEATURE_LABELS: Record<ProFeature, { title: string; description: string }> = {
  canUseInsights: {
    title: 'التحليلات الذكية',
    description: 'احصل على نصائح ذكية حول منتجاتك وصحة متجرك وتوصيات الأسعار — متاح فقط في الخطة Pro.',
  },
  canExportReports: {
    title: 'تصدير التقارير',
    description: 'صدّر تقاريرك كملف CSV لتحليلها في Excel أو أي برنامج آخر — متاح فقط في الخطة Pro.',
  },
  canViewAllPeriods: {
    title: 'عرض كامل التاريخ',
    description: 'استعرض بيانات المبيعات والمصاريف لكل الفترات بدون قيود — متاح فقط في الخطة Pro.',
  },
  canComparePeriods: {
    title: 'مقارنة الفترات',
    description: 'قارن هذا الشهر بالشهر الماضي وشاهد نسبة النمو في المبيعات والأرباح — متاح فقط في الخطة Pro.',
  },
  canUseSmartAlerts: {
    title: 'التنبيهات الذكية',
    description: 'احصل على تنبيهات فورية: فواتير غير مدفوعة، منتجات دون مبيعات، ومخزون منخفض — متاح فقط في الخطة Pro.',
  },
  canViewProductProfitability: {
    title: 'ربحية كل منتج',
    description: 'شاهد الربح والهامش لكل منتج مرتباً حسب الأربح — متاح فقط في الخطة Pro.',
  },
  canExportMonthlySummary: {
    title: 'خلاصة مالية PDF',
    description: 'صدّر تقريراً شهرياً شاملاً بالمبيعات والمصاريف وصافي الربح — متاح فقط في الخطة Pro.',
  },
};

/** Full-page lock screen */
function ProLockScreen({ feature, reason }: { feature: ProFeature; reason?: string }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const info = FEATURE_LABELS[feature];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center" dir="rtl">
      {/* Icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center border-2 border-amber-500/30">
          <Lock className="h-10 w-10 text-amber-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-md">
          <Crown className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Text */}
      <div className="space-y-2 max-w-xs">
        <h2 className="text-xl font-bold text-foreground">{info.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{reason ?? info.description}</p>
      </div>

      {/* Pro features teaser */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 w-full max-w-xs space-y-2">
        {['منتجات غير محدودة', 'تصدير التقارير CSV', 'تحليلات ذكية للمتجر', 'مقارنة الفترات الشهرية', 'ربحية كل منتج', 'تنبيهات ذكية فورية', 'خلاصة مالية PDF شهرية', 'موردون غير محدودون'].map(f => (
          <div key={f} className="flex items-center gap-2 text-sm">
            <Zap className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <Button
        className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 gap-2 w-full max-w-xs"
        onClick={() => setShowUpgrade(true)}
      >
        <Crown className="h-4 w-4" />
        ترقية إلى Pro
      </Button>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason={reason ?? info.description} />
    </div>
  );
}

/** Inline lock badge (for buttons/small elements) */
function ProLockInline({ feature, reason }: { feature: ProFeature; reason?: string }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowUpgrade(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
          'bg-amber-500/10 text-amber-600 border border-amber-500/30',
          'hover:bg-amber-500/20 transition-colors cursor-pointer'
        )}
      >
        <Crown className="h-3 w-3" />
        Pro فقط
      </button>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason={reason} />
    </>
  );
}

export function ProGate({ feature, children, inline = false, reason }: ProGateProps) {
  const { limits } = usePlan();

  // Check access based on feature flag
  const hasAccess = limits[feature] === true;

  if (hasAccess) return <>{children}</>;

  if (inline) return <ProLockInline feature={feature} reason={reason} />;

  return <ProLockScreen feature={feature} reason={reason} />;
}
