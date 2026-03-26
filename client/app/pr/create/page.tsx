"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { useProcurement } from "../../context/ProcurementContext";
import { Trash2, Save, FileText, ShoppingBag, AlertCircle, Info, Plus, Sparkles } from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";
import SupplierSuggestionWidget from "../../components/SupplierSuggestionWidget";

interface Product {
    id: string;
    name: string;
    sku: string;
    categoryId: string;
    unitPriceRef: number;
    unit: string;
}

interface CostCenter {
    id: string;
    name: string;
    code: string;
    deptId?: string;
    budgetAnnual: number;
    budgetUsed: number;
    currency: string;
}

interface PRItem {
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
    currency: string;
    costCenterId: string;
    items: PRItem[];
}

export default function CreatePRPage() {
    const { apiFetch, costCenters, currentUser } = useProcurement();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
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

    useEffect(() => {
        apiFetch('/products')
            .then((res: Response) => res.ok ? res.json() : { data: [] })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((data: any) => {
                const productList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setProducts(productList);
            })
            .catch(() => setProducts([]));
    }, [apiFetch]);

    const filteredCostCenters = costCenters.filter((cc: CostCenter) => {
        if (!currentUser) return false;
        // Admins and Procurement officers can see all cost centers
        if (currentUser.role === "PLATFORM_ADMIN" || currentUser.role === "PROCUREMENT") return true;
        // Requesters and Managers only see their own department's cost centers
        return !currentUser.deptId || !cc.deptId || cc.deptId === currentUser.deptId;
    });

    const activeCC = filteredCostCenters.find((cc: CostCenter) => cc.id === form.costCenterId);
    const totalEstimate = form.items.reduce((sum: number, item: PRItem) => sum + (item.qty * item.estimatedPrice), 0);
    const isOverBudget = activeCC && (Number(activeCC.budgetAnnual) - Number(activeCC.budgetUsed) < totalEstimate);

    const addItem = (option: { value: string; label: string }) => {
        const product = products.find((p: Product) => p.id === option.value);
        if (!product || form.items.find((i: PRItem) => i.productId === product.id)) return;
        
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

    const handleSubmit = async () => {
        if (!form.title || form.items.length === 0 || !form.costCenterId) {
            alert("Vui lòng nhập đầy đủ tiêu đề, trung tâm chi phí và ít nhất 1 sản phẩm.");
            return;
        }
        const payload = {
            title: form.title,
            description: form.description || undefined,
            justification: form.justification || undefined,
            requiredDate: form.requiredDate || undefined,
            priority: Number(form.priority),
            currency: form.currency || "VND",
            costCenterId: form.costCenterId,
            items: form.items.map((i: PRItem) => ({
                productId: i.productId || undefined,
                productDesc: i.productDesc,
                sku: i.sku || undefined,
                categoryId: i.categoryId || undefined,
                qty: Number(i.qty),
                unit: i.unit || "PCS",
                estimatedPrice: Number(i.estimatedPrice),
                currency: i.currency || "VND",
                specNote: i.specNote || undefined
            }))
        };

        setIsSubmitting(true);
        try {
            const createRes = await apiFetch('/procurement-requests', { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            const createData = await createRes.json();
            
            if (createRes.ok && createData.data?.id) {
                const prId = createData.data.id;
                const submitRes = await apiFetch(`/procurement-requests/${prId}/submit`, { 
                    method: 'POST' 
                });
                
                if (submitRes.ok) {
                    alert("Đã gửi PR thành công lên quy trình phê duyệt!");
                    router.push("/pr");
                } else {
                    alert("Đã tạo nháp PR nhưng không thể gửi phê duyệt tự động.");
                    router.push("/pr");
                }
            } else {
                alert("Không thể tạo PR. Vui lòng kiểm tra lại dữ liệu.");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi hệ thống khi gửi PR.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Yêu cầu mua sắm", "Tạo mới PR"]} />

            <div className="mt-8 flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-3">
                        Tạo Yêu Cầu Mua Hàng (PR)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Khởi tạo quy trình mua sắm mới cho bộ phận của bạn.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 font-black text-slate-500 hover:bg-slate-100 rounded-xl text-xs uppercase tracking-widest transition-colors" onClick={() => router.back()}>Hủy bỏ</button>
                    <button className="btn-primary shadow-xl shadow-erp-navy/30 py-4 px-8" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Đang gửi..." : "Gửi Phê Duyệt PR"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="erp-card shadow-sm border border-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <FileText size={16} /> Thông tin chung
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tiêu đề yêu cầu</label>
                                <input 
                                    className="erp-input w-full font-bold focus:border-erp-blue" 
                                    onChange={e => setForm({...form, title: e.target.value})} 
                                    placeholder="VD: Mua laptop cho team dev, Thiết bị văn phòng tháng 03..." 
                                />
                            </div>
                             <div>
                                 <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Trung tâm chi phí (Cost Center)</label>
                                 <select 
                                     className="erp-input w-full focus:border-erp-blue font-bold" 
                                     value={form.costCenterId}
                                     onChange={e => setForm({...form, costCenterId: e.target.value})}
                                 >
                                     <option value="">-- Chọn trung tâm chi phí --</option>
                                     {filteredCostCenters.map((cc: CostCenter) => (
                                         <option key={cc.id} value={cc.id}>
                                             {cc.name} ({cc.code}) - Còn lại: {(Number(cc.budgetAnnual) - Number(cc.budgetUsed)).toLocaleString()} {cc.currency}
                                         </option>
                                     ))}
                                 </select>
                                 {activeCC && (
                                     <div className={`mt-2 text-[10px] font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                                         {isOverBudget ? '⚠️ Vượt ngân sách dự kiến!' : '✅ Ngân sách khả dụng'}
                                     </div>
                                 )}
                             </div>
                             <div>
                                 <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Mức độ khẩn cấp</label>
                                <select 
                                    className={`erp-input w-full focus:border-erp-blue font-bold ${form.priority === 1 ? 'border-red-300 bg-red-50 text-red-600' : ''}`} 
                                    value={form.priority}
                                    onChange={e => {
                                        const newPriority = parseInt(e.target.value);
                                        const updatedItems = form.items.map((item: PRItem) => ({
                                            ...item,
                                            estimatedPrice: newPriority === 1 ? item.basePrice * 1.2 : item.basePrice
                                        }));
                                        setForm({...form, priority: newPriority, items: updatedItems});
                                    }}
                                >
                                    <option value={1}>1 - Khẩn cấp (Surcharge +20%)</option>
                                    <option value={2}>2 - Bình thường</option>
                                    <option value={3}>3 - Dự phòng / Thay thế</option>
                                </select>
                                {form.priority === 1 && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                        <AlertCircle size={12} /> Áp dụng phụ phí khẩn cấp 20%
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Ngày cần hàng (Target Date)</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="erp-input w-full font-mono focus:border-erp-blue" 
                                        onChange={e => setForm({...form, requiredDate: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Lý do mua sắm (Justification)</label>
                                <textarea 
                                    className="erp-input w-full h-24 focus:border-erp-blue text-sm" 
                                    onChange={e => setForm({...form, justification: e.target.value})} 
                                    placeholder="Giải trình tại sao cần mua những mặt hàng này..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="erp-card shadow-sm border border-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <ShoppingBag size={16} /> Danh sách mặt hàng
                        </h3>
                        
                        <div className="mb-6">
                            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tìm & Thêm sản phẩm</label>
                            <Select<{ value: string; label: string }>
                                options={products.map((p: Product) => ({ label: `${p.name} - SKU: ${p.sku} [${(Number(p.unitPriceRef) || 0).toLocaleString()} ₫]`, value: p.id }))}
                                onChange={(option) => option && addItem(option)}
                                className="text-sm font-medium"
                                placeholder="Nhập tên sản phẩm hoặc mã SKU để tìm..."
                                styles={{
                                    control: (base: Record<string, unknown>) => ({
                                        ...base,
                                        borderRadius: '0.75rem',
                                        padding: '4px',
                                        borderColor: '#e2e8f0',
                                        boxShadow: 'none',
                                        '&:hover': { borderColor: '#1e40af' }
                                    })
                                }}
                            />
                        </div>

                        <div className="overflow-x-auto -mx-8">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Sản phẩm & Đặc tính</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Nhà cung cấp</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Số lượng</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Đơn giá</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Thành tiền</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú Spec</th>
                                        <th className="px-8 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.map((item: PRItem, i: number) => (
                                        <tr key={i} className="group hover:bg-erp-blue/5 transition-colors duration-150">
                                            <td className="px-8 py-4 border-b border-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:border-erp-blue/30 group-hover:bg-white transition-all">
                                                        <ShoppingBag size={18} className="text-slate-400 group-hover:text-erp-blue" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-erp-navy text-sm leading-tight mb-0.5">{item.productDesc}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{item.sku} • {item.unit || 'PCS'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 border-b border-slate-50">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="inline-block px-3 py-1 rounded-lg bg-erp-blue/10 text-erp-blue text-[10px] font-black uppercase tracking-widest border border-erp-blue/20 w-fit">
                                                        {item.supplierName || 'Thị trường'}
                                                    </span>
                                                    {item.aiStatus && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 w-fit animate-pulse">
                                                            <Sparkles size={10} className="fill-amber-600" />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">{item.aiLabel}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 border-b border-slate-50">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    className="erp-input-sm w-full text-center text-erp-navy border-slate-100 ring-erp-blue/20" 
                                                    value={item.qty} 
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value);
                                                        const items = [...form.items];
                                                        items[i].qty = isNaN(val) ? 0 : val;
                                                        setForm({...form, items});
                                                    }} 
                                                />
                                            </td>
                                            <td className="px-4 py-4 border-b border-slate-50 text-right font-mono text-xs text-slate-500 font-medium">
                                                {item.estimatedPrice.toLocaleString()} ₫
                                            </td>
                                            <td className="px-4 py-4 border-b border-slate-50 text-right font-mono font-black text-erp-blue">
                                                {(item.qty * item.estimatedPrice).toLocaleString()} ₫
                                            </td>
                                            <td className="px-4 py-4 border-b border-slate-50">
                                                <div className="relative">
                                                    <Info size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                    <input 
                                                        className="erp-input-sm w-full pl-8 text-[11px] border-slate-100" 
                                                        placeholder="Cấu hình, kích thước, màu sắc..." 
                                                        value={item.specNote}
                                                        onChange={e => {
                                                            const items = [...form.items];
                                                            items[i].specNote = e.target.value;
                                                            setForm({...form, items});
                                                        }} 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 border-b border-slate-50 text-center">
                                                <button 
                                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all" 
                                                    title="Xóa dòng này"
                                                    onClick={() => {
                                                        setForm({...form, items: form.items.filter((_: PRItem, idx: number) => idx !== i)});
                                                    }}
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {form.items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-20 bg-slate-50/30">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                                        <Plus size={32} className="text-slate-200" />
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Giỏ hàng trống</span>
                                                        <p className="text-[10px] text-slate-300 font-medium max-w-50">Hãy chọn sản phẩm từ khung tìm kiếm phía trên để bắt đầu yêu cầu.</p>
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
                                                        {form.items.reduce((sum: number, item: PRItem) => sum + (item.qty * item.estimatedPrice), 0).toLocaleString()}
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
                    <div className="erp-card shadow-sm border border-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 flex items-center gap-2">
                            <Plus size={16} /> Quy trình phê duyệt
                        </h3>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start border-l-2 border-erp-blue pl-4">
                                <div className="text-[10px] font-black text-white bg-erp-blue w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</div>
                                <div>
                                    <div className="text-[10px] font-black text-erp-navy uppercase">Khởi tạo</div>
                                    <p className="text-[10px] text-slate-500 font-medium">Bạn đang ở bước này. PR sẽ được gửi đi sau khi nhấn Submit.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start border-l-2 border-slate-200 pl-4 py-1">
                                <div className="text-[10px] font-black text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase">Trưởng bộ phận (HOD)</div>
                                    <p className="text-[10px] text-slate-400 font-medium">Phê duyệt ngân sách và sự cần thiết.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start border-l-2 border-slate-200 pl-4">
                                <div className="text-[10px] font-black text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase">Sourcing / Procurement</div>
                                    <p className="text-[10px] text-slate-400 font-medium">Tiếp nhận và bắt đầu tìm kiếm nhà cung cấp.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 flex items-start gap-4">
                        <Info size={20} className="text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-black text-orange-900 uppercase mb-1">Lưu ý ngân sách</h4>
                            <p className="text-[10px] text-orange-800 leading-relaxed font-medium">Hệ thống sẽ tự động kiểm tra Budget Cap của Center ID-325F. Nếu vượt hạn mức, PR sẽ tự động chuyển sang luồng phê duyệt ngoại lệ (Presidency Approval).</p>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={16} className="text-erp-blue" />
                            <h4 className="text-xs font-black text-erp-navy uppercase">Hỗ trợ</h4>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium italic">&quot;Mọi thắc mắc về Spec kỹ thuật hoặc mã hàng, vui lòng liên hệ bộ phận ProcurePro qua Extension 101.&quot;</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
