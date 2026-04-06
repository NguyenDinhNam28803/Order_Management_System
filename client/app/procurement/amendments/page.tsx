"use client";

import React, { useState } from "react";
import { 
    ShieldAlert, Plus, Search, Filter, 
    ArrowRight, ChevronRight, X, History,
    Eye, Edit3, CheckCircle, Clock, AlertTriangle,
    ArrowLeft, Split, MessageSquare, Save, Ship, FileText
} from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";

// --- Mock Data ---
interface AmendmentMock {
    id: string;
    poNumber: string;
    amendmentNumber: number;
    changeType: "QUANTITY" | "PRICE" | "DELIVERY_DATE" | "ITEM_ADD" | "ITEM_REMOVE";
    originalValue: string;
    newValue: string;
    createdAt: string;
    reason: string;
}

const mockAmendments: AmendmentMock[] = [
    {
        id: "am-1",
        poNumber: "PO-2026-001",
        amendmentNumber: 1,
        changeType: "PRICE",
        originalValue: "1,200,000,000 ₫",
        newValue: "1,150,000,000 ₫",
        createdAt: "2026-04-02T09:00:00Z",
        reason: "Thỏa thuận lại giá sau khi mua số lượng lớn."
    }
];

export default function AmendmentsPage() {
    const [amendments, setAmendments] = useState<AmendmentMock[]>(mockAmendments);
    const [view, setView] = useState<"list" | "create">("list");
    const [selectedPOHistory, setSelectedPOHistory] = useState<string | null>(null);

    const getBadgeColor = (type: string) => {
        switch (type) {
            case "QUANTITY": return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20";
            case "PRICE": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "DELIVERY_DATE": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            case "ITEM_ADD": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "ITEM_REMOVE": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            default: return "bg-[#161922] text-[#64748B] border-[rgba(148,163,184,0.1)]";
        }
    };

    return (
        <main className="min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <DashboardHeader breadcrumbs={["Quản lý Đơn hàng", "Điều chỉnh PO (Amendments)"]} />

            <div className="p-8 max-w-[1600px] mx-auto">
                {view === "list" ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2">ĐIỀU CHỈNH ĐƠN HÀNG (AMENDMENTS)</h1>
                                <p className="text-[#64748B] font-bold text-sm tracking-tight flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-500" /> 
                                    Quản lý lịch sử thay đổi và điều khoản phát sinh của PO
                                </p>
                            </div>
                            <button 
                                onClick={() => setView("create")}
                                className="flex items-center gap-2 bg-[#3B82F6] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#3B82F6]/20 hover:scale-105 active:scale-95 transition-all group"
                            >
                                <Plus size={18} className="transition-transform group-hover:rotate-90" /> Tạo Amendment
                            </button>
                        </div>

                        <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)] text-[9px] font-black text-[#64748B] uppercase tracking-widest">
                                            <th className="px-8 py-5">Mã PO</th>
                                            <th className="px-8 py-5">Amendment #</th>
                                            <th className="px-8 py-5">Loại thay đổi</th>
                                            <th className="px-8 py-5">Giá trị cũ/mới</th>
                                            <th className="px-8 py-5">Ngày tạo</th>
                                            <th className="px-8 py-5 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {amendments.map((am) => (
                                            <tr key={am.id} className="hover:bg-[#0F1117]/30 transition-all group">
                                                <td className="px-8 py-8 font-black text-[#F8FAFC]">{am.poNumber}</td>
                                                <td className="px-8 py-8">
                                                    <span className="w-8 h-8 rounded-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[10px] font-black text-[#64748B]">
                                                        {am.amendmentNumber}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getBadgeColor(am.changeType)}`}>
                                                        {am.changeType}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-3 text-xs font-bold">
                                                        <span className="text-[#64748B] line-through">{am.originalValue}</span>
                                                        <ArrowRight size={14} className="text-[#3B82F6]" />
                                                        <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{am.newValue}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-[11px] font-bold text-[#64748B]">
                                                    {new Date(am.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-8 text-right">
                                                    <button 
                                                        onClick={() => setSelectedPOHistory(am.poNumber)}
                                                        className="p-3 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-xl transition-all border border-[rgba(148,163,184,0.1)]"
                                                        title="Xem lịch sử"
                                                    >
                                                        <History size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {selectedPOHistory && (
                            <AmendmentHistoryTimeline 
                                poNumber={selectedPOHistory} 
                                history={amendments.filter(a => a.poNumber === selectedPOHistory)}
                                onClose={() => setSelectedPOHistory(null)}
                                getBadgeColor={getBadgeColor}
                            />
                        )}
                    </div>
                ) : (
                    <AmendmentForm 
                        onCancel={() => setView("list")} 
                        onSave={(data: AmendmentMock) => { setAmendments([...amendments, data]); setView("list"); }}
                    />
                )}
            </div>
            </main>
        
    );
}

function AmendmentForm({ onCancel, onSave }: { onCancel: () => void, onSave: (data: AmendmentMock) => void }) {
    const [formData, setFormData] = useState({
        poNumber: "PO-2026-001",
        changeType: "QUANTITY" as AmendmentMock["changeType"],
        originalValue: "100 units",
        newValue: "",
        reason: ""
    });

    const amendmentNumber = 2; // Auto-increment mock

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center gap-2 text-[#64748B] hover:text-[#F8FAFC] font-black text-[10px] uppercase tracking-widest transition-all">
                    <ArrowLeft size={16} /> Quay lại danh sách
                </button>
                <button 
                    onClick={() => onSave({ ...formData, id: `am-${Date.now()}`, amendmentNumber, createdAt: new Date().toISOString() })}
                    className="flex items-center gap-3 bg-[#3B82F6] text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#3B82F6]/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Save size={18} /> Gửi Amendment
                </button>
            </div>

            <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden">
                <div className="p-10 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117] flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-[#F8FAFC] uppercase leading-none mb-2">TẠO ĐIỀU CHỈNH ĐƠN HÀNG</h2>
                        <p className="text-xs text-[#64748B] font-bold uppercase tracking-widest uppercase">Amendment #{amendmentNumber}</p>
                    </div>
                    <div className="p-4 bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-inner flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#3B82F6] flex items-center justify-center text-white"><FileText size={20} /></div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-[#64748B] uppercase leading-none mb-1">Hiện đang chỉnh sửa:</p>
                             <p className="text-base font-black text-[#3B82F6] tracking-tighter">PO-2026-001</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-1">Loại thay đổi *</label>
                            <select 
                                className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl px-6 py-5 text-sm font-bold text-[#F8FAFC] outline-none focus:bg-[#161922] focus:border-[#3B82F6]/30 transition-all"
                                value={formData.changeType}
                                onChange={(e) => setFormData({ ...formData, changeType: e.target.value as any })}
                            >
                                <option value="QUANTITY">Số lượng (Quantity)</option>
                                <option value="PRICE">Đơn giá (Price)</option>
                                <option value="DELIVERY_DATE">Ngày giao hàng (Delivery Date)</option>
                                <option value="ITEM_ADD">Thêm hạng mục (Item Add)</option>
                                <option value="ITEM_REMOVE">Gỡ hạng mục (Item Remove)</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B] ml-1">Lý do điều chỉnh *</label>
                            <div className="relative">
                                <MessageSquare className="absolute right-6 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl px-6 py-5 text-sm font-bold text-[#F8FAFC] outline-none focus:bg-[#161922] focus:border-[#3B82F6]/30 transition-all pr-16 placeholder:text-[#64748B]"
                                    placeholder="Lý do chi tiết..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comparison Panel */}
                    <div className="bg-[#0F1117] p-10 rounded-[32px] border border-[rgba(148,163,184,0.1)] space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Split className="text-[#3B82F6]" size={20} />
                            <h3 className="text-xs font-black text-[#F8FAFC] uppercase tracking-[0.2em]">BẢNG SO SÁNH THAY ĐỔI</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-10 items-center">
                            <div className="bg-[#161922] p-8 rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-sm">
                                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-4">GIÁ TRỊ CŨ (ORIGINAL)</p>
                                <p className="text-xl font-bold text-[#64748B] line-through leading-none">{formData.originalValue}</p>
                            </div>
                            <div className="bg-emerald-500 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/20 relative group overflow-hidden">
                                <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-br from-emerald-400/0 to-emerald-400/50 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-emerald-100">GIÁ TRỊ MỚI (NEW VERSION)</p>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/20 border border-white/20 rounded-xl px-6 py-4 text-xl font-black text-white outline-none focus:bg-white focus:text-emerald-600 transition-all placeholder:text-emerald-200/50"
                                        placeholder="Nhập giá trị mới..."
                                        value={formData.newValue}
                                        onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center -mt-14 relative z-20 md:block hidden">
                             <div className="w-12 h-12 rounded-full bg-[#161922] border border-[rgba(148,163,184,0.1)] shadow-xl flex items-center justify-center mx-auto text-[#3B82F6]">
                                <ArrowRight size={24} />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AmendmentHistoryTimeline({ poNumber, history, onClose, getBadgeColor }: { poNumber: string, history: AmendmentMock[], onClose: () => void, getBadgeColor: (type: string) => string }) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-[#0F1117]/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}></div>
            <div className="bg-[#161922] w-full max-w-xl h-full relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-[rgba(148,163,184,0.1)]">
                <div className="p-10 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#0F1117]">
                    <div>
                        <h3 className="text-2xl font-black text-[#F8FAFC] uppercase">LỊCH SỬ ĐIỀU CHỈNH</h3>
                        <p className="text-xs font-bold text-[#3B82F6] tracking-tighter uppercase mt-1">ĐƠN HÀNG: {poNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-[#161922] rounded-full transition-all border border-[rgba(148,163,184,0.1)]">
                        <X size={24} className="text-[#64748B]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                     {history.length > 0 ? (
                         <div className="relative space-y-12">
                             <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-[rgba(148,163,184,0.1)] rounded-full" />
                             {history.map((am, idx: number) => (
                                 <div key={am.id} className="relative flex items-start gap-8 z-10">
                                     <div className="w-10 h-10 rounded-2xl bg-[#161922] border border-[rgba(148,163,184,0.1)] shadow-xl flex items-center justify-center text-[#F8FAFC] shrink-0 font-black text-xs">
                                         {am.amendmentNumber}
                                     </div>
                                     <div className="flex-1 bg-[#0F1117] p-6 rounded-[28px] border border-[rgba(148,163,184,0.1)]">
                                         <div className="flex justify-between items-start mb-4">
                                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${getBadgeColor(am.changeType)}`}>
                                                  {am.changeType}
                                              </span>
                                              <span className="text-[10px] font-bold text-[#64748B]">{new Date(am.createdAt).toLocaleString()}</span>
                                         </div>
                                         <div className="flex items-center gap-4 mb-4">
                                              <span className="text-xs font-bold text-[#64748B] line-through">{am.originalValue}</span>
                                              <ArrowRight size={12} className="text-[#3B82F6]" />
                                              <span className="text-sm font-black text-emerald-400">{am.newValue}</span>
                                         </div>
                                         <p className="text-[11px] text-[#94A3B8] font-medium leading-relaxed italic">
                                             "{am.reason}"
                                         </p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center h-full text-[#64748B]">
                             <History size={60} className="mb-6 opacity-20" />
                             <p className="font-black uppercase tracking-widest text-xs">Không có lịch sử điều chỉnh</p>
                         </div>
                     )}
                </div>

                <div className="p-10 border-t border-[rgba(148,163,184,0.1)] bg-[#0F1117]">
                    <button onClick={onClose} className="w-full bg-[#3B82F6] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#3B82F6]/20 hover:bg-[#2563EB] transition-all">ĐÓNG PANEL</button>
                </div>
            </div>
        </div>
    );
}
