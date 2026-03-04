import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersDB, supplierTransactionsDB, Supplier, SupplierTransaction } from '@/lib/appDB';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { toast } from 'sonner';

export function useSuppliers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['suppliers', user?.uid],
    queryFn: () => suppliersDB.getAll(),
    enabled: !!user,
  });
}

export function useSupplier(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['suppliers', user?.uid, id],
    queryFn: () => suppliersDB.getById(id),
    enabled: !!id && !!user,
  });
}

export function useSupplierTransactions(supplierId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['supplierTransactions', user?.uid, supplierId],
    queryFn: () => supplierTransactionsDB.getBySupplier(supplierId),
    enabled: !!supplierId && !!user,
  });
}

export function useAddSupplier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { limits } = usePlan();
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'balance' | 'totalPurchases' | 'totalPaid'>) => {
      const existing = await suppliersDB.getAll();
      if (existing.length >= limits.maxSuppliers) {
        throw new Error('PLAN_LIMIT_SUPPLIERS');
      }
      return suppliersDB.add(supplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', user?.uid] });
      toast.success('تم إضافة المورد بنجاح');
    },
    onError: (err: Error) => {
      if (err.message === 'PLAN_LIMIT_SUPPLIERS') {
        toast.error(`وصلت للحد الأقصى (${limits.maxSuppliers} موردين). يلزم الترقية إلى Pro لإضافة المزيد.`);
      } else {
        toast.error('فشل في إضافة المورد');
      }
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Supplier> }) =>
      suppliersDB.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', user?.uid] });
      toast.success('تم تحديث المورد');
    },
    onError: () => toast.error('فشل في تحديث المورد'),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => suppliersDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['supplierTransactions', user?.uid] });
      toast.success('تم حذف المورد');
    },
    onError: () => toast.error('فشل في حذف المورد'),
  });
}

export function useAddSupplierTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (tx: Omit<SupplierTransaction, 'id' | 'createdAt'>) =>
      supplierTransactionsDB.add(tx),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['supplierTransactions', user?.uid, vars.supplierId] });
      toast.success(vars.type === 'purchase' ? 'تم تسجيل الشراء' : 'تم تسجيل الدفع');
    },
    onError: () => toast.error('فشل في تسجيل المعاملة'),
  });
}

export function useDeleteSupplierTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => supplierTransactionsDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['supplierTransactions', user?.uid] });
      toast.success('تم حذف المعاملة');
    },
    onError: () => toast.error('فشل في حذف المعاملة'),
  });
}
