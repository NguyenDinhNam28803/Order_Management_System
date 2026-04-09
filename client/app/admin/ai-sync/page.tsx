"use client";

import { useState } from "react";
import { Database, RefreshCw, Layers, CheckCircle2, AlertCircle, FileText, Download, Users, Zap, Search } from "lucide-react";
import { apiFetch } from "../../utils/api-client";

const SYNC_ENTITIES = [
    { id: "products", name: "Sản phẩm & Vật tư", icon: Layers, desc: "Dữ liệu Product Catalog, Description, SKU" },
    { id: "pos", name: "Lịch sử Đơn hàng (PO)", icon: FileText, desc: "Bao gồm PO, Line Items, Tình trạng Giao hàng" },
    { id: "rfqs", name: "Dữ liệu Thị trường (RFQ)", icon: Search, desc: "Báo giá, NCC đã trúng thầu, Phân tích giá" },
    { id: "suppliers", name: "Hồ sơ Nhà cung cấp", icon: Users, desc: "Năng lực, SLA, Lịch sử KPI" }
];

export default function AISyncPage() {
    const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
    const [syncStatuses, setSyncStatuses] = useState<Record<string, 'idle' | 'syncing' | 'success' | 'error'>>({});

    const handleGlobalSync = async () => {
        setIsGlobalSyncing(true);
        try {
            await apiFetch("/rag/sync", { method: "POST" });
            // Simulate all success if backend succeeds
            const newStatuses: Record<string, any> = {};
            SYNC_ENTITIES.forEach(e => newStatuses[e.id] = 'success');
            setSyncStatuses(newStatuses);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi đồng bộ RAG toàn hệ thống");
        } finally {
            setIsGlobalSyncing(false);
        }
    };

    const handleSyncEntity = async (entity: string) => {
        setSyncStatuses(prev => ({ ...prev, [entity]: 'syncing' }));
        try {
            await apiFetch(`/rag/ingest/${entity}`, { method: "POST" });
            setSyncStatuses(prev => ({ ...prev, [entity]: 'success' }));
        } catch (error) {
            console.error(error);
            setSyncStatuses(prev => ({ ...prev, [entity]: 'error' }));
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-10 mt-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight uppercase">Huấn luyện & Đồng bộ AI</h1>
                    <p className="text-sm text-[#64748B] mt-1 font-medium italic">KẾT NỐI VECTOR DATABASE (RAG) CHO TRỢ LÝ MUA HÀNG THÔNG MINH</p>
                </div>
                <button
                    onClick={handleGlobalSync}
                    disabled={isGlobalSyncing}
                    className="flex items-center gap-2 bg-[#3B82F6] text-white px-8 py-4 rounded-[22px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-[#3B82F6]/30 hover:scale-[1.03] transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={20} className={isGlobalSyncing ? "animate-spin" : ""} /> 
                    {isGlobalSyncing ? "Đang xử lý Embeddings..." : "Đồng bộ Toàn cầu (Global Sync)"}
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: "Vector Index Status", value: "Active", icon: Database, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "Total Embeddings", value: "12,450", icon: Layers, color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
                    { label: "Last Gloabl Sync", value: "2 giờ trước", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { label: "Query Speed", value: "45ms", icon: RefreshCw, color: "text-purple-500", bg: "bg-purple-500/10" }
                ].map((stat, i) => (
                    <div key={i} className="bg-[#161922] p-6 rounded-[30px] border border-[rgba(148,163,184,0.1)] flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <div className={`h-10 w-10 flex items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">{stat.label}</div>
                            <div className="text-xl font-black text-[#F8FAFC]">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Entity Sync List */}
            <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl overflow-hidden p-8">
                <h2 className="text-sm font-black text-[#64748B] uppercase tracking-widest mb-6">Đồng bộ từng phần (Partial Ingestion)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SYNC_ENTITIES.map((entity) => {
                        const status = syncStatuses[entity.id] || 'idle';
                        const Icon = entity.icon;
                        
                        return (
                            <div key={entity.id} className="bg-[#0F1117] p-6 rounded-3xl border border-[rgba(148,163,184,0.05)] flex items-center justify-between group hover:border-[#3B82F6]/30 transition-all">
                                <div className="flex gap-4 items-center">
                                    <div className="h-12 w-12 rounded-2xl bg-[#161922] border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#3B82F6]">
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#F8FAFC]">{entity.name}</div>
                                        <div className="text-[11px] text-[#64748B] max-w-[200px] line-clamp-1">{entity.desc}</div>
                                    </div>
                                </div>

                                <div>
                                    {status === 'success' ? (
                                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            <CheckCircle2 size={14} /> Completed
                                        </div>
                                    ) : status === 'error' ? (
                                        <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                            <AlertCircle size={14} /> Failed
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleSyncEntity(entity.id)}
                                            disabled={status === 'syncing'}
                                            className="btn-primary px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"
                                        >
                                            {status === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14}/>}
                                            {status === 'syncing' ? "Ingesting..." : "Sync Now"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
