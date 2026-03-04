import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  ArrowLeft,
  Store,
  User,
  Phone,
  MapPin,
  Palette,
  Sun,
  Moon,
  Monitor,
  BarChart3,
  Percent,
  Package,
  Check,
  Shield,
  Crown,
  RefreshCw,
  HelpCircle,
  Printer,
  Download,
  Receipt,
  Globe,
  MessageCircle,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/useTheme";
import { settingsDB, Settings as SettingsType, IS_FIREBASE_ENABLED } from "@/lib/appDB";
import { migrateLocalDataToFirestore } from "@/lib/appDB";
import { getDB as getLocalDB } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/UpgradeModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, planExpiresAt } = useAuth();
  const { isPro } = usePlan();
  const { t } = useTranslation();
  const { currentLang, setLanguage, languages } = useLanguage();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const s = await settingsDB.get();
      setSettings(s);
    };
    loadSettings();
  }, []);

  const handleMigrateData = async () => {
    setIsMigrating(true);
    try {
      const localDB = await getLocalDB();
      const [products, sales, invoices, expenses, credits] = await Promise.all([
        localDB.getAll('products'),
        localDB.getAll('sales'),
        localDB.getAll('invoices'),
        localDB.getAll('expenses'),
        localDB.getAll('credits'),
      ]);

      const hasData =
        products.length + sales.length + invoices.length +
        expenses.length + credits.length > 0;

      if (!hasData) {
        toast.info('لا توجد بيانات محلية للنقل');
        return;
      }

      await migrateLocalDataToFirestore({ products, sales, invoices, expenses, credits });
      toast.success(`تم نقل البيانات بنجاح! (${products.length} منتج، ${sales.length} بيعة)`);
    } catch {
      toast.error('فشل نقل البيانات');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await settingsDB.save(settings);
      toast.success('تم حفظ الإعدادات');
    } catch {
      toast.error('فشل في حفظ الإعدادات');
    }
    setIsSaving(false);
  };

  const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const themeOptions = [
    { value: 'light' as const, label: t('settings.light'), icon: Sun },
    { value: 'dark' as const, label: t('settings.dark'), icon: Moon },
    { value: 'system' as const, label: t('settings.auto'), icon: Monitor },
  ];

  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-xl font-bold">{t('settings.title')}</h1>
            </div>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Account Section */}
        <section className="glass-card p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {t('settings.account')}
          </h2>

          {/* User profile row */}
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
            <Avatar className="w-12 h-12 ring-2 ring-border">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.displayName || t('settings.user')}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs flex-shrink-0',
                isPro
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isPro ? (
                <><Crown className="w-3 h-3 me-1" />Pro</>
              ) : (
                t('common.free')
              )}
            </Badge>
          </div>

          {/* Plan action buttons */}
          {isPro ? (
            <div className="space-y-2">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-amber-600">
                  {planExpiresAt
                    ? t('settings.subscriptionEnds', { date: new Date(planExpiresAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) })
                    : t('settings.lifetimePlan')
                  }
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                onClick={() => setShowUpgrade(true)}
              >
                <Crown className="w-4 h-4" />
                {t('settings.renewCode')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Mini pricing grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { name: 'شهر', price: '1,500 دج' },
                  { name: '٣ أشهر', price: '3,000 دج' },
                  { name: '٦ أشهر', price: '5,000 دج' },
                  { name: 'سنة', price: '9,000 دج' },
                  { name: 'مدى الحياة', price: '12,000 دج', full: true },
                ].map(p => (
                  <button
                    key={p.name}
                    onClick={() => setShowUpgrade(true)}
                    className={`${p.full ? 'col-span-3' : ''} rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 active:scale-95 transition-all p-2 text-center`}
                  >
                    <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{p.name}</p>
                    <p className="text-xs font-bold text-amber-500 leading-none">{p.price}</p>
                  </button>
                ))}
              </div>
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 gap-2"
                onClick={() => setShowUpgrade(true)}
              >
                <Crown className="w-4 h-4" />
                {t('settings.upgradeToPro')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-muted-foreground"
                onClick={() => { setShowUpgrade(true); }}
              >
                {t('settings.haveCode')}
              </Button>
            </div>
          )}

          {/* Data migration — only shown when Firebase is configured */}
          {IS_FIREBASE_ENABLED && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-muted-foreground"
              onClick={handleMigrateData}
              disabled={isMigrating}
            >
              <RefreshCw className={cn('w-4 h-4', isMigrating && 'animate-spin')} />
              {isMigrating ? t('settings.migrating') : t('settings.migrateToCloud')}
            </Button>
          )}

          {/* Receipt preview */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
            asChild
          >
            <Link to="/receipt-preview">
              <Receipt className="w-4 h-4" />
              {t('settings.receiptPreview')}
            </Link>
          </Button>

        </section>

        {/* Store Info */}
        <section className="glass-card p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {t('settings.storeInfo')}
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                {t('settings.storeName')}
              </Label>
              <Input
                id="storeName"
                value={settings.storeName}
                onChange={(e) => updateSetting('storeName', e.target.value)}
                placeholder={t('settings.storeName')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {t('settings.ownerName')}
              </Label>
              <Input
                id="ownerName"
                value={settings.ownerName}
                onChange={(e) => updateSetting('ownerName', e.target.value)}
                placeholder={t('settings.ownerName')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {t('settings.phone')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => updateSetting('phone', e.target.value)}
                placeholder={t('settings.phone')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {t('settings.address')}
              </Label>
              <Input
                id="address"
                value={settings.address || ''}
                onChange={(e) => updateSetting('address', e.target.value)}
                placeholder={t('settings.address')}
              />
            </div>
          </div>
        </section>

        {/* Theme Settings */}
        <section className="glass-card p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent" />
            {t('settings.appearance')}
          </h2>
          
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    isActive 
                      ? "border-accent bg-accent/10 text-accent" 
                      : "border-border hover:border-border/80 text-muted-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-accent rounded-full p-0.5">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            {t('settings.currentMode', { mode: resolvedTheme === 'dark' ? t('settings.dark') : t('settings.light') })}
          </p>
        </section>

        {/* Language / Langue */}
        <section className="glass-card p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('settings.language')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('settings.languageDesc')}</p>
          <div className="grid grid-cols-2 gap-3">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-start',
                  currentLang === lang.code
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border hover:border-border/80 text-muted-foreground'
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{lang.label}</p>
                  <p className="text-xs text-muted-foreground">{lang.dir === 'rtl' ? 'RTL' : 'LTR'}</p>
                </div>
                {currentLang === lang.code && (
                  <div className="ms-auto">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Business Settings */}
        <section className="glass-card p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('settings.businessSettings')}
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultMargin" className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                {t('settings.defaultMargin')}
              </Label>
              <Input
                id="defaultMargin"
                type="number"
                min="0"
                max="100"
                value={settings.defaultProfitMargin}
                onChange={(e) => updateSetting('defaultProfitMargin', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lowStock" className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                {t('settings.lowStockThreshold')}
              </Label>
              <Input
                id="lowStock"
                type="number"
                min="1"
                value={settings.lowStockThreshold}
                onChange={(e) => updateSetting('lowStockThreshold', Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('settings.currency')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {['د.ج', 'ر.س', 'ج.م', 'د.م', 'د.ك', 'ر.ع', 'USD', 'EUR'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateSetting('currency', c)}
                    className={cn(
                      'py-2 text-sm rounded-lg border-2 font-medium transition-all',
                      settings.currency === c
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground hover:border-border/80'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Backup & Restore */}
        <section className="glass-card p-4 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {t('settings.backup')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('settings.backupDesc')}</p>
          <Link to="/backup">
            <Button className="w-full gap-2" variant="outline">
              <Download className="h-4 w-4" />
              {t('settings.openBackup')}
            </Button>
          </Link>
        </section>

        {/* Quick Links */}
        <section className="space-y-2">
          <Link 
            to="/printer" 
            className="glass-card p-4 flex items-center justify-between group hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-primary" />
              <span className="font-medium">{t('settings.bluetoothPrinter')}</span>
            </div>
            <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 group-hover:text-accent transition-colors" />
          </Link>

          <Link 
            to="/reports" 
            className="glass-card p-4 flex items-center justify-between group hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-accent" />
              <span className="font-medium">{t('settings.reportsAnalytics')}</span>
            </div>
            <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 group-hover:text-accent transition-colors" />
          </Link>
          
          <Link 
            to="/credits" 
            className="glass-card p-4 flex items-center justify-between group hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">{t('settings.debtManagement')}</span>
            </div>
            <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 group-hover:text-accent transition-colors" />
          </Link>
        </section>

        {/* App Info — Professional Footer */}
        <section className="space-y-3 pt-2">

          {/* Support button */}
          <a
            href="https://wa.me/213558088314?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%E2%80%94%20%D8%A3حتاج%20مساعدة%20في%20تطبيق%20محلي"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 glass-card p-4 group hover:border-green-500/40 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">دعم فني</p>
              <p className="text-xs text-muted-foreground">تواصل معنا عبر واتساب</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
          </a>

          {/* Privacy policy */}
          <div className="glass-card p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">سياسة الخصوصية</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              جميع بياناتك (منتجات، مبيعات، مصاريف) محفوظة محلياً على جهازك فقط.
              لا يُرسل أي شيء لخوادم خارجية،
              ولا يمكن لأي جهة الوصول إليها.
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center py-4 space-y-1.5">
            <div className="inline-flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">محلي</span>
              <span className="text-xs text-muted-foreground font-medium">Ma7ali</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.version', { version: '1.0.0' })}
            </p>
            <p className="text-xs text-muted-foreground/60">
              © 2026 THRONE · جميع الحقوق محفوظة
            </p>
          </div>

        </section>
      </main>

      {/* Upgrade modal */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        defaultTab={isPro ? 'code' : 'features'}
      />
    </div>
  );
}
