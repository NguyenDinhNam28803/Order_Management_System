import { useQuery } from '@tanstack/react-query';
import { useProcurement } from '../context/ProcurementContext';

export const usePurchaseOrders = (page: number = 1, limit: number = 20) => {
    const { apiFetch } = useProcurement();

    return useQuery({
        queryKey: ['purchaseOrders', page, limit],
        queryFn: async () => {
            const resp = await apiFetch(`/purchase-orders/paginated?page=${page}&limit=${limit}`);
            if (!resp.ok) throw new Error('Failed to fetch purchase orders');
            const res = await resp.json();
            
            // Dựa trên dữ liệu API mới: { status: "success", data: { data: [...], total: ... } }
            const payload = res.data || {};
            return {
                data: Array.isArray(payload.data) ? payload.data : [],
                total: payload.total || 0,
                page,
                limit
            };
        },
        staleTime: 30 * 1000,
    });
};
