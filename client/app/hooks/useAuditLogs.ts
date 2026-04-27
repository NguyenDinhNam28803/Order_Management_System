import { useQuery } from '@tanstack/react-query';
import { useProcurement } from '../context/ProcurementContext';

export const useAuditLogs = (page: number = 1, limit: number = 20) => {
    const { apiFetch } = useProcurement();

    return useQuery({
        queryKey: ['auditLogs', page, limit],
        queryFn: async () => {
            const resp = await apiFetch(`/audit-logs/paginated?page=${page}&limit=${limit}`);
            if (!resp.ok) throw new Error('Failed to fetch audit logs');
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
