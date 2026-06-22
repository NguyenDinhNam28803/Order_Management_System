"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, DollarSign, Building, Eye, X } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { useProcurement, Department, CurrencyCode } from "../../context/ProcurementContext";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { formatVND, parseMoney } from "../../utils/formatUtils";
import { CostCenter } from "@/app/types/api-types";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";
import TableToolbar from "../../components/shared/TableToolbar";

export default function CostCentersPage() {
    const { costCenters, departments, addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchMyDeptCostCenters, refreshData, notify, currentUser } = useProcurement();
    
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });
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

    const columns: DataTableColumn<CostCenter>[] = [
        {
            label: "Mã & Tên Đơn vị", key: "name", sortable: true,
            render: (cc) => (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] border border-[#2563EB]/20 shrink-0">
                        <Building size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{cc.name}</div>
                        <div className="text-[10px] text-[#2563EB] font-bold mt-0.5 tracking-wider num-display">{cc.code}</div>
                    </div>
                </div>
            ),
        },
        {
            label: "Phòng ban quản lý", hideOnMobile: true,
            render: (cc) => <span className="font-medium text-slate-900 text-xs">{departments.find(d => d.id === cc.deptId)?.name || "Hệ thống chung"}</span>,
        },
        {
            label: "Ngân sách định mức", align: "right",
            render: (cc) => (
                <div className="flex items-center justify-end gap-1.5 font-bold text-slate-900 num-display">
                    <DollarSign size={14} className="text-slate-400" />
                    {formatVND(cc.budgetAnnual)}
                </div>
            ),
        },
        {
            label: "Tình trạng tiêu thụ",
            render: (cc) => {
                const annual = Number(cc.budgetAnnual) || 0;
                const used = Number(cc.budgetUsed) || 0;
                const usagePercent = annual > 0 ? (used / annual) * 100 : 0;
                return (
                    <div className="space-y-1.5 max-w-[200px]">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-900 uppercase tracking-wider num-display">{formatVND(cc.budgetUsed || 0)}</span>
                            <span className={usagePercent > 90 ? 'text-rose-500 num-display' : 'text-[#2563EB] num-display'}>{usagePercent.toFixed(1)}%</span>
                        </div>
                        <div className="budget-meter">
                            <div
                                className={`h-full transition-all duration-700 ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-400' : 'bg-[#2563EB]'}`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            label: "Thao tác", align: "right",
            render: (cc) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => handleViewDetail(cc.id)} className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-colors text-slate-900 hover:text-[#2563EB]" title="Xem chi tiết">
                        <Eye size={14} />
                    </button>
                    <button onClick={() => handleOpenModal(cc)} className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-colors text-slate-900 hover:text-[#2563EB]" title="Sửa">
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => setConfirmState({
                            open: true,
                            title: "Xóa trung tâm chi phí",
                            message: "Bạn có chắc chắn muốn xóa trung tâm chi phí này?",
                            onConfirm: () => { removeCostCenter(cc.id); setConfirmState(s => ({ ...s, open: false })); }
                        })}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-slate-500 hover:text-red-500"
                        aria-label="Xóa"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="animate-in fade-in duration-500 p-6 space-y-6">
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <PageHeader
                icon={DollarSign}
                iconColor="blue"
                title="Quản lý Cost Center"
                subtitle="Cấu hình bộ phận và phân bổ ngân sách định mức."
                actions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> Thêm Cost Center
                    </button>
                }
            />

            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm kiếm mã hoặc tên..."
                    filters={
                        <>
                            <button
                                onClick={toggleMyDept}
                                className={`text-[10px] font-black px-4 h-10 rounded-lg transition-all border ${isMyDept ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#2563EB]/30'}`}
                            >
                                {isMyDept ? "PHÒNG BAN CỦA TÔI" : "TẤT CẢ ĐƠN VỊ"}
                            </button>
                            <select
                                value={selectedDeptId}
                                onChange={(e) => setSelectedDeptId(e.target.value)}
                                className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                            >
                                <option value="">Tất cả phòng ban</option>
                                {departments?.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </>
                    }
                />
                <DataTable
                    columns={columns}
                    data={filteredCostCenters ?? []}
                    pageSize={12}
                    getRowKey={(cc) => cc.id}
                    emptyMessage="Chưa có cost center nào"
                    emptyDescription="Nhấn 'Thêm Cost Center' để bắt đầu"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingCC ? "Cập nhật Cost Center" : "Thêm Trung tâm Chi phí"}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-900 hover:text-slate-900"><X size={20}/></button>
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
                                            className="erp-input font-bold text-[#2563EB]"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                             <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                                <h2 className="text-xl font-bold text-slate-900">Chi tiết Trung tâm Chi phí</h2>
                                <button onClick={() => setShowDetailModal(false)} className="text-slate-900 hover:text-slate-900"><X size={20}/></button>
                            </div>

                            {isLoadingDetail ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <div className="h-10 w-10 border-4 border-[#F1F5F9] border-t-[#2563EB] rounded-full animate-spin"></div>
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Đang trích xuất dữ liệu...</span>
                                </div>
                            ) : viewingCC ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8 p-6 bg-[#FFFFFF] rounded-xl border border-slate-200 shadow-inner">
                                        <div className="form-group">
                                            <label className="erp-label">Mã định danh</label>
                                            <div className="text-sm font-bold text-[#2563EB] tracking-wider">{viewingCC.code}</div>
                                        </div>
                                        <div className="form-group">
                                            <label className="erp-label">Tên hiển thị</label>
                                            <div className="text-sm font-bold text-slate-900">{viewingCC.name}</div>
                                        </div>
                                        <div className="form-group">
                                            <label className="erp-label">Quản lý bởi</label>
                                            <div className="text-sm font-semibold text-slate-900">{viewingCC.department?.name || "Tất cả"}</div>
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
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Lịch sử cấp phát ngân sách (Quarterly)</h3>
                                            <div className="status-pill status-draft py-0.5 px-3">{viewingCC.budgetAllocations?.length || 0} Đợt cấp</div>
                                        </div>
                                        
                                        <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                                            {viewingCC.budgetAllocations && viewingCC.budgetAllocations.length > 0 ? (
                                                viewingCC.budgetAllocations.map((alloc) => (
                                                    <div key={alloc.id} className="flex justify-between items-center p-4 rounded-xl bg-[#FFFFFF] border border-slate-200 hover:border-[#2563EB]/30 transition-all shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#2563EB] font-bold text-xs border border-slate-200">
                                                                {alloc.budgetPeriod?.periodNumber ? `Q${alloc.budgetPeriod.periodNumber}` : 'FY'}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-900">Ngân sách {alloc.budgetPeriod?.fiscalYear || "Hàng năm"}</div>
                                                                <div className="text-[10px] text-slate-900 font-medium italic">Ngày cập nhật: {new Date(alloc.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-slate-900">{formatVND(alloc.allocatedAmount)}</div>
                                                            <div className="text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-tighter">Đã ghi nhận</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-12 text-center bg-[#FFFFFF] rounded-xl border border-dashed border-slate-200">
                                                    <p className="text-xs font-medium text-slate-900 italic">Chưa có dữ liệu phân bổ ngân sách chi tiết cho đơn vị này</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowDetailModal(false)}
                                        className="w-full btn-secondary py-3 text-slate-900 bg-[#FFFFFF] border-slate-200"
                                    >
                                        Đóng thông tin
                                    </button>
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <p className="text-red-400 font-bold">Không trích xuất được hồ sơ đơn vị.</p>
                                    <button onClick={() => setShowDetailModal(false)} className="mt-4 text-[#2563EB] font-bold text-xs hover:underline">Vui lòng thử lại</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

