/**
 * Converts Prisma Decimal object { s, e, d: [...] } to number
 * Use this for arithmetic operations before formatting
 */
export const convertPrismaDecimal = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    // Prisma Decimal format: { s: 1, e: 6, d: [8110452, 7800000] }
    // Hoặc có thể là string representation
    if (typeof val === 'object' && val !== null) {
        // Thử lấy giá trị từ các thuộc tính quen thuộc
        const v = val as any;
        
        // Nếu có toString method (Prisma Decimal có)
        if (typeof v.toString === 'function') {
            const str = v.toString();
            if (str && str !== '[object Object]') {
                const num = parseFloat(str);
                if (!isNaN(num)) return num;
            }
        }
        
        // Nếu có valueOf method
        if (typeof v.valueOf === 'function') {
            const num = Number(v.valueOf());
            if (!isNaN(num)) return num;
        }
        
        // Xử lý format { d: [...], e: ..., s: ... }
        if ('d' in v && Array.isArray(v.d)) {
            // Prisma Decimal stores numbers as array of digits
            // Format: { s: sign, e: exponent, d: [digit1, digit2, ...] }
            // Giá trị = sign * (digits[0] * 10^e + digits[1] * 10^(e-1) + ...)
            const digits = v.d as number[];
            if (digits.length === 0) return 0;
            
            // Nối các digits lại thành chuỗi
            const digitStr = digits.join('');
            const exponent = v.e || 0;
            const sign = v.s === -1 ? -1 : 1;
            
            // Tính giá trị: digits * 10^(exponent - digits.length + 1)
            const value = sign * parseFloat(digitStr) * Math.pow(10, exponent - digitStr.length + 1);
            return isNaN(value) ? 0 : value;
        }
    }
    return Number(val) || 0;
};

/**
 * Formats a number or string into a currency-style format with commas as thousands separators.
 * Auto-converts Prisma Decimal objects.
 * @param val The value to format (number, string, or Prisma Decimal object)
 * @param includeSymbol Whether to include the currency symbol (₫)
 */
export const formatVND = (val: number | string | object | undefined | null, includeSymbol: boolean = false) => {
    if (val === undefined || val === null || val === '') return '0';
    
    // Convert Prisma Decimal if needed
    const num = convertPrismaDecimal(val);
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
    'ACTIVE': 'Hoạt động',
    
    // RFQ Status
    'OPEN': 'Mở',
    'CLOSED': 'Đã đóng',
    'AWARDED': 'Đã trao thưởng',
    'QUOTING': 'Đang báo giá',
    'QUOTED': 'Đã báo giá',
    'ACCEPTED': 'Đã chấp nhận',
    'DECLINED': 'Từ chối',
    
    // Priority/Urgency
    'URGENT': 'Khẩn cấp',
    'OVERDUE': 'Quá hạn',
    'HIGH': 'Cao',
    'MEDIUM': 'Trung bình',
    'LOW': 'Thấp',
    'CRITICAL': 'Nghiêm trọng',
    
    // Document/Invoice Status
    'UNPAID': 'Chưa thanh toán',
    'PARTIAL_PAID': 'Thanh toán một phần',
    'PROCESSING': 'Đang xử lý',
    
    // Approval Flow
    'DEPT_APPROVED': 'Trưởng phòng đã duyệt',
    'FINANCE_APPROVED': 'Tài chính đã duyệt',
    'DIRECTOR_APPROVED': 'Giám đốc đã duyệt',
    'CEO_APPROVED': 'CEO đã duyệt',
    
    // Contract Status
    'EXPIRED': 'Hết hạn',
    'EXPIRING': 'Sắp hết hạn',
    'RENEWED': 'Đã gia hạn',
    'TERMINATED': 'Đã chấm dứt',
    
    // Budget Status
    'LOCKED': 'Đã khóa',
    'UNLOCKED': 'Chưa khóa',
    'REALLOCATED': 'Đã điều chỉnh',
    
    // Dispute Status
    'RESOLVED': 'Đã giải quyết',
    'ESCALATED': 'Đã leo thang',
    
    // General
    'NEW': 'Mới',
    'OLD': 'Cũ',
    'DEFAULT': 'Mặc định',
    'ALL': 'Tất cả',
    'NONE': 'Không có',
    'INACTIVE': 'Không hoạt động',
};

export const getStatusLabel = (status: string | undefined): string => {
    if (!status) return 'Không xác định';
    return statusMap[status] || status.replace(/_/g, ' ');
};
