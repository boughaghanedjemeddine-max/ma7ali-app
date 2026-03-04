import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getProductPerformance } from '@/lib/appDB';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', user?.uid, 'stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useProductPerformance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', user?.uid, 'product-performance'],
    queryFn: getProductPerformance,
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}
