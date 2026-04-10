/**
 * Formats a number or string into a currency-style format with commas as thousands separators.
 * @param val The value to format
 * @param includeSymbol Whether to include the currency symbol (₫)
 */
export const formatVND = (val: number | string | undefined | null, includeSymbol: boolean = false) => {
    if (val === undefined || val === null || val === '') return '0';
    
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0';

    // Using 'en-US' locale to get commas as thousands separators as requested by the user
    const formatted = new Intl.NumberFormat('en-US').format(num);
    
    return includeSymbol ? `${formatted} ₫` : formatted;
};

/**
 * Parses a formatted string back into a number (removes commas)
 */
export const parseMoney = (val: string) => {
    return parseFloat(val.replace(/,/g, '')) || 0;
};

/**
 * Maps English status to Vietnamese
 */
export const statusMap: Record<string, string> = {
    // PR Status
    'DRAFT': 'Nháp',
    'PENDING': 'Chờ duyệt',
    'PENDING_APPROVAL': 'Chờ phê duyệt',
    'SUBMITTED': 'Đã gửi',
    'UNDER_REVIEW': 'Đang xem xét',
    'APPROVED': 'Đã duyệt',
    'REJECTED': 'Từ chối',
    'CANCELLED': 'Đã hủy',
    'COMPLETED': 'Hoàn thành',
    'PO_CREATED': 'Đã tạo PO',
    'IN_SOURCING': 'Đang báo giá',
    
    // PO Status
    'ISSUED': 'Đã phát hành',
    'ACKNOWLEDGED': 'Đã xác nhận',
    'CONFIRMED': 'Đã confirm',
    'SHIPPED': 'Đã giao',
    'IN_TRANSIT': 'Đang vận chuyển',
    'PARTIAL': 'Giao một phần',
    'RECEIVED': 'Đã nhận',
    'INVOICED': 'Đã lập hóa đơn',
    'PAID': 'Đã thanh toán',
    'ORDERED': 'Đã đặt hàng',
    
    // RFQ Status
    'OPEN': 'Mở',
    'CLOSED': 'Đã đóng',
    'AWARDED': 'Đã trao thưởng',
};

export const getStatusLabel = (status: string | undefined): string => {
    if (!status) return 'Không xác định';
    return statusMap[status] || status.replace(/_/g, ' ');
};
