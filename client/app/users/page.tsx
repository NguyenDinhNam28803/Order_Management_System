"use client";

import React from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Users, UserPlus, Shield, Mail, Edit2, Trash2 } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";

export default function UsersPage() {
    const { users } = useProcurement();


    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Hệ thống", "Quản lý người dùng"]} />

            <div className="mt-8 flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-black text-erp-navy tracking-tight">Người dùng & Phân quyền</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản nhân viên và vai trò trong hệ thống ERP.</p>
                </div>
                <button className="flex items-center gap-2 bg-erp-navy text-white px-6 py-2.5 rounded-xl font-bold">
                    <UserPlus size={18} /> Thêm người dùng
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>Họ tên & Email</th>
                            <th>Vai trò (Role)</th>
                            <th>Trạng thái</th>
                            <th className="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((user, i) => (
                            <tr key={i}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-erp-navy">{user.icon}</div>
                                        <div>
                                            <div className="text-sm font-bold text-erp-navy">{user.name}</div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1"><Mail size={10} /> {user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge ${user.role.toLowerCase().includes('finance') ? 'role-finance' : 'role-warehouse'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        <div className={`h-2 w-2 rounded-full ${user.status === 'ONLINE' ? 'bg-emerald-500' : user.status === 'AWAY' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                                        {user.status}
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <button className="p-2 hover:bg-slate-100 rounded text-slate-400"><Edit2 size={16} /></button>
                                        <button className="p-2 hover:bg-red-50 rounded text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
