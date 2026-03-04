import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersDB, customerPaymentsDB, Customer, CustomerPayment } from '@/lib/appDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useCustomers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customers', user?.uid],
    queryFn: () => customersDB.getAll(),
    enabled: !!user,
  });
}

export function useCustomer(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customers', user?.uid, id],
    queryFn: () => customersDB.getById(id),
    enabled: !!id && !!user,
  });
}

export function useCustomerTotals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customers', user?.uid, 'totals'],
    queryFn: () => customersDB.getTotals(),
    enabled: !!user,
  });
}

export function useCustomerPayments(customerId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customers', user?.uid, customerId, 'payments'],
    queryFn: () => customerPaymentsDB.getByCustomer(customerId),
    enabled: !!customerId && !!user,
  });
}

export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) =>
      customersDB.add(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', user?.uid] });
      toast.success('تم إضافة العميل بنجاح');
    },
    onError: () => toast.error('فشل في إضافة العميل'),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Customer> }) =>
      customersDB.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['customers', user?.uid, id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => customersDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', user?.uid] });
      toast.success('تم حذف العميل');
    },
    onError: () => toast.error('فشل في حذف العميل'),
  });
}

export function useAddCustomerPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payment: Omit<CustomerPayment, 'id' | 'createdAt'>) =>
      customerPaymentsDB.add(payment),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['customers', user?.uid, customerId, 'payments'] });
      toast.success('تم تسجيل المبلغ بنجاح');
    },
    onError: () => toast.error('فشل في تسجيل المبلغ'),
  });
}

export function useDeleteCustomerPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => customerPaymentsDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', user?.uid] });
      toast.success('تم حذف السجل');
    },
  });
}
