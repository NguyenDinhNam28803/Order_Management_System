"use client";

import React from "react";
import DashboardHeader from "../components/DashboardHeader";
import { UserPlus, Mail, Edit2, Trash2 } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";

export default function UsersPage() {
    const { users } = useProcurement();

    return (
        <main className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Quản trị Người dùng</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">TOÀN QUYỀN TRUY CẬP VÀ PHÂN QUYỀN HỆ THỐNG ERP</p>
                </div>
                <button className="flex items-center gap-2 bg-erp-navy text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-erp-navy/20 hover:scale-[1.02] transition-transform active:scale-95">
                    <UserPlus size={18} /> Thêm người dùng
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-8 bg-slate-50/20 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-4">Quản lý Tài khoản (Directory)</div>
                        <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full">{users?.length || 0} Nhân sự</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th>Họ tên & Email Doanh nghiệp</th>
                                <th>Vai trò Hệ thống</th>
                                <th className="text-center">Trạng thái</th>
                                <th className="text-center">Thao tác Quản trị</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((user: any, i: number) => (
                                <tr key={user.id || i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-erp-navy flex items-center justify-center font-black text-white shadow-lg shadow-erp-navy/10 text-xs">
                                                {user.icon || (user.name ? user.name.substring(0,2).toUpperCase() : "??")}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-erp-navy leading-tight">{user.name || user.fullName}</div>
                                                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1 tracking-tight">
                                                    <Mail size={12} className="text-slate-300" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill status-${(user.role || 'guest').toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">ONLINE</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-3">
                                            <button className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-erp-blue hover:border-erp-blue/30 rounded-xl transition-all shadow-sm">
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
