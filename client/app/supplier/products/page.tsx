"use client";

import { useState, useEffect, useMemo } from "react";
import { useProcurement, Product, ProductCategory } from "../../context/ProcurementContext";
import { CreateProductDtoShort, CurrencyCode, ProductType } from "../../types/api-types";
import ERPTable, { ERPTableColumn } from "../../components/shared/ERPTable";
import {
    Plus, Search, Edit2, Trash2,
    Box, ChevronDown, Loader2, Package, Tag, Info
} from "lucide-react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { formatVND } from "../../utils/formatUtils";

export default function SupplierProductsPage() {
    const { 
        products, 
        categories,
        organizations,
        refreshData,
        addProduct, 
        updateProduct, 
        removeProduct,
        notify,
        currentUser
    } = useProcurement();

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<Partial<Product>>({});

    useEffect(() => {
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, [refreshData]);

    // Filter products to only show those belonging to the supplier's organization
    const myProducts = useMemo(() => {
        return (products || []).filter(p => p.orgId === currentUser?.orgId);
    }, [products, currentUser?.orgId]);

    const filteredData = useMemo(() => {
        return myProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [myProducts, searchTerm]);

    useEffect(() => {
        if (editingProduct) {
            setForm({ ...editingProduct });
        } else {
            setForm({
                name: "",
                sku: "",
                unitPriceRef: 0,
                unit: "Cái",
                currency: CurrencyCode.VND,
                type: ProductType.CATALOG,
                categoryId: categories[0]?.id || "",
                orgId: currentUser?.orgId || "",
                isActive: true,
                description: ""
            });
        }
    }, [editingProduct, categories, currentUser?.orgId]);

    const handleSave = async () => {
        if (!form.name || !form.sku || !form.categoryId) {
            notify("Vui lòng điền các trường bắt buộc (Tên, SKU, Danh mục)", "warning");
            return;
        }

        setLoading(true);
        try {
            const payload: CreateProductDtoShort = {
                name: form.name || "",
                sku: form.sku || "",
                unitPriceRef: Number(form.unitPriceRef) || 0,
                unit: form.unit || "Cái",
                currency: form.currency || CurrencyCode.VND,
                type: form.type || ProductType.CATALOG,
                categoryId: form.categoryId || undefined,
                orgId: currentUser?.orgId || undefined,
                isActive: form.isActive ?? true,
                description: form.description || "",
                attributes: form.attributes || {}
            };

            let success = false;
            if (editingProduct) {
                success = await updateProduct(editingProduct.id, payload);
            } else {
                success = await addProduct(payload);
            }
            
            if (success) {
                setIsModalOpen(false);
                setEditingProduct(null);
                refreshData();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmState({
            open: true,
            title: "Ngừng kinh doanh sản phẩm",
            message: "Bạn có chắc chắn muốn ngừng kinh doanh sản phẩm này?",
            onConfirm: async () => {
                setConfirmState(s => ({ ...s, open: false }));
                const success = await removeProduct(id);
                if (success) refreshData();
            }
        });
    };

    const columns: ERPTableColumn<Product>[] = [
        { 
            label: "Sản phẩm", 
            key: "name",
            render: (row: Product) => (
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 leading-tight">{row.name}</div>
                        <div className="text-[0.6875rem] text-[#64748B] font-black uppercase tracking-widest mt-1">{row.sku}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Phân loại",
            key: "category",
            render: (row: Product) => (
                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <Tag size={12} className="text-indigo-500" />
                        {row.category?.name || "Chưa phân loại"}
                    </span>
                    <span className={`text-[0.6875rem] font-black uppercase tracking-tighter ${row.type === ProductType.CATALOG ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {row.type === ProductType.CATALOG ? 'Catalog' : 'Non-catalog'}
                    </span>
                </div>
            )
        },
        {
            label: "Giá niêm yết",
            key: "unitPriceRef",
            render: (row: Product) => (
                <div className="font-black text-slate-900">
                    {formatVND(row.unitPriceRef)}
                    <span className="text-[0.6875rem] text-black font-bold ml-1 uppercase">/ {row.unit || "Cái"}</span>
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "isActive",
            render: (row: Product) => (
                <div className="min-w-[90px]">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-black uppercase tracking-wider ${
                        row.isActive ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" : "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                    }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${row.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {row.isActive ? "Đang bán" : "Ngừng bán"}
                    </span>
                </div>
            )
        },
        {
            label: "Thao tác",
            render: (row: Product) => (
                <div className="flex gap-1">
                    <button 
                        className="p-1.5 text-slate-900 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg border border-transparent hover:border-[#2563EB]/20 transition-all"
                        onClick={() => {
                            setEditingProduct(row);
                            setIsModalOpen(true);
                        }}
                        title="Chỉnh sửa"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        className="p-2 text-black hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                        onClick={() => handleDelete(row.id)}
                        title="Xóa/Ngừng bán"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-slate-900">
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Danh mục Sản phẩm</h1>
                    <p className="text-[0.8125rem] text-[#64748B] font-medium italic">Quản lý danh sách hàng hóa và dịch vụ bạn cung cấp cho hệ thống.</p>
                </div>
                <button 
                    className="flex items-center gap-2 py-4 px-8 bg-[#2563EB] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#1D4ED8] transition-all shadow-xl shadow-[#2563EB]/20"
                    onClick={() => {
                        setEditingProduct(null);
                        setIsModalOpen(true);
                    }}
                >
                    <Plus size={20} />
                    <span>Thêm sản phẩm mới</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Stats cards for supplier */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#F1F5F9] p-6 rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center border border-[#2563EB]/20">
                            <Box size={24} />
                        </div>
                        <div>
                            <p className="text-[0.6875rem] font-black text-[#64748B] uppercase tracking-widest leading-none mb-1">Tổng sản phẩm</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{myProducts.length}</p>
                        </div>
                    </div>
                    <div className="bg-[#F1F5F9] p-6 rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
                            <Box size={24} />
                        </div>
                        <div>
                            <p className="text-[0.6875rem] font-black text-[#64748B] uppercase tracking-widest leading-none mb-1">Đang kinh doanh</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{myProducts.filter(p => p.isActive).length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-slate-200 bg-[#FFFFFF] flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative flex-1 max-w-md group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
                            <input 
                                className="w-full pl-12 pr-4 py-3 bg-[#F1F5F9] border border-slate-200 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/30 focus:bg-[#FFFFFF] transition-all"
                                placeholder="Tìm theo tên hoặc mã SKU..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[0.6875rem] font-black text-[#64748B] uppercase tracking-widest mr-2 flex items-center gap-1">
                                <Info size={12} /> Tự động đồng nhất với dữ liệu Backend
                            </span>
                        </div>
                    </div>

                    <div className="min-h-[400px]">
                        <ERPTable columns={columns} data={filteredData} pageSize={12} />
                        {filteredData.length === 0 && !loading && (
                            <div className="py-20 text-center">
                                <div className="h-20 w-20 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900 border border-slate-200">
                                    <Package size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Chưa có sản phẩm nào</h3>
                                <p className="text-slate-900 text-sm">Hãy bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn.</p>
                            </div>
                        )}
                        {loading && (
                            <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                                <Loader2 size={40} className="animate-spin text-[#2563EB]" />
                                <p className="text-slate-900 font-bold uppercase text-[0.6875rem] tracking-[0.2em]">Đang tải dữ liệu...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-slate-200">
                        {/* Header */}
                        <div className="p-10 border-b border-slate-200 bg-[#FFFFFF] flex items-center justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {editingProduct ? "CẬP NHẬT SẢN PHẨM" : "THÊM SẢN PHẨM MỚI"}
                                </h3>
                                <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mt-1">Hồ sơ hàng hóa & dịch vụ</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="h-12 w-12 rounded-xl bg-[#F1F5F9] border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-all shadow-sm group"
                            >
                                <Plus size={24} className="rotate-45 text-slate-900 group-hover:text-black transition-colors" />
                            </button>
                        </div>
                        
                        {/* Form Body */}
                        <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2">
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2.5 ml-1">Tên sản phẩm / Dịch vụ <span className="text-black">*</span></label>
                                    <input 
                                        className="w-full pl-4 pr-4 py-3 bg-[#FFFFFF] border border-slate-200 rounded-xl font-bold text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/30 focus:bg-[#F1F5F9] transition-all" 
                                        value={form.name || ""} 
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="VD: Gói bảo trì máy chủ hàng tháng..." 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2.5 ml-1">Mã SKU / Model <span className="text-black">*</span></label>
                                    <input 
                                        className="w-full pl-4 pr-4 py-3 bg-[#FFFFFF] border border-slate-200 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/30 focus:bg-[#F1F5F9] transition-all" 
                                        value={form.sku || ""} 
                                        onChange={e => setForm({ ...form, sku: e.target.value })}
                                        placeholder="VD: SVC-MAINT-2024" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2.5 ml-1">Đơn vị tính</label>
                                    <input 
                                        className="w-full pl-4 pr-4 py-3 bg-[#FFFFFF] border border-slate-200 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/30 focus:bg-[#F1F5F9] transition-all" 
                                        value={form.unit || "Cái"} 
                                        onChange={e => setForm({ ...form, unit: e.target.value })}
                                        placeholder="Cái, Giờ, Gói..." 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2.5 ml-1">Giá tham khảo (VNĐ) <span className="text-black">*</span></label>
                                    <input 
                                        type="number" 
                                        className="w-full pl-4 pr-4 py-3 bg-[#FFFFFF] border border-slate-200 rounded-xl font-black text-[#2563EB] text-lg placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/30 focus:bg-[#F1F5F9] transition-all" 
                                        value={form.unitPriceRef || 0} 
                                        onChange={e => setForm({ ...form, unitPriceRef: Number(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2.5 ml-1">Danh mục hệ thống <span className="text-black">*</span></label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-4 pr-10 py-3 bg-[#FFFFFF] border border-slate-200 rounded-xl font-bold text-slate-900 appearance-none cursor-pointer focus:outline-none focus:border-[#2563EB]/30 focus:bg-[#F1F5F9] transition-all"
                                            value={form.categoryId || ""}
                                            onChange={e => setForm({ ...form, categoryId: e.target.value })}
                                        >
                                            <option value="" disabled>-- Chọn danh mục --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2.5 ml-1">Mô tả chi tiết</label>
                                    <textarea 
                                        className="w-full pl-4 pr-4 py-3 bg-[#FFFFFF] border border-slate-200 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/30 focus:bg-[#F1F5F9] transition-all h-24 resize-none" 
                                        value={form.description || ""} 
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="Nhập các đặc tính kỹ thuật, cam kết bảo hành..."
                                    />
                                </div>

                                <div className="col-span-2 flex items-center justify-between p-6 bg-[#FFFFFF] rounded-xl border border-slate-200 border-dashed">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Sẵn sàng kinh doanh</span>
                                        <span className="text-[0.6875rem] text-slate-900 font-bold">Nếu tắt, sản phẩm sẽ không hiển thị khi khách hàng tìm kiếm</span>
                                    </div>
                                    <button 
                                        onClick={() => setForm({...form, isActive: !form.isActive})}
                                        className={`w-14 h-7 rounded-full p-1 transition-all duration-500 shadow-inner ${form.isActive ? 'bg-[#2563EB]' : 'bg-[#000000]'}`}
                                    >
                                        <div className={`h-5 w-5 bg-white rounded-full shadow-md transition-transform duration-500 ${form.isActive ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-10 bg-[#FFFFFF] border-t border-slate-200 flex justify-end gap-4">
                            {loading && (
                                <div className="flex items-center gap-2 text-[#2563EB] font-black uppercase text-[0.6875rem] tracking-widest mr-auto">
                                    <Loader2 size={16} className="animate-spin" /> Đang cập nhật dữ liệu...
                                </div>
                            )}
                            <button 
                                className="px-10 py-4 font-black text-slate-900 uppercase tracking-widest border border-slate-200 hover:bg-[#F1F5F9] hover:text-slate-900 rounded-xl transition-all shadow-sm active:scale-95" 
                                onClick={() => setIsModalOpen(false)}
                                disabled={loading}
                            >
                                Đóng
                            </button>
                            <button 
                                className="py-4 px-12 bg-[#2563EB] text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-[#2563EB]/20 active:scale-95 disabled:opacity-50 hover:bg-[#1D4ED8] transition-all" 
                                onClick={handleSave} 
                                disabled={loading}
                            >
                                {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}



