import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditsDB, Credit } from '@/lib/appDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useCredits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['credits', user?.uid],
    queryFn: () => creditsDB.getAll(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useCreditsByType(type: 'supplier' | 'customer') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['credits', user?.uid, 'type', type],
    queryFn: () => creditsDB.getByType(type),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useCreditTotals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['credits', user?.uid, 'totals'],
    queryFn: () => creditsDB.getTotals(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useAddCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credit: Omit<Credit, 'id' | 'createdAt' | 'updatedAt'>) =>
      creditsDB.add(credit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم إضافة الدين بنجاح');
    },
    onError: () => {
      toast.error('فشل في إضافة الدين');
    },
  });
}

export function useUpdateCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Credit> }) =>
      creditsDB.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم تحديث الدين بنجاح');
    },
    onError: () => {
      toast.error('فشل في تحديث الدين');
    },
  });
}

export function useDeleteCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => creditsDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم حذف الدين بنجاح');
    },
    onError: () => {
      toast.error('فشل في حذف الدين');
    },
  });
}
