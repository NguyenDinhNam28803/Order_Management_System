"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { formatVND } from "../../utils/formatUtils";
import { useProcurement, Product, BudgetAllocation, BudgetPeriod, PR } from "../../context/ProcurementContext";
import { CostCenter, CreatePrDto, CreatePrItemDto } from "@/app/types/api-types";
import { Trash2, Save, FileText, ShoppingBag, AlertCircle, Info, Plus, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";
import SupplierSuggestionWidget from "../../components/SupplierSuggestionWidget";

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
    currency?: string;
}

interface PRForm {
    title: string;
    description: string;
    justification: string;
    requiredDate: string;
    priority: number;
    currency: "VND" | "USD" | "EUR" | "SGD" | "JPY" | "CNY" | "GBP" | "AUD";
    costCenterId: string;
    items: PRItem[];
}

/**
 * UTILITY: Check if string is a valid UUID
 */
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
        notify, 
        budgetAllocations, 
        budgetPeriods: periods,
        fetchQuarterlyBudget
    } = useProcurement();

    const router = useRouter();
    const [form, setForm] = useState<PRForm>({
        title: "",
        description: "",
        justification: "",
        requiredDate: "",
        priority: 2,
        currency: "VND",
        costCenterId: "",
        items: []
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quarterlyAllocation, setQuarterlyAllocation] = useState<BudgetAllocation | null>(null);

    // Calculate current quarter
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentQuarter = Math.floor((today.getMonth() + 3) / 3);

    // Fetch quarterly budget when Cost Center changes
    useEffect(() => {
        if (form.costCenterId && isValidUuid(form.costCenterId)) {
            const getBudget = async () => {
                const data = await fetchQuarterlyBudget(form.costCenterId, currentYear, currentQuarter);
                setQuarterlyAllocation(data?.data || null);
            };
            getBudget();
        } else {
            setQuarterlyAllocation(null);
        }
    }, [form.costCenterId, fetchQuarterlyBudget, currentYear, currentQuarter]);

    const filteredCostCenters = costCenters.filter((cc: CostCenter) => {
        if (!currentUser) return false;
        // Admins and Procurement officers can see all cost centers
        if (currentUser.role === "PLATFORM_ADMIN" || currentUser.role === "PROCUREMENT") return true;
        // Requesters and Managers only see their own department's cost centers
        return !currentUser.deptId || !cc.deptId || cc.deptId === currentUser.deptId;
    });

    // Auto-assign Cost Center based on department
    useEffect(() => {
        if (!form.costCenterId && filteredCostCenters.length > 0) {
            // Auto-select the first available CC for the user's department
            setForm(prev => ({ ...prev, costCenterId: filteredCostCenters[0].id }));
        }
    }, [filteredCostCenters, form.costCenterId]);

    const activeCC = filteredCostCenters.find((cc: CostCenter) => cc.id === form.costCenterId);
    const totalEstimate = form.items.reduce((sum: number, item: PRItem) => sum + (item.qty * item.estimatedPrice), 0);
    
    // Calculate remaining budget based strictly on Quarterly Allocation
    const remainingBudget = quarterlyAllocation
        ? (Number(quarterlyAllocation.allocatedAmount) - Number(quarterlyAllocation.spentAmount || 0) - Number(quarterlyAllocation.committedAmount || 0))
        : 0;

    const isOverBudget = activeCC && (remainingBudget < totalEstimate);

    const addItem = (option: { value: string; label: string }) => {
        const product = products.find((p: Product) => p.id === option.value);
        if (!product || form.items.find((i: PRItem) => i.productId === product.id)) return;

        // Role-based limit validation
        const limits: Record<string, number> = {
            "REQUESTER": 5000000,
            "DEPT_APPROVER": 50000000,
            "MANAGER": 50000000,
            "DIRECTOR": 200000000
        };
        const userRole = currentUser?.role || "REQUESTER";
        const userLimit = limits[userRole] || 5000000;

        const currentSum = form.items.reduce((s: number, i: PRItem) => s + (i.qty * i.estimatedPrice), 0);
        const productPrice = product.unitPriceRef || 0;

        if (currentSum + productPrice > userLimit) {
            notify(`Vượt mức ngân sách bạn có thể đặt (${formatVND(userLimit)} ₫) cho vai trò ${userRole}`, "warning");
            return;
        }

        const suppliers = ["Thiên Long", "Rạng Đông", "Điện Quang", "Sunhouse", "Kangaroo", "Vinamilk", "Trung Nguyên", "Hòa Phát", "Ladoda", "Mekong"];
        const foundSupplier = suppliers.find(s => product.name.includes(s)) || "Thị trường";

        const aiTypes = ["GIÁ TỐT NHẤT", "ĐẶT NHIỀU NHẤT"];
        const aiLabel = Math.random() > 0.5 ? aiTypes[0] : aiTypes[1];

        const basePrice = product.unitPriceRef || 0;
        const finalPrice = form.priority === 1 ? basePrice * 1.2 : basePrice;

        setForm({
            ...form,
            items: [...form.items, {
                productId: product.id,
                productDesc: product.name,
                sku: product.sku,
                categoryId: product.categoryId,
                qty: 1,
                unit: product.unit || "PCS",
                estimatedPrice: finalPrice,
                basePrice: basePrice,
                supplierName: foundSupplier,
                aiStatus: Math.random() > 0.2,
                aiLabel: aiLabel,
                specNote: ""
            }]
        });
    };

    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async () => {
        // Validation check
        if (!form.title || form.items.length === 0 || !form.costCenterId) {
            setErrorMessage("Vui lòng nhập đầy đủ tiêu đề, trung tâm chi phí và ít nhất 1 sản phẩm.");
            setSubmissionStatus('error');
            return;
        }

        const payload: CreatePrDto = {
            title: form.title.trim(),
            description: form.description?.trim() || undefined,
            justification: form.justification?.trim() || undefined,
            requiredDate: form.requiredDate ? new Date(form.requiredDate).toISOString() : undefined,
            priority: Number(form.priority) || 2, 
            currency: form.currency as any,    
            costCenterId: isValidUuid(form.costCenterId) ? form.costCenterId : undefined,
            items: form.items.map((i: PRItem) => ({
                productId: isValidUuid(i.productId) ? i.productId : undefined,
                productDesc: i.productDesc,
                sku: i.sku || undefined,
                categoryId: isValidUuid(i.categoryId) ? i.categoryId : undefined,
                qty: Number(i.qty),
                unit: i.unit || "PCS",           
                estimatedPrice: Number(i.estimatedPrice),
                currency: (i.currency || form.currency) as any,
                specNote: i.specNote?.trim() || undefined
            }))
        };

        setSubmissionStatus('loading');
        setIsSubmitting(true);

        try {
            // STEP 1: CREATE DRAFT PR via Context Service
            const createdPR = await addPR(payload);

            if (createdPR && createdPR.id) {
                // STEP 2: SUBMIT FOR APPROVAL via Context Service
                const success = await submitPR(createdPR.id);

                if (success) {
                    setSubmissionStatus('success');
                    setTimeout(() => router.push("/pr"), 2000);
                } else {
                    setErrorMessage("Đã tạo nháp PR nhưng không thể gửi phê duyệt tự động");
                    setSubmissionStatus('error');
                }
            } else {
                setErrorMessage("Không thể tạo yêu cầu mua hàng. Vui lòng kiểm tra lại kết nối.");
                setSubmissionStatus('error');
            }
        } catch (err) {
            console.error("PR Submission Error:", err);
            setErrorMessage("Lỗi hệ thống khi gửi PR");
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Yêu cầu mua sắm", "Tạo mới PR"]} />

            <div className="mt-12 flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-erp-navy tracking-tight flex items-center gap-4">
                        <div className="h-12 w-2 bg-erp-blue rounded-full" />
                        Tạo Phiếu Yêu Cầu (PR)
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-2">
                        <Info size={16} className="text-erp-blue" />
                        Mã định danh hệ thống sẽ được cấp sau khi gửi thành công.
                    </p>
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button 
                        className="flex-1 md:flex-none px-6 py-3.5 font-black text-erp-blue hover:bg-erp-blue/5 border-2 border-erp-blue/10 rounded-2xl text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        onClick={() => {
                            if (products.length > 0 && filteredCostCenters.length > 0) {
                                const cc = filteredCostCenters.find((c: CostCenter) => c.code === 'CC_IT_OPS') || filteredCostCenters[0];
                                const sampleProducts = products.slice(0, 2);
                                
                                setForm({
                                    ...form,
                                    title: "Mua sắm thiết bị IT định kỳ tháng 03/2026",
                                    description: "Nâng cấp máy tính cho bộ phận vận hành IT và mua thêm phụ kiện chuột, bàn phím.",
                                    justification: "Các thiết bị cũ đã hỏng và không đáp ứng được nhu cầu công việc hiện tại.",
                                    requiredDate: "2026-04-15",
                                    priority: 2,
                                    costCenterId: cc.id,
                                    items: sampleProducts.map(p => ({
                                        productId: p.id,
                                        productDesc: p.name,
                                        sku: p.sku,
                                        categoryId: p.categoryId,
                                        qty: 2,
                                        unit: p.unit || "PCS",
                                        estimatedPrice: p.unitPriceRef || 500000,
                                        basePrice: p.unitPriceRef || 500000,
                                        supplierName: "Thiên Long",
                                        aiStatus: true,
                                        aiLabel: "GIÁ TỐT NHẤT",
                                        specNote: "Hàng chính hãng, bảo hành 12 tháng"
                                    }))
                                });
                            } else {
                                notify("Đang tải dữ liệu sản phẩm...", "info");
                            }
                        }}
                    >
                        Tải dữ liệu mẫu
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-3.5 font-black text-slate-500 hover:bg-slate-100 rounded-2xl text-[10px] uppercase tracking-widest transition-all" onClick={() => router.back()}>Hủy bỏ</button>
                    <button className="flex-1 md:flex-none btn-primary shadow-2xl shadow-erp-navy/40 py-4 px-10 text-[11px] hover:scale-105 active:scale-95" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Đang xử lý..." : "Gửi Phê Duyệt Hệ Thống"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="erp-card shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                <div className="p-2 bg-erp-blue/10 rounded-xl">
                                    <FileText size={18} className="text-erp-blue" />
                                </div>
                                Thông tin chung
                            </h3>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">PR Module v2.0</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2 group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <Sparkles size={12} className="text-slate-300 group-focus-within:text-erp-blue/50" />
                                    Tiêu đề yêu cầu
                                </label>
                                <input
                                    className="erp-input transition-all"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="VD: Mua sắm thiết bị IT định kỳ, Thiết bị văn phòng..."
                                />
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <div className="w-1 h-3 bg-erp-blue/30 rounded-full" />
                                    Trung tâm chi phí
                                </label>
                                <select
                                    className="erp-input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                                    value={form.costCenterId}
                                    onChange={e => setForm({ ...form, costCenterId: e.target.value })}
                                >
                                    <option value="">-- Chọn trung tâm chi phí --</option>
                                    {filteredCostCenters.map((cc: CostCenter) => (
                                        <option key={cc.id} value={cc.id}>
                                            {cc.code} - {cc.name}
                                        </option>
                                    ))}
                                </select>
                                {activeCC && (
                                    <div className="mt-8 animate-in fade-in slide-in-from-top-6 duration-700 overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)]">
                                        <div className={`p-6 flex items-center justify-between transition-colors ${isOverBudget ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-erp-navy text-white'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl border border-white/20">
                                                    {isOverBudget ? <AlertCircle size={24} /> : <Sparkles size={24} className="fill-white" />}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-0.5">Phân tích dự toán</div>
                                                    <div className="text-base font-black uppercase tracking-tight">
                                                        {isOverBudget ? 'Vượt hạn mức ngân sách' : 'Nguồn vốn khả dụng'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-0.5">Cost Center</div>
                                                <div className="text-lg font-black font-mono">{activeCC.code}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-8 grid grid-cols-2 gap-8 bg-white relative">
                                            <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-slate-50" />
                                            <div className="space-y-2">
                                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Ngân sách Quý {currentQuarter}</div>
                                                <div className="text-2xl font-black text-erp-navy tracking-tighter">
                                                    {formatVND(remainingBudget)} <span className="text-xs text-slate-300 ml-1">VND</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-right">
                                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Tác động của PR</div>
                                                <div className={`text-2xl font-black tracking-tighter ${isOverBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    -{formatVND(totalEstimate)} <span className="text-xs opacity-50 ml-1">VND</span>
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-2 pt-6 border-t border-slate-50">
                                                <div className="flex justify-between items-center mb-3 px-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tỉ lệ chiếm dụng nguồn vốn</span>
                                                    <span className={`text-[11px] font-black uppercase ${isOverBudget ? 'text-rose-500' : 'text-erp-blue'}`}>
                                                        {remainingBudget > 0 ? ((totalEstimate / remainingBudget) * 100).toFixed(1) : 100}% DỰ TOÁN
                                                    </span>
                                                </div>
                                                <div className="h-4 w-full bg-slate-50 rounded-full p-1 border border-slate-100/50 shadow-inner overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${isOverBudget ? 'bg-gradient-to-r from-rose-500 to-red-400' : 'bg-gradient-to-r from-erp-blue to-blue-400'}`}
                                                        style={{ width: `${Math.min(100, (totalEstimate / (remainingBudget || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                {isOverBudget && (
                                                    <div className="mt-5 p-4 bg-rose-50 rounded-2xl border border-rose-100 border-dashed flex items-center gap-3 text-[11px] font-bold text-rose-600 animate-pulse uppercase tracking-tight">
                                                        <AlertCircle size={18} /> Cần phê duyệt đặc biệt (Over-budget Policy)
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <div className="w-1 h-3 bg-amber-400/30 rounded-full" />
                                    Mức độ khẩn cấp
                                </label>
                                <select
                                    className={`erp-input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat ${form.priority === 1 ? 'border-red-200 bg-red-50/50 text-red-600' : ''}`}
                                    value={form.priority}
                                    onChange={e => {
                                        const newPriority = parseInt(e.target.value);
                                        const updatedItems = form.items.map((item: PRItem) => ({
                                            ...item,
                                            estimatedPrice: newPriority === 1 ? item.basePrice * 1.2 : item.basePrice
                                        }));
                                        setForm({ ...form, priority: newPriority, items: updatedItems });
                                    }}
                                >
                                    <option value={1}>1 - Khẩn cấp (Surcharge +20%)</option>
                                    <option value={2}>2 - Bình thường</option>
                                    <option value={3}>3 - Dự phòng / Thay thế</option>
                                </select>
                                {form.priority === 1 && (
                                    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse px-3 py-1 bg-red-50 rounded-lg w-fit">
                                        <AlertCircle size={12} /> Áp dụng phụ phí khẩn cấp 20%
                                    </div>
                                )}
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <div className="w-1 h-3 bg-indigo-400/30 rounded-full" />
                                    Ngày cần hàng
                                </label>
                                <input
                                    type="date"
                                    className="erp-input font-mono"
                                    value={form.requiredDate}
                                    onChange={e => setForm({ ...form, requiredDate: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2 group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <div className="w-1 h-3 bg-slate-400/30 rounded-full" />
                                    Lý do mua sắm (Justification)
                                </label>
                                <textarea
                                    className="erp-input h-32 text-sm leading-relaxed"
                                    value={form.justification}
                                    onChange={e => setForm({ ...form, justification: e.target.value })}
                                    placeholder="Tại sao bạn cần những mặt hàng này? Giải trình ngắn gọn về mục đích sử dụng..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="erp-card shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <ShoppingBag size={18} className="text-indigo-600" />
                                </div>
                                Danh sách mặt hàng
                            </h3>
                            <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {form.items.length} Items
                            </div>
                        </div>

                        <div className="mb-10">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
                                <Plus size={12} className="text-erp-blue" />
                                Tìm & Thêm sản phẩm nhanh
                            </label>
                            <Select<{ value: string; label: string }>
                                options={products.map((p: Product) => ({ label: `${p.name} - SKU: ${p.sku} [${formatVND(p.unitPriceRef)} ₫]`, value: p.id }))}
                                onChange={(option) => option && addItem(option)}
                                className="text-sm font-bold"
                                placeholder="Nhập tên sản phẩm hoặc mã SKU..."
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        borderRadius: '1rem',
                                        padding: '8px 12px',
                                        borderColor: state.isFocused ? '#2563eb' : '#f1f5f9',
                                        backgroundColor: '#f8fafc',
                                        boxShadow: state.isFocused ? '0 0 0 8px rgba(37, 99, 235, 0.05)' : 'none',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { borderColor: '#2563eb' }
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: '#cbd5e1',
                                        fontStyle: 'italic',
                                        fontWeight: '500'
                                    })
                                }}
                            />
                        </div>

                        <div className="overflow-x-auto -mx-8 relative">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Sản phẩm</th>
                                        <th className="px-4 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Nhà cung cấp</th>
                                        <th className="px-4 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-28">Số lượng</th>
                                        <th className="px-4 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-36">Thành tiền</th>
                                        <th className="px-4 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Quy cách hàng hóa</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {form.items.map((item: PRItem, i: number) => (
                                        <tr key={i} className="group hover:bg-erp-blue/[0.04] transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-sm group-hover:scale-110 group-hover:shadow-erp-blue/10 group-hover:border-erp-blue/20 transition-all duration-500">
                                                        <ShoppingBag size={22} className="text-slate-400 group-hover:text-erp-blue" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-erp-navy text-[15px] leading-tight mb-1.5">{item.productDesc}</div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[9px] text-slate-500 font-black tracking-widest uppercase">SKU: {item.sku}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit || 'PCS'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="flex flex-col gap-2.5">
                                                    <span className="inline-block px-3 py-1.5 rounded-xl bg-white text-erp-navy text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm w-fit group-hover:border-erp-blue/30 group-hover:shadow-erp-blue/5 transition-all">
                                                        {item.supplierName || 'Thị trường'}
                                                    </span>
                                                    {item.aiStatus && (
                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-400 text-white border border-amber-500/50 w-fit shadow-lg shadow-amber-200 transition-transform group-hover:scale-105">
                                                            <Sparkles size={12} className="fill-white" />
                                                            <span className="text-[9px] font-black uppercase tracking-tight">{item.aiLabel}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="flex items-center bg-slate-100/50 rounded-2xl p-1.5 gap-1 border border-slate-100 group-hover:bg-white group-hover:border-erp-blue/20 group-hover:shadow-inner transition-all w-24 mx-auto">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full bg-transparent text-center text-[15px] font-black text-erp-navy outline-none"
                                                        value={item.qty}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value);
                                                            const items = [...form.items];
                                                            items[i].qty = isNaN(val) ? 0 : val;
                                                            setForm({ ...form, items });
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-6 text-right">
                                                <div className="font-black text-erp-blue text-lg tracking-tighter">{formatVND(item.qty * item.estimatedPrice)}</div>
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">VND Subtotal</div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="relative group/input">
                                                    <Info size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-erp-blue transition-colors" />
                                                    <input
                                                        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-transparent rounded-[20px] text-xs font-semibold text-slate-600 outline-none transition-all focus:bg-white focus:border-erp-blue/30 focus:shadow-[0_10px_25px_-5px_rgba(37,99,235,0.08)]"
                                                        placeholder="Màu sắc, kích thước, quy cách..."
                                                        value={item.specNote}
                                                        onChange={e => {
                                                            const items = [...form.items];
                                                            items[i].specNote = e.target.value;
                                                            setForm({ ...form, items });
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-white hover:bg-rose-500 rounded-[20px] transition-all shadow-sm hover:shadow-xl hover:shadow-rose-200 active:scale-90"
                                                    onClick={() => {
                                                        setForm({ ...form, items: form.items.filter((_: PRItem, idx: number) => idx !== i) });
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {form.items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-24">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                                                        <Plus size={32} className="text-slate-300" />
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-1">Giỏ hàng rỗng</span>
                                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Vui lòng thêm sản phẩm để tiếp tục</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {form.items.length > 0 && (
                            <div className="mt-8 flex justify-end">
                                <div className="bg-erp-navy rounded-3xl p-8 text-white min-w-[320px] shadow-2xl shadow-erp-navy/30 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="relative z-10 flex flex-col gap-4">
                                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Số lượng mặt hàng</span>
                                            <span className="font-black text-xl">{form.items.length} <span className="text-xs font-medium ml-1">Items</span></span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Tổng cộng dự kiến</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black">
                                                        {formatVND(form.items.reduce((sum: number, item: PRItem) => sum + (item.qty * item.estimatedPrice), 0))}
                                                    </span>
                                                    <span className="text-xs font-bold text-white/70 uppercase">VND</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-2xl">
                                                <Save size={20} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <SupplierSuggestionWidget items={form.items} />
                </div>

                {/* Side info & Help */}
                <div className="space-y-6">
                    {activeCC ? (
                        <div className="erp-card shadow-xl border-t-4 border-t-erp-blue overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                    <AlertCircle size={16} className="text-erp-blue" /> Tổng quan Ngân sách
                                </h3>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                    {activeCC.code}
                                </span>
                            </div>

                            <div className="space-y-5">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấp phát Quý {currentQuarter}</div>
                                        <div className="text-sm font-black text-erp-navy">
                                            {formatVND(quarterlyAllocation ? quarterlyAllocation.allocatedAmount : activeCC.budgetAnnual)} {activeCC.currency}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đã dùng (Q{currentQuarter})</div>
                                        <div className="text-sm font-black text-slate-600">
                                            {formatVND(quarterlyAllocation ? (Number(quarterlyAllocation.spentAmount || 0) + Number(quarterlyAllocation.committedAmount || 0)) : activeCC.budgetUsed)} {activeCC.currency}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] items-center">
                                        <span className="font-bold text-slate-400">Tiến độ tiêu thụ Quý</span>
                                        <span className={`font-black ${isOverBudget ? 'text-red-500' : 'text-erp-blue'}`}>
                                            {Math.round(((quarterlyAllocation ? (Number(quarterlyAllocation.spentAmount || 0) + Number(quarterlyAllocation.committedAmount || 0)) : Number(activeCC.budgetUsed)) + totalEstimate) / (quarterlyAllocation ? Number(quarterlyAllocation.allocatedAmount) : (Number(activeCC.budgetAnnual) || 1)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-50">
                                        {/* Used Budget Segment */}
                                        <div
                                            className="h-full bg-slate-300 transition-all duration-500"
                                            style={{ width: `${Math.min(100, (quarterlyAllocation ? (Number(quarterlyAllocation.spentAmount || 0) + Number(quarterlyAllocation.committedAmount || 0)) : Number(activeCC.budgetUsed)) / (quarterlyAllocation ? Number(quarterlyAllocation.allocatedAmount) : (Number(activeCC.budgetAnnual) || 1)) * 100)}%` }}
                                        />
                                        {/* Current PR Impact Segment */}
                                        <div
                                            className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-erp-blue animate-pulse'}`}
                                            style={{ width: `${Math.min(100 - ((quarterlyAllocation ? (Number(quarterlyAllocation.spentAmount || 0) + Number(quarterlyAllocation.committedAmount || 0)) : Number(activeCC.budgetUsed)) / (quarterlyAllocation ? Number(quarterlyAllocation.allocatedAmount) : (Number(activeCC.budgetAnnual) || 1)) * 100), (totalEstimate / (quarterlyAllocation ? Number(quarterlyAllocation.allocatedAmount) : (Number(activeCC.budgetAnnual) || 1))) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Đã dùng</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-erp-blue animate-pulse"></div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Dự kiến PR</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl border flex flex-col gap-1 ${isOverBudget ? 'bg-red-50 border-red-100' : 'bg-erp-blue/5 border-erp-blue/10'}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isOverBudget ? 'text-red-600' : 'text-erp-blue/70'}`}>
                                        {isOverBudget ? 'Ngân sách thiếu hụt' : 'Ngân sách còn lại sau PR'}
                                    </span>
                                    <div className="flex justify-between items-baseline">
                                        <span className={`text-xl font-black ${isOverBudget ? 'text-red-600' : 'text-erp-blue'}`}>
                                            {formatVND(Math.abs(remainingBudget - totalEstimate))}
                                        </span>
                                        <span className={`text-[10px] font-bold ${isOverBudget ? 'text-red-400' : 'text-erp-blue/50'}`}>{activeCC.currency}</span>
                                    </div>
                                    <div className="mt-1 text-[8px] font-bold text-slate-400 italic">
                                        Dựa trên dữ liệu: Ngân sách Quý {currentQuarter}/{currentYear}
                                    </div>
                                </div>

                                {isOverBudget && (
                                    <div className="p-3 bg-red-100 rounded-xl flex items-start gap-3 border border-red-200">
                                        <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-red-700 font-bold leading-tight">Yêu cầu này vượt hạn mức ngân sách. Quy trình phê duyệt sẽ được chuyển sang cấp cao hơn (Board Approval).</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="erp-card bg-slate-50 text-center py-10 border border-dashed border-slate-200">
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm mb-2">
                                    <Info size={24} className="text-slate-300" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vui lòng chọn Cost Center</span>
                                <p className="text-[9px] text-slate-300 max-w-[160px] mx-auto font-bold uppercase tracking-tight">Chọn một trung tâm chi phí để kiểm tra ngân sách khả dụng cho yêu cầu này.</p>
                            </div>
                        </div>
                    )}

                    <div className="erp-card shadow-sm border border-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-slate-50 rounded-lg">
                                <Plus size={16} className="text-erp-blue" />
                            </div>
                            Quy trình phê duyệt
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start border-l-2 border-erp-blue pl-4">
                                <div className="text-[10px] font-black text-white bg-erp-blue w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</div>
                                <div>
                                    <div className="text-[10px] font-black text-erp-navy uppercase">Khởi tạo</div>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Bạn đang ở bước này. PR sẽ được gửi đi sau khi nhấn Submit.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start border-l-2 border-slate-200 pl-4 py-1">
                                <div className="text-[10px] font-black text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                        {totalEstimate >= 10000000 ? "Giám đốc (Director)" : "Trưởng bộ phận (Manager)"}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                        {totalEstimate >= 10000000 ? "Phê duyệt các PR giá trị cao (>= 10,000,000 VND)." : "Phê duyệt các PR tiêu chuẩn (< 10,000,000 VND)."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start border-l-2 border-slate-200 pl-4">
                                <div className="text-[10px] font-black text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase">Sourcing / Procurement</div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Tiếp nhận và bắt đầu tìm kiếm nhà cung cấp phù hợp.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 shadow-sm border-dashed">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={16} className="text-erp-blue" />
                            <h4 className="text-[10px] font-black text-erp-navy uppercase tracking-widest">Hỗ trợ ProcurePro</h4>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            &quot;Mọi thắc mắc về Spec kỹ thuật hoặc mã hàng, vui lòng liên hệ bộ phận ProcurePro qua Extension 101.&quot;
                        </p>
                    </div>
                </div>
            </div>

            {/* Submission Status Modal */}
            {submissionStatus !== 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-erp-navy/40 backdrop-blur-sm animate-in fade-in duration-300" />

                    <div className="relative bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        <div className="p-10 text-center">
                            {submissionStatus === 'loading' && (
                                <div className="flex flex-col items-center gap-6 py-4">
                                    <div className="relative flex items-center justify-center h-20 w-20">
                                        <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-erp-blue animate-spin" />
                                        <div className="absolute inset-2 rounded-full border-2 border-slate-50 border-b-erp-blue/30 animate-spin [animation-duration:3s]" />
                                        <Loader2 className="text-erp-blue animate-spin" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-erp-navy uppercase tracking-tight mb-2">Đang xử lý...</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Vui lòng không đóng cửa sổ này khi hệ thống đang ghi nhận dữ liệu.</p>
                                    </div>
                                </div>
                            )}

                            {submissionStatus === 'success' && (
                                <div className="flex flex-col items-center gap-6 py-4">
                                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100 animate-in zoom-in duration-500">
                                        <CheckCircle2 size={40} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-emerald-600 uppercase tracking-tight mb-2">Gửi thành công!</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Yêu cầu đã được chuyển tới cấp phê duyệt tương ứng.</p>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-emerald-500 transition-all duration-2000 ease-linear" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            )}

                            {submissionStatus === 'error' && (
                                <div className="flex flex-col items-center gap-6 py-4">
                                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center border-4 border-red-100 animate-in zoom-in duration-500">
                                        <XCircle size={40} className="text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-red-600 uppercase tracking-tight mb-2">Gửi thất bại</h3>
                                        <p className="text-[11px] text-slate-500 font-bold italic mt-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">{errorMessage}</p>
                                    </div>
                                    <button
                                        onClick={() => setSubmissionStatus('idle')}
                                        className="w-full py-4 bg-erp-navy text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-erp-navy/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Quay lại chỉnh sửa
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
