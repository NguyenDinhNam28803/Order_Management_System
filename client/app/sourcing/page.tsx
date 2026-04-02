"use client";

import { useState } from "react";
import { PR, useProcurement } from "../context/ProcurementContext";
import DashboardHeader from "../components/DashboardHeader";
import { 
    Filter, ArrowRight, 
    FileText, ShoppingBag, 
    Zap, TrendingUp, 
    Package, Send} from "lucide-react";
import Link from "next/link";
import { RFQ } from "../context/ProcurementContext";

export default function SourcingPage() {
    const { prs, rfqs, currentUser, refreshData, notify, createRFQ, createPOFromPR, organizations } = useProcurement();
    const [activeTab, setActiveTab] = useState("approved-prs");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter organizations to get only suppliers
    const suppliersList = (organizations || []).filter(org => 
        org.companyType === 'SUPPLIER' || org.companyType === 'BOTH'
    );

    // 1. Get Approved PRs that need sourcing (not already in an RFQ)
    const rfqsPrIds = (rfqs || []).map((r: RFQ) => r.prId);
    const approvedPRs = (prs || []).filter((pr: PR) => 
        (pr.status === "APPROVED" || pr.status === "PENDING_QUOTATION") && 
        !rfqsPrIds.includes(pr.id)
    );

    // 2. Get active RFQs
    const activeRFQs = (rfqs || []);

    // 3. Mock logic for creating RFQ
    const handleCreateRFQ = async (prId: string) => {
        setIsProcessing(true);
        try {
            const pr = prs.find(p => p.id === prId);
            const targetSupplier = suppliersList[0];
            
            // Theo đúng schema CreateRfqDto
            const success = await createRFQ({
                prId,
                title: pr?.title ? `RFQ: ${pr.title}` : `RFQ cho PR ${pr?.prNumber || prId.substring(0,8)}`,
                description: pr?.description || pr?.justification || "Yêu cầu báo giá tự động từ hệ thống Sourcing",
                supplierIds: targetSupplier ? [targetSupplier.id] : [],
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            });
            
            if (success) {
                notify("Đã khởi tạo RFQ thành công", "success");
                await refreshData();
            }
        } catch (err) {
            console.error(err);
            notify("Lỗi khi khởi tạo RFQ", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuickPO = async (prId: string) => {
        if (!suppliersList || suppliersList.length === 0) {
            notify("Không có nhà cung cấp nào khả dụng để tạo PO nhanh", "warning");
            return;
        }
        
        setIsProcessing(true);
        try {
            // Pick the first available supplier for the demo
            const targetSupplier = suppliersList[0];
            const success = await createPOFromPR(prId, targetSupplier.id);
            if (success) {
                notify(`Đã tạo PO nhanh cho NCC ${targetSupplier.name}`, "success");
                refreshData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const stats = [
        { label: "PR chờ RFQ", value: approvedPRs.length, icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "RFQ đang chạy", value: activeRFQs.length, icon: Send, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "PO chờ phát hành", value: 3, icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: "Tiết kiệm (Est.)", value: "125M \u20ab", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
    ];

    if (currentUser?.role !== "PROCUREMENT" && currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-black text-slate-400">Bạn không có quyền truy cập trang này.</div>;
    }

    return (
        <main className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Nguồn hàng & Báo giá"]} />

            <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase mb-2">QUẢN LÝ NGUỒN HÀNG (SOURCING)</h1>
                    <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-2">
                        <Zap size={14} className="text-amber-500 fill-amber-500" /> 
                        Tối ưu hóa quy trình chọn nhà cung cấp và quản lý RFQ/PO
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                        <Filter size={16} /> Bộ lọc nâng cao
                    </button>
                    <Link href="/sourcing/rfq-create">
                        <button className="flex items-center gap-2 bg-erp-navy text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-erp-navy/20 hover:scale-105 active:scale-95 transition-all">
                            <PlusIcon size={16} /> Tạo RFQ thủ công
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-2xl shadow-erp-navy/[0.03] flex items-center gap-6 group hover:border-erp-blue/20 hover:shadow-erp-blue/[0.04] transition-all duration-500">
                        <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1.5">{stat.label}</div>
                            <div className="text-3xl font-black text-erp-navy tracking-tight">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                <div className="flex bg-slate-50/50 border-b border-slate-100 p-2 gap-2">
                    <TabButton active={activeTab === "approved-prs"} onClick={() => setActiveTab("approved-prs")} label="PR Đã Phê Duyệt" count={approvedPRs.length} />
                    <TabButton active={activeTab === "active-rfqs"} onClick={() => setActiveTab("active-rfqs")} label="RFQ Đang Triển Khai" count={activeRFQs.length} />
                    <TabButton active={activeTab === "suppliers"} onClick={() => setActiveTab("suppliers")} label="Danh sách NCC gợi ý" />
                </div>

                <div className="p-0">
                    {activeTab === "approved-prs" && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded mt-1" /></th>
                                        <th className="px-6 py-4">Thông tin PR</th>
                                        <th className="px-6 py-4 text-center">Bộ phận / Dự án</th>
                                        <th className="px-6 py-4 text-right">Giá trị thực hiện</th>
                                        <th className="px-6 py-4 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedPRs.length > 0 ? approvedPRs.map((pr: PR) => (
                                        <tr key={pr.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 cursor-pointer"><input type="checkbox" className="rounded" /></td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-erp-navy mb-0.5">{pr.prNumber || pr.id.substring(0,8)}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500 font-bold">{pr.title}</span>
                                                        {pr.priority === 2 && <span className="text-[8px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-black uppercase">Ưu tiên</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className="text-xs font-black text-slate-700">{pr.deptId || "N/A"}</span>
                                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full inline-block font-black uppercase">{pr.costCenter?.code || "DEFAULT"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono font-black text-erp-blue">
                                                {(Number(pr.totalEstimate) || 0).toLocaleString()} \u20ab
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleCreateRFQ(pr.id)}
                                                        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95"
                                                        disabled={isProcessing}
                                                    >
                                                        Khởi tạo RFQ
                                                    </button>
                                                    <button 
                                                        onClick={() => handleQuickPO(pr.id)}
                                                        className="inline-flex items-center gap-2 bg-erp-navy text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all transform active:scale-95 shadow-lg shadow-erp-navy/20"
                                                        disabled={isProcessing}
                                                        title="Tạo PO trực tiếp cho nhà cung cấp mặc định"
                                                    >
                                                        Tạo PO nhanh <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-30">
                                                    <Package size={48} className="mb-4" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Không có đơn PR nào cần xử lý nguồn</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "active-rfqs" && (
                        <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs">
                            <Send size={40} className="mx-auto mb-4 opacity-20" />
                            Danh sách RFQ đang chờ nhà cung cấp phản hồi sẽ hiển thị ở đây.
                        </div>
                    )}

                    {activeTab === "suppliers" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="border border-slate-100 p-6 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group bg-slate-50/20">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center font-black text-erp-navy uppercase">S{i}</div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => <div key={star} className="w-2 h-2 rounded-full bg-amber-400"></div>)}
                                        </div>
                                    </div>
                                    <h4 className="font-black text-erp-navy mb-1 uppercase tracking-tight">Cung cấp thiết bị số {i}</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mb-4">Chuyên: Laptop, Server, Thiết bị mạng Cisco...</p>
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Thời gian giao</span>
                                            <span className="text-xs font-bold text-erp-navy">2-4 ngày</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Rating</span>
                                            <span className="text-xs font-bold text-emerald-500">9.8/10</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12 erp-card bg-gradient-to-br from-erp-navy via-erp-navy to-erp-blue p-12 text-white overflow-hidden relative shadow-[0_30px_70px_-15px_rgba(10,25,47,0.4)] border-none animate-in slide-in-from-bottom-12 duration-1000 group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                                <Zap size={28} className="text-amber-300 fill-amber-300/20" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">Next-Gen Sourcing Intelligence</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight mb-6 leading-tight">AI đang phân tích & gợi ý 5 nguồn hàng tối ưu nhất cho bạn</h2>
                        <p className="text-white/60 text-lg font-medium leading-relaxed mb-4">Dựa trên dữ liệu mạng lưới hơn 5,000 nhà cung cấp toàn cầu, hệ thống đã lọc ra các đối tác có năng lực cung ứng kịp thời nhất.</p>
                        <div className="flex items-center gap-6 mt-8">
                            <div className="flex -space-x-4">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-erp-navy bg-slate-800 flex items-center justify-center text-[10px] font-black shadow-xl">S{i}</div>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">+ 48 Verified Sources</span>
                        </div>
                    </div>
                    <button className="bg-white text-erp-navy px-12 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-5px_rgba(255,255,255,0.2)] hover:bg-emerald-400 hover:text-white hover:scale-105 active:scale-95 transition-all duration-500 shrink-0">
                        Phân tích nguồn hàng ngay
                    </button>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-erp-blue/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>
                <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-amber-300 rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white/20 rounded-full animate-ping"></div>
            </div>
        </main>
    );
}

function TabButton({ active, onClick, label, count }: {
    active: boolean;
    onClick: () => void;
    label: string;
    count?: number;
}) {
    return (
        <button 
            onClick={onClick}
            className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                active 
                ? "bg-white text-erp-navy shadow-md" 
                : "text-slate-400 hover:text-slate-600"
            }`}
        >
            {label} 
            {count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] ${active ? "bg-erp-blue text-white" : "bg-slate-200 text-slate-500"}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function PlusIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
