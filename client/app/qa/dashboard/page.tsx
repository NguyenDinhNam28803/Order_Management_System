"use client";

import React from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { ShieldAlert, CheckCircle, AlertTriangle, Search, FileText, Zap, BarChart3, Activity } from "lucide-react";
import Link from "next/link";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";

export default function QADashboard() {
    const { pos, grns } = useProcurement();

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-500 bg-slate-50/50 min-h-screen">
            <DashboardHeader breadcrumbs={["Kiểm soát CL", "Bảng điều khiển QA"]} />

            <div className="mt-8 mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-erp-navy tracking-tight uppercase italic">QA Control Center</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Activity size={14} className="text-blue-500" /> Quality & Compliance Monitoring
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Export Quality Report</button>
                    <button className="px-8 py-4 bg-erp-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-erp-blue transition-all shadow-xl shadow-erp-navy/20">New Batch Inspection</button>
                </div>
            </div>

            {/* QA Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="erp-card bg-white shadow-xl shadow-slate-200/40 border-none p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Pending Inspection</div>
                    <div className="text-6xl font-black text-erp-navy tracking-tighter mb-2">14</div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tight italic">Avg. Time: 4.2 Hours</div>
                </div>
                <div className="erp-card bg-white shadow-xl shadow-slate-200/40 border-none p-10 relative overflow-hidden group border-l-8 border-emerald-500">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Pass Rate (MTD)</div>
                    <div className="text-6xl font-black text-emerald-500 tracking-tighter mb-2">99.1%</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                         <Zap size={10}/> +1.2% Target Exceeded
                    </div>
                </div>
                <div className="erp-card bg-white shadow-xl shadow-slate-200/40 border-none p-10 relative overflow-hidden group">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Critical Defects</div>
                    <div className="text-6xl font-black text-rose-500 tracking-tighter mb-2">02</div>
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-tight italic italic">Origin: Supplier Batch #92</div>
                </div>
                <div className="erp-card bg-erp-navy p-10 border-none shadow-2xl shadow-erp-navy/20 text-white flex flex-col justify-between group">
                    <BarChart3 size={32} className="text-blue-400 mb-8 group-hover:scale-110 transition-transform" />
                    <div>
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Vendor Quality Tier</div>
                        <div className="text-2xl font-black uppercase italic tracking-tighter">Strategic High</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
                <div className="xl:col-span-7 bg-white rounded-[48px] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-erp-navy flex items-center gap-3">
                            <Search size={18} className="text-blue-500" /> Active Inspection Queue
                        </h3>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-white/50">
                                <th className="px-10 py-6">Batch ID</th>
                                <th>Received From</th>
                                <th>Compliance Level</th>
                                <th className="text-center">QC Status</th>
                                <th className="text-right px-10">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-10 py-8 font-black text-erp-navy tracking-tight italic uppercase">GRN-2026-X{i}</td>
                                    <td className="py-8 font-bold text-slate-600 uppercase text-[11px]">Supplier Corp Alpha</td>
                                    <td className="py-8 font-mono text-slate-400 text-[10px]">ISO-9001 Required</td>
                                    <td className="py-8 text-center"><span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-black text-[9px] uppercase border border-amber-100">In Testing</span></td>
                                    <td className="px-10 py-8 text-right"><button className="px-5 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">Perform QC</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="xl:col-span-3 space-y-10">
                    <div className="bg-erp-navy rounded-[40px] p-10 text-white shadow-2xl shadow-erp-navy/30 relative overflow-hidden group">
                        <ShieldAlert className="absolute -right-8 -top-8 w-40 h-40 opacity-5 group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-8 leading-none">Security Alerts</h3>
                        <div className="space-y-6">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="text-[9px] font-black uppercase text-rose-400 mb-1">Critical Discrepancy</div>
                                <p className="text-[11px] font-bold leading-relaxed opacity-70">Batch #9283 rejected due to packaging seal violation.</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl opacity-50">
                                <div className="text-[9px] font-black uppercase text-blue-400 mb-1">System Update</div>
                                <p className="text-[11px] font-bold leading-relaxed">New QC protocols for Electronics active.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-erp-navy mb-8">Recent QC Decisions</h3>
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-slate-800 tracking-tight">Approved Batch X42</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">Decision by Agent-AI</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
