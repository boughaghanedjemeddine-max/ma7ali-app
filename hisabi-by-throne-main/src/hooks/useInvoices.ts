import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesDB, Invoice } from '@/lib/appDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useInvoices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['invoices', user?.uid],
    queryFn: () => invoicesDB.getAll(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useInvoice(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['invoices', user?.uid, id],
    queryFn: () => invoicesDB.getById(id),
    enabled: !!id && !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useAddInvoice() {
  const queryClient = useQueryClient();
  const { limits } = useAuth();

  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
      const monthCount = await invoicesDB.countThisMonth();
      if (monthCount >= limits.maxMonthlyInvoices) {
        throw new Error('PLAN_LIMIT_INVOICES');
      }
      return invoicesDB.add(invoice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم إنشاء الفاتورة بنجاح');
    },
    onError: (err: Error) => {
      if (err.message === 'PLAN_LIMIT_INVOICES') {
        toast.error(`وصلت للحد الأقصى (${limits.maxMonthlyInvoices} فاتورة/شهر) — قم بالترقية لـ Pro`);
      } else {
        toast.error('فشل في إنشاء الفاتورة');
      }
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'paid' | 'pending' }) =>
      invoicesDB.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم تحديث حالة الفاتورة');
    },
    onError: () => {
      toast.error('فشل في تحديث الفاتورة');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('تم حذف الفاتورة بنجاح');
    },
    onError: () => {
      toast.error('فشل في حذف الفاتورة');
    },
  });
}
