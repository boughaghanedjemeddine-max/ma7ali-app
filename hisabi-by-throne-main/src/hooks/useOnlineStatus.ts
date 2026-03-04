import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameBack(true);
      // Hide "back online" banner after 3 seconds
      setTimeout(() => setJustCameBack(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setJustCameBack(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, justCameBack };
}
