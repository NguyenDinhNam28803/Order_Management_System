"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Layers, Building2, ChevronRight, Hash, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { useProcurement, ProductCategory } from "../../context/ProcurementContext";
import { Organization, CreateCategoryDto, UpdateCategoryDto } from "../../types/api-types";
import ERPTable, { ERPTableColumn } from "../../components/shared/ERPTable";

export default function CategoriesPage() {
    const { 
        categories, 
        organizations, 
        refreshData, 
        addCategory, 
        updateCategory, 
        removeCategory,
        notify,
        currentUser
    } = useProcurement();

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const [formData, setFormData] = useState<Partial<ProductCategory>>({
        name: "",
        code: "",
        description: "",
        orgId: "",
        isActive: true
    });

    useEffect(() => {
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, [refreshData]);

    const filteredCategories = categories.filter((c: ProductCategory) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (cat?: ProductCategory) => {
        if (cat) {
            setEditingCategory(cat);
            setFormData({
                name: cat.name,
                code: cat.code,
                description: cat.description || "",
                orgId: cat.orgId || "",
                isActive: cat.isActive
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                code: "",
                description: "",
                orgId: currentUser?.orgId || organizations[0]?.id || "",
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.code || !formData.orgId) {
            notify("Vui lòng điền đầy đủ các trường bắt buộc", "warning");
            return;
        }

        setLoading(true);
        try {
            let success = false;
            if (editingCategory) {
                const updatePayload: UpdateCategoryDto = {
                    name: formData.name,
                    description: formData.description,
                    orgId: formData.orgId,
                    isActive: formData.isActive
                };
                success = await updateCategory(editingCategory.id, updatePayload);
            } else {
                const createPayload: CreateCategoryDto = {
                    name: formData.name,
                    code: formData.code,
                    description: formData.description,
                    orgId: formData.orgId,
                    isActive: formData.isActive ?? true
                };
                success = await addCategory(createPayload);
            }

            if (success) {
                setShowModal(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const columns: ERPTableColumn<ProductCategory>[] = [
        {
            label: "Danh mục & Mã",
            key: "name",
            render: (row) => (
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#B4533A] shadow-sm">
                        <Layers size={22} />
                    </div>
                    <div>
                        <div className="text-sm font-black text-[#000000] tracking-tight">{row.name}</div>
                        <div className="text-[10px] font-black text-[#B4533A] bg-[#B4533A]/10 px-2 py-0.5 rounded mt-1 w-fit uppercase">
                            CODE: {row.code}
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: "Tổ chức nguồn",
            key: "orgId",
            render: (row) => {
                const org = organizations.find(o => o.id === row.orgId);
                return (
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[#000000]" />
                        <span className="text-xs font-bold text-[#000000]">{org?.name || "Global / N/A"}</span>
                    </div>
                );
            }
        },
        {
            label: "Mô tả",
            key: "description",
            render: (row) => (
                <div className="max-w-xs text-[11px] text-[#000000] font-medium italic line-clamp-2">
                    {row.description || "Không có mô tả..."}
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "isActive",
            render: (row) => (
                <div className="min-w-[90px]">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        row.isActive ? "bg-emerald-500/10 text-black border border-emerald-500/20" : "bg-rose-500/10 text-black border border-rose-500/20"
                    }`}>
                        {row.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {row.isActive ? "Hoạt động" : "Tạm ngưng"}
                    </span>
                </div>
            )
        },
        {
            label: "Thao tác",
            render: (row) => (
                <div className="flex gap-1">
                    <button 
                        onClick={() => handleOpenModal(row)}
                        className="p-1.5 text-[#000000] hover:text-[#B4533A] hover:bg-[#B4533A]/10 rounded-lg border border-transparent hover:border-[#B4533A]/20 transition-all"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        onClick={() => {
                            if(confirm("Xóa danh mục này sẽ ảnh hưởng đến các sản phẩm liên quan. Bạn chắc chứ?")) {
                                removeCategory(row.id);
                            }
                        }}
                        className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-black hover:border-rose-400/30 rounded-xl transition-all shadow-sm"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="animate-in fade-in duration-500">

            <div className="flex justify-between items-end mb-10 mt-6">
                <div>
                    <h1 className="text-3xl font-black text-[#000000] tracking-tight uppercase">Quản lý Danh mục</h1>
                    <p className="text-sm text-[#000000] mt-1 font-medium italic">PHÂN LOẠI NHÓM HÀNG HÓA VÀ DỊCH VỤ TRONG HỆ THỐNG</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#B4533A] text-[#000000] px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#B4533A]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm Danh mục
                </button>
            </div>

            <div className="bg-[#FAF8F5] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5 overflow-hidden">
                <div className="p-8 bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#000000] uppercase tracking-widest">Phân loại hàng hóa</span>
                            <div className="text-2xl font-black text-[#000000]">{categories.length} <span className="text-xs text-[#000000] font-bold uppercase ml-1">Nhóm ngành</span></div>
                        </div>
                        <div className="h-10 w-px bg-[rgba(148,163,184,0.1)] hidden md:block" />
                        <div className="flex items-center gap-2 bg-[#B4533A]/10 px-4 py-2 rounded-2xl border border-[#B4533A]/20">
                            <Globe size={14} className="text-[#B4533A]" />
                            <span className="text-[10px] font-black text-[#B4533A] uppercase tracking-tight">Cấu trúc đa chi nhánh</span>
                        </div>
                    </div>

                    <div className="relative group w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000000] group-focus-within:text-[#B4533A] transition-colors" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm mã hoặc tên danh mục..."
                            className="w-full pl-12 pr-4 py-3.5 bg-[#FAF8F5] border-2 border-[rgba(148,163,184,0.1)] rounded-[20px] text-xs text-[#000000] font-bold focus:border-[#B4533A] focus:ring-0 outline-none transition-all placeholder:text-[#000000]"
                        />
                    </div>
                </div>

                <ERPTable columns={columns} data={filteredCategories} />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#FAF8F5] rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-[#000000] uppercase mb-2 tracking-tight">
                                {editingCategory ? "Cập nhật Danh mục" : "Thêm Danh mục mới"}
                            </h2>
                            <p className="text-xs text-[#000000] font-bold uppercase tracking-widest mb-10">PHÂN LOẠI HÀNG HÓA</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="erp-label">Mã Danh mục</label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            type="text"
                                            placeholder="VD: STATIONERY"
                                            className="erp-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="erp-label">Tên Danh mục</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Văn phòng phẩm"
                                            className="erp-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="erp-label">Thuộc Tổ chức</label>
                                    <select
                                        required
                                        value={formData.orgId}
                                        onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                                        className="erp-input"
                                    >
                                        <option value="">Chọn tổ chức</option>
                                        {organizations.map(org => (
                                            <option key={org.id} value={org.id}>{org.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="erp-label">Mô tả</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Nhập mô tả..."
                                        className="erp-input resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#FFFFFF] rounded-2xl border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-[#000000] tracking-widest">Kích hoạt Danh mục</span>
                                        <span className="text-[9px] text-[#000000] font-bold">Danh mục đang hoạt động sẽ xuất hiện khi tạo sản phẩm</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${formData.isActive ? 'bg-[#B4533A]' : 'bg-[#000000]'}`}
                                    >
                                        <div className={`h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-secondary flex-1 py-4 uppercase tracking-widest text-xs"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex-1 py-4 uppercase tracking-widest text-xs"
                                    >
                                        {loading ? "Đang xử lý..." : (editingCategory ? "Lưu thay đổi" : "Khởi tạo")}
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

