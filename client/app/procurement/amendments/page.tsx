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
            case "QUANTITY": return "bg-blue-100 text-blue-600 border-blue-200";
            case "PRICE": return "bg-amber-100 text-amber-600 border-amber-200";
            case "DELIVERY_DATE": return "bg-purple-100 text-purple-600 border-purple-200";
            case "ITEM_ADD": return "bg-emerald-100 text-emerald-600 border-emerald-200";
            case "ITEM_REMOVE": return "bg-rose-100 text-rose-600 border-rose-200";
            default: return "bg-slate-100 text-slate-500 border-slate-200";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/30">
            <DashboardHeader breadcrumbs={["Quản lý Đơn hàng", "Điều chỉnh PO (Amendments)"]} />

            <div className="p-8 max-w-[1600px] mx-auto">
                {view === "list" ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase mb-2">ĐIỀU CHỈNH ĐƠN HÀNG (AMENDMENTS)</h1>
                                <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-500" /> 
                                    Quản lý lịch sử thay đổi và điều khoản phát sinh của PO
                                </p>
                            </div>
                            <button 
                                onClick={() => setView("create")}
                                className="flex items-center gap-2 bg-erp-navy text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-erp-navy/20 hover:scale-105 active:scale-95 transition-all group"
                            >
                                <Plus size={18} className="transition-transform group-hover:rotate-90" /> Tạo Amendment
                            </button>
                        </div>

                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-8 py-5">Mã PO</th>
                                            <th className="px-8 py-5">Amendment #</th>
                                            <th className="px-8 py-5">Loại thay đổi</th>
                                            <th className="px-8 py-5">Giá trị cũ/mới</th>
                                            <th className="px-8 py-5">Ngày tạo</th>
                                            <th className="px-8 py-5 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {amendments.map((am) => (
                                            <tr key={am.id} className="hover:bg-slate-50 transition-all group">
                                                <td className="px-8 py-8 font-black text-erp-navy">{am.poNumber}</td>
                                                <td className="px-8 py-8">
                                                    <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
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
                                                        <span className="text-slate-400 line-through">{am.originalValue}</span>
                                                        <ArrowRight size={14} className="text-slate-300" />
                                                        <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{am.newValue}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-[11px] font-bold text-slate-500">
                                                    {new Date(am.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-8 text-right">
                                                    <button 
                                                        onClick={() => setSelectedPOHistory(am.poNumber)}
                                                        className="p-3 text-slate-300 hover:text-erp-navy hover:bg-slate-100 rounded-xl transition-all"
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
        </div>
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
                <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-erp-navy font-black text-[10px] uppercase tracking-widest transition-all">
                    <ArrowLeft size={16} /> Quay lại danh sách
                </button>
                <button 
                    onClick={() => onSave({ ...formData, id: `am-${Date.now()}`, amendmentNumber, createdAt: new Date().toISOString() })}
                    className="flex items-center gap-3 bg-erp-navy text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-erp-navy/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Save size={18} /> Gửi Amendment
                </button>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-erp-navy uppercase leading-none mb-2">TẠO ĐIỀU CHỈNH ĐƠN HÀNG</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest uppercase">Amendment #{amendmentNumber}</p>
                    </div>
                    <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-inner flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-erp-navy flex items-center justify-center text-white"><FileText size={20} /></div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-erp-navy uppercase leading-none mb-1">Hiện đang chỉnh sửa:</p>
                             <p className="text-base font-black text-erp-blue tracking-tighter">PO-2026-001</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Loại thay đổi *</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all"
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lý do điều chỉnh *</label>
                            <div className="relative">
                                <MessageSquare className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all pr-16"
                                    placeholder="Lý do chi tiết..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comparison Panel */}
                    <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Split className="text-erp-blue" size={20} />
                            <h3 className="text-xs font-black text-erp-navy uppercase tracking-[0.2em]">BẢNG SO SÁNH THAY ĐỔI</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-10 items-center">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">GIÁ TRỊ CŨ (ORIGINAL)</p>
                                <p className="text-xl font-bold text-slate-300 line-through leading-none">{formData.originalValue}</p>
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
                             <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-xl flex items-center justify-center mx-auto text-erp-blue">
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
            <div className="absolute inset-0 bg-erp-navy/40 backdrop-blur-sm animate-in fade-in" onClick={onClose}></div>
            <div className="bg-white w-full max-w-xl h-full relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-erp-navy uppercase">LỊCH SỬ ĐIỀU CHỈNH</h3>
                        <p className="text-xs font-bold text-erp-blue tracking-tighter uppercase mt-1">ĐƠN HÀNG: {poNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                     {history.length > 0 ? (
                         <div className="relative space-y-12">
                             <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-slate-100 rounded-full" />
                             {history.map((am, idx: number) => (
                                 <div key={am.id} className="relative flex items-start gap-8 z-10">
                                     <div className="w-10 h-10 rounded-2xl bg-white border-4 border-slate-50 shadow-xl flex items-center justify-center text-erp-navy shrink-0 font-black text-xs">
                                         {am.amendmentNumber}
                                     </div>
                                     <div className="flex-1 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100/50">
                                         <div className="flex justify-between items-start mb-4">
                                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${getBadgeColor(am.changeType)}`}>
                                                  {am.changeType}
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-400">{new Date(am.createdAt).toLocaleString()}</span>
                                         </div>
                                         <div className="flex items-center gap-4 mb-4">
                                              <span className="text-xs font-bold text-slate-300 line-through">{am.originalValue}</span>
                                              <ArrowRight size={12} className="text-slate-300" />
                                              <span className="text-sm font-black text-emerald-600">{am.newValue}</span>
                                         </div>
                                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                                             "{am.reason}"
                                         </p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center h-full text-slate-300">
                             <History size={60} className="mb-6 opacity-20" />
                             <p className="font-black uppercase tracking-widest text-xs">Không có lịch sử điều chỉnh</p>
                         </div>
                     )}
                </div>

                <div className="p-10 border-t border-slate-100 bg-slate-50">
                    <button onClick={onClose} className="w-full bg-erp-navy text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-erp-navy/10">ĐÓNG PANEL</button>
                </div>
            </div>
        </div>
    );
}
