import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesDB, Expense, getCurrentDate } from '@/lib/appDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['expenses', user?.uid],
    queryFn: () => expensesDB.getAll(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useExpensesByType(type: 'shop' | 'personal') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['expenses', user?.uid, 'type', type],
    queryFn: () => expensesDB.getByType(type),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useTodayExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['expenses', user?.uid, 'today'],
    queryFn: () => expensesDB.getTodayTotal(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: Omit<Expense, 'id' | 'createdAt'>) =>
      expensesDB.add(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم إضافة المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل في إضافة المصروف');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Expense> }) =>
      expensesDB.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم تحديث المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل في تحديث المصروف');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expensesDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم حذف المصروف بنجاح');
    },
    onError: () => {
      toast.error('فشل في حذف المصروف');
    },
  });
}
