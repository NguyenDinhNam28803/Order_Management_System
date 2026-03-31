"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PR, PRItem, useProcurement, Organization, CompanyType, KycStatus } from "../../../context/ProcurementContext";
import DashboardHeader from "../../../components/DashboardHeader";
import { 
    FileText, 
    User, 
    Building2, 
    Calendar, 
    Plus, 
    Trash2, 
    Send, 
    ChevronLeft,
    Search,
    Info,
    CheckCircle2
} from "lucide-react";

interface SubItem {
    id: string;
    productName: string;
    qty: number;
    unit: string;
    estimatedPrice: number;
}

export default function CreateRFQPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { prs, apiFetch, refreshData, currentUser, organizations } = useProcurement();
    
    // Get prId from query or params
    const prId = params.id as string || searchParams.get("prId");
    const targetPR = prs.find((p: PR) => p.id === prId);

    const [selectedVendors, setSelectedVendors] = useState<Organization[]>([]);
    const [vendorSearch, setVendorSearch] = useState("");
    const [deadline, setDeadline] = useState("");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Filter organizations to exclude current user's org
    const realVendors = React.useMemo(() => 
        (organizations || []).filter((o: Organization) => o.id !== currentUser?.orgId),
    [organizations, currentUser?.orgId]);

    const filteredVendors = realVendors.filter((v: Organization) =>
        v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
        (v.email && v.email.toLowerCase().includes(vendorSearch.toLowerCase()))
    );

    const addVendor = (v: Partial<Organization>) => {
        if (!selectedVendors.find(sv => sv.id === v.id)) {
            setSelectedVendors([...selectedVendors, v as Organization]);
        }
        setVendorSearch("");
    };

    const removeVendor = (id: string) => {
        setSelectedVendors(selectedVendors.filter(v => v.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedVendors.length === 0) {
            alert("Vui lòng chọn ít nhất một nhà cung cấp");
            return;
        }

        setIsSubmitting(true);
        try {
            // Updated to match backend CreateRfqDto
            const payload = {
                prId: prId,
                title: `RFQ for ${targetPR?.prNumber || targetPR?.id}`,
                description: note,
                deadline: new Date(deadline).toISOString(),
                supplierIds: selectedVendors.map(v => v.id),
                minSuppliers: selectedVendors.length
            };

            const res = await apiFetch('/request-for-quotations', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to create RFQ");
            }

            setIsSuccess(true);
            refreshData();
            setTimeout(() => {
                router.push("/procurement/prs");
            }, 2000);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            alert(`Có lỗi xảy ra khi tạo RFQ: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!targetPR) {
        return <div className="p-20 text-center font-black">Không tìm thấy thông tin PR.</div>;
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center max-w-md animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-erp-navy mb-2 uppercase">THÀNH CÔNG!</h2>
                    <p className="text-slate-500 font-medium">Yêu cầu báo giá đã được gửi tới {selectedVendors.length} nhà cung cấp.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="h-14 w-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-erp-navy hover:border-erp-blue transition-all shadow-xl shadow-slate-200/20 active:scale-95">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase">TẠO YÊU CẦU BÁO GIÁ (RFQ)</h1>
                        <nav className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nghiệp vụ Thu mua</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] font-black text-erp-blue uppercase tracking-widest">Tạo mới RFQ</span>
                        </nav>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phiên làm việc</div>
                        <div className="text-sm font-black text-erp-navy uppercase">{currentUser?.name}</div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-erp-navy flex items-center justify-center text-white font-black">
                        {currentUser?.name?.substring(0,2).toUpperCase()}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left side: PR Info Summary */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                        <div className="bg-erp-navy p-8 text-white">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Thông tin PR gốc</span>
                            </div>
                            <h2 className="text-2xl font-black mb-1">{targetPR.prNumber || "PR-" + targetPR.id.substring(0,8).toUpperCase()}</h2>
                            <p className="text-white/60 text-sm font-medium">{targetPR.title}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Người yêu cầu</span>
                                <span className="text-erp-navy font-black">{targetPR.requester?.fullName || targetPR.requester?.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Bộ phận</span>
                                <span className="text-erp-navy font-black">{typeof targetPR.department === 'string' ? targetPR.department : targetPR.department?.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Ước tính (VNĐ)</span>
                                <span className="text-erp-blue font-black font-mono">{(Number(targetPR.totalEstimate) || 0).toLocaleString()} \u20ab</span>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-50">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Danh sách sản phẩm</h3>
                                <div className="space-y-3">
                                    {(targetPR.items || []).map((item: PRItem, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-700">{item.productId || "Sản phẩm " + (idx+1)}</span>
                                                <span className="text-[10px] text-slate-400 font-bold italic">{item.qty} {item.unit}</span>
                                            </div>
                                            <span className="text-[11px] font-black text-slate-400">{(Number(item.estimatedPrice) || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 flex items-start gap-4">
                        <div className="h-10 w-10 bg-amber-200 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-800 uppercase tracking-tight mb-1">Mẹo chọn nhà cung cấp</h4>
                            <p className="text-amber-700/70 text-xs font-medium leading-relaxed">Chọn ít nhất 3 nhà cung cấp để tăng tính cạnh tranh và tối ưu hóa chi phí cho doanh nghiệp.</p>
                        </div>
                    </div>
                </div>

                {/* Right side: RFQ Formulation Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 p-10 space-y-10">
                        {/* Vendor Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                        <Building2 size={16} />
                                    </div>
                                    <h3 className="text-lg font-black text-erp-navy uppercase tracking-tight">Nhà cung cấp nhận báo giá</h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedVendors.length} Nhà cung cấp hiện có</span>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm nhà cung cấp từ kho dữ liệu hoặc nhập tên mới..."
                                    className="erp-input w-full pl-14 py-5 h-16 !rounded-2xl"
                                    value={vendorSearch}
                                    onChange={(e) => setVendorSearch(e.target.value)}
                                />
                                {vendorSearch && (
                                    <div className="absolute top-18 left-0 w-full bg-white border border-slate-100 shadow-2xl rounded-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {filteredVendors.length > 0 ? (
                                            filteredVendors.map((v, i) => (
                                                <button 
                                                    key={i} 
                                                    type="button"
                                                    onClick={() => addVendor(v)}
                                                    className="w-full text-left p-4 hover:bg-slate-50 flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="text-sm font-black text-erp-navy">{v.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold">{v.email}</div>
                                                    </div>
                                                    <Plus size={16} className="text-slate-300 group-hover:text-erp-blue transition-all" />
                                                </button>
                                            ))
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => addVendor({
                                                    id: 'new-' + Date.now(),
                                                    name: vendorSearch,
                                                    email: "",
                                                    code: 'NEW',
                                                    companyType: CompanyType.SUPPLIER,
                                                    countryCode: 'VN',
                                                    isActive: true,
                                                    kycStatus: KycStatus.PENDING,
                                                    trustScore: 0,
                                                    metadata: {},
                                                    createdAt: new Date().toISOString(),
                                                    updatedAt: new Date().toISOString()
                                                })}
                                                className="w-full text-left p-4 hover:bg-slate-50 flex items-center gap-3"
                                            >
                                                <Plus size={16} className="text-erp-blue" />
                                                <span className="text-sm font-bold text-erp-navy">Thêm &quot;<strong>{vendorSearch}</strong>&quot; như nhà cung cấp mới</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedVendors.map((v, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-erp-navy font-black text-[10px] border border-slate-100">
                                                {v.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-erp-navy truncate max-w-[150px]">{v.name}</div>
                                                <div className="text-[9px] text-slate-400 font-bold">{v.email || "Email chưa được cấu hình"}</div>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeVendor(v.id)}
                                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timing Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                    <Calendar size={16} />
                                </div>
                                <h3 className="text-lg font-black text-erp-navy uppercase tracking-tight">Thời hạn & Tiến độ</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Hạn cuối nộp báo giá</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="erp-input w-full h-14 !rounded-xl"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Độ ưu tiên</label>
                                    <select className="erp-input w-full h-14 !rounded-xl appearance-none bg-slate-50 border-transparent font-bold">
                                        <option>BÌNH THƯỜNG</option>
                                        <option>CAO - CẦN GẤP</option>
                                        <option>KHẨN CẤP - CHIẾN LƯỢC</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Note Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <h3 className="text-lg font-black text-erp-navy uppercase tracking-tight">Ghi chú & Yêu cầu kỹ thuật</h3>
                            </div>
                            <textarea 
                                placeholder="Ghi chú thêm cho nhà cung cấp về chất lượng, hình thức thanh toán, thời gian giao hàng mong muốn..."
                                className="erp-input w-full min-h-[150px] !rounded-3xl p-6"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Submit Actions */}
                        <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    {selectedVendors.slice(0,3).map((v, i) => (
                                        <div key={i} className="h-10 w-10 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black">{v.name.substring(0,1)}</div>
                                    ))}
                                    {selectedVendors.length > 3 && (
                                        <div className="h-10 w-10 rounded-full border-4 border-white bg-erp-navy text-white flex items-center justify-center text-[10px] font-black">+{selectedVendors.length - 3}</div>
                                    )}
                                </div>
                                <div className="text-xs text-slate-400 font-medium">Báo giá sẽ được gửi qua Email & Hệ thống Portal.</div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || selectedVendors.length === 0}
                                className="bg-erp-blue hover:bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang xử lý..." : "PHÁT HÀNH RFQ"}
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
