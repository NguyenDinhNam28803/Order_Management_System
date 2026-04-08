"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { formatVND } from "../../utils/formatUtils";
import { useProcurement, Product, BudgetAllocation, PR } from "../../context/ProcurementContext";
import { CostCenter, CreatePrDto, CurrencyCode, BudgetAllocationStatus } from "@/app/types/api-types";
import { Trash2, FileText, Wallet, BarChart3, TrendingUp, PieChart, CheckCircle2, Loader2, XCircle, ArrowLeft, Activity, ChevronDown, ShoppingCart, AlertTriangle, Zap, Bot, Sparkles } from "lucide-react";

// --- Components ---

const AllocationStatusBadge = ({ status }: { status: BudgetAllocationStatus }) => {
    const map: Record<BudgetAllocationStatus, { label: string; cls: string }> = {
        APPROVED:  { label: "Đã phê duyệt", cls: "status-approved" },
        REJECTED:  { label: "Bị từ chối",   cls: "status-rejected" },
        DRAFT:     { label: "Nháp",             cls: "status-draft" },
        SUBMITTED: { label: "Chờ duyệt",     cls: "status-pending" },
    };
    const cfg = map[status] ?? map.DRAFT;
    return (
        <span className={`status-pill ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
};

const BudgetAllocationCard = ({
    allocation,
    isSelected,
    onClick,
}: {
    allocation: BudgetAllocation;
    isSelected: boolean;
    onClick: () => void;
}) => {
    const spent    = Number(allocation.spentAmount    || 0);
    const committed = Number(allocation.committedAmount || 0);
    const total    = Number(allocation.allocatedAmount || 1);
    const usedPct  = Math.min(100, ((spent + committed) / total) * 100);
    const remaining = total - spent - committed;
    const isOver   = remaining < 0;

    return (
        <div
            onClick={onClick}
            className={`group relative cursor-pointer rounded-[32px] border-2 p-6 transition-all duration-300 shadow-xl
                ${isSelected
                    ? "border-[#3B82F6] bg-[#3B82F6]/5 shadow-[#3B82F6]/10 scale-[1.02]"
                    : "border-[rgba(148,163,184,0.1)] bg-[#0F1117] hover:border-[#3B82F6]/30 hover:bg-[#161922]"
                }`}
        >
            <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all ${isSelected ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30" : "bg-[#161922] text-[#64748B] group-hover:text-[#3B82F6]"}`}>
                        <Wallet size={16} />
                    </div>
                    <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#64748B] mb-0.5">{String(allocation.notes || "Hạng mục ngân sách")}</div>
                        <div className={`text-sm font-black tracking-tight ${isSelected ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>
                            {formatVND(total)} <span className="text-[10px] font-bold opacity-30 uppercase ml-1">{String(allocation.currency || "VND")}</span>
                        </div>
                    </div>
                </div>
                <AllocationStatusBadge status={allocation.status as BudgetAllocationStatus} />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: "Đã chi",     value: spent,     color: "text-[#64748B]", bg: "bg-[#0F1117]" },
                    { label: "Cam kết",    value: committed, color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/5" },
                    { label: "Còn lại",    value: remaining, color: isOver ? "text-rose-400" : "text-emerald-400", bg: isOver ? "bg-rose-500/5" : "bg-emerald-500/5" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl p-3 text-center border border-[rgba(148,163,184,0.05)]`}>
                        <div className="text-[7px] font-black uppercase tracking-widest text-[#64748B] mb-1">{label}</div>
                        <div className={`text-[10px] font-black ${color} tracking-tight`}>
                            {formatVND(Math.abs(value))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-[#64748B]">Mức sử dụng</span>
                    <span className={isOver ? "text-rose-400" : "text-[#3B82F6]"}>{usedPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#161922] rounded-full overflow-hidden flex shadow-inner">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(100, (spent / total) * 100)}%` }} />
                    <div className={`${isOver ? "bg-rose-400" : "bg-indigo-400 opacity-60"} h-full transition-all duration-1000`} style={{ width: `${Math.min(100 - (spent / total) * 100, (committed / total) * 100)}%` }} />
                </div>
            </div>
        </div>
    );
};

const BudgetAllocationsPanel = ({
    allocations,
    selectedCostCenterId,
    selectedAllocationId,
    onSelect,
}: {
    allocations: BudgetAllocation[];
    selectedCostCenterId: string;
    selectedAllocationId: string | null;
    onSelect: (id: string) => void;
}) => {
    const filtered = selectedCostCenterId
        ? allocations.filter(a => a.costCenterId === selectedCostCenterId)
        : allocations;

    const totalAllocated  = filtered.reduce((s, a) => s + Number(a.allocatedAmount || 0), 0);
    const totalSpent      = filtered.reduce((s, a) => s + Number(a.spentAmount || 0), 0);
    const totalCommitted  = filtered.reduce((s, a) => s + Number(a.committedAmount || 0), 0);
    const totalRemaining  = totalAllocated - totalSpent - totalCommitted;

    return (
        <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
            <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117]/50">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8FAFC] flex items-center gap-3">
                     <PieChart size={16} className="text-[#3B82F6]" /> Phân bổ Ngân sách Chi tiết
                 </h3>
            </div>

            <div className="p-10">
                {filtered.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            { icon: <Wallet size={14} />, label: "Tổng cấp phát",  value: totalAllocated,  color: "text-[#F8FAFC]",     bg: "bg-[#0F1117]" },
                            { icon: <TrendingUp size={14} />, label: "Đã tiêu thụ", value: totalSpent,      color: "text-[#94A3B8]",    bg: "bg-[#0F1117]" },
                            { icon: <Sparkles size={14} />,   label: "Đang cam kết", value: totalCommitted, color: "text-[#3B82F6]",    bg: "bg-[#3B82F6]/5" },
                            { icon: <CheckCircle2 size={14} />, label: "Còn khả dụng", value: totalRemaining, color: totalRemaining < 0 ? "text-rose-400" : "text-emerald-400", bg: totalRemaining < 0 ? "bg-rose-500/5" : "bg-emerald-500/5" },
                        ].map(({ icon, label, value, color, bg }) => (
                            <div key={label} className={`${bg} rounded-[32px] p-6 border border-[rgba(148,163,184,0.05)] shadow-sm hover:translate-y-[-2px] transition-all`}>
                                <p className={`flex items-center gap-2 opacity-60 text-[8px] font-black uppercase tracking-widest text-[#64748B] mb-2`}>
                                    {icon} {label}
                                </p>
                                <div className={`text-sm font-black ${color} tracking-tight`}>
                                    {formatVND(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filtered.length === 0 ? (
                    <div className="py-20 text-center bg-[#0F1117] rounded-[32px] border border-dashed border-[rgba(148,163,184,0.1)]">
                        <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest opacity-50">Không tìm thấy dữ liệu ngân sách cho trung tâm chi phí này</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filtered.map(allocation => (
                            <BudgetAllocationCard
                                key={allocation.id}
                                allocation={allocation}
                                isSelected={selectedAllocationId === allocation.id}
                                onClick={() => onSelect(allocation.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Page Logic ---

interface PRItem {
    id?: string;
    productId?: string;
    productDesc: string;
    sku?: string;
    categoryId?: string;
    qty: number;
    unit: string;
    estimatedPrice: number;
    basePrice: number;
    supplierName: string;
    aiStatus: boolean;
    aiLabel: string;
    specNote: string;
    currency?: CurrencyCode;
}

interface PRForm {
    title: string;
    description: string;
    justification: string;
    requiredDate: string;
    priority: number;
    currency: CurrencyCode;
    costCenterId: string;
    items: PRItem[];
}

const isValidUuid = (id: string | undefined): boolean => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

export default function CreatePRPage() {
    const { 
        addPR,
        submitPR,
        costCenters, 
        currentUser, 
        products, 
        budgetAllocations, 
        fetchQuarterlyAllocation
    } = useProcurement();

    const router = useRouter();
    const [form, setForm] = useState<PRForm>({
        title: "",
        description: "",
        justification: "",
        requiredDate: "",
        priority: 2,
        currency: CurrencyCode.VND,
        costCenterId: "",
        items: []
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quarterlyAllocation, setQuarterlyAllocation] = useState<BudgetAllocation | null>(null);
    const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentQuarter = Math.floor((today.getMonth() + 3) / 3);

    useEffect(() => {
        if (form.costCenterId && isValidUuid(form.costCenterId)) {
            const getBudget = async () => {
                const data = await fetchQuarterlyAllocation(form.costCenterId, currentYear, currentQuarter);
                setQuarterlyAllocation(data || null);
                if (data?.id) setSelectedAllocationId(data.id);
            };
            getBudget();
        }
    }, [form.costCenterId, fetchQuarterlyAllocation, currentYear, currentQuarter]);

    const filteredCostCenters = costCenters.filter((cc: CostCenter) => {
        if (!currentUser) return false;
        if (currentUser.role === "PLATFORM_ADMIN" || currentUser.role === "PROCUREMENT") return true;
        return !currentUser.deptId || !cc.deptId || cc.deptId === currentUser.deptId;
    });

    useEffect(() => {
        if (!form.costCenterId && filteredCostCenters.length > 0) {
            setForm(prev => ({ ...prev, costCenterId: filteredCostCenters[0].id }));
        }
    }, [filteredCostCenters, form.costCenterId]);

    const activeCC = filteredCostCenters.find((cc: CostCenter) => cc.id === form.costCenterId);
    const totalEstimate = form.items.reduce((sum: number, item: PRItem) => sum + (item.qty * item.estimatedPrice), 0);
    
    const remainingBudget = quarterlyAllocation
        ? (Number(quarterlyAllocation.allocatedAmount) - Number(quarterlyAllocation.spentAmount || 0) - Number(quarterlyAllocation.committedAmount || 0))
        : 0;

    const addItem = (option: { value: string; label: string }) => {
        const product = products.find((p: Product) => p.id === option.value);
        if (!product) return;
        
        setForm(prev => ({
            ...prev,
            items: [...prev.items, {
                productId: product.id,
                productDesc: product.name,
                sku: product.sku,
                categoryId: product.categoryId,
                qty: 1,
                unit: product.unit || "PCS",
                estimatedPrice: product.unitPriceRef || 0,
                basePrice: product.unitPriceRef || 0,
                supplierName: "Thị trường",
                aiStatus: true,
                aiLabel: "GIÁ TỐT NHẤT",
                specNote: ""
            }]
        }));
    };

    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async () => {
        if (!form.title || form.items.length === 0 || !form.costCenterId) {
            setErrorMessage("Vui lòng nhập đầy đủ tiêu đề, trung tâm chi phí và ít nhất 1 sản phẩm.");
            setSubmissionStatus('error');
            return;
        }

        const payload: CreatePrDto = {
            title: form.title.trim(),
            description: form.description,
            justification: form.justification,
            priority: Number(form.priority),
            currency: form.currency,
            costCenterId: form.costCenterId,
            items: form.items.map(i => ({
                productDesc: i.productDesc,
                productId: i.productId,
                qty: Number(i.qty),
                estimatedPrice: Number(i.estimatedPrice),
                unit: i.unit,
                currency: i.currency || form.currency
            }))
        };

        setSubmissionStatus('loading');
        setIsSubmitting(true);
        try {
            const createdPR = await addPR(payload);
            if (createdPR?.id) {
                await submitPR(createdPR.id);
                setSubmissionStatus('success');
                setTimeout(() => router.push("/pr"), 2000);
            } else {
                setSubmissionStatus('error');
                setErrorMessage("Không thể tạo PR");
            }
        } catch (err) {
            setSubmissionStatus('error');
            setErrorMessage("Lỗi hệ thống");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-700 space-y-12">
            {/* PAGE HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[rgba(148,163,184,0.1)] pb-10">
                <div>
                   <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2">Tạo Phiếu Yêu Cầu (PR)</h1>
                   <p className="text-sm font-bold text-[#64748B] tracking-tight uppercase">
                      Xin chào, <span className="text-[#3B82F6]">{currentUser?.name || currentUser?.fullName}</span> – Hệ thống AI Procurement đang hỗ trợ bạn lập kế hoạch.
                   </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1D23] transition-all" onClick={() => router.push("/pr")}>Hủy bỏ</button>
                    <button 
                        className="px-10 py-4 bg-[#3B82F6] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-[#3B82F6]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3" 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        {isSubmitting ? "Đang xử lý..." : "Gửi Phê Duyệt"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
                {/* LEFT CONTENT — 60% */}
                <div className="xl:col-span-6 space-y-10">
                    
                    {/* FORM SECTION 1 — THÔNG TIN CHUNG */}
                    <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
                        <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117]/50">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8FAFC] flex items-center gap-3">
                                 <Activity size={16} className="text-[#3B82F6]" /> Thông tin chung
                             </h3>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Tiêu đề yêu cầu</label>
                                <input 
                                    className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 transition-all placeholder:text-[#64748B]/50" 
                                    placeholder="Nhập tên dịch vụ/sản phẩm cần mua sắm..."
                                    value={form.title} 
                                    onChange={e => setForm({ ...form, title: e.target.value })} 
                                />
                                {submissionStatus === 'error' && !form.title && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">Tiêu đề không được để trống</span>}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Trung tâm chi phí</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-[#94A3B8] appearance-none cursor-pointer focus:ring-2 focus:ring-[#3B82F6]/20 transition-all" 
                                            value={form.costCenterId} 
                                            onChange={e => setForm({ ...form, costCenterId: e.target.value })}
                                        >
                                            <option value="" className="bg-[#161922]">-- Chọn trung tâm chi phí --</option>
                                            {filteredCostCenters.map(cc => (
                                                <option key={cc.id} value={cc.id} className="bg-[#161922]">{String(cc.code)} - {String(cc.name)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Độ ưu tiên</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-[#94A3B8] appearance-none cursor-pointer focus:ring-2 focus:ring-[#3B82F6]/20 transition-all"
                                            value={form.priority} 
                                            onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                                        >
                                            <option value={1} className="bg-[#161922]">THẤP</option>
                                            <option value={2} className="bg-[#161922]">BÌNH THƯỜNG</option>
                                            <option value={3} className="bg-[#161922]">GẤP (ƯU TIÊN)</option>
                                            <option value={4} className="bg-[#161922]">KHẨN CẤP (SLA 4H)</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <BudgetAllocationsPanel
                        allocations={budgetAllocations as BudgetAllocation[]}
                        selectedCostCenterId={form.costCenterId}
                        selectedAllocationId={selectedAllocationId}
                        onSelect={setSelectedAllocationId}
                    />

                    {/* FORM SECTION 3 — DANH MỤC HÀNG HÓA */}
                    <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
                        <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117]/50 flex justify-between items-center">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8FAFC] flex items-center gap-3">
                                 <ShoppingCart size={16} className="text-[#3B82F6]" /> Danh mục hàng hóa đề xuất
                             </h3>
                        </div>
                        <div className="p-10">
                            <div className="mb-8 space-y-3">
                                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Tìm kiếm & Thêm sản phẩm</label>
                                <Select
                                    placeholder="Gõ tên sản phẩm, mã SKU..."
                                    options={products.map(p => ({ label: p.name, value: p.id }))}
                                    onChange={(opt) => opt && addItem(opt)}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderRadius: '16px',
                                            borderColor: 'rgba(148,163,184,0.15)',
                                            background: '#0F1117',
                                            padding: '8px',
                                            boxShadow: 'none',
                                            '&:hover': { borderColor: 'rgba(148,163,184,0.3)' }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            background: '#161922',
                                            border: '1px solid rgba(148,163,184,0.1)',
                                            borderRadius: '16px',
                                            overflow: 'hidden'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            background: state.isFocused ? 'rgba(59,130,246,0.1)' : 'transparent',
                                            color: '#F8FAFC',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            padding: '12px 20px'
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#F8FAFC'
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            color: '#F8FAFC'
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#64748B'
                                        })
                                    }}
                                />
                            </div>
                            
                            <div className="overflow-hidden rounded-3xl border border-[rgba(148,163,184,0.1)] bg-[#0F1117]">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#161922] text-[9px] font-black text-[#64748B] border-b border-[rgba(148,163,184,0.1)] uppercase tracking-[0.1em]">
                                            <th className="px-8 py-5">Sản phẩm / Mô tả</th>
                                            <th className="px-8 py-5 text-center">Số lượng</th>
                                            <th className="px-8 py-5 text-right">Đơn giá tham chiếu</th>
                                            <th className="px-8 py-5 text-right">Thành tiền</th>
                                            <th className="px-8 py-5 w-20 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {form.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-[10px] font-black text-[#64748B] uppercase tracking-widest italic">Chưa có sản phẩm nào được chọn</td>
                                            </tr>
                                        ) : (
                                            form.items.map((item, i) => (
                                                <tr key={i} className="hover:bg-[#161922]/50 transition-colors">
                                                    <td className="px-8 py-6 font-black text-[#F8FAFC] text-xs transition-colors">{item.productDesc}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <input 
                                                            type="number" 
                                                            className="w-20 text-center bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl py-2 px-3 text-xs font-black text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/50" 
                                                            value={item.qty} 
                                                            onChange={e => {
                                                                const items = [...form.items];
                                                                items[i].qty = parseInt(e.target.value) || 0;
                                                                setForm({ ...form, items });
                                                            }} 
                                                        />
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-bold text-[#64748B] text-[11px]">{formatVND(item.estimatedPrice)}</td>
                                                    <td className="px-8 py-6 text-right font-black text-[#3B82F6] text-sm tracking-tight">{formatVND(item.qty * item.estimatedPrice)}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button 
                                                            className="p-3 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
                                                            onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR — 40% */}
                <div className="xl:col-span-4">
                    <div className="sticky top-24 space-y-8">
                        {/* TOTAL CARD */}
                        <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/10 p-10 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                <Wallet size={200} />
                            </div>
                            
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6] mb-10 flex items-center gap-3">
                                <PieChart size={16} /> Tổng quan Ngân sách
                            </h3>
                            
                            <div className="space-y-8 relative">
                                <div className="flex justify-between items-center p-6 bg-[#0F1117] rounded-[32px] border border-[rgba(148,163,184,0.1)]">
                                    <div className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Trung tâm:</div>
                                    <div className="text-[10px] font-black text-[#F8FAFC] bg-[#161922] px-4 py-2 rounded-xl border border-[#3B82F6]/10 shadow-lg tracking-widest">
                                        {activeCC ? String(activeCC.code) : "CHƯA CHỌN"}
                                    </div>
                                </div>

                                <div className="space-y-6 px-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-tight">Khả dụng (Quý {currentQuarter}):</div>
                                        <div className="text-lg font-black text-[#F8FAFC] tracking-tighter">
                                            {formatVND(remainingBudget)} ₫
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-tight">Tổng giá trị PR:</div>
                                        <div className="text-lg font-black text-rose-400 tracking-tighter">
                                            -{formatVND(totalEstimate)} ₫
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-[rgba(148,163,184,0.1)]" />
                                    
                                    <div className={`p-8 rounded-[40px] border-2 transition-all duration-500 ${remainingBudget - totalEstimate < 0 ? "bg-rose-500/10 border-rose-500/20 shadow-rose-500/5" : "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5"}`}>
                                        <div className="flex items-center gap-3 mb-2 opacity-70">
                                            <div className={`h-2 w-2 rounded-full ${remainingBudget - totalEstimate < 0 ? "bg-rose-500" : "bg-emerald-500"}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${remainingBudget - totalEstimate < 0 ? "text-rose-400" : "text-emerald-400"}`}>CÒN LẠI SAU PR</span>
                                        </div>
                                        <div className={`text-4xl font-black tracking-tighter ${remainingBudget - totalEstimate < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                            {formatVND(Math.abs(remainingBudget - totalEstimate))} <span className="text-lg opacity-50">₫</span>
                                        </div>
                                    </div>
                                    
                                    {remainingBudget - totalEstimate < 0 && (
                                        <div className="flex gap-4 p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20 text-amber-400 animate-pulse">
                                            <AlertTriangle size={24} className="shrink-0" />
                                            <p className="text-[10px] font-black uppercase leading-tight tracking-tight">Cảnh báo: PR vượt quá ngân sách khả dụng. Việc phê duyệt có thể bị CEO/CFO kiểm soát chặt chẽ hơn.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    className="w-full py-6 mt-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-black uppercase tracking-[0.2em] rounded-[32px] shadow-2xl shadow-[#3B82F6]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group/btn" 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="group-hover:fill-white transition-all" />}
                                    {isSubmitting ? "Đang xử lý khởi tạo..." : "Xác nhận & Gửi Approval"}
                                </button>
                            </div>
                        </div>

                        {/* HELPER CARD */}
                        <div className="bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-[40px] p-10 text-white shadow-2xl shadow-[#3B82F6]/20 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-700">
                                 <Bot size={80} />
                             </div>
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-white/80">AI Procurement Tip</h4>
                             <p className="text-base font-bold leading-tight mb-2 pr-12">Hệ thống AI vừa kiểm soát giá tham chiếu.</p>
                             <p className="text-xs font-medium text-white/70">
                                Chúng tôi đã đối chiếu giá từ 4 nhà cung cấp định kỳ để đảm bảo PR này nằm trong khung giá tối ưu nhất.
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATUS OVERLAY */}
            {submissionStatus !== 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F1117]/80 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-[#161922] p-12 rounded-[40px] text-center shadow-2xl max-w-sm w-full border border-[rgba(148,163,184,0.1)] animate-in zoom-in-95 duration-300">
                        {submissionStatus === 'loading' && (
                            <div className="py-10 space-y-6">
                                <div className="h-20 w-20 border-8 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin mx-auto shadow-xl shadow-[#3B82F6]/10"></div>
                                <div>
                                    <h3 className="text-lg font-black text-[#F8FAFC] uppercase tracking-tighter">Đang khởi tạo yêu cầu...</h3>
                                    <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-[0.2em] mt-3 animate-pulse">Vui lòng chờ trong giây lát</p>
                                </div>
                            </div>
                        )}
                        {submissionStatus === 'success' && (
                            <div className="py-12 space-y-8">
                                <div className="w-28 h-28 bg-[#10B981] rounded-[35px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 animate-bounce-subtle">
                                    <CheckCircle2 size={56} className="text-white" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-[#F8FAFC] tracking-tight uppercase">Thành công!</h3>
                                    <p className="text-[#94A3B8] text-[13px] font-bold leading-relaxed px-6">
                                        Đã khởi tạo PR và đẩy vào quy trình phê duyệt đa cấp thành công.
                                    </p>
                                </div>
                            </div>
                        )}
                        {submissionStatus === 'error' && (
                            <div className="py-12 space-y-8">
                                <div className="w-28 h-28 bg-rose-500 rounded-[35px] flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/20">
                                    <XCircle size={56} className="text-white" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-[#F8FAFC] tracking-tight uppercase">Xảy ra lỗi</h3>
                                    <p className="text-rose-400 text-[13px] font-bold px-6 leading-relaxed">{errorMessage}</p>
                                </div>
                            </div>
                        )}
                        {submissionStatus !== 'loading' && (
                            <button 
                                onClick={() => setSubmissionStatus('idle')} 
                                className="w-full mt-6 py-4 bg-[#0F1117] text-[#94A3B8] font-black text-[10px] uppercase tracking-widest rounded-2xl border border-[rgba(148,163,184,0.1)] hover:bg-[#1A1D23] transition-all"
                            >
                                Quay lại chỉnh sửa
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
