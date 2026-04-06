"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { formatVND } from "../../utils/formatUtils";
import { useProcurement, Product, BudgetAllocation, PR } from "../../context/ProcurementContext";
import { CostCenter, CreatePrDto, CurrencyCode, BudgetAllocationStatus } from "@/app/types/api-types";
import { Trash2, FileText, Wallet, BarChart3, TrendingUp, PieChart, CheckCircle2, Loader2, XCircle, ArrowLeft } from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";

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
            className={`group relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 shadow-sm
                ${isSelected
                    ? "border-indigo-600 bg-indigo-50/30"
                    : "border-slate-100 bg-white hover:border-indigo-300 hover:bg-slate-50"
                }`}
        >
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"}`}>
                        <Wallet size={16} />
                    </div>
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{String(allocation.notes || "Ngân sách")}</div>
                        <div className={`text-sm font-bold mt-0.5 ${isSelected ? "text-indigo-900" : "text-slate-900"}`}>
                            {formatVND(total)} <span className="text-[10px] font-medium opacity-50">{String(allocation.currency || "VND")}</span>
                        </div>
                    </div>
                </div>
                <AllocationStatusBadge status={allocation.status as BudgetAllocationStatus} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                    { label: "Đã chi",     value: spent,     color: "text-slate-600" },
                    { label: "Cam kết",    value: committed, color: "text-indigo-500" },
                    { label: "Còn lại",    value: remaining, color: isOver ? "text-red-500" : "text-emerald-600" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                        <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
                        <div className={`text-[10px] font-bold ${color}`}>
                            {formatVND(Math.abs(value))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-medium text-slate-500">
                    <span>Sử dụng</span>
                    <span className={isOver ? "text-red-500" : "text-indigo-600"}>{usedPct.toFixed(1)}%</span>
                </div>
                <div className="budget-meter">
                    <div className="meter-spent" style={{ width: `${Math.min(100, (spent / total) * 100)}%` }} />
                    <div className={isOver ? "bg-red-400" : "meter-committed"} style={{ width: `${Math.min(100 - (spent / total) * 100, (committed / total) * 100)}%` }} />
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
        <div className="erp-card">
            <h3 className="section-title">
                <BarChart3 size={16} /> Phân bổ Ngân sách
            </h3>

            {filtered.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: <Wallet size={14} />, label: "Tổng cấp phát",  value: totalAllocated,  color: "text-slate-900",     bg: "bg-slate-50" },
                        { icon: <TrendingUp size={14} />, label: "Đã tiêu thụ", value: totalSpent,      color: "text-slate-600",    bg: "bg-slate-50" },
                        { icon: <PieChart size={14} />,   label: "Đang cam kết", value: totalCommitted, color: "text-indigo-600",    bg: "bg-indigo-50" },
                        { icon: <CheckCircle2 size={14} />, label: "Còn khả dụng", value: totalRemaining, color: totalRemaining < 0 ? "text-red-600" : "text-emerald-600", bg: totalRemaining < 0 ? "bg-red-50" : "bg-emerald-50" },
                    ].map(({ icon, label, value, color, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-4 border border-slate-100 shadow-sm`}>
                            <p className={`flex items-center gap-1.5 opacity-60 text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1`}>
                                {icon} {label}
                            </p>
                            <div className={`text-sm font-bold ${color}`}>
                                {formatVND(value)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Không có ngân sách khả dụng</p>
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
        <main className="pt-20 px-8 pb-12 bg-slate-50 min-h-screen animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Yêu cầu mua sắm", "Tạo mới PR"]} />

            <div className="mt-8 flex justify-between items-center mb-10 border-b border-slate-200 pb-8">
                <div>
                   <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tạo Phiếu Yêu Cầu (PR)</h1>
                   <p className="text-slate-500 text-sm mt-1">Lập kế hoạch mua sắm và xin phê duyệt ngân sách tập trung.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary" onClick={() => router.push("/pr")}>Hủy bỏ</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Đang xử lý..." : "Gửi Phê Duyệt"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="erp-card">
                        <div className="form-grid">
                            <div className="md:col-span-2 form-group">
                                <label className="erp-label">Tiêu đề yêu cầu</label>
                                <input 
                                    className="erp-input shadow-sm" 
                                    placeholder="Nhập tên dịch vụ/sản phẩm cần mua sắm..."
                                    value={form.title} 
                                    onChange={e => setForm({ ...form, title: e.target.value })} 
                                />
                                {submissionStatus === 'error' && !form.title && <span className="erp-error">Tiêu đề không được để trống</span>}
                            </div>
                            <div className="form-group">
                                <label className="erp-label">Trung tâm chi phí (Cost Center)</label>
                                <select className="erp-input shadow-sm" value={form.costCenterId} onChange={e => setForm({ ...form, costCenterId: e.target.value })}>
                                    <option value="">-- Chọn trung tâm chi phí --</option>
                                    {filteredCostCenters.map(cc => (
                                        <option key={cc.id} value={cc.id}>{String(cc.code)} - {String(cc.name)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="erp-label">Độ ưu tiên</label>
                                <select className="erp-input shadow-sm" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })}>
                                    <option value={1}>Thấp</option>
                                    <option value={2}>Bình thường</option>
                                    <option value={3}>Gấp (Cần xử lý nhanh)</option>
                                    <option value={4}>Khẩn cấp (SLA 4h)</option>
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

                    <div className="erp-card">
                        <h3 className="section-title">
                           <FileText size={16} /> Danh mục hàng hóa đề xuất
                        </h3>
                        <div className="mb-6">
                            <label className="erp-label">Tìm kiếm & Thêm sản phẩm</label>
                            <Select
                                placeholder="Gõ tên sản phẩm, mã SKU..."
                                options={products.map(p => ({ label: p.name, value: p.id }))}
                                onChange={(opt) => opt && addItem(opt)}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderRadius: '8px',
                                        borderColor: '#e2e8f0',
                                        padding: '4px',
                                        boxShadow: 'none',
                                        '&:hover': { borderColor: '#cbd5e1' }
                                    })
                                }}
                            />
                        </div>
                        
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="erp-table border-none">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm / Mô tả</th>
                                        <th className="text-center">Số lượng</th>
                                        <th className="text-right">Đơn giá tham chiếu</th>
                                        <th className="text-right">Thành tiền</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 italic">Chưa có sản phẩm nào được chọn</td>
                                        </tr>
                                    ) : (
                                        form.items.map((item, i) => (
                                            <tr key={i}>
                                                <td className="font-semibold text-slate-800">{item.productDesc}</td>
                                                <td className="text-center">
                                                    <input 
                                                        type="number" 
                                                        className="w-20 text-center erp-input py-1 px-2 h-9" 
                                                        value={item.qty} 
                                                        onChange={e => {
                                                            const items = [...form.items];
                                                            items[i].qty = parseInt(e.target.value) || 0;
                                                            setForm({ ...form, items });
                                                        }} 
                                                    />
                                                </td>
                                                <td className="text-right font-medium text-slate-500">{formatVND(item.estimatedPrice)}</td>
                                                <td className="text-right font-bold text-indigo-600">{formatVND(item.qty * item.estimatedPrice)}</td>
                                                <td className="text-center">
                                                    <button 
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

                <div className="space-y-6">
                    <div className="erp-card bg-white sticky top-24">
                        <h3 className="section-title">Tổng quan Ngân sách</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Trung tâm:</div>
                                <div className="text-xs font-bold text-indigo-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                                    {activeCC ? String(activeCC.code) : "Chưa chọn"}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <div className="text-xs font-medium text-slate-500">Khả dụng (Quý {currentQuarter}):</div>
                                    <div className="text-sm font-bold text-slate-900">
                                        {formatVND(remainingBudget)}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="text-xs font-medium text-slate-500">Tổng giá trị PR:</div>
                                    <div className="text-sm font-bold text-indigo-600">
                                        -{formatVND(totalEstimate)}
                                    </div>
                                </div>
                                <div className="h-px bg-slate-100 w-full" />
                                <div className={`p-4 rounded-xl border ${remainingBudget - totalEstimate < 0 ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Còn lại sau PR</span>
                                    <div className="text-2xl font-bold tracking-tight">
                                        {formatVND(Math.abs(remainingBudget - totalEstimate))}
                                    </div>
                                </div>
                                
                                {remainingBudget - totalEstimate < 0 && (
                                    <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700">
                                        <XCircle size={16} className="shrink-0" />
                                        <p className="text-[10px] font-medium leading-tight">Yêu cầu này vượt quá ngân sách khả dụng. Việc phê duyệt có thể bị kéo dài.</p>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                className="w-full btn-primary py-3.5 shadow-lg shadow-indigo-200" 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Gửi Phê Duyệt"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {submissionStatus !== 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
                        {submissionStatus === 'loading' && (
                            <div className="py-8">
                                <Loader2 size={48} className="animate-spin mx-auto text-indigo-600 mb-4" />
                                <h3 className="font-bold text-slate-900">Đang khởi tạo yêu cầu...</h3>
                                <p className="text-slate-500 text-xs mt-2">Vui lòng chờ trong giây lát</p>
                            </div>
                        )}
                        {submissionStatus === 'success' && (
                            <div className="py-8">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-900">Thành công!</h3>
                                <p className="text-slate-500 text-xs mt-2">Yêu cầu đã được gửi vào quy trình phê duyệt.</p>
                            </div>
                        )}
                        {submissionStatus === 'error' && (
                            <div className="py-8">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle size={32} />
                                </div>
                                <h3 className="font-bold text-slate-900 text-red-600">Xảy ra lỗi</h3>
                                <p className="text-slate-500 text-xs mt-2">{errorMessage}</p>
                            </div>
                        )}
                        {submissionStatus !== 'loading' && (
                            <button onClick={() => setSubmissionStatus('idle')} className="w-full mt-6 btn-secondary py-2">Quay lại</button>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
