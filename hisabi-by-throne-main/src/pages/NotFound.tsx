import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 — صفحة غير موجودة:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 p-6" dir="rtl">
      <div className="text-center space-y-3">
        <h1 className="text-8xl font-extrabold text-primary/30">404</h1>
        <h2 className="text-2xl font-bold text-foreground">{t('notFound.title')}</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          {t('notFound.description')}
        </p>
      </div>
      <Button asChild>
        <Link to="/dashboard">
          <Home className="h-4 w-4 me-2" />
          {t('notFound.goHome')}
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
