import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThroneLogo } from "@/components/ThroneLogo";
import { HisabiLogo } from "@/components/HisabiLogo";
import { useAuth } from "@/contexts/AuthContext";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [showHisabi, setShowHisabi] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Show app logo animation
  useEffect(() => {
    const hisabiTimer = setTimeout(() => setShowHisabi(true), 1800);
    const minTimer = setTimeout(() => setMinTimeElapsed(true), 2800);

    return () => {
      clearTimeout(hisabiTimer);
      clearTimeout(minTimer);
    };
  }, []);

  // Navigate once auth is loaded AND minimum splash time has passed
  useEffect(() => {
    if (!minTimeElapsed || loading) return;

    if (!user) {
      navigate("/login", { replace: true });
    } else if (userProfile && !userProfile.onboardingCompleted) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [minTimeElapsed, loading, user, userProfile, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-8">
        <ThroneLogo size="xl" animated showTagline />

        {showHisabi && (
          <div
            className="animate-fade-up opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            <HisabiLogo size="lg" />
            <p className="text-center text-muted-foreground mt-2 text-sm">
              إدارة ذكية لتجارتك
            </p>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      <div className="relative z-10 flex flex-col items-center gap-3 pb-16">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent animate-pulse-soft"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
