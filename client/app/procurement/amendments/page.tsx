"use client";

import React, { useState } from "react";
import {
    ShieldAlert, Plus, Search, Filter,
    ArrowRight, ChevronRight, X, History,
    Eye, Edit3, CheckCircle, Clock, AlertTriangle,
    ArrowLeft, Split, MessageSquare, Save, Ship, FileText, Edit
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";

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
            case "QUANTITY": return "bg-blue-600/10 text-blue-600 border-blue-600/20";
            case "PRICE": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
            case "DELIVERY_DATE": return "bg-purple-500/10 text-purple-700 border-purple-500/20";
            case "ITEM_ADD": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
            case "ITEM_REMOVE": return "bg-rose-500/10 text-rose-700 border-rose-500/20";
            default: return "bg-slate-100 text-slate-900 border-slate-200";
        }
    };

    return (
        <div className="space-y-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {view === "list" ? (
                    <div className="space-y-6">
                        <PageHeader
                            icon={Edit}
                            iconColor="amber"
                            title="Điều chỉnh đơn hàng (Amendment)"
                            subtitle="Quản lý lịch sử thay đổi và điều khoản phát sinh của PO"
                            actions={
                                <button
                                    onClick={() => setView("create")}
                                    className="btn-primary text-xs uppercase tracking-[0.2em]"
                                >
                                    <Plus size={18} className="transition-transform group-hover:rotate-90" /> Tạo Amendment
                                </button>
                            }
                        />

                        <div className="erp-card table-card">
                            <div className="overflow-x-auto">
                                <table className="erp-table text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-8 py-5">Mã PO</th>
                                            <th className="px-8 py-5">Amendment #</th>
                                            <th className="px-8 py-5">Loại thay đổi</th>
                                            <th className="px-8 py-5">Giá trị cũ/mới</th>
                                            <th className="px-8 py-5">Ngày tạo</th>
                                            <th className="px-8 py-5 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {amendments.map((am) => (
                                            <tr key={am.id} className="hover:bg-white/30 transition-all group">
                                                <td className="px-8 py-8 font-bold text-slate-900">Đơn hàng</td>
                                                <td className="px-8 py-8">
                                                    <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[0.6875rem] font-bold text-slate-900">
                                                        {am.amendmentNumber}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-[0.6875rem] font-bold uppercase tracking-widest border ${getBadgeColor(am.changeType)}`}>
                                                        {am.changeType}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-3 text-xs font-bold">
                                                        <span className="text-slate-900 line-through">{am.originalValue}</span>
                                                        <ArrowRight size={14} className="text-blue-600" />
                                                        <span className="text-black bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{am.newValue}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-[11px] font-bold text-slate-900">
                                                    {am.createdAt ? new Date(am.createdAt).toLocaleString('vi-VN') : '—'}
                                                </td>
                                                <td className="px-8 py-8 text-right">
                                                    <button 
                                                        onClick={() => setSelectedPOHistory(am.poNumber)}
                                                        className="p-3 text-slate-900 hover:text-blue-600 hover:bg-blue-600/10 rounded-xl transition-all border border-slate-200"
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
                                poNumber="***" 
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
                <button onClick={onCancel} className="btn-secondary flex items-center gap-2">
                    <ArrowLeft size={16} /> Quay lại danh sách
                </button>
                <button
                    onClick={() => onSave({ ...formData, id: `am-${Date.now()}`, amendmentNumber, createdAt: new Date().toISOString() })}
                    className="btn-primary"
                >
                    <Save size={18} /> Gửi Amendment
                </button>
            </div>

            <div className="erp-card table-card">
                <div className="p-10 border-b border-slate-200 bg-white flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-[#0F172A] uppercase leading-none mb-2">TẠO ĐIỀU CHỈNH ĐƠN HÀNG</h2>
                        <p className="text-xs text-[#64748B] font-medium uppercase tracking-widest">Amendment #{amendmentNumber}</p>
                    </div>
                    <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 shadow-inner flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white"><FileText size={20} /></div>
                        <div className="text-right">
                             <p className="text-[0.6875rem] font-bold text-slate-900 uppercase leading-none mb-1">Hiện đang chỉnh sửa:</p>
                             <p className="text-base font-bold text-blue-600">PO-2026-001</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-1.5">
                            <label className="erp-label">Loại thay đổi *</label>
                            <select
                                className="erp-input"
                                value={formData.changeType}
                                onChange={(e) => setFormData({ ...formData, changeType: e.target.value as AmendmentMock["changeType"] })}
                            >
                                <option value="QUANTITY">Số lượng (Quantity)</option>
                                <option value="PRICE">Đơn giá (Price)</option>
                                <option value="DELIVERY_DATE">Ngày giao hàng (Delivery Date)</option>
                                <option value="ITEM_ADD">Thêm hạng mục (Item Add)</option>
                                <option value="ITEM_REMOVE">Gỡ hạng mục (Item Remove)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="erp-label">Lý do điều chỉnh *</label>
                            <div className="relative">
                                <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    className="erp-input pr-10"
                                    placeholder="Lý do chi tiết..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Comparison Panel */}
                    <div className="bg-white p-10 rounded-xl border border-slate-200 space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Split className="text-blue-600" size={20} />
                            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">BẢNG SO SÁNH THAY ĐỔI</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-10 items-center">
                            <div className="bg-slate-100 p-8 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-[0.6875rem] font-bold text-slate-900 uppercase tracking-widest mb-4">GIÁ TRỊ CŨ (ORIGINAL)</p>
                                <p className="text-xl font-bold text-slate-900 line-through leading-none">{formData.originalValue}</p>
                            </div>
                            <div className="bg-emerald-500 p-8 rounded-xl text-white shadow-xl shadow-emerald-500/20 relative group overflow-hidden">
                                <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-br from-emerald-400/0 to-emerald-400/50 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <p className="text-[0.6875rem] font-bold uppercase tracking-widest mb-4 text-emerald-100">GIÁ TRỊ MỚI (NEW VERSION)</p>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/20 border border-white/20 rounded-lg px-4 py-3 text-base font-bold text-white outline-none focus:bg-white focus:text-emerald-700 transition-all placeholder:text-emerald-200/70"
                                        placeholder="Nhập giá trị mới..."
                                        value={formData.newValue}
                                        onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center -mt-14 relative z-20 md:block hidden">
                             <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 shadow-xl flex items-center justify-center mx-auto text-blue-600">
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
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}></div>
            <div className="bg-slate-100 w-full max-w-xl h-full relative z-10 shadow-xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-200">
                <div className="p-10 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 uppercase">LỊCH SỬ ĐIỀU CHỈNH</h3>
                        <p className="text-xs font-bold text-blue-600 uppercase mt-1">ĐƠN HÀNG: {poNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all border border-slate-200">
                        <X size={24} className="text-slate-900" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                     {history.length > 0 ? (
                         <div className="relative space-y-12">
                             <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-slate-200 rounded-full" />
                             {history.map((am, idx: number) => (
                                 <div key={am.id} className="relative flex items-start gap-8 z-10">
                                     <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shadow-xl flex items-center justify-center text-slate-900 shrink-0 font-bold text-xs">
                                         {am.amendmentNumber}
                                     </div>
                                     <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200">
                                         <div className="flex justify-between items-start mb-4">
                                              <span className={`px-3 py-1 rounded-lg text-[8px] font-bold uppercase border ${getBadgeColor(am.changeType)}`}>
                                                  {am.changeType}
                                              </span>
                                              <span className="text-[0.6875rem] font-bold text-slate-900">{am.createdAt ? new Date(am.createdAt).toLocaleString('vi-VN') : '—'}</span>
                                         </div>
                                         <div className="flex items-center gap-4 mb-4">
                                              <span className="text-xs font-bold text-slate-900 line-through">{am.originalValue}</span>
                                              <ArrowRight size={12} className="text-blue-600" />
                                              <span className="text-sm font-bold text-[#0F172A]">{am.newValue}</span>
                                         </div>
                                         <p className="text-[11px] text-slate-900 font-medium leading-relaxed italic">
                                             &quot;{am.reason}&quot;
                                         </p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center h-full text-slate-900">
                             <History size={60} className="mb-6 opacity-20" />
                             <p className="font-bold uppercase tracking-widest text-xs">Không có lịch sử điều chỉnh</p>
                         </div>
                     )}
                </div>

                <div className="p-10 border-t border-slate-200 bg-white">
                    <button onClick={onClose} className="btn-primary w-full justify-center">ĐÓNG PANEL</button>
                </div>
            </div>
        </div>
    );
}


