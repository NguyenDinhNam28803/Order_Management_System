"use client";

import React from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { Activity, Terminal, Shield, Zap, History, Server, Cpu, Globe } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";

export default function SystemLogs() {
    const logs = [
        { id: 1, type: 'API', status: '200 OK', msg: 'POST /api/v1/procurement/submit', time: '10:42:01', detail: 'User ID: u-9283-x' },
        { id: 2, type: 'AI', status: 'RESOLVED', msg: 'Gemini function call: query_suppliers', time: '10:41:55', detail: 'Token Usage: 452' },
        { id: 3, type: 'SYS', status: 'CRON', msg: 'Budget Reconcile Job Complete', time: '10:40:00', detail: 'Processed 15 departments' },
        { id: 4, type: 'WARN', status: 'LATENCY', msg: 'Slow query detected on pr_items', time: '10:38:22', detail: 'Duration: 1.2s' },
        { id: 5, type: 'SEC', status: 'LOGIN', msg: 'New admin login from 192.168.1.42', time: '10:35:10', detail: 'Session validated' },
    ];

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-500 bg-slate-950 min-h-screen text-white">
            <DashboardHeader breadcrumbs={["Hệ thống", "Nhật ký Hệ thống"]} />

            <div className="mt-8 mb-16 flex justify-between items-end border-b border-white/5 pb-10">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-blue-600 rounded-[24px] flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                        <Terminal size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">System Kernel Monitor</h1>
                        <div className="flex gap-4 mt-2">
                             <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                 <Server size={10}/> All Nodes Healthy
                             </span>
                             <span className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                 <Cpu size={10}/> AI Core: 42.1ms Latency
                             </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
                 {[
                     { icon: Activity, label: 'Throughput', value: '4.2k rps', color: 'text-blue-400' },
                     { icon: Globe, label: 'Global Traffic', value: 'VN / SG / US', color: 'text-purple-400' },
                     { icon: Shield, label: 'Security Blocks', value: '12', color: 'text-emerald-400' },
                     { icon: Zap, label: 'AI Power', value: '99.9%', color: 'text-amber-400' }
                 ].map((m, i) => (
                    <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[32px] hover:bg-white/10 transition-all group">
                        <m.icon size={24} className={`${m.color} mb-4 group-hover:scale-110 transition-transform`} />
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{m.label}</div>
                        <div className="text-3xl font-black tracking-tighter">{m.value}</div>
                    </div>
                 ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[48px] overflow-hidden">
                <div className="p-10 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <History size={16} className="text-blue-500" /> Real-time Kernel Stream
                    </h3>
                    <div className="flex gap-4">
                         <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase border border-emerald-500/30 animate-pulse">Live Tracking</div>
                    </div>
                </div>
                <div className="p-4">
                    <table className="w-full text-left font-mono text-xs">
                        <thead>
                            <tr className="text-slate-500 uppercase tracking-widest text-[10px] font-black">
                                <th className="px-6 py-4">Timestamp</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Message</th>
                                <th className="text-right px-6">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-all group">
                                    <td className="px-6 py-6 text-slate-500 group-hover:text-blue-400 transition-colors">{log.time}</td>
                                    <td><span className={`font-black ${log.type === 'AI' ? 'text-purple-400' : 'text-blue-400'}`}>{log.type}</span></td>
                                    <td><span className={`px-2 py-1 rounded text-[9px] font-black ${log.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>{log.status}</span></td>
                                    <td className="text-slate-300 font-bold">{log.msg}</td>
                                    <td className="text-right px-6 text-slate-500 text-[10px] italic">{log.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-10 bg-white/5 text-center">
                    <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors underline">Download full historical dump (.gz)</button>
                </div>
            </div>
        </main>
    );
}
