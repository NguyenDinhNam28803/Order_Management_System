"use client";

import React, { useState } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import { CreateOrganizationPayload } from "@/app/types/api-types";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import {
    Truck, Plus,
    Trash2, Star,
    Mail, Phone, Globe
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";
import TableToolbar from "../../components/shared/TableToolbar";
import StatusBadge from "../../components/shared/StatusBadge";

export interface Supplier {
    id: string;
    name: string;
    code: string;
    category: string;
    status: 'ACTIVE' | 'INACTIVE';
    rating: number;
    email: string;
    phone: string;
    website?: string;
}

export default function SupplierManagementPage() {
    const { currentUser, notify, organizations, addOrganization, removeOrganization, refreshData } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });
    
    React.useEffect(() => {
        refreshData();
    }, [refreshData]);

    const suppliers = (organizations || []).filter(org => 
        org.companyType === 'SUPPLIER' || org.companyType === 'BOTH'
    );

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
        status: 'ACTIVE',
        rating: 4
    });

    if (currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-bold text-slate-900">Bạn không có quyền truy cập trang quản trị này.</div>;
    }

    const handleAddSupplier = async () => {
        if (!newSupplier.name || !newSupplier.code) {
            notify("Vui lòng nhập tên và mã NCC", "error");
            return;
        }

        const success = await addOrganization({
            name: newSupplier.name!,
            code: newSupplier.code!,
            industry: newSupplier.category || "General",
            companyType: "SUPPLIER" as const,
            email: newSupplier.email || "",
            phone: newSupplier.phone,
            website: newSupplier.website,
            countryCode: "VN"
        } as CreateOrganizationPayload);

        if (success) {
            setIsAddModalOpen(false);
            setNewSupplier({ status: 'ACTIVE', rating: 4 });
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.industry || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    type SupplierOrg = (typeof filteredSuppliers)[number];
    const columns: DataTableColumn<SupplierOrg>[] = [
        {
            label: "Nhà cung cấp", key: "name", sortable: true,
            render: (s) => (
                <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-white shrink-0 ${s.isActive !== false ? 'bg-[#2563EB]' : 'bg-slate-400'}`}>
                        {s.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 leading-none mb-1">{s.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase bg-white px-1.5 py-0.5 rounded border border-slate-200 num-display">{s.code}</span>
                            {s.website && <Globe size={10} className="text-[#94A3B8]" />}
                        </div>
                    </div>
                </div>
            ),
        },
        { label: "Lĩnh vực", hideOnMobile: true, render: (s) => <span className="text-xs font-bold text-slate-900 uppercase">{s.industry || "General"}</span> },
        {
            label: "Liên hệ", hideOnMobile: true,
            render: (s) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-slate-900"><Mail size={12} className="text-[#94A3B8]" /> {s.email || "N/A"}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-900"><Phone size={12} className="text-[#94A3B8]" /> {s.phone || "N/A"}</div>
                </div>
            ),
        },
        {
            label: "Đánh giá",
            render: (s) => (
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={12} className={i <= (s.trustScore ? Math.ceil(Number(s.trustScore) / 20) : 4) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                    ))}
                </div>
            ),
        },
        {
            label: "Trạng thái",
            render: (s) => <StatusBadge status={s.isActive !== false ? "ACTIVE" : "INACTIVE"} label={s.isActive !== false ? "Đang hoạt động" : "Tạm ngưng"} size="sm" />,
        },
        {
            label: "", align: "right",
            render: (s) => (
                <button
                    onClick={() => setConfirmState({
                        open: true,
                        title: "Xóa nhà cung cấp",
                        message: "Xác nhận xóa đối tác này?",
                        onConfirm: () => { removeOrganization(s.id); setConfirmState(st => ({ ...st, open: false })); }
                    })}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-slate-500 hover:text-red-500"
                    aria-label="Xóa nhà cung cấp"
                >
                    <Trash2 size={16} />
                </button>
            ),
        },
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <PageHeader
                icon={Truck}
                iconColor="blue"
                title="Quản lý Nhà cung cấp"
                subtitle="Danh mục đối tác và nhà cung ứng chiến lược của hệ thống."
                actions={
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> Thêm nhà cung cấp
                    </button>
                }
            />

            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm theo tên, mã hoặc lĩnh vực..."
                />
                <DataTable
                    columns={columns}
                    data={filteredSuppliers}
                    pageSize={12}
                    getRowKey={(s) => s.id}
                    emptyMessage="Không tìm thấy nhà cung cấp nào"
                    emptyDescription="Thử thay đổi từ khóa tìm kiếm"
                />
            </div>

            {/* Add Supplier Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#FFFFFF]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-white border border-[#E2E8F0] rounded-xl w-full max-w-xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-300">
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 tracking-tight">
                                Thêm nhà cung cấp mới
                            </h2>
                            <p className="text-[0.8125rem] text-[#64748B] font-medium uppercase tracking-widest mb-6">QUẢN LÝ NHÀ CUNG CẤP</p>
                            
                            <div className="form-grid mb-8">
                                <div className="form-group col-span-2">
                                    <label className="erp-label">Tên nhà cung cấp</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: Công ty TNHH Giải pháp Số" 
                                        value={newSupplier.name || ""}
                                        onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Mã NCC</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: DGT-SOL" 
                                        value={newSupplier.code || ""}
                                        onChange={e => setNewSupplier({...newSupplier, code: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Lĩnh vực chuyên môn</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: IT, Nội thất..." 
                                        value={newSupplier.category || ""}
                                        onChange={e => setNewSupplier({...newSupplier, category: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Email liên hệ</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="supplier@email.com" 
                                        value={newSupplier.email || ""}
                                        onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Số điện thoại</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="024 XXXX XXXX" 
                                        value={newSupplier.phone || ""}
                                        onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="btn-secondary flex-1 py-4 uppercase tracking-widest text-xs" onClick={() => setIsAddModalOpen(false)}>Hủy bỏ</button>
                                <button className="btn-primary flex-1 py-4 uppercase tracking-widest text-xs" onClick={handleAddSupplier}>
                                    Xác nhận lưu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

