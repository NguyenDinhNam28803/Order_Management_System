"use client";

import { useState } from "react";
import { PR, useProcurement, QuoteRequestStatus, QuoteRequest, QuoteRequestItem, Organization, PO } from "../context/ProcurementContext";
import { 
    Filter, ArrowRight, 
    FileText, ShoppingBag, 
    Zap, TrendingUp, 
    Package, Send, CheckCircle, X, ChevronRight, Bot} from "lucide-react";
import Link from "next/link";
import { RFQ } from "../context/ProcurementContext";
import { getStatusLabel } from "../utils/formatUtils";

export default function SourcingPage() {
    const { prs, rfqs, pos, currentUser, refreshData, notify, createRFQ, createPOFromPR, organizations, quoteRequests, updateQuoteRequest, submitQuoteRequest, sendQuoteRequestToSupplier, processPOAutomation } = useProcurement();
    const [activeTab, setActiveTab] = useState("quote-requests");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter organizations to get only suppliers
    const suppliersList = (organizations || []).filter(org => 
        org.companyType === 'SUPPLIER' || org.companyType === 'BOTH'
    );

    // 1. Get Approved PRs that need sourcing
    const rfqsPrIds = (rfqs || []).map((r: RFQ) => r.prId);
    const approvedPRs = (prs || []).filter((pr: PR) => 
        (pr.status === "APPROVED" || pr.status === "PENDING_QUOTATION" || pr.status === "PRICE_CONFIRMATION_SENT") && 
        !rfqsPrIds.includes(pr.id)
    );

    // 2. Get active RFQs
    const activeRFQs = (rfqs || []);

    // 3. Logic for creating RFQ
    const handleCreateRFQ = async (prId: string) => {
        setIsProcessing(true);
        try {
            const pr = prs.find(p => p.id === prId);
            const targetSupplier = suppliersList[0];
            const success = await createRFQ({
                prId,
                title: pr?.title ? `RFQ: ${pr.title}` : `RFQ cho PR ${prId.substring(0,8)}`,
                description: "Yêu cầu báo giá",
                supplierIds: targetSupplier ? [targetSupplier.id] : [],
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
            if (success) {
                notify("Đã khởi tạo RFQ thành công", "success");
                await refreshData();
            }
        } catch (err) {
            notify("Lỗi khi khởi tạo RFQ", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuickPO = async (prId: string) => {
        setIsProcessing(true);
        try {
            const pr = prs.find(p => p.id === prId);
            const targetSupplier = organizations.find(o => o.id === pr?.preferredSupplierId) || suppliersList[0];
            if (!targetSupplier) return;
            
            const success = await createPOFromPR(prId, targetSupplier.id);
            if (success) {
                notify(`Đã tạo PO nhanh cho NCC ${targetSupplier.name}`, "success");
                
                // Refresh to get latest data
                await refreshData();
                
                // Fetch all POs to find the newly created one
                const posResp = await fetch('/api/purchase-orders');
                if (posResp.ok) {
                    const allPOs = await posResp.json();
                    const newPO = allPOs.find((p: PO & { prId?: string }) => p.prId === prId);
                    if (newPO?.id) {
                        const poTotal = Number(newPO.totalAmount || newPO.total || 0);
                        if (poTotal >= 50000000) {
                            notify(`Đơn hàng đạt ngưỡng 50M VND. Đang tạo hợp đồng...`, "info");
                            const result = await processPOAutomation(newPO.id);
                            if (result?.contractCreated) {
                                notify(result.message, "success");
                            }
                        }
                    }
                }
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const stats = [
        { label: "PR chờ RFQ", value: approvedPRs.length, icon: FileText, color: "text-[#B4533A]", bg: "bg-[#F9EFEC]" },
        { label: "RFQ đang chạy", value: activeRFQs.length, icon: Send, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "PO chờ phát hành", value: 3, icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: "Tiết kiệm (Est.)", value: "125M \u20ab", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
    ];

    if (currentUser?.role !== "PROCUREMENT" && currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-black text-black uppercase tracking-widest">Bạn không có quyền truy cập trang này.</div>;
    }

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-[#000000] tracking-tighter uppercase mb-2">QUẢN LÝ NGUỒN HÀNG (SOURCING)</h1>
                    <p className="text-[#000000] font-bold text-sm tracking-tight flex items-center gap-2">
                        <Zap size={14} className="text-amber-500 fill-amber-500" /> 
                        Tối ưu hóa quy trình chọn nhà cung cấp và quản lý RFQ/PO
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] text-[#000000] px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1D23] transition-all">
                        <Filter size={16} /> Bộ lọc nâng cao
                    </button>
                    <Link href="/sourcing/rfq-create">
                        <button className="flex items-center gap-2 bg-[#B4533A] text-[#000000] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#B4533A]/20 hover:scale-105 active:scale-95 transition-all">
                            <PlusIcon size={16} /> Tạo RFQ thủ công
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-[#FAF8F5] p-8 rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5 flex items-center gap-6 group hover:border-[#B4533A]/20 transition-all duration-500">
                        <div className={`w-16 h-16 rounded-2xl ${stat.bg.replace('-50', '-500/10')} ${stat.color} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black tracking-[0.2em] text-[#000000] mb-1.5">{stat.label}</div>
                            <div className="text-3xl font-black text-[#000000] tracking-tight">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5 overflow-hidden">
                <div className="flex bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)] p-2 gap-2 overflow-x-auto">
                    <TabButton active={activeTab === "quote-requests"} onClick={() => setActiveTab("quote-requests")} label="Yêu cầu Báo giá" count={quoteRequests.filter(q => ['SUBMITTED', 'PROCESSING', 'QUOTED'].includes(q.status)).length} />
                    <TabButton active={activeTab === "catalog-prs"} onClick={() => setActiveTab("catalog-prs")} label="Xác nhận Catalog" count={approvedPRs.filter(p => p.type === 'CATALOG').length} />
                    <TabButton active={activeTab === "sourcing-prs"} onClick={() => setActiveTab("sourcing-prs")} label="Báo giá RFQ" count={approvedPRs.filter(p => p.type !== 'CATALOG').length} />
                    <TabButton active={activeTab === "active-rfqs"} onClick={() => setActiveTab("active-rfqs")} label="RFQ Đang chạy" count={activeRFQs.length} />
                    <TabButton active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")} label="Danh sách NCC" />
                    <TabButton active={activeTab === "purchase-orders"} onClick={() => setActiveTab("purchase-orders")} label="Đơn hàng (PO)" count={pos?.length || 0} />
                </div>

                <div className="p-0">
                    {activeTab === "quote-requests" && (
                        <QuoteRequestProcessing 
                            quoteRequests={quoteRequests.filter(q => ['SUBMITTED', 'PROCESSING', 'QUOTED'].includes(q.status))} 
                            suppliers={suppliersList}
                            onUpdate={updateQuoteRequest}
                            notify={notify}
                        />
                    )}

                    {activeTab === "catalog-prs" && (
                        <PRListTable 
                            data={approvedPRs.filter(p => p.type === 'CATALOG')} 
                            type="CATALOG"
                            onAction={handleQuickPO}
                            isProcessing={isProcessing}
                        />
                    )}

                    {activeTab === "sourcing-prs" && (
                        <PRListTable 
                            data={approvedPRs.filter(p => p.type !== 'CATALOG')} 
                            type="NON_CATALOG"
                            onAction={handleCreateRFQ}
                            isProcessing={isProcessing}
                        />
                    )}

                    {activeTab === "purchase-orders" && (
                        <POManagement pos={pos} />
                    )}
                    {activeTab === "active-rfqs" && (
                        <div className="p-24 text-center text-[#000000] font-black uppercase tracking-[0.2em] text-xs flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-[#FFFFFF] rounded-3xl border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#B4533A]/50 shadow-inner">
                                <Send size={32} />
                            </div>
                            <span>Danh sách RFQ đang chờ nhà cung cấp phản hồi.</span>
                        </div>
                    )}

                    {activeTab === "suppliers" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                            {suppliersList.map(supplier => (
                                <div key={supplier.id} className="border border-[rgba(148,163,184,0.1)] p-6 rounded-3xl hover:border-[#B4533A]/30 transition-all cursor-pointer group bg-[#FAF8F5]/50 shadow-lg shadow-black/5 hover:bg-[#FAF8F5]/80">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] flex items-center justify-center font-black text-[#000000] uppercase text-sm shadow-inner group-hover:bg-[#B4533A]/10 transition-colors">
                                            {supplier.name.substring(0, 1)}
                                        </div>
                                    </div>
                                    <h4 className="font-black text-[#000000] mb-1 uppercase tracking-tight text-sm">{supplier.name}</h4>
                                    <p className="text-[10px] text-[#000000] font-bold mb-4 uppercase tracking-[0.05em]">Email: {supplier.email || "supplier@abc.com.vn"}</p>
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-[rgba(148,163,184,0.05)]">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const qr = quoteRequests.find(q => q.status === 'SUBMITTED');
                                                if (qr) {
                                                    sendQuoteRequestToSupplier(qr.id, [supplier.id]);
                                                    notify(`Đã mời ${supplier.name} báo giá`, "success");
                                                }
                                            }}
                                            className="flex-1 bg-[#B4533A] text-[#000000] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#A85032] transition-all shadow-lg shadow-[#B4533A]/20"
                                        >
                                            Mời báo giá
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function PRListTable({ data, type, onAction, isProcessing }: { data: PR[], type: string, onAction: (id: string) => void, isProcessing: boolean }) {
    return (
        <div className="overflow-x-auto">
            <table className="erp-table text-xs">
                <thead>
                    <tr className="bg-[#FFFFFF] text-[10px] font-black uppercase tracking-widest text-[#000000] border-b border-[rgba(148,163,184,0.1)]">
                        <th className="px-6 py-4">Thông tin PR</th>
                        <th className="px-6 py-4 text-center">Bộ phận</th>
                        <th className="px-6 py-4 text-right">Giá trị (Est.)</th>
                        <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? data.map((pr) => (
                        <tr key={pr.id} className="border-b border-[rgba(148,163,184,0.05)] hover:bg-[#FFFFFF]/50 transition-colors">
                            <td className="px-6 py-5">
                                <div className="flex flex-col">
                                    <span className="font-black text-[#000000] mb-0.5 uppercase">Yêu cầu mua</span>
                                    <span className="text-xs text-[#000000] font-bold">{pr.title}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <span className="text-[10px] bg-[#FFFFFF] text-[#000000] border border-[rgba(148,163,184,0.1)] px-2 py-0.5 rounded-full font-black uppercase">{pr.deptId || pr.requester?.fullName?.substring(0,2)}</span>
                            </td>
                            <td className="px-6 py-5 text-right font-black text-[#B4533A]">
                                {(pr.totalEstimate || 0).toLocaleString()} ₫
                            </td>
                            <td className="px-6 py-5 text-center">
                                <button 
                                    onClick={() => onAction(pr.id)}
                                    className={`inline-flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                        type === 'CATALOG' ? 'bg-[#B4533A] text-[#000000] shadow-lg shadow-[#B4533A]/20' : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981] hover:text-[#000000]'
                                    }`}
                                    disabled={isProcessing}
                                >
                                    {type === 'CATALOG' ? 'Xác nhận giá' : 'Khởi tạo RFQ'} <ArrowRight size={14} />
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={4} className="py-20 text-center opacity-30">
                                <Package size={48} className="mx-auto mb-4" />
                                <span className="text-xs font-black uppercase tracking-widest">Không có đơn PR nào cần xử lý</span>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function TabButton({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count?: number }) {
    return (
        <button 
            onClick={onClick}
            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                active ? "bg-[#FAF8F5] text-[#B4533A] shadow-lg shadow-[#B4533A]/5" : "text-[#000000] hover:text-[#000000]"
            }`}
        >
            {label} {count !== undefined && <span className={`px-2 py-0.5 rounded-full text-[9px] ${active ? "bg-[#B4533A] text-[#000000]" : "bg-[#FFFFFF] text-[#000000] border border-[rgba(148,163,184,0.1)]"}`}>{count}</span>}
        </button>
    );
}

function QuoteRequestProcessing({ quoteRequests, suppliers, onUpdate, notify }: { quoteRequests: QuoteRequest[], suppliers: Organization[], onUpdate: (id: string, data: Partial<QuoteRequest>) => Promise<boolean>, notify: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<QuoteRequest | null>(null);

    const handleStartProcessing = (qr: QuoteRequest) => onUpdate(qr.id, { status: QuoteRequestStatus.PROCESSING });
    const handleOpenEdit = (qr: QuoteRequest) => { setProcessingId(qr.id); setEditData(JSON.parse(JSON.stringify(qr))); };
    const handleUpdateItem = (idx: number, field: string, value: string | number) => {
        if (!editData) return;
        const ni = [...editData.items]; ni[idx] = { ...ni[idx], [field]: value } as QuoteRequestItem;
        setEditData({ ...editData, items: ni });
    };

    const handleComplete = async () => {
        if (!editData) return;
        await onUpdate(editData.id, { status: QuoteRequestStatus.COMPLETED, items: editData.items });
        setProcessingId(null);
        notify("Báo giá hoàn tất", "success");
    };

    return (
        <div className="p-6">
            {!processingId ? (
                <div className="space-y-4">
                    {quoteRequests.map((qr) => (
                        <div key={qr.id} className="bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-2xl p-6 flex justify-between items-center shadow-lg shadow-[#B4533A]/5">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl flex items-center justify-center font-black text-[#000000] text-xs">{qr.qrNumber.split('-').pop()}</div>
                                <div>
                                    <h4 className="font-black text-[#000000] text-sm uppercase">{qr.title}</h4>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${qr.status === 'QUOTED' ? 'text-black' : 'text-black'}`}>{qr.status}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {qr.status === 'SUBMITTED' && <button onClick={() => handleStartProcessing(qr)} className="bg-[#B4533A] text-[#000000] px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#B4533A]/20">Tiếp nhận</button>}
                                {qr.status === 'PROCESSING' && <button onClick={() => handleOpenEdit(qr)} className="bg-amber-500 text-[#000000] px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20">Nhập giá</button>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 bg-[#FFFFFF] rounded-3xl border border-[rgba(148,163,184,0.1)]">
                    <h3 className="font-black text-[#000000] uppercase mb-8 flex items-center gap-3">
                        <Zap size={20} className="text-amber-500" /> Nhập giá: <span className="text-[#B4533A]">{editData?.qrNumber}</span>
                    </h3>
                    <div className="space-y-4">
                        {editData?.items.map((item, idx: number) => (
                            <div key={idx} className="bg-[#FAF8F5] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] grid grid-cols-1 md:grid-cols-2 gap-6 hover:border-[#B4533A]/20 transition-all">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-[#000000] block mb-2 tracking-widest">Mặt hàng yêu cầu</label>
                                    <div className="text-sm font-black text-[#000000] p-4 bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.05)] uppercase">{item.productName}</div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-[#000000] block tracking-widest">Thanh toán & Nhà cung cấp</label>
                                    <input type="number" placeholder="Nhập đơn giá mới..." className="erp-input w-full h-12 text-sm font-bold" onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))} />
                                    <select className="erp-input w-full h-12 text-sm font-bold" onChange={(e) => handleUpdateItem(idx, 'supplierName', e.target.value)}>
                                        <option value="">Chọn Nhà cung cấp...</option>
                                        {suppliers.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleComplete} className="mt-8 bg-emerald-500 hover:bg-emerald-600 text-[#000000] w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]">Gửi báo giá hoàn tất</button>
                </div>
            )}
        </div>
    );
}

function POManagement({ pos }: { pos: PO[] | null }) {
    return (
        <div className="p-8 space-y-4">
            {(pos || []).map((po) => (
                <div key={po.id} className="bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-[32px] p-6 flex justify-between items-center group hover:border-[#B4533A]/20 transition-all shadow-lg shadow-[#B4533A]/5">
                    <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl flex items-center justify-center font-black text-[#000000] text-lg group-hover:bg-[#B4533A] group-hover:text-[#000000] transition-all shadow-inner">***</div>
                        <div>
                            <h4 className="font-black text-[#000000] text-base uppercase tracking-tight">{po.vendor}</h4>
                            <span className="text-[11px] font-black text-[#B4533A] uppercase tracking-[0.1em]">{(po.total || 0).toLocaleString()} ₫ | {getStatusLabel(po.status)}</span>
                        </div>
                    </div>
                    <button className="p-3 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-[#B4533A] hover:border-[#B4533A]/30 rounded-xl transition-all shadow-sm">
                        <ChevronRight size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function PlusIcon({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>; }

