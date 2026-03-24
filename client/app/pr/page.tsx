"use client";

import { useProcurement } from "../context/ProcurementContext";
import ERPTable from "../components/shared/ERPTable";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function PRPage() {
    const { prs, approvePR } = useProcurement();

    const columns = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Mã PR", key: "id", render: (row: any) => <span className="font-bold text-erp-navy">{row.id}</span> },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Phòng ban", key: "department", render: (row: any) => row.department?.name || row.department },
        { label: "Lý do", key: "reason" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Trạng thái", key: "status", render: (row: any) => <span className={`status-pill status-${(row.status || 'draft').toLowerCase()}`}>{row.status}</span> },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Tổng tiền", key: "total", render: (row: any) => <span className="font-black text-erp-navy">{Number(row.total || 0).toLocaleString()} VND</span> },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Hành động", key: "actions", render: (row: any) => row.status === 'PENDING' && (
            <button onClick={() => approvePR(row.id)} className="btn-secondary text-[10px] py-1 px-3">Phê duyệt</button>
        )}
    ];

    return (
        <div className="p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-erp-navy uppercase tracking-widest">Yêu cầu mua hàng (PR)</h1>
                    <p className="text-xs text-erp-gray font-medium mt-1">Quản lý và theo dõi các yêu cầu mua sắm của phòng ban.</p>
                </div>
                <Link href="/pr/create" className="btn-primary">
                    <Plus size={16} />
                    Tạo PR mới
                </Link>
            </header>
            <ERPTable columns={columns} data={prs} />
        </div>
    );
}
