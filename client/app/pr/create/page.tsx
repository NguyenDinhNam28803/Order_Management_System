"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { formatVND } from "../../utils/formatUtils";
import { useProcurement, Product, BudgetAllocation, BudgetPeriod, PR } from "../../context/ProcurementContext";
import { CostCenter, CreatePrDto, CreatePrItemDto, CurrencyCode, BudgetAllocationStatus, BudgetPeriodType } from "@/app/types/api-types";
import { Trash2, Save, FileText, ShoppingBag, AlertCircle, Info, Plus, Sparkles, Loader2, CheckCircle2, XCircle, Calendar, ClipboardList, BadgeCheck, TrendingUp, Wallet, PieChart, BarChart3 } from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";
import SupplierSuggestionWidget from "../../components/SupplierSuggestionWidget";

// --- Components ---

const AllocationStatusBadge = ({ status }: { status: BudgetAllocationStatus }) => {
    const map: Record<BudgetAllocationStatus, { label: string; cls: string }> = {
        APPROVED:  { label: "Đã phê duyệt", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        REJECTED:  { label: "Bị từ chối",   cls: "bg-red-50 text-red-500 border-red-100" },
        DRAFT:     { label: "Nháp",             cls: "bg-amber-50 text-amber-500 border-amber-100" },
        SUBMITTED: { label: "Chờ duyệt",     cls: "bg-blue-50 text-blue-600 border-blue-100" },
    };
    const cfg = map[status] ?? map.DRAFT;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${cfg.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
            {cfg.label}
        </span>
    );
};

const periodTypeLabel: Record<string, string> = {
    MONTHLY:   "Tháng",
    QUARTERLY: "Quý",
    ANNUAL:    "Năm",
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

    const period = allocation.budgetPeriod;
    const periodLabel = period
        ? `${periodTypeLabel[period.periodType] ?? period.periodType} ${period.periodNumber} / ${period.fiscalYear}`
        : "—";

    return (
        <div
            onClick={onClick}
            className={`group relative cursor-pointer rounded-3xl border-2 p-5 transition-all duration-300 hover:shadow-lg overflow-hidden
                ${isSelected
                    ? "border-erp-blue bg-erp-blue/[0.04] shadow-md shadow-erp-blue/10"
                    : "border-slate-100 bg-white hover:border-erp-blue/30 hover:bg-erp-blue/[0.02]"
                }`}
        >
            {isSelected && (
                <div className="absolute top-0 left-0 w-1 h-full bg-erp-blue rounded-l-3xl" />
            )}

            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-2xl shrink-0 transition-colors ${isSelected ? "bg-erp-blue text-white" : "bg-slate-100 text-slate-500 group-hover:bg-erp-blue/10 group-hover:text-erp-blue"}`}>
                        <Wallet size={16} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{String(allocation.notes || "Phân bổ ngân sách")}</div>
                        <div className={`text-sm font-black truncate mt-0.5 ${isSelected ? "text-erp-blue" : "text-erp-navy"}`}>
                            {formatVND(total)} <span className="text-[10px] font-bold opacity-50">{String(allocation.currency || "VND")}</span>
                        </div>
                    </div>
                </div>
                <AllocationStatusBadge status={allocation.status as BudgetAllocationStatus} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { label: "Đã chi",     value: spent,     color: "text-slate-600" },
                    { label: "Cam kết",    value: committed, color: "text-amber-500" },
                    { label: "Còn lại",    value: remaining, color: isOver ? "text-red-500" : "text-emerald-600" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
                        <div className={`text-[11px] font-black ${color} leading-tight`}>
                            {formatVND(Math.abs(value))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiêu thụ ngân sách</span>
                    <span className={`text-[9px] font-black ${isOver ? "text-red-500" : "text-erp-blue"}`}>
                        {usedPct.toFixed(1)}%
                    </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-50">
                    <div
                        className="h-full bg-slate-300 transition-all duration-700"
                        style={{ width: `${Math.min(100, (spent / total) * 100)}%` }}
                    />
                    <div
                        className={`h-full transition-all duration-700 ${isOver ? "bg-red-400" : "bg-amber-400"}`}
                        style={{ width: `${Math.min(100 - (spent / total) * 100, (committed / total) * 100)}%` }}
                    />
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
        <div className="erp-card shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <BarChart3 size={18} className="text-indigo-600" />
                    </div>
                    Phân bổ Ngân sách
                </h3>
            </div>

            {filtered.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { icon: <Wallet size={14} />, label: "Tổng cấp phát",  value: totalAllocated,  color: "text-erp-navy",     bg: "bg-slate-50" },
                        { icon: <TrendingUp size={14} />, label: "Đã tiêu thụ", value: totalSpent,      color: "text-slate-600",    bg: "bg-slate-50" },
                        { icon: <PieChart size={14} />,   label: "Đang cam kết", value: totalCommitted, color: "text-amber-600",    bg: "bg-amber-50/60" },
                        { icon: <CheckCircle2 size={14} />, label: "Còn khả dụng", value: totalRemaining, color: totalRemaining < 0 ? "text-red-600" : "text-emerald-600", bg: totalRemaining < 0 ? "bg-red-50/60" : "bg-emerald-50/60" },
                    ].map(({ icon, label, value, color, bg }) => (
                        <div key={label} className={`${bg} rounded-2xl p-4 border border-slate-100`}>
                            <p className={`flex items-center gap-1.5 ${color} mb-2 opacity-60 text-[8px] font-black uppercase tracking-widest`}>
                                {icon} {label}
                            </p>
                            <div className={`text-sm font-black ${color} leading-tight`}>
                                {formatVND(Math.abs(value))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Không có dữ liệu phân bổ</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    const dateInputRef = useRef<HTMLInputElement>(null);
    const { 
        addPR,
        submitPR,
        addQuoteRequest,
        submitQuoteRequest,
        costCenters, 
        currentUser, 
        products, 
        notify, 
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

    const [flowType, setFlowType] = useState<"FLOW1" | "FLOW2">("FLOW1");
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

    const isOverBudget = activeCC && (remainingBudget < totalEstimate);

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
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Yêu cầu mua sắm", "Tạo mới PR"]} />

            <div className="mt-12 flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black text-erp-navy tracking-tight">Tạo Phiêu Yêu Cầu (PR)</h1>
                <div className="flex gap-4">
                    <button className="btn-primary py-4 px-10" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Đang xử lý..." : "Gửi Phê Duyệt"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="erp-card shadow-sm border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Tiêu đề</label>
                                <input className="erp-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Trung tâm chi phí</label>
                                <select className="erp-input" value={form.costCenterId} onChange={e => setForm({ ...form, costCenterId: e.target.value })}>
                                    <option value="">-- Chọn --</option>
                                    {filteredCostCenters.map(cc => (
                                        <option key={cc.id} value={cc.id}>{String(cc.code)} - {String(cc.name)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <BudgetAllocationsPanel
                        allocations={budgetAllocations as BudgetAllocation[]}
                        selectedCostCenterId={form.costCenterId}
                        selectedAllocationId={selectedAllocationId}
                        onSelect={setSelectedAllocationId}
                    />

                    <div className="erp-card shadow-sm border border-slate-200">
                        <Select
                            options={products.map(p => ({ label: p.name, value: p.id }))}
                            onChange={(opt) => opt && addItem(opt)}
                            className="mb-8"
                        />
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-400 border-b">
                                    <th className="text-left py-4">Sản phẩm</th>
                                    <th className="text-center py-4">SL</th>
                                    <th className="text-right py-4">Thành tiền</th>
                                    <th className="py-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.map((item, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-4 font-black">{item.productDesc}</td>
                                        <td className="py-4 text-center">
                                            <input type="number" className="w-16 text-center bg-slate-50 rounded-lg p-1" value={item.qty} onChange={e => {
                                                const items = [...form.items];
                                                items[i].qty = parseInt(e.target.value) || 0;
                                                setForm({ ...form, items });
                                            }} />
                                        </td>
                                        <td className="py-4 text-right font-black text-erp-blue">{formatVND(item.qty * item.estimatedPrice)}</td>
                                        <td className="py-4 text-right">
                                            <button onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}>
                                                <Trash2 size={16} className="text-slate-300 hover:text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    {activeCC && (
                        <div className="erp-card shadow-xl border-t-4 border-t-erp-blue">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy">Tổng quan Ngân sách</h3>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black text-slate-500">{String(activeCC.code)}</span>
                            </div>
                            <div className="space-y-5">
                                <div className="flex justify-between">
                                    <div className="text-[9px] font-black text-slate-400 uppercase">Cấp phát Quý {currentQuarter}</div>
                                    <div className="text-sm font-black text-erp-navy">
                                        {formatVND(quarterlyAllocation ? quarterlyAllocation.allocatedAmount : (activeCC ? Number(activeCC.budgetAnnual) : 0))} {activeCC ? String(activeCC.currency) : "VND"}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-erp-blue/5 border border-erp-blue/10">
                                    <span className="text-[8px] font-black text-erp-blue/70 uppercase">Còn lại sau PR</span>
                                    <div className="text-xl font-black text-erp-blue">
                                        {formatVND(Math.abs(remainingBudget - totalEstimate))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {submissionStatus !== 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-erp-navy/40 backdrop-blur-sm">
                    <div className="bg-white p-10 rounded-[40px] text-center shadow-2xl">
                        {submissionStatus === 'loading' && <Loader2 size={40} className="animate-spin mx-auto text-erp-blue" />}
                        {submissionStatus === 'success' && <CheckCircle2 size={40} className="mx-auto text-emerald-500" />}
                        {submissionStatus === 'error' && <XCircle size={40} className="mx-auto text-red-500" />}
                        <h3 className="mt-4 font-black uppercase tracking-widest">
                            {submissionStatus === 'loading' ? "Đang xử lý..." : (submissionStatus === 'success' ? "Thành công!" : "Lỗi")}
                        </h3>
                        {submissionStatus === 'error' && <p className="text-xs mt-2 text-slate-400">{errorMessage}</p>}
                        {submissionStatus !== 'loading' && (
                            <button onClick={() => setSubmissionStatus('idle')} className="mt-6 px-8 py-2 bg-erp-navy text-white rounded-xl text-xs font-black">Đóng</button>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}