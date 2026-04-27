"use client";

import { useState, useEffect } from "react";
import { useProcurement, Product, ProductCategory } from "../../context/ProcurementContext";
import { CreateProductDtoShort, CreateCategoryDto, CurrencyCode, ProductType } from "../../types/api-types";
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
                    <div className="h-10 w-10 rounded-xl bg-[#FFFFFF] flex items-center justify-center text-[#000000] border border-[rgba(148,163,184,0.1)] uppercase font-black text-[10px]">
                        {row.name.substring(0,2)}
                    </div>
                    <div>
                        <div className="font-bold text-[#000000] leading-tight">{row.name}</div>
                        <div className="text-[10px] text-[#000000] tracking-tighter uppercase">{row.sku}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Danh mục",
            key: "category",
            render: (row: Product) => (
                <div className="flex flex-col gap-1">
                    <span className="px-3 py-1 rounded-full bg-[#FFFFFF] text-[#000000] text-[10px] font-black uppercase tracking-widest border border-[rgba(148,163,184,0.1)] w-fit">
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
            render: (row: Product) => <span className="text-xs font-bold text-[#000000] uppercase">{row.unit || "PCS"}</span>
        },
        {
            label: "Giá tham khảo",
            key: "unitPriceRef",
            render: (row: Product) => (
                <div className="font-black text-[#000000] text-sm">
                    {Number(row.unitPriceRef || 0).toLocaleString()} ₫
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "isActive",
            render: (row: Product) => (
                <div className="min-w-[90px]">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        row.isActive ? "bg-emerald-500/10 text-black border border-emerald-500/20" : "bg-rose-500/10 text-black border border-rose-500/20"
                    }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${row.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
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
                        className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-[#B4533A] hover:border-[#B4533A]/30 rounded-xl transition-all shadow-sm"
                        onClick={() => {
                            setEditingProduct(row);
                            setIsProductModalOpen(true);
                        }}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-black hover:border-rose-400/30 rounded-xl transition-all shadow-sm"
                        onClick={() => handleDeleteProduct(row.id)}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    const categoryColumns: ERPTableColumn<ProductCategory>[] = [
        {
            label: "Mã",
            key: "code",
            render: (row: ProductCategory) => <span className=" text-xs font-bold text-[#000000]">{row.code}</span>
        },
        {
            label: "Tên danh mục",
            key: "name",
            render: (row: ProductCategory) => (
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-[#000000]" />
                    <span className="font-bold text-[#000000]">{row.name}</span>
                </div>
            )
        },
        {
            label: "Mô tả",
            key: "description",
            render: (row: ProductCategory) => <span className="text-xs text-black italic">{row.description || "-"}</span>
        },
        {
            label: "Thao tác",
            render: (row: ProductCategory) => (
                <div className="flex gap-2">
                    <button 
                        className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-[#B4533A] hover:border-[#B4533A]/30 rounded-xl transition-all shadow-sm"
                        onClick={() => {
                            setEditingCategory(row);
                            setIsCategoryModalOpen(true);
                        }}
                    >
                        <Edit2 size={14}/>
                    </button>
                    <button 
                        className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-black hover:border-rose-400/30 rounded-xl transition-all shadow-sm"
                        onClick={() => handleDeleteCategory(row.id)}
                    >
                        <Trash2 size={14}/>
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
        <div className="animate-in fade-in duration-500">            
            <div className="mt-8 flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#000000] tracking-tight uppercase">Quản lý kho hàng & Danh mục</h1>
                    <p className="text-sm text-[#000000] mt-1 font-bold">DỮ LIỆU SẢN PHẨM SOURCE TỪ HỆ THỐNG TRUNG TÂM</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        className="flex items-center gap-2 bg-[#B4533A] text-[#000000] px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#B4533A]/20 hover:scale-[1.02] transition-transform active:scale-95"
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
                        <Plus size={18} />
                        {activeTab === "Sản phẩm" ? "Thêm sản phẩm" : "Thêm danh mục"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-[#FAF8F5] rounded-4xl border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF] flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex gap-1 p-1 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-2xl w-fit">
                            {["Sản phẩm", "Danh mục"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab 
                                        ? "bg-[#B4533A] text-[#000000] shadow-lg shadow-[#B4533A]/20" 
                                        : "text-[#000000] hover:text-[#B4533A] hover:bg-[#B4533A]/10"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 flex-1 max-w-md">
                            <div className="relative flex-1 group">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000000] group-focus-within:text-[#B4533A] transition-colors" />
                                <input 
                                    className="erp-input w-full pl-12 font-bold focus:border-[#B4533A] bg-[#FFFFFF] text-[#000000]" 
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
                    <div className="bg-[#FAF8F5] p-8 rounded-4xl border border-[rgba(148,163,184,0.1)] flex items-center gap-6 group hover:border-[#B4533A]/30 transition-all text-center">
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-[#000000] uppercase tracking-widest mb-1">Mục sản phẩm</div>
                            <div className="text-3xl font-black text-[#000000]">{products.length}</div>
                        </div>
                    </div>
                    <div className="bg-[#FAF8F5] p-8 rounded-4xl border border-[rgba(148,163,184,0.1)] flex items-center gap-6 group hover:border-[#B4533A]/30 transition-all text-center">
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-[#000000] uppercase tracking-widest mb-1">Danh mục cấp 1</div>
                            <div className="text-3xl font-black text-[#000000]">{categories.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4">
                    <div className="bg-[#FAF8F5] rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-[#000000] uppercase mb-2 tracking-tight">
                                {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                            </h2>
                            <p className="text-xs text-[#000000] font-bold uppercase tracking-widest mb-10">QUẢN LÝ KHO HÀNG</p>

                            <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="erp-label">Tên sản phẩm</label>
                                        <input 
                                            className="erp-input w-full" 
                                            value={productForm.name || ""} 
                                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                            placeholder="VD: Server Dell R740..." 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="erp-label">Mã SKU</label>
                                        <input 
                                            className="erp-input w-full" 
                                            value={productForm.sku || ""} 
                                            onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                                            placeholder="DELL-R740-01" 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="erp-label">Đơn vị tính</label>
                                        <input 
                                            className="erp-input w-full" 
                                            value={productForm.unit || "Cái"} 
                                            onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                                            placeholder="Cái, Bộ, Lô..." 
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="erp-label">Giá tham khảo (VNĐ)</label>
                                        <input 
                                            type="number" 
                                            className="erp-input w-full text-[#B4533A]" 
                                            value={productForm.unitPriceRef || 0} 
                                            onChange={e => setProductForm({ ...productForm, unitPriceRef: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="erp-label">Loại sản phẩm</label>
                                        <select 
                                            className="erp-input w-full"
                                            value={productForm.type || ProductType.CATALOG}
                                            onChange={e => setProductForm({ ...productForm, type: e.target.value as ProductType })}
                                        >
                                            <option value={ProductType.CATALOG}>Catalog (Hàng tiêu chuẩn)</option>
                                            <option value={ProductType.NON_CATALOG}>Non-catalog (Phi tiêu chuẩn)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="erp-label">Danh mục</label>
                                        <select 
                                            className="erp-input w-full"
                                            value={productForm.categoryId || ""}
                                            onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                                        >
                                            <option value="" disabled>Chọn danh mục</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2 form-group">
                                        <label className="erp-label">Tổ chức / Nhà cung cấp</label>
                                        <select 
                                            className="erp-input w-full"
                                            value={productForm.orgId || ""}
                                            onChange={e => setProductForm({ ...productForm, orgId: e.target.value })}
                                        >
                                            <option value="" disabled>Chọn tổ chức</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between p-4 bg-[#FFFFFF] rounded-2xl border border-[rgba(148,163,184,0.1)]">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-[#000000] tracking-widest">Kích hoạt sản phẩm</span>
                                            <span className="text-[9px] text-[#000000] font-bold">Cho phép sử dụng sản phẩm này trong các yêu cầu mua hàng</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setProductForm({...productForm, isActive: !productForm.isActive})}
                                            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${productForm.isActive ? 'bg-[#B4533A]' : 'bg-[#000000]'}`}
                                        >
                                            <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${productForm.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        className="btn-secondary flex-1 py-4 uppercase tracking-widest text-xs"
                                        onClick={() => setIsProductModalOpen(false)}
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn-primary flex-1 py-4 uppercase tracking-widest text-xs"
                                        disabled={loading}
                                    >
                                        {loading ? "Đang xử lý..." : (editingProduct ? "Lưu thay đổi" : "Khởi tạo")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Product/Category Creation Form Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4">
                    <div className="bg-[#FAF8F5] rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-[#000000] uppercase mb-2 tracking-tight">
                                {editingCategory ? "Cập nhật Danh mục" : "Thêm Danh mục mới"}
                            </h2>
                            <p className="text-xs text-[#000000] font-bold uppercase tracking-widest mb-10">QUẢN LÝ DANH MỤC</p>

                            <form onSubmit={(e) => { e.preventDefault(); handleSaveCategory(); }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="form-group">
                                        <label className="erp-label">Mã (Code)</label>
                                        <input 
                                            className="erp-input w-full" 
                                            placeholder="VD: CAT-001"
                                            value={categoryForm.code || ""} 
                                            onChange={e => setCategoryForm({...categoryForm, code: e.target.value})} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="erp-label">Tên (Name)</label>
                                        <input 
                                            className="erp-input w-full" 
                                            placeholder="Nhập tên..."
                                            value={categoryForm.name || ""} 
                                            onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} 
                                        />
                                    </div>
                                    
                                    <div className="col-span-2 form-group">
                                        <label className="erp-label">Tổ chức / Nhà cung cấp</label>
                                        <select 
                                            className="erp-input w-full"
                                            value={categoryForm.orgId || ""}
                                            onChange={e => setCategoryForm({...categoryForm, orgId: e.target.value})}
                                        >
                                            <option value="" disabled>Chọn tổ chức</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2 form-group">
                                        <label className="erp-label">Mô tả</label>
                                        <textarea 
                                            className="erp-input w-full h-24 resize-none" 
                                            placeholder="Nhập mô tả..."
                                            value={categoryForm.description || ""} 
                                            onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} 
                                        />
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between p-4 bg-[#FFFFFF] rounded-2xl border border-[rgba(148,163,184,0.1)]">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-[#000000] tracking-widest">Kích hoạt</span>
                                            <span className="text-[9px] text-[#000000] font-bold">Trạng thái hoạt động của dữ liệu</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setCategoryForm({...categoryForm, isActive: !categoryForm.isActive})}
                                            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${categoryForm.isActive ? 'bg-[#B4533A]' : 'bg-[#000000]'}`}
                                        >
                                            <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${categoryForm.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        className="btn-secondary flex-1 py-4 uppercase tracking-widest text-xs"
                                        onClick={() => setIsCategoryModalOpen(false)}
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn-primary flex-1 py-4 uppercase tracking-widest text-xs"
                                        disabled={loading}
                                    >
                                        {loading ? "Đang xử lý..." : "Lưu thay đổi"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

