"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Truck, Package, MapPin, Calendar,
    Search, X, Edit3, CheckCircle, Clock,
    Box, Activity, Filter, ChevronRight, ShoppingCart, User, Eye
} from "lucide-react";
import { useProcurement } from "@/app/context/ProcurementContext";
import { formatVND, getStatusLabel } from "@/app/utils/formatUtils";

// --- Delivery Info Type (extends PO with delivery details) ---
interface DeliveryInfo {
    poId: string;
    poNumber: string;
    supplierName: string;
    status: "ORDERED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "PARTIAL";
    progress: number;
    trackingNumber?: string;
    carrier?: string;
    shippedAt?: string;
    estimatedArrival?: string;
    itemsDelivered: number;
    itemsTotal: number;
    totalValue: number;
}

export default function DeliveryTrackingPage() {
    const { pos, organizations } = useProcurement();
    const [selectedPO, setSelectedPO] = useState<DeliveryInfo | null>(null);
    const [editingDelivery, setEditingDelivery] = useState<DeliveryInfo | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Stable mock data refs
    const carriersRef = useRef(["DHL", "FedEx", "ViettelPost", "GHN"]);
    
    // Sử dụng useMemo để tạo giá trị ổn định thay vì useRef với function impure
    // eslint-disable-next-line react-hooks/purity
    const getTracking = () => `VN${Math.floor(Math.random() * 1000000000)}`;
    // eslint-disable-next-line react-hooks/purity
    const getCarrier = () => carriersRef.current[Math.floor(Math.random() * carriersRef.current.length)];

    // Convert POs to Delivery Info
    const deliveryList: DeliveryInfo[] = useMemo(() => {
        return pos.map(po => {
            const supplierOrg = organizations?.find(o => o.id === po.supplierId);
            const supplierName = supplierOrg?.name || po.vendor || "Nhà cung cấp";
            
            // Mock delivery status based on PO status
            let status: DeliveryInfo["status"] = "ORDERED";
            let progress = 0;
            
            if (po.status === "DRAFT") {
                status = "ORDERED";
                progress = 10;
            } else if (po.status === "SENT" || po.status === "CONFIRMED") {
                status = "SHIPPED";
                progress = 40;
            } else if (po.status === "PARTIALLY_RECEIVED") {
                status = "PARTIAL";
                progress = 70;
            } else if (po.status === "RECEIVED" || po.status === "COMPLETED") {
                status = "DELIVERED";
                progress = 100;
            } else {
                status = "IN_TRANSIT";
                progress = 60;
            }
            
            return {
                poId: po.id,
                poNumber: po.poNumber,
                supplierName,
                status,
                progress,
                trackingNumber: getTracking(),
                carrier: getCarrier(),
                shippedAt: po.createdAt,
                estimatedArrival: po.createdAt ? new Date(new Date(po.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
                itemsDelivered: status === "DELIVERED" ? po.items.length : Math.floor(po.items?.length * progress / 100),
                itemsTotal: po.items?.length,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                totalValue: po.total || po.items?.reduce((sum: number, item: any) => sum + (item.total || item.qty * (item.unitPrice || item.estimatedPrice || 0)), 0)
            };
        });
    }, [pos, organizations]);

    const stages = [
        { label: "Đã đặt hàng", key: "ORDERED", color: "#000000" },
        { label: "Đang vận chuyển", key: "SHIPPED", color: "#F59E0B" },
        { label: "Đến kho", key: "IN_TRANSIT", color: "#2563EB" },
        { label: "Hoàn thành", key: "DELIVERED", color: "#10B981" }
    ];

    const getProgressIndex = (status: string) => {
        const idx = stages.findIndex(s => s.key === status);
        return idx >= 0 ? idx : 0;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DELIVERED": return "text-black";
            case "PARTIAL": return "text-black";
            case "IN_TRANSIT": return "text-[#3B82F6]";
            case "SHIPPED": return "text-violet-400";
            default: return "text-slate-900";
        }
    };

    const handleUpdateTracking = (data: Partial<DeliveryInfo>) => {
        // In real app, this would call API to update delivery info
        setEditingDelivery(null);
    };

    const filteredDeliveries = deliveryList.filter(d =>
        d.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="animate-in fade-in duration-500 bg-[#FFFFFF] min-h-screen text-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 mt-4 px-6 md:px-8 pt-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Theo dõi Giao hàng</h1>
                    <p className="text-sm font-bold text-slate-900 mt-1">GIÁM SÁT TIẾN ĐỘ VẬN CHUYỂN THỜI GIAN THỰC</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm PO, nhà cung cấp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs text-slate-900 placeholder:text-slate-900 focus:outline-none focus:border-[#2563EB] w-72"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)] rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                        <Filter size={14} /> Bộ lọc
                    </button>
                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-black">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></div>
                        {filteredDeliveries.filter(d => d.status !== "DELIVERED").length} PO đang giao
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 px-6 md:px-8 pb-12">
                {/* Left List */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Danh sách PO - Theo dõi giao hàng</h3>
                            <span className="text-xs text-slate-900">{filteredDeliveries.length} đơn hàng</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="erp-table text-xs">
                                <thead>
                                    <tr className="border-b border-[rgba(148,163,184,0.1)]">
                                        <th className="px-6 py-4 text-left">Mã PO / Nhà cung cấp</th>
                                        <th className="px-6 py-4 text-left">Giá trị</th>
                                        <th className="px-6 py-4 text-left">Vận chuyển</th>
                                        <th className="px-6 py-4 text-left">Tiến độ giao</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                                    {filteredDeliveries.map((del) => (
                                        <tr key={del.poId}
                                            className={`hover:bg-[#FFFFFF]/50 transition-all group cursor-pointer ${selectedPO?.poId === del.poId ? 'bg-[#2563EB]/5' : ''}`}
                                            onClick={() => setSelectedPO(del)}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] flex items-center justify-center">
                                                        <ShoppingCart size={18} className="text-[#2563EB]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{del.poNumber}</p>
                                                        <p className="text-[10px] font-bold text-slate-900 uppercase flex items-center gap-1">
                                                            <User size={10} /> {del.supplierName}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-black text-black">{formatVND(del.totalValue)}</p>
                                                <p className="text-[10px] text-slate-900">{del.itemsTotal} mặt hàng</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs font-black text-slate-900">{del.carrier}</p>
                                                <p className="text-[10px] text-[#2563EB] font-bold">#{del.trackingNumber}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="w-32">
                                                    <div className="flex justify-between items-end mb-1">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase">{del.itemsDelivered}/{del.itemsTotal}</span>
                                                        <span className="text-[10px] font-black text-[#2563EB]">{del.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${del.progress === 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'}`} 
                                                            style={{ width: `${del.progress}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                    del.status === "DELIVERED" ? "bg-emerald-500/10 border-emerald-500/20 text-black" :
                                                    del.status === "PARTIAL" ? "bg-amber-500/10 border-amber-500/20 text-black" :
                                                    del.status === "IN_TRANSIT" ? "bg-[#2563EB]/10 border-[#2563EB]/20 text-[#3B82F6]" :
                                                    del.status === "SHIPPED" ? "bg-violet-500/10 border-violet-500/20 text-violet-400" :
                                                    "bg-[#0F172A] border-[rgba(148,163,184,0.1)] text-white"
                                                }`}>
                                                    {del.status === "DELIVERED" && <CheckCircle size={12} />}
                                                    {del.status === "ORDERED" && <Clock size={12} />}
                                                    {(del.status === "SHIPPED" || del.status === "IN_TRANSIT") && <Truck size={12} />}
                                                    {del.status === "PARTIAL" && <Package size={12} />}
                                                    {stages.find(s => s.key === del.status)?.label || del.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedPO(del); }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg text-[10px] font-black uppercase text-[#2563EB] hover:bg-[#2563EB]/20 transition-all"
                                                >
                                                    <Eye size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredDeliveries.length === 0 && (
                                <div className="py-16 text-center">
                                    <Box size={40} className="text-slate-900 mx-auto mb-4" />
                                    <p className="text-sm font-bold text-slate-900">Không tìm thấy PO nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Timeline */}
                <div className="xl:col-span-4">
                    {selectedPO ? (
                        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 sticky top-6">
                            <div className="mb-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#2563EB] mb-4">
                                    <Package size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase leading-tight mb-2">Chi tiết giao hàng</h3>
                                <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest border border-[#2563EB]/20 px-3 py-1 rounded-full">#{selectedPO.poNumber}</p>
                            </div>

                            {/* PO Summary */}
                            <div className="mb-6 bg-[#FFFFFF] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-slate-900 uppercase">Nhà cung cấp</span>
                                    <span className="text-xs font-bold text-slate-900">{selectedPO.supplierName}</span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-black text-slate-900 uppercase">Giá trị PO</span>
                                    <span className="text-sm font-black text-black">{formatVND(selectedPO.totalValue)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-900 uppercase">Số mặt hàng</span>
                                    <span className="text-xs font-bold text-text-primary">{selectedPO.itemsDelivered}/{selectedPO.itemsTotal} đã giao</span>
                                </div>
                            </div>

                            <div className="relative space-y-6 mb-6">
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#FFFFFF] rounded-full" />
                                <TimelineStep label="Tạo PO" time={selectedPO.shippedAt || "--"} active={true} done={true} icon={<CheckCircle size={14} />} />
                                <TimelineStep label="Xác nhận giao" time="Đã xác nhận" active={selectedPO.status !== "ORDERED"} done={selectedPO.status !== "ORDERED"} icon={<CheckCircle size={14} />} />
                                <TimelineStep label="Vận chuyển" time={selectedPO.carrier || "--"} active={selectedPO.status === "SHIPPED" || selectedPO.status === "IN_TRANSIT" || selectedPO.status === "PARTIAL"} done={selectedPO.status === "DELIVERED" || selectedPO.status === "PARTIAL"} icon={<Truck size={14} />} details={selectedPO.trackingNumber} />
                                <TimelineStep label="Giao hàng" time={selectedPO.status === "DELIVERED" ? "Hoàn thành" : "Chờ giao"} active={selectedPO.status === "DELIVERED"} done={selectedPO.status === "DELIVERED"} icon={<MapPin size={14} />} />
                            </div>

                            <div className="mt-6 pt-6 border-t border-[rgba(148,163,184,0.1)]">
                                <div className="flex justify-between items-center bg-[#FFFFFF] p-4 rounded-xl border border-[rgba(148,163,184,0.1)] mb-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Dự kiến giao</p>
                                        <p className="font-black text-slate-900">{selectedPO.estimatedArrival || "--"}</p>
                                    </div>
                                    <div className="p-2 bg-emerald-500/10 rounded-xl text-black"><Clock size={18} /></div>
                                </div>
                                <button 
                                    onClick={() => setEditingDelivery(selectedPO)}
                                    className="w-full bg-[#2563EB] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#1D4ED8] transition-all"
                                >
                                    Cập nhật tracking
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
                            <Box size={40} className="text-slate-900 mx-auto mb-4" />
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Chọn PO để xem chi tiết giao hàng</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Tracking Modal */}
            {editingDelivery && (
                <UpdateTrackingModal delivery={editingDelivery} onClose={() => setEditingDelivery(null)} onSave={handleUpdateTracking} />
            )}
        </main>
    );
}

function TimelineStep({ label, time, active, done, icon, details }: { label: string, time: string, active: boolean, done: boolean, icon: React.ReactNode, details?: string }) {
    return (
        <div className="relative flex items-start gap-4 z-10">
            <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : active ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-[#FFFFFF] border-[rgba(148,163,184,0.2)] text-white'}`}>
                {icon}
            </div>
            <div className="flex flex-col pt-1">
                <h4 className={`text-xs font-black uppercase tracking-tight ${done || active ? 'text-slate-900' : 'text-slate-900'}`}>{label}</h4>
                <span className="text-[10px] font-bold text-slate-900">{time}</span>
                {details && <span className="text-[9px] font-black text-[#2563EB] uppercase mt-1">{details}</span>}
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

function UpdateTrackingModal({ delivery, onClose, onSave }: { delivery: DeliveryInfo, onClose: () => void, onSave: (data: TrackingFormData) => void }) {
    const [formData, setFormData] = useState({
        trackingNumber: delivery.trackingNumber || "",
        carrier: delivery.carrier || "ViettelPost",
        shippedAt: delivery.shippedAt || "",
        estimatedArrival: delivery.estimatedArrival || "",
        note: ""
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#FFFFFF]/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-xl w-full max-w-lg relative z-10 shadow-sm overflow-hidden border border-[#E2E8F0]">
                <div className="p-8 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase">Cập nhật Tracking</h3>
                        <p className="text-xs text-slate-900 font-bold uppercase mt-1">PO: {delivery.poNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#FFFFFF] rounded-full transition-all">
                        <X size={20} className="text-slate-900" />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Đơn vị vận chuyển</label>
                        <select
                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[#2563EB]"
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Mã vận đơn</label>
                        <input
                            type="text"
                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[#2563EB]"
                            value={formData.trackingNumber}
                            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Ngày gửi</label>
                            <input
                                type="date"
                                className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[#2563EB]"
                                value={formData.shippedAt}
                                onChange={(e) => setFormData({ ...formData, shippedAt: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Dự kiến về</label>
                            <input
                                type="date"
                                className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[#2563EB]"
                                value={formData.estimatedArrival}
                                onChange={(e) => setFormData({ ...formData, estimatedArrival: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Ghi chú</label>
                        <textarea
                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[#2563EB] min-h-[80px]"
                            placeholder="Tình trạng vận chuyển..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-[rgba(148,163,184,0.1)] flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-slate-900 transition-all">Hủy</button>
                    <button onClick={() => onSave(formData)} className="bg-[#2563EB] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1D4ED8] transition-all">Lưu</button>
                </div>
            </div>
        </div>
    );
}

