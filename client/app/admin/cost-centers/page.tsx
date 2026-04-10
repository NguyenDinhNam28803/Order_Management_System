"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, DollarSign, Building, Eye, X } from "lucide-react";
import { useProcurement, Department, CurrencyCode } from "../../context/ProcurementContext";
import { formatVND, parseMoney } from "../../utils/formatUtils";
import { CostCenter } from "@/app/types/api-types";

export default function CostCentersPage() {
    const { costCenters, departments, addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchMyDeptCostCenters, refreshData, notify, currentUser } = useProcurement();
    
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewingCC, setViewingCC] = useState<CostCenter | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
    
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        deptId: "",
        budgetAnnual: 0,
        currency: CurrencyCode.VND
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDeptId, setSelectedDeptId] = useState("");
    const [isMyDept, setIsMyDept] = useState(false);

    const filteredCostCenters = costCenters?.filter((cc: CostCenter) => {
        const matchesSearch = cc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             cc.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = !selectedDeptId || cc.deptId === selectedDeptId;
        return matchesSearch && matchesDept;
    });

    const toggleMyDept = async () => {
        if (!isMyDept) {
            await fetchMyDeptCostCenters();
            setIsMyDept(true);
        } else {
            await refreshData();
            setIsMyDept(false);
        }
    };

    const handleOpenModal = (cc?: CostCenter) => {
        if (cc) {
            setEditingCC(cc);
            setFormData({
                code: cc.code,
                name: cc.name,
                deptId: cc.deptId || "",
                budgetAnnual: Number(cc.budgetAnnual) || 0,
                currency: cc.currency || CurrencyCode.VND
            });
        } else {
            setEditingCC(null);
            setFormData({
                code: "",
                name: "",
                deptId: departments?.[0]?.id || "",
                budgetAnnual: 0,
                currency: CurrencyCode.VND
            });
        }
        setShowModal(true);
    };

    const handleViewDetail = async (id: string) => {
        setIsLoadingDetail(true);
        setShowDetailModal(true);
        try {
            const data = await fetchCostCenter(id);
            setViewingCC(data);
        } catch (error) {
            console.error("Lỗi khi tải chi tiết CC:", error);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.code.trim()) {
            notify("Mã Cost Center không được để trống", "error");
            return;
        }

        if (!currentUser?.orgId) {
            notify("Không tìm thấy thông tin tổ chức. Vui lòng đăng nhập lại.", "error");
            return;
        }

        const payload = {
            ...formData,
            orgId: currentUser.orgId
        };

        let success = false;
        if (editingCC) {
            const { orgId, currency, ...updatePayload } = payload;
            success = await updateCostCenter(editingCC.id, updatePayload);
        } else {
            success = await addCostCenter(payload);
        }

        if (success) {
            setShowModal(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">

            <div className="mt-8 flex justify-between items-end mb-10 border-b border-[rgba(148,163,184,0.1)] pb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight uppercase">Quản lý Cost Center</h1>
                    <p className="text-sm text-[#64748B] mt-1 font-medium italic">CẤU HÌNH BỘ PHẬN VÀ PHÂN BỔ NGÂN SÁCH ĐỊNH MỨC</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#3B82F6] text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#3B82F6]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm Cost Center
                </button>
            </div>

            <div className="erp-card p-0! overflow-hidden bg-[#161922] shadow-sm border border-[rgba(148,163,184,0.1)]">
                <div className="p-5 bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Hệ thống:</span>
                        <div className="status-pill status-approved py-0.5 px-3">{costCenters?.length || 0} Đơn vị</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={toggleMyDept}
                            className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all border ${isMyDept ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-transparent text-[#64748B] border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30'}`}
                        >
                            {isMyDept ? "PHÒNG BAN CỦA TÔI" : "TẤT CẢ ĐƠN VỊ"}
                        </button>

                        <select
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                            className="erp-input py-2 text-[10px] font-bold w-48 shadow-sm bg-[#0F1117] border-[rgba(148,163,184,0.1)] text-[#F8FAFC] outline-none"
                        >
                            <option value="">Tất cả phòng ban</option>
                            {departments?.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={14} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mã hoặc tên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="erp-input pl-10 py-2 text-xs w-64 h-10 shadow-sm bg-[#0F1117] border-[rgba(148,163,184,0.1)] text-[#F8FAFC] placeholder:text-[#64748B]"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="erp-table border-none">
                        <thead>
                            <tr>
                                <th>Mã & Tên Đơn vị</th>
                                <th>Phòng ban quản lý</th>
                                <th>Ngân sách định mức</th>
                                <th className="w-64">Tình trạng tiêu thụ</th>
                                <th className="text-right pr-6">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCostCenters?.map((cc: CostCenter) => {
                                const dept = departments.find(d => d.id === cc.deptId);
                                const annual = Number(cc.budgetAnnual) || 0;
                                const used = Number(cc.budgetUsed) || 0;
                                const usagePercent = annual > 0 ? (used / annual) * 100 : 0;

                                return (
                                    <tr key={cc.id} className="hover:bg-[#0F1117]/50 transition-colors border-b border-[rgba(148,163,184,0.1)]">
                                        <td className="py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/20">
                                                    <Building size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-[#F8FAFC] leading-tight">{cc.name}</div>
                                                    <div className="text-[10px] text-[#3B82F6] font-bold mt-0.5 tracking-wider">
                                                        {cc.code}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[#94A3B8] text-xs">{dept?.name || "Hệ thống chung"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                                                <DollarSign size={14} className="text-[#64748B]" />
                                                {formatVND(cc.budgetAnnual)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1.5 max-w-50">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-[#64748B] uppercase tracking-wider">{formatVND(cc.budgetUsed || 0)}</span>
                                                    <span className={usagePercent > 90 ? 'text-red-400' : 'text-[#3B82F6]'}>
                                                        {usagePercent.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="budget-meter">
                                                    <div
                                                        className={`h-full transition-all duration-700 ${usagePercent > 90 ? 'bg-red-500' :
                                                                 usagePercent > 70 ? 'bg-amber-400' : 'bg-[#3B82F6]'
                                                            }`}
                                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetail(cc.id)}
                                                    className="p-2 border border-[rgba(148,163,184,0.1)] rounded-lg hover:bg-[#0F1117] transition-colors text-[#64748B] hover:text-[#3B82F6]"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(cc)}
                                                    className="p-2 border border-[rgba(148,163,184,0.1)] rounded-lg hover:bg-[#0F1117] transition-colors text-[#64748B] hover:text-[#3B82F6]"
                                                    title="Sửa"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if(confirm("Bạn có chắc chắn muốn xóa trung tâm chi phí này?")) {
                                                            removeCostCenter(cc.id);
                                                        }
                                                    }}
                                                    className="p-2 border border-[rgba(148,163,184,0.1)] rounded-lg hover:bg-red-500/10 hover:border-red-500/30 transition-colors text-[#64748B] hover:text-red-400"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1117]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#161922] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)] animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8 border-b border-[rgba(148,163,184,0.1)] pb-4">
                                <h2 className="text-xl font-bold text-[#F8FAFC]">
                                    {editingCC ? "Cập nhật Cost Center" : "Thêm Trung tâm Chi phí"}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#F8FAFC]"><X size={20}/></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="erp-label">Mã Cost Center <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            type="text"
                                            placeholder="VD: CC_IT_OPS"
                                            className="erp-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="erp-label">Tên bộ phận/Đơn vị</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Chi phí Vận hành IT"
                                            className="erp-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="erp-label">Phòng ban liên kết</label>
                                    <select
                                        required
                                        value={formData.deptId}
                                        onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}
                                        className="erp-input"
                                    >
                                        <option value="">-- Chọn phòng ban --</option>
                                        {departments?.map((dept: Department) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="erp-label">Ngân sách hàng năm (VND)</label>
                                        <input
                                            required
                                            value={formatVND(formData.budgetAnnual)}
                                            onChange={(e) => setFormData({ ...formData, budgetAnnual: parseMoney(e.target.value) })}
                                            type="text"
                                            className="erp-input font-bold text-[#3B82F6]"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="erp-label">Loại tiền tệ</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                                            className="erp-input"
                                        >
                                            <option value={CurrencyCode.VND}>VND - Việt Nam Đồng</option>
                                            <option value={CurrencyCode.USD}>USD - Đô la Mỹ</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1 py-3"
                                    >
                                        {editingCC ? "Lưu thay đổi" : "Khởi tạo Cost Center"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1117]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#161922] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)] animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                             <div className="flex justify-between items-center mb-8 border-b border-[rgba(148,163,184,0.1)] pb-4">
                                <h2 className="text-xl font-bold text-[#F8FAFC]">Chi tiết Trung tâm Chi phí</h2>
                                <button onClick={() => setShowDetailModal(false)} className="text-[#64748B] hover:text-[#F8FAFC]"><X size={20}/></button>
                            </div>

                            {isLoadingDetail ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <div className="h-10 w-10 border-4 border-[#161922] border-t-[#3B82F6] rounded-full animate-spin"></div>
                                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Đang trích xuất dữ liệu...</span>
                                </div>
                            ) : viewingCC ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8 p-6 bg-[#0F1117] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-inner">
                                        <div className="form-group">
                                            <label className="erp-label">Mã định danh</label>
                                            <div className="text-sm font-bold text-[#3B82F6] tracking-wider">{viewingCC.code}</div>
                                        </div>
                                        <div className="form-group">
                                            <label className="erp-label">Tên hiển thị</label>
                                            <div className="text-sm font-bold text-[#F8FAFC]">{viewingCC.name}</div>
                                        </div>
                                        <div className="form-group">
                                            <label className="erp-label">Quản lý bởi</label>
                                            <div className="text-sm font-semibold text-[#94A3B8]">{viewingCC.department?.name || "Tất cả"}</div>
                                        </div>
                                        <div className="form-group">
                                            <label className="erp-label">Trạng thái vận hành</label>
                                            <div className={`status-pill ${viewingCC.isActive ? 'status-approved' : 'status-rejected'} py-0.5 px-3`}>
                                                {viewingCC.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Lịch sử cấp phát ngân sách (Quarterly)</h3>
                                            <div className="status-pill status-draft py-0.5 px-3">{viewingCC.budgetAllocations?.length || 0} Đợt cấp</div>
                                        </div>
                                        
                                        <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                                            {viewingCC.budgetAllocations && viewingCC.budgetAllocations.length > 0 ? (
                                                viewingCC.budgetAllocations.map((alloc) => (
                                                    <div key={alloc.id} className="flex justify-between items-center p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-lg bg-[#161922] flex items-center justify-center text-[#3B82F6] font-bold text-xs border border-[rgba(148,163,184,0.1)]">
                                                                {alloc.budgetPeriod?.periodNumber ? `Q${alloc.budgetPeriod.periodNumber}` : 'FY'}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-[#F8FAFC]">Ngân sách {alloc.budgetPeriod?.fiscalYear || "Hàng năm"}</div>
                                                                <div className="text-[10px] text-[#64748B] font-medium italic">Ngày cập nhật: {new Date(alloc.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-[#F8FAFC]">{formatVND(alloc.allocatedAmount)}</div>
                                                            <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Đã ghi nhận</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-12 text-center bg-[#0F1117] rounded-xl border border-dashed border-[rgba(148,163,184,0.2)]">
                                                    <p className="text-xs font-medium text-[#64748B] italic">Chưa có dữ liệu phân bổ ngân sách chi tiết cho đơn vị này</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="w-full btn-secondary py-3 text-[#94A3B8] bg-[#0F1117] border-[rgba(148,163,184,0.1)]"
                                    >
                                        Đóng thông tin
                                    </button>
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <p className="text-red-400 font-bold">Không trích xuất được hồ sơ đơn vị.</p>
                                    <button onClick={() => setShowDetailModal(false)} className="mt-4 text-[#3B82F6] font-bold text-xs hover:underline">Vui lòng thử lại</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
