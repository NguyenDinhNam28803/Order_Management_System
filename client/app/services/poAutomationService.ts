/**
 * PO Automation Service
 * Xử lý tự động hóa sau khi tạo PO:
 * - Kiểm tra ngưỡng giá
 * - Tạo hợp đồng tự động nếu đạt ngưỡng
 * - Gửi thông báo cho nhà cung cấp
 */

import { PO } from "../context/ProcurementContext";
import { Contract, CurrencyCode, ContractStatus } from "../types/api-types";

export interface POAutomationConfig {
  // Ngưỡng giá tối thiểu để tạo hợp đồng (VND)
  contractThreshold: number;
  // Số ngày hiệu lực hợp đồng mặc định
  defaultContractDays: number;
  // Tự động gửi email cho nhà cung cấp
  autoSendEmail: boolean;
}

export interface AutomationResult {
  success: boolean;
  poId: string;
  contractCreated: boolean;
  contractId?: string;
  message: string;
  emailSent?: boolean;
}

// Cấu hình mặc định
export const defaultAutomationConfig: POAutomationConfig = {
  contractThreshold: 50_000_000, // 50 triệu VND
  defaultContractDays: 365, // 1 năm
  autoSendEmail: true,
};

/**
 * Kiểm tra PO có đạt ngưỡng để tạo hợp đồng không
 */
export function shouldCreateContract(
  po: PO,
  config: POAutomationConfig = defaultAutomationConfig
): boolean {
  return (po.total ?? po.totalAmount ?? 0) >= config.contractThreshold;
}

/**
 * Tạo dữ liệu hợp đồng từ PO
 */
export function generateContractFromPO(
  po: PO,
  config: POAutomationConfig = defaultAutomationConfig
): Partial<Contract> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + config.defaultContractDays);

  return {
    title: `Hợp đồng từ PO ${po.poNumber}`,
    description: `Hợp đồng tự động tạo từ đơn hàng ${po.poNumber} với giá trị ${(po.total ?? po.totalAmount ?? 0).toLocaleString('vi-VN')} VND`,
    supplierId: po.supplierId || po.vendor,
    poId: po.id,
    totalValue: po.total ?? po.totalAmount,
    currency: CurrencyCode.VND,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    status: ContractStatus.DRAFT,
  };
}

/**
 * Tạo nội dung email thông báo hợp đồng
 */
export function generateContractEmailContent(
  po: PO,
  contract: Partial<Contract>,
  supplierName: string
): { subject: string; body: string } {
  const subject = `Hợp đồng mới từ PO ${po.poNumber} - Giá trị ${(po.total ?? po.totalAmount ?? 0).toLocaleString('vi-VN')} VND`;
  
  const body = `
Kính gửi ${supplierName},

Hệ thống đã tự động tạo hợp đồng từ đơn hàng ${po.poNumber} với thông tin sau:

📋 THÔNG TIN HỢP ĐỒNG:
- Mã hợp đồng: ${contract.contractNumber || 'Đang chờ cấp số'}
- Giá trị: ${(po.total ?? po.totalAmount ?? 0).toLocaleString('vi-VN')} VND
- Ngày bắt đầu: ${contract.startDate}
- Ngày kết thúc: ${contract.endDate}
- Trạng thái: Chờ ký kết

📦 CHI TIẾT ĐƠN HÀNG:
- Mã PO: ${po.poNumber}
- Nhà cung cấp: ${supplierName}
- Tổng giá trị: ${(po.total ?? po.totalAmount ?? 0).toLocaleString('vi-VN')} VND

Vui lòng đăng nhập vào hệ thống để xem chi tiết và ký kết hợp đồng.

Trân trọng,
Hệ thống Quản lý Mua hàng
`;

  return { subject, body };
}

/**
 * Hook automation chính
 */
export function usePOAutomation() {
  /**
   * Xử lý automation sau khi tạo PO
   */
  const processPOAutomation = async (
    po: PO,
    createContractFn: (data: Partial<Contract>) => Promise<boolean>,
    sendEmailFn?: (supplierId: string, subject: string, body: string) => Promise<boolean>,
    config: POAutomationConfig = defaultAutomationConfig
  ): Promise<AutomationResult> => {
    try {
      // Kiểm tra ngưỡng giá
      if (!shouldCreateContract(po, config)) {
        return {
          success: true,
          poId: po.id,
          contractCreated: false,
          message: `PO ${po.poNumber} không đạt ngưỡng giá ${config.contractThreshold.toLocaleString('vi-VN')} VND để tạo hợp đồng`,
        };
      }

      // Tạo hợp đồng
      const contractData = generateContractFromPO(po, config);
      const contractCreated = await createContractFn(contractData);

      if (!contractCreated) {
        return {
          success: false,
          poId: po.id,
          contractCreated: false,
          message: `Không thể tạo hợp đồng từ PO ${po.poNumber}`,
        };
      }

      // Gửi email nếu được cấu hình và có function gửi email
      let emailSent = false;
      if (config.autoSendEmail && sendEmailFn && po.supplierId) {
        const { subject, body } = generateContractEmailContent(
          po,
          contractData,
          po.vendor || 'Nhà cung cấp'
        );
        emailSent = await sendEmailFn(po.supplierId, subject, body);
      }

      return {
        success: true,
        poId: po.id,
        contractCreated: true,
        message: `Đã tạo hợp đồng tự động từ PO ${po.poNumber}${emailSent ? ' và gửi email thông báo' : ''}`,
        emailSent,
      };
    } catch (error) {
      return {
        success: false,
        poId: po.id,
        contractCreated: false,
        message: `Lỗi automation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  return {
    processPOAutomation,
    shouldCreateContract,
    generateContractFromPO,
    defaultAutomationConfig,
  };
}

export default usePOAutomation;
