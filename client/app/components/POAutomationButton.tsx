"use client";

import { useState } from "react";
import { useProcurement } from "../context/ProcurementContext";
import { Loader2, Bot, FileText, Mail } from "lucide-react";

interface POAutomationButtonProps {
  poId: string;
  poNumber: string;
  totalAmount: number;
  onSuccess?: (result: { contractCreated: boolean; message: string }) => void;
}

export function POAutomationButton({ 
  poId, 
  poNumber, 
  totalAmount,
  onSuccess 
}: POAutomationButtonProps) {
  const { processPOAutomation } = useProcurement();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ contractCreated: boolean; message: string } | null>(null);

  const handleAutomation = async () => {
    setLoading(true);
    try {
      const automationResult = await processPOAutomation(poId);
      if (automationResult) {
        const resultData = {
          contractCreated: automationResult.contractCreated ?? false,
          message: automationResult.message
        };
        setResult(resultData);
        onSuccess?.(resultData);
      }
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className={`p-4 rounded-lg border ${
        result.contractCreated 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-[#F9EFEC] border-[#E6BCB0]'
      }`}>
        <div className="flex items-start gap-3">
          {result.contractCreated ? (
            <FileText className="w-5 h-5 text-emerald-600 mt-0.5" />
          ) : (
            <Bot className="w-5 h-5 text-[#A85032] mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              result.contractCreated ? 'text-emerald-800' : 'text-blue-800'
            }`}>
              {result.contractCreated ? 'Hợp đồng đã được tạo!' : 'Kiểm tra hoàn tất'}
            </p>
            <p className={`text-sm mt-1 ${
              result.contractCreated ? 'text-emerald-600' : 'text-[#A85032]'
            }`}>
              {result.message}
            </p>
            {result.contractCreated && (
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600">
                <Mail className="w-4 h-4" />
                <span>Email đã được gửi cho nhà cung cấp</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleAutomation}
      disabled={loading}
      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang xử lý automation...
        </>
      ) : (
        <>
          <Bot className="w-4 h-4" />
          Kiểm tra tự động tạo hợp đồng
        </>
      )}
    </button>
  );
}

export function useAutoPOAutomation() {
  const { processPOAutomation, notify } = useProcurement();

  const autoProcess = async (poId: string, poNumber: string, totalAmount: number) => {
    const threshold = 50_000_000;
    
    if (totalAmount >= threshold) {
      notify(`PO ${poNumber} đạt ngưỡng ${threshold.toLocaleString('vi-VN')} VND. Đang tạo hợp đồng...`, 'info');
      
      try {
        const result = await processPOAutomation(poId);
        if (result?.contractCreated) {
          notify(result.message, 'success');
        }
        return result;
      } catch (error) {
        notify('Lỗi khi tạo hợp đồng tự động', 'error');
        return null;
      }
    }
    
    return null;
  };

  return { autoProcess };
}

export default POAutomationButton;

