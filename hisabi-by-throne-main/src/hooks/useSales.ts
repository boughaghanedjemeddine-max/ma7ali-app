import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesDB, invoicesDB, customersDB, customerPaymentsDB, Sale, getCurrentDate, productsDB, settingsDB, creditsDB } from '@/lib/appDB';
import { notifyLowStock } from '@/lib/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSales() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales', user?.uid],
    queryFn: () => salesDB.getAll(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useTodaySales() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales', user?.uid, 'today'],
    queryFn: () => salesDB.getByDate(getCurrentDate()),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useSalesByDate(date: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales', user?.uid, 'date', date],
    queryFn: () => salesDB.getByDate(date),
    enabled: !!date && !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useTodayStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales', user?.uid, 'today-stats'],
    queryFn: () => salesDB.getTodayStats(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useAddSale() {
  const queryClient = useQueryClient();
  const { user, limits } = useAuth();

  return useMutation({
    mutationFn: async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
      const saved = await salesDB.add(sale);
      // Auto-create invoice
      try {
        const monthCount = await invoicesDB.countThisMonth();
        if (monthCount < limits.maxMonthlyInvoices) {
          await invoicesDB.add({
            saleId: saved.id,
            customerName: sale.customerName || 'عميل نقدي',
            items: sale.items,
            total: sale.total,
            paymentType: sale.paymentType,
            status: sale.paymentType === 'cash' ? 'paid' : 'pending',
            date: sale.date,
          });
        }
      } catch { /* invoice creation is best-effort */ }
      // Auto-create a Credits entry for credit sales
      if (sale.paymentType === 'credit') {
        await creditsDB.add({
          type: 'customer',
          name: sale.customerName || 'زبون',
          amount: sale.total,
          paidAmount: 0,
          status: 'pending',
          description: `بيع بالآجل — ${sale.date}`,
          customerId: sale.customerId,
        });
        // Update customer balance + add payment history entry if linked to a customer
        if (sale.customerId) {
          const customer = await customersDB.getById(sale.customerId);
          if (customer) {
            await customersDB.update(sale.customerId, {
              balance: customer.balance + sale.total,
            });
            // Record the debt in customer payment history
            await customerPaymentsDB.add({
              customerId: sale.customerId,
              type: 'debt',
              amount: sale.total,
              description: `بيع بالآجل — ${sale.items.map(i => i.productName).join('، ')}`,
              date: sale.date,
            });
          }
        }
      }
      return saved;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم تسجيل البيع بنجاح');
      // Check for low-stock products and notify
      try {
        const [settings, products] = await Promise.all([settingsDB.get(), productsDB.getAll()]);
        const lowStock = products.filter(p => p.quantity <= settings.lowStockThreshold);
        if (lowStock.length > 0) {
          await notifyLowStock(lowStock.map(p => ({ name: p.name, quantity: p.quantity })));
        }
      } catch { /* notifications are best-effort */ }
    },
    onError: () => {
      toast.error('فشل في تسجيل البيع');
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('تم حذف البيع واستعادة المخزون');
    },
    onError: () => {
      toast.error('فشل في حذف البيع');
    },
  });
}
