"use client";

import { useState, useCallback } from "react";
import {
    Database, RefreshCw, Layers, CheckCircle2, AlertCircle,
    FileText, Download, Users, Zap, Search, Brain, Activity,
    Clock, Mail, Inbox, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";

const SYNC_ENTITIES = [
    {
        id: "products",
        name: "Sản phẩm & Vật tư",
        icon: Layers,
        desc: "Product Catalog, Description, SKU, Pricing",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        count: "4,230",
    },
    {
        id: "purchase_orders",
        name: "Lịch sử Đơn hàng (PO)",
        icon: FileText,
        desc: "PO, Line Items, Tình trạng Giao hàng",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20",
        count: "3,810",
    },
    {
        id: "rfq_requests",
        name: "Dữ liệu Thị trường (RFQ)",
        icon: Search,
        desc: "Báo giá, NCC trúng thầu, Phân tích giá",
        color: "text-violet-400",
        bg: "bg-violet-400/10",
        border: "border-violet-400/20",
        count: "2,190",
    },
    {
        id: "organizations",
        name: "Hồ sơ Nhà cung cấp",
        icon: Users,
        desc: "Năng lực, SLA, Lịch sử KPI, Hợp đồng",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20",
        count: "2,220",
    },
];

const ACTIVITY_LOG = [
    { time: "10:42", action: "Global Sync hoàn thành",   detail: "12,450 embeddings đã cập nhật", icon: CheckCircle2, color: "text-emerald-400" },
    { time: "08:15", action: "Partial Sync — products",   detail: "4,230 vectors đã upsert",       icon: Layers,       color: "text-blue-400"   },
    { time: "Hôm qua", action: "Scheduled Sync",          detail: "Auto-sync chạy thành công",     icon: Clock,        color: "text-[#484F58]"  },
];

interface ParsedEmail {
    messageId: string;
    subject: string;
    from: string;
    date: string;
    body: string;
}

export default function AISyncPage() {
    const { syncRAG, ingestRAGEntity, apiFetch } = useProcurement();

    const [isGlobalSyncing,   setIsGlobalSyncing]   = useState(false);
    const [syncStatuses,      setSyncStatuses]       = useState<Record<string, "idle" | "syncing" | "success" | "error">>({});
    const [globalProgress,    setGlobalProgress]     = useState(0);

    // Email RAG state
    const [emailLimit,        setEmailLimit]         = useState(20);
    const [emails,            setEmails]             = useState<ParsedEmail[]>([]);
    const [emailsLoading,     setEmailsLoading]      = useState(false);
    const [emailIngestStatus, setEmailIngestStatus]  = useState<"idle" | "loading" | "success" | "error">("idle");
    const [emailIngestResult, setEmailIngestResult]  = useState<{ ingested: number; skipped: number } | null>(null);
    const [showEmails,        setShowEmails]         = useState(false);
    const [emailError,        setEmailError]         = useState("");

    const handleGlobalSync = async () => {
        setIsGlobalSyncing(true);
        setGlobalProgress(0);
        const timer = setInterval(() => {
            setGlobalProgress(p => (p >= 90 ? 90 : p + 12));
        }, 400);
        const ok = await syncRAG();
        clearInterval(timer);
        setGlobalProgress(100);
        if (ok) {
            const s: Record<string, "success"> = {};
            SYNC_ENTITIES.forEach(e => { s[e.id] = "success"; });
            setSyncStatuses(s);
        }
        setTimeout(() => { setIsGlobalSyncing(false); setGlobalProgress(0); }, 800);
    };

    const handleSyncEntity = async (entity: string) => {
        setSyncStatuses(prev => ({ ...prev, [entity]: "syncing" }));
        const ok = await ingestRAGEntity(entity);
        setSyncStatuses(prev => ({ ...prev, [entity]: ok ? "success" : "error" }));
    };

    const handleFetchEmails = useCallback(async () => {
        setEmailsLoading(true);
        setEmailError("");
        try {
            const resp = await apiFetch(`/rag/emails?limit=${emailLimit}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            setEmails(Array.isArray(data) ? data : []);
            setShowEmails(true);
        } catch {
            setEmailError("Không thể tải email. Kiểm tra cấu hình IMAP.");
        } finally {
            setEmailsLoading(false);
        }
    }, [apiFetch, emailLimit]);

    const handleIngestEmails = useCallback(async () => {
        setEmailIngestStatus("loading");
        setEmailIngestResult(null);
        try {
            const resp = await apiFetch(`/rag/emails/ingest?limit=${emailLimit}`, { method: "POST" });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            setEmailIngestResult(data);
            setEmailIngestStatus("success");
        } catch {
            setEmailIngestStatus("error");
        }
    }, [apiFetch, emailLimit]);

    return (
        <div className="animate-fade-in">

            {/* ── Page Header ── */}
            <div className="mb-8 mt-2 flex flex-wrap justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Brain size={16} className="text-white" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-md">
                            RAG · Vector DB
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Huấn luyện & Đồng bộ AI</h1>
                    <p className="text-[12px] text-[#64748B] mt-1 font-medium">
                        Kết nối Vector Database cho Trợ lý Mua hàng Thông minh ProcureSmart
                    </p>
                </div>

                <button
                    onClick={handleGlobalSync}
                    disabled={isGlobalSyncing}
                    className="relative flex items-center gap-2.5 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white px-6 py-3 rounded-xl font-bold text-[12px] shadow-xl shadow-blue-500/25 hover:shadow-blue-500/45 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                >
                    {isGlobalSyncing && (
                        <div className="absolute inset-0 bg-white/10 transition-all duration-300" style={{ width: `${globalProgress}%` }} />
                    )}
                    <RefreshCw size={16} className={`relative z-10 ${isGlobalSyncing ? "animate-spin" : ""}`} />
                    <span className="relative z-10">
                        {isGlobalSyncing ? `Đang xử lý Embeddings… ${globalProgress}%` : "Global Sync"}
                    </span>
                </button>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
                {[
                    { label: "Vector Index",      value: "Active",       icon: Database, color: "text-emerald-400", bg: "bg-emerald-400/10", sub: "pgvector · dim 768" },
                    { label: "Total Embeddings",  value: "12,450",       icon: Layers,   color: "text-blue-400",    bg: "bg-blue-400/10",    sub: "+320 hôm nay" },
                    { label: "Lần sync cuối",     value: "2 giờ trước",  icon: Clock,    color: "text-amber-400",   bg: "bg-amber-400/10",   sub: "Auto · 06:00 AM" },
                    { label: "Query Speed",       value: "45 ms",        icon: Zap,      color: "text-violet-400",  bg: "bg-violet-400/10",  sub: "avg p95: 82 ms" },
                ].map((s, i) => (
                    <div key={i} className="erp-card flex items-center gap-3 p-4">
                        <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${s.bg} ${s.color} shrink-0`}>
                            <s.icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-[#484F58] truncate">{s.label}</p>
                            <p className={`text-[17px] font-black leading-tight num-display ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-[#484F58] mt-0.5 truncate">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Grid: Sync entities + Activity ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                {/* Entity Sync Cards */}
                <div className="xl:col-span-2 erp-card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">
                            Đồng bộ từng phần — Partial Ingestion
                        </h2>
                        <span className="text-[9px] text-[#484F58] bg-[#21262D] border border-[rgba(240,246,252,0.08)] px-2 py-0.5 rounded-md">
                            4 nguồn dữ liệu
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SYNC_ENTITIES.map((entity) => {
                            const status = syncStatuses[entity.id] ?? "idle";
                            const Icon   = entity.icon;
                            return (
                                <div
                                    key={entity.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                                        status === "success" ? "bg-emerald-500/5 border-emerald-500/20"
                                        : status === "error" ? "bg-rose-500/5 border-rose-500/20"
                                        : `bg-[#0D1117] ${entity.border} hover:border-opacity-50`
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-11 w-11 rounded-xl ${entity.bg} border ${entity.border} flex items-center justify-center ${entity.color} shrink-0`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-bold text-[#F8FAFC] truncate">{entity.name}</p>
                                            <p className="text-[10px] text-[#64748B] truncate max-w-[140px]">{entity.desc}</p>
                                            <p className={`text-[9px] font-bold mt-0.5 num-display ${entity.color}`}>{entity.count} vectors</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 ml-2">
                                        {status === "success" ? (
                                            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                <CheckCircle2 size={12} /> Done
                                            </div>
                                        ) : status === "error" ? (
                                            <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                                                <AlertCircle size={12} /> Failed
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleSyncEntity(entity.id)}
                                                disabled={status === "syncing"}
                                                className="btn-primary px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-60"
                                            >
                                                {status === "syncing"
                                                    ? <><RefreshCw size={11} className="animate-spin" /> Syncing…</>
                                                    : <><Download size={11} /> Sync</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Activity Log */}
                <div className="erp-card p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={14} className="text-[#484F58]" />
                        <h2 className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">Hoạt động gần đây</h2>
                    </div>
                    <div className="space-y-3 flex-1">
                        {ACTIVITY_LOG.map((log, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="h-7 w-7 rounded-lg bg-[#21262D] flex items-center justify-center shrink-0 mt-0.5">
                                    <log.icon size={13} className={log.color} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold text-[#E6EDF3] leading-snug">{log.action}</p>
                                    <p className="text-[9px] text-[#484F58] mt-0.5">{log.detail}</p>
                                </div>
                                <span className="text-[9px] text-[#30363D] shrink-0 mt-0.5">{log.time}</span>
                            </div>
                        ))}
                    </div>
                    <div className="divider-label mt-5 mb-3">Trạng thái kết nối</div>
                    <div className="space-y-2">
                        {[
                            { label: "PostgreSQL pgvector",  ok: true },
                            { label: "FPT AI Embedding API", ok: true },
                            { label: "Redis Queue",          ok: true },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-[11px] text-[#8B949E]">{s.label}</span>
                                <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide ${s.ok ? "text-emerald-400" : "text-rose-400"}`}>
                                    <span className={`status-dot ${s.ok ? "status-dot-active" : "status-dot-error"}`} />
                                    {s.ok ? "Online" : "Offline"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Email RAG Panel ── */}
            <div className="erp-card p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#3B82F6]/20 to-[#6366F1]/20 border border-[#3B82F6]/20 flex items-center justify-center shrink-0">
                            <Mail size={16} className="text-[#3B82F6]" />
                        </div>
                        <div>
                            <h2 className="text-[13px] font-black text-[#E6EDF3]">Email RAG Ingestion</h2>
                            <p className="text-[10px] text-[#64748B]">Đọc email Gmail qua IMAP · Nhúng vào Vector DB</p>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
                        Gmail IMAP
                    </span>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    <div className="flex items-center gap-2 bg-[#0D1117] border border-[rgba(240,246,252,0.08)] rounded-lg px-3 py-2">
                        <span className="text-[11px] text-[#64748B]">Số email:</span>
                        <input
                            type="number"
                            min={5}
                            max={200}
                            value={emailLimit}
                            onChange={e => setEmailLimit(Number(e.target.value))}
                            className="w-14 bg-transparent text-[#E6EDF3] text-[12px] font-bold outline-none text-center"
                        />
                    </div>

                    <button
                        onClick={handleFetchEmails}
                        disabled={emailsLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#21262D] border border-[rgba(240,246,252,0.1)] hover:border-[#3B82F6]/40 text-[#E6EDF3] rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                    >
                        {emailsLoading
                            ? <><RefreshCw size={13} className="animate-spin" /> Đang tải…</>
                            : <><Inbox size={13} /> Xem Email</>}
                    </button>

                    <button
                        onClick={handleIngestEmails}
                        disabled={emailIngestStatus === "loading"}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white rounded-lg text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {emailIngestStatus === "loading"
                            ? <><RefreshCw size={13} className="animate-spin" /> Đang ingest…</>
                            : <><Sparkles size={13} /> Ingest vào RAG</>}
                    </button>

                    {/* Ingest result badge */}
                    {emailIngestStatus === "success" && emailIngestResult && (
                        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg text-[10px] font-black">
                            <CheckCircle2 size={12} />
                            {emailIngestResult.ingested} đã ingest · {emailIngestResult.skipped} bỏ qua
                        </div>
                    )}
                    {emailIngestStatus === "error" && (
                        <div className="flex items-center gap-1.5 text-rose-400 bg-rose-400/10 border border-rose-400/20 px-3 py-1.5 rounded-lg text-[10px] font-black">
                            <AlertCircle size={12} /> Lỗi ingest
                        </div>
                    )}
                </div>

                {emailError && (
                    <p className="text-[11px] text-rose-400 mb-4 flex items-center gap-1.5">
                        <AlertCircle size={12} /> {emailError}
                    </p>
                )}

                {/* Email list */}
                {emails.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowEmails(v => !v)}
                            className="flex items-center gap-2 text-[11px] font-bold text-[#64748B] hover:text-[#8B949E] mb-3 transition-colors"
                        >
                            {showEmails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {emails.length} email đã tải
                        </button>

                        {showEmails && (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {emails.map((email, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-[#0D1117] border border-[rgba(240,246,252,0.06)] rounded-xl hover:border-[rgba(240,246,252,0.12)] transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-[#21262D] flex items-center justify-center shrink-0">
                                            <Mail size={13} className="text-[#3B82F6]" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-semibold text-[#E6EDF3] truncate">{email.subject || "(Không có tiêu đề)"}</p>
                                            <p className="text-[10px] text-[#64748B] truncate">Từ: {email.from}</p>
                                            <p className="text-[10px] text-[#484F58] mt-0.5 line-clamp-1">{email.body?.slice(0, 100)}…</p>
                                        </div>
                                        <span className="text-[9px] text-[#30363D] shrink-0 mt-0.5">
                                            {email.date ? new Date(email.date).toLocaleDateString("vi-VN") : ""}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Info hint */}
                <div className="mt-4 p-3 bg-[#3B82F6]/5 border border-[#3B82F6]/10 rounded-xl">
                    <p className="text-[10px] text-[#64748B] leading-relaxed">
                        <span className="text-[#3B82F6] font-bold">Cách hoạt động:</span> Email từ Gmail INBOX được đọc qua IMAP,
                        nhúng thành vector bằng FPT AI Embedding (768 dim), lưu vào PostgreSQL pgvector.
                        AI Assistant sau đó có thể tìm kiếm và trả lời câu hỏi dựa trên nội dung email.
                    </p>
                </div>
            </div>
        </div>
    );
}
