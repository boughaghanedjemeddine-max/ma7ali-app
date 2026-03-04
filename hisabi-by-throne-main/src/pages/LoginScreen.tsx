import { useState, useEffect } from 'react';
import { Store, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThroneLogo } from '@/components/ThroneLogo';
import { HisabiLogo } from '@/components/HisabiLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IS_LOCAL_MODE = !import.meta.env.VITE_FIREBASE_API_KEY;

export default function LoginScreen() {
  const { signInWithGoogle, user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // In local mode, user is always set — skip login screen entirely
  useEffect(() => {
    if (IS_LOCAL_MODE && user) {
      const dest = userProfile?.onboardingCompleted ? '/dashboard' : '/onboarding';
      navigate(dest, { replace: true });
    }
  }, [IS_LOCAL_MODE, user, userProfile, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error?.code !== 'auth/popup-closed-by-user') {
        toast.error('فشل تسجيل الدخول. حاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between pb-safe"
      dir="rtl"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-60 h-60 bg-accent/8 rounded-full blur-3xl" />

      {/* Top spacer */}
      <div className="flex-1" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-sm">
        {/* Logos */}
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <ThroneLogo size="md" animated={false} />
          <HisabiLogo size="lg" showThrone={false} />
        </div>

        {/* Tagline */}
        <div className="text-center space-y-1 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
          <p className="text-muted-foreground text-sm leading-relaxed">
            إدارة ذكية لمتجرك في راحة يدك
          </p>
          <p className="text-muted-foreground/60 text-xs">
            مبيعات • مخزون • أرباح • فواتير
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border/60" />

        {/* Sign in section */}
        <div
          className="w-full space-y-4 animate-fade-up"
          style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards' }}
        >
          <p className="text-center text-sm font-medium text-foreground">
            سجّل الدخول للمتابعة
          </p>

          <Button
            size="lg"
            className="w-full h-14 text-base gap-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-md"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              /* Google G icon */
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? 'جاري الدخول...' : 'الدخول بواسطة Google'}
          </Button>
        </div>
      </div>

      {/* Bottom */}
      <div
        className="relative z-10 flex flex-col items-center gap-3 pb-8 px-6 animate-fade-up"
        style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}
      >
        {/* Trust badges */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>بياناتك محمية</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5 text-xs">
            <Store className="w-3.5 h-3.5 text-accent" />
            <span>خصوصي ومشفّر</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center">
          بتسجيل الدخول، توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
}
