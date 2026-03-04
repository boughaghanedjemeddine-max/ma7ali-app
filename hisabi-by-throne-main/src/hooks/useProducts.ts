import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsDB, creditsDB, suppliersDB, Product } from '@/lib/appDB';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['products', user?.uid],
    queryFn: () => productsDB.getAll(),
    enabled: !!user,
    staleTime: 0,           // دائماً احضر بيانات جديدة عند فتح الصفحة
    refetchOnMount: true,
  });
}

export function useProduct(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['products', user?.uid, id],
    queryFn: () => productsDB.getById(id),
    enabled: !!id && !!user,
  });
}

export function useLowStockProducts(threshold: number = 5) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['products', user?.uid, 'low-stock', threshold],
    queryFn: () => productsDB.getLowStock(threshold),
    enabled: !!user,
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  const { user, limits } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Check plan limit before adding
      const currentProducts = await productsDB.getAll();
      if (currentProducts.length >= limits.maxProducts) {
        throw new Error('PLAN_LIMIT_PRODUCTS');
      }
      const saved = await productsDB.add(product);
      // Auto-create a supplier credit entry when product is bought on credit
      if (product.paymentType === 'credit') {
        let supplierId: string | undefined;
        if (product.supplier) {
          const allSuppliers = await suppliersDB.getAll();
          supplierId = allSuppliers.find(s => s.name === product.supplier)?.id;
        }
        await creditsDB.add({
          type: 'supplier',
          name: product.supplier || 'مورد',
          amount: product.purchasePrice,
          paidAmount: 0,
          status: 'pending',
          description: `شراء بالآجل — ${product.name}`,
          supplierId,
        });
      }
      return saved;
    },
    onSuccess: () => {
      // استخدام queryKey جزئي لضمان مطابقة شاملة بغض النظر عن uid
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      toast.success('تم إضافة المنتج بنجاح');
    },
    onError: (err: Error) => {
      if (err.message === 'PLAN_LIMIT_PRODUCTS') {
        toast.error(`وصلت للحد الأقصى (${limits.maxProducts} منتجات) — قم بالترقية لـ Pro`);
      } else {
        toast.error('فشل في إضافة المنتج');
      }
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      productsDB.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: () => {
      toast.error('فشل في تحديث المنتج');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsDB.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف المنتج بنجاح');
    },
    onError: () => {
      toast.error('فشل في حذف المنتج');
    },
  });
}
