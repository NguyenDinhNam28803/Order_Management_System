"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Layers, Building2, ChevronRight, Hash, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { useProcurement, ProductCategory } from "../../context/ProcurementContext";
import { Organization, CreateCategoryDto, UpdateCategoryDto } from "../../types/api-types";
import DashboardHeader from "../../components/DashboardHeader";
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
            const payload: any = {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                orgId: formData.orgId,
                isActive: formData.isActive
            };

            let success = false;
            if (editingCategory) {
                success = await updateCategory(editingCategory.id, payload);
            } else {
                success = await addCategory(payload);
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
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Layers size={22} />
                    </div>
                    <div>
                        <div className="text-sm font-black text-erp-navy tracking-tight">{row.name}</div>
                        <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mt-1 w-fit uppercase">
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
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{org?.name || "Global / N/A"}</span>
                    </div>
                );
            }
        },
        {
            label: "Mô tả",
            key: "description",
            render: (row) => (
                <div className="max-w-xs text-[11px] text-slate-500 font-medium italic line-clamp-2">
                    {row.description || "Không có mô tả..."}
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "isActive",
            render: (row) => (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${
                    row.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                    {row.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {row.isActive ? "Hoạt động" : "Tạm ngưng"}
                </div>
            )
        },
        {
            label: "Thao tác",
            render: (row) => (
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleOpenModal(row)}
                        className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-erp-blue hover:border-erp-blue/30 rounded-xl transition-all shadow-sm"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => {
                            if(confirm("Xóa danh mục này sẽ ảnh hưởng đến các sản phẩm liên quan. Bạn chắc chứ?")) {
                                removeCategory(row.id);
                            }
                        }}
                        className="h-10 w-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 rounded-xl transition-all shadow-sm"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <main className="p-8 animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Quản trị hệ thống", "Danh mục sản phẩm"]} />

            <div className="flex justify-between items-end mb-10 mt-6">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Quản lý Danh mục</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">PHÂN LOẠI NHÓM HÀNG HÓA VÀ DỊCH VỤ TRONG HỆ THỐNG</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-erp-navy text-white px-8 py-4 rounded-[22px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-erp-navy/20 hover:scale-[1.03] transition-all active:scale-95"
                >
                    <Plus size={20} /> Thêm Danh mục mới
                </button>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-8 bg-slate-50/30 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân loại hàng hóa</span>
                            <div className="text-2xl font-black text-erp-navy">{categories.length} <span className="text-xs text-slate-400 font-bold uppercase ml-1">Nhóm ngành</span></div>
                        </div>
                        <div className="h-10 w-px bg-slate-200 hidden md:block" />
                        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                            <Globe size={14} className="text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">Cấu trúc đa chi nhánh</span>
                        </div>
                    </div>

                    <div className="relative group w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-erp-blue transition-colors" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm mã hoặc tên danh mục..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-[20px] text-xs font-bold focus:border-erp-blue focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                <ERPTable columns={columns} data={filteredCategories} />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-erp-navy/50 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[45px] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-12">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-14 w-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <Layers size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-erp-navy uppercase leading-tight tracking-tight">
                                        {editingCategory ? "Cập nhật Danh mục" : "Tạo Danh mục mới"}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Product Category System</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã Danh mục</label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            type="text"
                                            placeholder="VD: STATIONERY"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:border-erp-blue focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Danh mục</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Văn phòng phẩm"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:border-erp-blue focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thuộc Tổ chức</label>
                                    <div className="relative group/select">
                                        <select
                                            required
                                            value={formData.orgId}
                                            onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:border-erp-blue focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Chọn tổ chức nguồn --</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none group-focus-within/select:text-erp-blue" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả chi tiết</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Nhập ghi chú giới thiệu về nhóm danh mục này..."
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold focus:border-erp-blue focus:bg-white outline-none transition-all placeholder:text-slate-300 resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[28px] border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-erp-navy tracking-widest">Kích hoạt Danh mục</span>
                                        <span className="text-[9px] text-slate-400 font-bold">Danh mục đang hoạt động sẽ xuất hiện khi tạo sản phẩm</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                        className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${formData.isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-300'}`}
                                    >
                                        <div className={`h-5 w-5 bg-white rounded-full shadow-md transition-transform duration-300 ${formData.isActive ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-5 bg-slate-100 rounded-3xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-8 py-5 bg-erp-navy text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-erp-navy/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? "Đang xử lý..." : (editingCategory ? "Lưu thay đổi" : "Khởi tạo ngay")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
