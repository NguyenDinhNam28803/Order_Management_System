import { useQuery } from '@tanstack/react-query';
import { useProcurement } from '../context/ProcurementContext';

// Hook cho Buyer
export const useBuyerData = (enabled: boolean) => {
    const { fetchBuyerDashboard } = useProcurement();
    
    return useQuery({
        queryKey: ['buyerDashboard'],
        queryFn: fetchBuyerDashboard,
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Hook cho Supplier
export const useSupplierData = (supplierId: string, enabled: boolean) => {
    const { fetchContractsBySupplier } = useProcurement();
    
    return useQuery({
        queryKey: ['supplierContracts', supplierId],
        queryFn: () => fetchContractsBySupplier(supplierId),
        enabled: enabled && !!supplierId,
        staleTime: 5 * 60 * 1000,
    });
};
