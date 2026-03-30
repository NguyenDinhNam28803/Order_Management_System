"use client";

import { useState, useEffect } from "react";
import { useProcurement, Product, ProductCategory } from "../../context/ProcurementContext";
import DashboardHeader from "../../components/DashboardHeader";
import ERPTable, { ERPTableColumn } from "../../components/shared/ERPTable";
import { 
    Plus, Search, Edit2, Trash2, Filter, 
    Package, Layers, Tag} from "lucide-react";

export default function ProductAdminPage() {
    const { apiFetch } = useProcurement();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Sản phẩm"); // "Sản phẩm" or "Danh mục"

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                apiFetch('/products'),
                apiFetch('/products/categories')
            ]);
            
            if (prodRes.ok) {
                const data = await prodRes.json();
                setProducts(data.data || []);
            }
            
            if (catRes.ok) {
                const data = await catRes.json();
                setCategories(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch products/categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
        try {
            const res = await apiFetch(`/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Delete failed", error);
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
                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{row.sku}</div>
                    </div>
                </div>
            )
        },
        {
            label: "Danh mục",
            key: "category",
            render: (row: Product) => (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    {row.category?.name || "N/A"}
                </span>
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
                <div className="font-mono font-black text-erp-navy text-sm">
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
            render: (row: ProductCategory) => <span className="font-mono text-xs font-bold text-erp-navy">{row.code}</span>
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
                    <button className="p-2 text-slate-400 hover:text-erp-blue hover:bg-erp-blue/5 rounded-lg transition-all"><Edit2 size={16}/></button>
                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                </div>
            )
        }
    ];

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Hệ thống", "Danh mục sản phẩm"]} />
            
            <div className="mt-8 flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Quản lý danh mục & sản phẩm</h1>
                    <p className="text-sm text-slate-500 mt-1 font-bold">CẬP NHẬT DANH MỤC HÀNG HÓA VÀ BẢNG GIÁ THAM KHẢO</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        className="btn-primary flex items-center gap-2 py-4 px-8 shadow-xl shadow-erp-navy/20"
                        onClick={() => {
                            setEditingProduct(null);
                            setIsProductModalOpen(true);
                        }}
                    >
                        <Plus size={20} />
                        <span className="text-sm font-black uppercase">Thêm sản phẩm mới</span>
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
                            <button className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-erp-blue hover:text-erp-blue transition-all">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-40 text-center flex flex-col items-center gap-4">
                            <div className="h-12 w-12 border-4 border-slate-100 border-t-erp-blue rounded-full animate-spin" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === "Sản phẩm" ? (
                                <ERPTable columns={productColumns} data={filteredProducts} />
                            ) : (
                                <ERPTable columns={categoryColumns} data={categories} />
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Summary Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 flex items-center gap-6 group hover:border-erp-blue/30 transition-all">
                        <div className="h-16 w-16 rounded-3xl bg-blue-50 flex items-center justify-center text-erp-blue group-hover:bg-erp-blue group-hover:text-white transition-all">
                            <Package size={32} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng sản phẩm</div>
                            <div className="text-3xl font-black text-erp-navy">{products.length}</div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 flex items-center gap-6 group hover:border-erp-blue/30 transition-all">
                        <div className="h-16 w-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                            <Layers size={32} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngành hàng</div>
                            <div className="text-3xl font-black text-erp-navy">{categories.length}</div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 flex items-center gap-6 group hover:border-erp-blue/30 transition-all">
                        <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Tag size={32} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã SKU duy nhất</div>
                            <div className="text-3xl font-black text-erp-navy">{products.filter(p => p.sku).length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Mock Modal for Product Creation/Edit */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-erp-navy/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-erp-navy uppercase tracking-tight">
                                {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                            </h3>
                            <button 
                                onClick={() => setIsProductModalOpen(false)}
                                className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Plus size={24} className="rotate-45 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Tên sản phẩm</label>
                                    <input className="erp-input w-full font-bold" defaultValue={editingProduct?.name} placeholder="VD: Bút bi Thiên Long..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Mã SKU</label>
                                    <input className="erp-input w-full font-mono font-bold" defaultValue={editingProduct?.sku} placeholder="VD: VN_OFFICE-1001" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Giá tham khảo (VNĐ)</label>
                                    <input type="number" className="erp-input w-full font-black text-erp-blue" defaultValue={editingProduct?.unitPriceRef} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Danh mục</label>
                                    <select className="erp-input w-full font-bold">
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id} selected={editingProduct?.categoryId === cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                            <button 
                                className="px-8 py-3 font-black text-slate-500 uppercase tracking-widest text-xs hover:bg-white rounded-xl transition-all"
                                onClick={() => setIsProductModalOpen(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                className="btn-primary py-4 px-12 shadow-xl shadow-erp-navy/30"
                                onClick={() => {
                                    alert("Đã lưu thông tin sản phẩm (Demo)");
                                    setIsProductModalOpen(false);
                                }}
                            >
                                {editingProduct ? "Cập nhật" : "Lưu sản phẩm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
