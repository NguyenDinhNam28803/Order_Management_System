"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, DollarSign, Building, Eye } from "lucide-react";
import { useProcurement, Department, CurrencyCode } from "../../context/ProcurementContext";
import { formatVND, parseMoney } from "../../utils/formatUtils";
import { CostCenter } from "@/app/types/api-types";

export default function CostCentersPage() {
    const { costCenters, departments, addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, notify, currentUser } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewingCC, setViewingCC] = useState<CostCenter | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
    const [formData, setFormData] = useState<{
        code: string;
        name: string;
        deptId: string;
        budgetAnnual: number;
        currency: CurrencyCode;
    }>({
        code: "",
        name: "",
        deptId: "",
        budgetAnnual: 0,
        currency: CurrencyCode.VND
    });

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
        <main className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Quản lý Cost Center</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">THIẾT LẬP TRUNG TÂM CHI PHÍ VÀ NGÂN SÁCH ĐỊNH MỨC</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-erp-navy text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-erp-navy/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm Cost Center
                </button>
            </div>

            <div className="bg-white rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-8 bg-slate-50/20 border-b border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-4">Finance Structure</div>
                        <div className="text-[10px] font-black text-erp-blue bg-blue-50 px-3 py-1 rounded-full">{costCenters?.length || 0} Cost Centers</div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã hoặc tên..."
                            className="pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-erp-blue/20 w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th>Mã & Tên CC</th>
                                <th>Phòng ban quản lý</th>
                                <th>Ngân sách định mức</th>
                                <th>Đã sử dụng</th>
                                <th className="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costCenters?.map((cc: CostCenter) => {
                                const dept = departments.find(d => d.id === cc.deptId);
                                const usagePercent = cc.budgetAnnual > 0 ? (cc.budgetUsed / cc.budgetAnnual) * 100 : 0;

                                return (
                                    <tr key={cc.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-erp-blue/5 flex items-center justify-center text-erp-blue shadow-sm transition-transform hover:rotate-12">
                                                    <Building size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-erp-navy leading-tight">{cc.name}</div>
                                                    <div className="text-[10px] text-erp-blue font-black mt-1 bg-blue-50 px-2 py-0.5 rounded w-fit capitalize">
                                                        CODE: {cc.code}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Building size={14} className="text-slate-400" />
                                                <span className="font-bold text-slate-600">{dept?.name || "Global / Unassigned"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 font-black text-erp-navy">
                                                <DollarSign size={14} className="text-erp-blue" />
                                                {formatVND(cc.budgetAnnual, true)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="w-48 space-y-2">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-tight">
                                                    <span className="text-slate-400">Used: {formatVND(cc.budgetUsed || 0, true)}</span>
                                                    <span className={usagePercent > 90 ? 'text-red-500' : 'text-erp-blue'}>
                                                        {usagePercent.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' :
                                                                usagePercent > 70 ? 'bg-amber-500' : 'bg-erp-blue'
                                                            }`}
                                                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={() => handleViewDetail(cc.id)}
                                                    className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-erp-blue hover:border-erp-blue/30 rounded-xl transition-all shadow-sm"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(cc)}
                                                    className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-erp-blue hover:border-erp-blue/30 rounded-xl transition-all shadow-sm"
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
                                                    className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-erp-navy/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-erp-navy uppercase mb-2 tracking-tight">
                                {editingCC ? "Cập nhật Cost Center" : "Thêm Trung tâm Chi phí"}
                            </h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10">FINANCIAL MANAGEMENT SYSTEM</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã Cost Center <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            type="text"
                                            placeholder="VD: CC_IT_OPS"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Cost Center</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Chi phí Vận hành IT"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phòng ban liên kết</label>
                                    <select
                                        required
                                        value={formData.deptId}
                                        onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="">Chọn phòng ban</option>
                                        {departments?.map((dept: Department) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngân sách dự kiến (VND)</label>
                                        <input
                                            required
                                            value={formatVND(formData.budgetAnnual)}
                                            onChange={(e) => setFormData({ ...formData, budgetAnnual: parseMoney(e.target.value) })}
                                            type="text"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền tệ</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        >
                                            <option value={CurrencyCode.VND}>VND - Việt Nam Đồng</option>
                                            <option value={CurrencyCode.USD}>USD - Đô la Mỹ</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-slate-100 rounded-3xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-erp-navy text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-erp-navy/20 hover:scale-[1.02] transition-all"
                                    >
                                        {editingCC ? "Lưu thay đổi" : "Tạo Cost Center"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-erp-navy/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-erp-navy uppercase mb-2 tracking-tight">Chi tiết Cost Center</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">FINANCIAL ANALYTICS & STRUCTURE</p>
                                </div>
                                <button onClick={() => setShowDetailModal(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                                    <Plus className="rotate-45" size={24} />
                                </button>
                            </div>

                            {isLoadingDetail ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <div className="h-10 w-10 border-4 border-erp-blue/20 border-t-erp-blue rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                                </div>
                            ) : viewingCC ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8 ring-1 ring-slate-100 p-8 rounded-3xl bg-slate-50/50">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Cost Center</div>
                                            <div className="text-lg font-black text-erp-navy">{viewingCC.code}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Cost Center</div>
                                            <div className="text-lg font-black text-erp-navy">{viewingCC.name}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng ban</div>
                                            <div className="text-sm font-bold text-erp-blue">{viewingCC.department?.name || "Global"}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</div>
                                            <div className={`text-[10px] font-black px-2 py-0.5 rounded w-fit ${viewingCC.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {viewingCC.isActive ? "ĐANG HOẠT ĐỘNG" : "NGƯNG HOẠT ĐỘNG"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hoạt động Ngân sách gần đây</h3>
                                            <span className="text-[10px] font-black text-erp-blue bg-blue-50 px-3 py-1 rounded-full uppercase">
                                                {viewingCC.budgetAllocations?.length || 0} Giao dịch
                                            </span>
                                        </div>
                                        
                                        <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                            {viewingCC.budgetAllocations && viewingCC.budgetAllocations.length > 0 ? (
                                                viewingCC.budgetAllocations.map((alloc) => (
                                                    <div key={alloc.id} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-50 hover:border-slate-100 transition-all shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-erp-blue font-black text-[10px]">
                                                                {alloc.budgetPeriod?.periodNumber ? `Q${alloc.budgetPeriod.periodNumber}` : 'FIX'}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black text-erp-navy">Phân bổ ngân sách {alloc.budgetPeriod?.fiscalYear || ""}</div>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ngày tạo: {new Date(alloc.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-black text-erp-navy">{formatVND(alloc.allocatedAmount, true)}</div>
                                                            <div className="text-[9px] font-bold text-green-500 uppercase">Success</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Chưa có giao dịch nào</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            onClick={() => setShowDetailModal(false)}
                                            className="w-full px-8 py-4 bg-erp-navy text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-erp-navy/20 hover:scale-[1.01] transition-all"
                                        >
                                            Đóng chi tiết
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <p className="text-red-500 font-bold">Không tìm thấy dữ liệu Trung tâm Chi phí này.</p>
                                    <button onClick={() => setShowDetailModal(false)} className="mt-4 text-erp-blue font-black text-xs uppercase tracking-widest underline">Quay lại</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
