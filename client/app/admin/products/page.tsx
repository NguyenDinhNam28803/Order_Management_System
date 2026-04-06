"use client";

import { useState, useEffect } from "react";
import { useProcurement, Product, ProductCategory } from "../../context/ProcurementContext";
import { CreateProductDtoShort, CreateCategoryDto, CurrencyCode, ProductType } from "../../types/api-types";
import DashboardHeader from "../../components/DashboardHeader";
import ERPTable, { ERPTableColumn } from "../../components/shared/ERPTable";
import { 
    Plus, Search, Edit2, Trash2, 
    Layers, ChevronDown, Loader2 } from "lucide-react";

export default function ProductAdminPage() {
    const { 
        products, 
        categories,
        organizations,
        refreshData,
        addProduct, 
        updateProduct, 
        removeProduct,
        addCategory,
        updateCategory,
        removeCategory,
        notify,
        currentUser
    } = useProcurement();

    useEffect(() => {
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, [refreshData]);
    
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Sản phẩm"); 

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

    const [productForm, setProductForm] = useState<Partial<Product>>({});
    const [categoryForm, setCategoryForm] = useState<Partial<ProductCategory>>({});

    useEffect(() => {
        if (editingProduct) {
            setProductForm({ ...editingProduct });
        } else {
            setProductForm({
                name: "",
                sku: "",
                unitPriceRef: 0,
                unit: "Cái",
                currency: CurrencyCode.VND,
                type: ProductType.CATALOG,
                categoryId: categories[0]?.id || "",
                orgId: organizations[0]?.id || "",
                isActive: true
            });
        }
    }, [editingProduct, categories, organizations]);

    useEffect(() => {
        if (editingCategory) {
            setCategoryForm({ ...editingCategory });
        } else {
            setCategoryForm({
                name: "",
                code: "",
                description: "",
                isActive: true,
                orgId: currentUser?.orgId || organizations[0]?.id || ""
            });
        }
    }, [editingCategory, organizations]);

    const handleSaveProduct = async () => {
        if (!productForm.name || !productForm.sku || !productForm.categoryId || !productForm.orgId) {
            notify("Vui lòng điền đầy đủ thông tin", "warning");
            return;
        }

        setLoading(true);
        try {
            let success = false;
            // Strict casting to Payload interface
            const payload: CreateProductDtoShort = {
                name: productForm.name || "",
                sku: productForm.sku || "",
                unitPriceRef: Number(productForm.unitPriceRef) || 0,
                unit: productForm.unit || "Cái",
                currency: productForm.currency || CurrencyCode.VND,
                type: productForm.type || ProductType.CATALOG,
                categoryId: productForm.categoryId || undefined,
                orgId: productForm.orgId || undefined,
                isActive: productForm.isActive ?? true,
                description: productForm.description || "",
                attributes: productForm.attributes || {}
            };

            if (editingProduct) {
                success = await updateProduct(editingProduct.id, payload);
            } else {
                success = await addProduct(payload);
            }
            
            if (success) {
                setIsProductModalOpen(false);
                setEditingProduct(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name || !categoryForm.code || !categoryForm.orgId) {
            notify("Vui lòng điền đầy đủ thông tin", "warning");
            return;
        }

        setLoading(true);
        try {
            let success = false;
            // Strict casting to Payload interface
            const payload: CreateCategoryDto = {
                name: categoryForm.name || "",
                code: categoryForm.code || "",
                description: categoryForm.description || "",
                orgId: categoryForm.orgId || undefined,
                isActive: categoryForm.isActive ?? true
            };

            if (editingCategory) {
                success = await updateCategory(editingCategory.id, payload);
            } else {
                success = await addCategory(payload);
            }
            
            if (success) {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            await removeProduct(id);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            await removeCategory(id);
        }
    };

    const productColumns: ERPTableColumn<Product>[] = [
        { 
            label: "Sản phẩm", 
            key: "name",
            render: (row: Product) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 uppercase font-black text-[10px]">
                        {row.name.substring(0,2)}
                    </div>
                    <div>
                        <div className="font-bold text-erp-navy leading-tight">{row.name}</div>
                        <div className="text-[10px] text-slate-400  tracking-tighter uppercase">{row.sku}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Danh mục",
            key: "category",
            render: (row: Product) => (
                <div className="flex flex-col gap-1">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200 w-fit">
                        {row.category?.name || "N/A"}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-tight ${row.type === ProductType.CATALOG ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {row.type === ProductType.CATALOG ? '● Catalog (Tiêu chuẩn)' : '○ Non-catalog (Phi tiêu chuẩn)'}
                    </span>
                </div>
            )
        },
        {
            label: "Đơn vị",
            key: "unit",
            render: (row: Product) => <span className="text-xs font-bold text-slate-500 uppercase">{row.unit || "PCS"}</span>
        },
        {
            label: "Giá tham khảo",
            key: "unitPriceRef",
            render: (row: Product) => (
                <div className=" font-black text-erp-navy text-sm">
                    {Number(row.unitPriceRef || 0).toLocaleString()} ₫
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "isActive",
            render: (row: Product) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    row.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${row.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                    {row.isActive ? "Đang bán" : "Ngừng bán"}
                </span>
            )
        },
        {
            label: "Thao tác",
            render: (row: Product) => (
                <div className="flex gap-2">
                    <button 
                        className="p-2 text-slate-400 hover:text-erp-blue hover:bg-erp-blue/5 rounded-lg transition-all"
                        onClick={() => {
                            setEditingProduct(row);
                            setIsProductModalOpen(true);
                        }}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => handleDeleteProduct(row.id)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const categoryColumns: ERPTableColumn<ProductCategory>[] = [
        {
            label: "Mã",
            key: "code",
            render: (row: ProductCategory) => <span className=" text-xs font-bold text-erp-navy">{row.code}</span>
        },
        {
            label: "Tên danh mục",
            key: "name",
            render: (row: ProductCategory) => (
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{row.name}</span>
                </div>
            )
        },
        {
            label: "Mô tả",
            key: "description",
            render: (row: ProductCategory) => <span className="text-xs text-slate-500 italic">{row.description || "-"}</span>
        },
        {
            label: "Thao tác",
            render: (row: ProductCategory) => (
                <div className="flex gap-2">
                    <button 
                        className="p-2 text-slate-400 hover:text-erp-blue hover:bg-erp-blue/5 rounded-lg transition-all"
                        onClick={() => {
                            setEditingCategory(row);
                            setIsCategoryModalOpen(true);
                        }}
                    >
                        <Edit2 size={16}/>
                    </button>
                    <button 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => handleDeleteCategory(row.id)}
                    >
                        <Trash2 size={16}/>
                    </button>
                </div>
            )
        }
    ];

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Hệ thống", "Hàng hóa & Sản phẩm"]} />
            
            <div className="mt-8 flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Quản lý kho hàng & Danh mục</h1>
                    <p className="text-sm text-slate-500 mt-1 font-bold">DỮ LIỆU SẢN PHẨM SOURCE TỪ HỆ THỐNG TRUNG TÂM</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        className="btn-primary flex items-center gap-2 py-4 px-8 shadow-xl shadow-erp-navy/20"
                        onClick={() => {
                            if (activeTab === "Sản phẩm") {
                                setEditingProduct(null);
                                setIsProductModalOpen(true);
                            } else {
                                setEditingCategory(null);
                                setIsCategoryModalOpen(true);
                            }
                        }}
                    >
                        <Plus size={20} />
                        <span className="text-sm font-black uppercase">
                            {activeTab === "Sản phẩm" ? "Thêm sản phẩm" : "Thêm danh mục"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white rounded-4xl border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl w-fit">
                            {["Sản phẩm", "Danh mục"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab 
                                        ? "bg-erp-navy text-white shadow-lg" 
                                        : "text-slate-400 hover:text-erp-navy hover:bg-slate-50"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 flex-1 max-w-md">
                            <div className="relative flex-1 group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-erp-blue transition-colors" />
                                <input 
                                    className="erp-input w-full pl-12 font-bold focus:border-erp-blue" 
                                    placeholder={`Tìm kiếm ${activeTab.toLowerCase()}...`}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-100">
                        {activeTab === "Sản phẩm" ? (
                            <ERPTable columns={productColumns} data={filteredProducts} />
                        ) : (
                            <ERPTable columns={categoryColumns} data={filteredCategories} />
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 flex items-center gap-6 group hover:border-erp-blue/30 transition-all text-center">
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mục sản phẩm</div>
                            <div className="text-3xl font-black text-erp-navy">{products.length}</div>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 flex items-center gap-6 group hover:border-erp-blue/30 transition-all text-center">
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Danh mục cấp 1</div>
                            <div className="text-3xl font-black text-erp-navy">{categories.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-erp-navy/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-100">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-erp-navy uppercase tracking-tight">
                                {editingProduct ? "Cập nhật sản phẩm" : "Thêm mới Sản phẩm nguồn"}
                            </h3>
                            <button 
                                onClick={() => setIsProductModalOpen(false)}
                                className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Plus size={24} className="rotate-45 text-slate-400" />
                            </button>
                        </div>
                        
                        {/* Form Body */}
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tên sản phẩm (Product Name)</label>
                                    <input 
                                        className="erp-input w-full font-bold" 
                                        value={productForm.name || ""} 
                                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                        placeholder="VD: Server Dell R740..." 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Mã SKU</label>
                                    <input 
                                        className="erp-input w-full  font-bold" 
                                        value={productForm.sku || ""} 
                                        onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                                        placeholder="DELL-R740-01" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Đơn vị tính</label>
                                    <input 
                                        className="erp-input w-full font-bold" 
                                        value={productForm.unit || "Cái"} 
                                        onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                                        placeholder="Cái, Bộ, Lô..." 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Giá tham khảo (VNĐ)</label>
                                    <input 
                                        type="number" 
                                        className="erp-input w-full font-black text-erp-blue" 
                                        value={productForm.unitPriceRef || 0} 
                                        onChange={e => setProductForm({ ...productForm, unitPriceRef: Number(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Loại sản phẩm</label>
                                    <div className="relative group/select">
                                        <select 
                                            className="erp-input w-full font-bold appearance-none bg-white cursor-pointer pr-10"
                                            value={productForm.type || ProductType.CATALOG}
                                            onChange={e => setProductForm({ ...productForm, type: e.target.value as ProductType })}
                                        >
                                            <option value={ProductType.CATALOG}>Catalog (Hàng tiêu chuẩn)</option>
                                            <option value={ProductType.NON_CATALOG}>Non-catalog (Phi tiêu chuẩn)</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/select:text-erp-blue" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Danh mục (Category)</label>
                                    <div className="relative group/select">
                                        <select 
                                            className="erp-input w-full font-bold appearance-none bg-white cursor-pointer pr-10"
                                            value={productForm.categoryId || ""}
                                            onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                                        >
                                            <option value="" disabled>-- Chọn danh mục --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/select:text-erp-blue" />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-1">
                                        Tổ chức / Nhà cung cấp (Organization) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group/select">
                                        <select 
                                            className="erp-input w-full font-bold appearance-none bg-white cursor-pointer pr-10"
                                            value={productForm.orgId || ""}
                                            onChange={e => setProductForm({ ...productForm, orgId: e.target.value })}
                                        >
                                            <option value="" disabled>-- Chọn tổ chức --</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/select:text-erp-blue" />
                                    </div>
                                </div>

                                <div className="col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-erp-navy tracking-widest">Kích hoạt (Is Active)</span>
                                        <span className="text-[8px] text-slate-400 font-bold">Cho phép sử dụng sản phẩm này trong các yêu cầu mua hàng</span>
                                    </div>
                                    <button 
                                        onClick={() => setProductForm({...productForm, isActive: !productForm.isActive})}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${productForm.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${productForm.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 text-xs">
                             {loading && <div className="flex items-center gap-2 text-erp-blue font-black uppercase tracking-widest mr-auto"><Loader2 size={14} className="animate-spin" /> Đang xử lý...</div>}
                            <button 
                                className="px-8 py-3.5 font-black text-slate-500 uppercase tracking-widest border border-slate-200 hover:bg-white rounded-2xl transition-all shadow-sm" 
                                onClick={() => setIsProductModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button 
                                className="btn-primary py-3.5 px-10 shadow-2xl shadow-erp-navy/30" 
                                onClick={handleSaveProduct} 
                                disabled={loading}
                            >
                                {editingProduct ? "Cập nhật" : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product/Category Creation Form Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-erp-navy/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300 border border-slate-100">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-erp-navy uppercase tracking-tight">
                                {editingCategory ? "Cập nhật Danh mục" : "Thêm mới Sản phẩm / Danh mục"}
                            </h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
                                <Plus size={24} className="rotate-45 text-slate-400" />
                            </button>
                        </div>
                        
                        {/* Form Body */}
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Mã (Code)</label>
                                    <input 
                                        className="erp-input w-full  font-bold" 
                                        placeholder="VD: CAT-001"
                                        value={categoryForm.code || ""} 
                                        onChange={e => setCategoryForm({...categoryForm, code: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tên (Name)</label>
                                    <input 
                                        className="erp-input w-full font-bold" 
                                        placeholder="Nhập tên..."
                                        value={categoryForm.name || ""} 
                                        onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                                    />
                                </div>
                                
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-1">
                                        Tổ chức / Nhà cung cấp (Organization) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group/select">
                                        <select 
                                            className="erp-input w-full font-bold appearance-none bg-white cursor-pointer pr-10"
                                            value={categoryForm.orgId || ""}
                                            onChange={e => setCategoryForm({...categoryForm, orgId: e.target.value})}
                                        >
                                            <option value="" disabled>-- Chọn tổ chức --</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/select:text-erp-blue transition-colors" />
                                    </div>
                                    <p className="mt-1.5 text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Dữ liệu nguồn được kéo từ GET /api/organizations</p>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Mô tả (Description)</label>
                                    <textarea 
                                        className="erp-input w-full h-24 font-medium resize-none" 
                                        placeholder="Nhập ghi chú chi tiết..."
                                        value={categoryForm.description || ""} 
                                        onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} 
                                    />
                                </div>

                                <div className="col-span-2 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-erp-navy tracking-widest">Kích hoạt (Is Active)</span>
                                        <span className="text-[8px] text-slate-400 font-bold">Trạng thái hoạt động của dữ liệu</span>
                                    </div>
                                    <button 
                                        onClick={() => setCategoryForm({...categoryForm, isActive: !categoryForm.isActive})}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${categoryForm.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${categoryForm.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 text-xs">
                             {loading && <div className="flex items-center gap-2 text-erp-blue font-black uppercase tracking-widest mr-auto"><Loader2 size={14} className="animate-spin" /> Đang xử lý...</div>}
                            <button 
                                className="px-8 py-3.5 font-black text-slate-500 uppercase tracking-widest border border-slate-200 hover:bg-white rounded-2xl transition-all shadow-sm" 
                                onClick={() => setIsCategoryModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button 
                                className="btn-primary py-3.5 px-10 shadow-2xl shadow-erp-navy/30" 
                                onClick={handleSaveCategory} 
                                disabled={loading}
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
