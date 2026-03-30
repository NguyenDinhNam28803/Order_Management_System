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
