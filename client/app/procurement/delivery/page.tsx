"use client";

import React, { useState } from "react";
import { 
    Truck, Package, MapPin, Calendar, 
    Search, Info, MoreHorizontal, ChevronRight, 
    X, Edit3, CheckCircle, Clock, ArrowLeft,
    TrendingUp, ShieldCheck, Box, Activity
} from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";

// --- Mock Data ---
interface DeliveryMock {
    id: string;
    poNumber: string;
    vendorName: string;
    trackingNumber: string;
    carrier: string;
    shippedAt: string;
    estimatedArrival: string;
    progress: number; // 0-100
    status: "ORDERED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED";
}

const mockDeliveries: DeliveryMock[] = [
    {
        id: "del-1",
        poNumber: "PO-2026-001",
        vendorName: "Hanoi Hardware",
        trackingNumber: "VN123456789",
        carrier: "DHL",
        shippedAt: "2026-04-01",
        estimatedArrival: "2026-04-07",
        progress: 75,
        status: "IN_TRANSIT"
    }
];

export default function DeliveryTrackingPage() {
    const [deliveries, setDeliveries] = useState<DeliveryMock[]>(mockDeliveries);
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMock | null>(mockDeliveries[0]);
    const [editingDelivery, setEditingDelivery] = useState<DeliveryMock | null>(null);

    const stages = [
        { label: "Đã đặt hàng", key: "ORDERED" },
        { label: "Đang vận chuyển", key: "SHIPPED" },
        { label: "Đến kho", key: "IN_TRANSIT" },
        { label: "Hoàn thành", key: "DELIVERED" }
    ];

    const getProgressIndex = (status: string) => {
        return stages.findIndex(s => s.key === status);
    };

    const handleUpdateTracking = (data: Partial<DeliveryMock>) => {
        // Mock update logic
        setDeliveries(prev => prev.map(d => d.id === editingDelivery?.id ? { ...d, ...data } : d));
        setEditingDelivery(null);
    };

    return (
        <div className="min-h-screen bg-slate-50/30">
            <DashboardHeader breadcrumbs={["Quản lý Đơn hàng", "Theo dõi giao hàng"]} />

            <div className="p-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase mb-2">THEO DÕI GIAO HÀNG</h1>
                        <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" /> 
                            Giám sát tiến độ vận chuyển và tình trạng hàng hóa thời gian thực
                        </p>
                    </div>
                    <div className="flex gap-4">
                         <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm shadow-erp-navy/5">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
                             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">ĐANG CẬP NHẬT: 2 KIỆN HÀNG</span>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Left List */}
                    <div className="xl:col-span-8 space-y-6 animate-in slide-in-from-left-8 duration-500">
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-sm font-black text-erp-navy uppercase">Danh sách vận chuyển</h3>
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><Search size={14} /></div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="px-8 py-5">Mã PO</th>
                                            <th className="px-8 py-5">Đơn vị vận chuyển</th>
                                            <th className="px-8 py-5">Lộ trình</th>
                                            <th className="px-8 py-5">Tiến độ</th>
                                            <th className="px-8 py-5 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {deliveries.map((del) => (
                                            <tr key={del.id} 
                                                className={`hover:bg-slate-50 transition-all group cursor-pointer ${selectedDelivery?.id === del.id ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => setSelectedDelivery(del)}
                                            >
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                                                            <Truck size={20} className="text-erp-navy" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-erp-navy">{del.poNumber}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{del.vendorName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex flex-col">
                                                        <p className="text-xs font-black text-slate-700">{del.carrier}</p>
                                                        <p className="text-[10px]  text-erp-blue font-bold tracking-tight">#{del.trackingNumber}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                                                            <Calendar size={12} /> {del.shippedAt}
                                                            <ChevronRight size={10} />
                                                            <span className="text-emerald-500">{del.estimatedArrival}</span>
                                                        </div>
                                                        <p className="text-[9px] font-bold text-slate-300">DỰ KIẾN: TRƯỚC 18H00</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="w-48">
                                                        <div className="flex justify-between items-end mb-2">
                                                            <span className="text-[10px] font-black text-erp-navy uppercase">{stages[getProgressIndex(del.status)].label}</span>
                                                            <span className="text-[10px] font-black text-erp-blue">{del.progress}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center relative">
                                                            <div 
                                                                className="h-full bg-erp-blue rounded-full transition-all duration-1000 absolute left-0"
                                                                style={{ width: `${del.progress}%` }}
                                                            />
                                                            {/* Marks */}
                                                            {[0, 33, 66, 100].map(mark => (
                                                                <div key={mark} className={`absolute w-1 h-3 rounded-full z-10 transition-colors ${del.progress >= mark ? 'bg-white' : 'bg-slate-200'}`} style={{ left: `${mark}%`, transform: 'translateX(-50%)' }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8 text-right">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingDelivery(del); }}
                                                        className="p-3 text-slate-300 hover:text-erp-blue hover:bg-blue-50 rounded-xl transition-all"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Timeline */}
                    <div className="xl:col-span-4 animate-in slide-in-from-right-8 duration-500">
                        {selectedDelivery ? (
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 p-10 top-24">
                                <div className="mb-10 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center text-erp-navy mb-4 shadow-inner border border-slate-100">
                                        <Truck size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-erp-navy uppercase leading-tight mb-2">HÀNH TRÌNH ĐƠN HÀNG</h3>
                                    <p className="text-[10px] font-black text-erp-blue uppercase tracking-widest border border-erp-blue/20 px-4 py-1.5 rounded-full inline-block">#{selectedDelivery.poNumber}</p>
                                </div>

                                <div className="relative space-y-12">
                                    {/* Vertical line connector */}
                                    <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-slate-100 rounded-full" />
                                    
                                    <TimelineStep 
                                        label="PO ISSUED" 
                                        time="01/04/2026 - 08:30" 
                                        active={true} 
                                        done={true} 
                                        icon={<CheckCircle size={16} />} 
                                    />
                                    <TimelineStep 
                                        label="SUPPLIER ACKNOWLEDGED" 
                                        time="01/04/2026 - 13:45" 
                                        active={true} 
                                        done={true} 
                                        icon={<CheckCircle size={16} />} 
                                    />
                                    <TimelineStep 
                                        label="SHIPPED" 
                                        time={`02/04/2026 - ${selectedDelivery.carrier}`} 
                                        active={true} 
                                        done={true} 
                                        icon={<Truck size={16} />} 
                                        details={`Mã: ${selectedDelivery.trackingNumber}`}
                                    />
                                    <TimelineStep 
                                        label="IN TRANSIT" 
                                        time="Phân phối trung tâm ViettelPost" 
                                        active={selectedDelivery.status === "IN_TRANSIT"} 
                                        done={selectedDelivery.status === "DELIVERED"} 
                                        icon={<Activity size={16} />} 
                                    />
                                    <TimelineStep 
                                        label="DELIVERED" 
                                        time="Chưa nhận hàng" 
                                        active={selectedDelivery.status === "DELIVERED"} 
                                        done={false} 
                                        icon={<MapPin size={16} />} 
                                    />
                                </div>

                                <div className="mt-12 pt-10 border-t border-slate-50 flex flex-col gap-4">
                                     <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                         <div>
                                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dự kiến giao</p>
                                             <p className="font-black text-erp-navy">{selectedDelivery.estimatedArrival}</p>
                                         </div>
                                         <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500"><Clock size={20} /></div>
                                     </div>
                                     <button className="w-full bg-erp-navy text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-erp-navy/10 hover:bg-erp-blue transition-all">LIÊN HỆ BÊN VẬN CHUYỂN</button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-[40px] border border-dashed border-slate-200 p-20 text-center flex flex-col items-center">
                                <Box size={40} className="text-slate-300 mb-4" />
                                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Chọn đơn hàng để xem lộ trình</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Update Tracking Modal */}
            {editingDelivery && (
                <UpdateTrackingModal 
                    delivery={editingDelivery} 
                    onClose={() => setEditingDelivery(null)} 
                    onSave={handleUpdateTracking} 
                />
            )}
        </div>
    );
}

function TimelineStep({ label, time, active, done, icon, details }: { label: string, time: string, active: boolean, done: boolean, icon: React.ReactNode, details?: string }) {
    return (
        <div className="relative flex items-start gap-8 z-10 group">
            <div className={`w-10 h-10 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center transition-all duration-500 shrink-0 ${
                done ? 'bg-emerald-500 text-white' : (active ? 'bg-erp-blue text-white animate-pulse' : 'bg-slate-100 text-slate-300')
            }`}>
                {icon}
            </div>
            <div className="flex flex-col gap-1 pt-1">
                <h4 className={`text-xs font-black uppercase tracking-tight transition-colors ${active || done ? 'text-erp-navy' : 'text-slate-300'}`}>{label}</h4>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">{time}</span>
                    {details && <span className="text-[9px] font-black text-erp-blue uppercase tracking-widest mt-1 bg-erp-blue/5 px-2 py-0.5 rounded-md inline-block">{details}</span>}
                </div>
            </div>
        </div>
    );
}

interface TrackingFormData {
    trackingNumber: string;
    carrier: string;
    shippedAt: string;
    estimatedArrival: string;
    note: string;
}

function UpdateTrackingModal({ delivery, onClose, onSave }: { delivery: DeliveryMock, onClose: () => void, onSave: (data: TrackingFormData) => void }) {
    const [formData, setFormData] = useState({
        trackingNumber: delivery.trackingNumber,
        carrier: delivery.carrier,
        shippedAt: delivery.shippedAt,
        estimatedArrival: delivery.estimatedArrival,
        note: ""
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-erp-navy/40 backdrop-blur-sm animate-in fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[40px] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-erp-navy uppercase">CẬP NHẬT TRACKING</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">PO: {delivery.poNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-10 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Đơn vị vận chuyển</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all"
                            value={formData.carrier}
                            onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                        >
                            <option value="ViettelPost">ViettelPost</option>
                            <option value="GHN">GHN</option>
                            <option value="DHL">DHL</option>
                            <option value="FedEx">FedEx</option>
                            <option value="Nội bộ">Nội bộ công ty</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mã vận đơn (Tracking Number)</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all"
                            value={formData.trackingNumber}
                            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ngày gửi</label>
                            <div className="relative group/date">
                                <input 
                                    type="text" 
                                    readOnly
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-erp-navy outline-none group-focus-within/date:ring-2 group-focus-within/date:ring-erp-blue transition-all"
                                    value={formData.shippedAt ? (() => {
                                        const [y, m, d] = formData.shippedAt.split('-');
                                        return `${d}-${m}-${y}`;
                                    })() : ""}
                                />
                                <input 
                                    type="date" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    value={formData.shippedAt}
                                    onChange={(e) => setFormData({ ...formData, shippedAt: e.target.value })}
                                    onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dự kiến về</label>
                            <div className="relative group/date">
                                <input 
                                    type="text" 
                                    readOnly
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-erp-navy outline-none group-focus-within/date:ring-2 group-focus-within/date:ring-erp-blue transition-all"
                                    value={formData.estimatedArrival ? (() => {
                                        const [y, m, d] = formData.estimatedArrival.split('-');
                                        return `${d}-${m}-${y}`;
                                    })() : ""}
                                />
                                <input 
                                    type="date" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    value={formData.estimatedArrival}
                                    onChange={(e) => setFormData({ ...formData, estimatedArrival: e.target.value })}
                                    onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ghi chú vận chuyển</label>
                        <textarea 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all min-h-[100px]"
                            placeholder="Tình trạng kẹt biên, kẹt cảng..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-erp-navy transition-all">Hủy bỏ</button>
                    <button 
                        onClick={() => onSave(formData)}
                        className="bg-erp-navy text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-erp-navy/10 hover:bg-erp-blue transition-all"
                    >
                        Lưu thông tin
                    </button>
                </div>
            </div>
        </div>
    );
}
