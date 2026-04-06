"use client";

import { useState, useMemo } from "react";
import { 
    AlertCircle, 
    CheckCircle2,
    RefreshCcw,
    ShieldCheck,
    LayoutDashboard,
    PlusCircle,
    Search,
    Filter,
    ArrowUpRight,
    Target
} from "lucide-react";
import { useProcurement, BudgetAllocation } from "../../context/ProcurementContext";
import { CostCenter } from "@/app/types/api-types";
import { formatVND, parseMoney } from "../../utils/formatUtils";

export default function FinanceBudgetsPage() {
    const { 
        departments, 
        costCenters,
        budgetAllocations,
        budgetPeriods,
        distributeAnnualBudget,
    } = useProcurement();
    
    const fiscalYears = [2024, 2025, 2026];

    const [activeTab, setActiveTab] = useState<'dashboard' | 'tools'>('dashboard');
    
    // TOOL STATE
    const [selectedCCId, setSelectedCCId] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [totalAnnualBudget, setTotalAnnualBudget] = useState(0);
    const [buckets, setBuckets] = useState({ q1: 0, q2: 0, q3: 0, q4: 0, reserve: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // DASHBOARD STATE
    const [dashYear, setDashYear] = useState(new Date().getFullYear());
    const [dashPeriodType, setDashPeriodType] = useState<'ALL' | 'ANNUAL' | 'QUARTERLY' | 'RESERVE'>('ALL');
    const [dashQuarter, setDashQuarter] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    // Tool Handlers
    const handleTotalBudgetChange = (val: number) => {
        setTotalAnnualBudget(val);
        const each = Math.floor(val / 5);
        setBuckets({ q1: each, q2: each, q3: each, q4: each, reserve: val - (each * 4) });
    };

    const handleCCChange = (ccId: string) => {
        setSelectedCCId(ccId);
        if (!ccId) { handleTotalBudgetChange(0); return; }
        const cc = costCenters.find((c: CostCenter) => c.id === ccId);
        if (cc) {
            handleTotalBudgetChange(Number(cc.budgetAnnual));
        }
    };

    const handleBucketEdit = (key: keyof typeof buckets, val: number) => {
        setBuckets(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = async () => {
        if (!isValid || !selectedCCId) return;
        setIsSaving(true);
        
        const success = await distributeAnnualBudget(selectedCCId, selectedYear);

        setIsSaving(false);
        if (success) {
            setSaveSuccess(true);
            // After 2 seconds, reset and go to dashboard
            setTimeout(() => {
                setSaveSuccess(false);
                setActiveTab('dashboard');
            }, 2000);
        }
    };

    // Dashboard Filtered & Aggregated Data
    const dashFiltered = useMemo(() => {
        let filtered = budgetAllocations.filter(a => {
            const period = budgetPeriods.find(p => p.id === a.budgetPeriodId);
            if (!period) return false;
            
            const matchYear = period.fiscalYear === dashYear;
            const matchType = dashPeriodType === 'ALL' || period.periodType === dashPeriodType;
            const matchQuarter = dashPeriodType !== 'QUARTERLY' || period.periodNumber === dashQuarter;
            
            return matchYear && matchType && matchQuarter;
        });

        if (searchTerm) {
            filtered = filtered.filter(a => {
                const cc = costCenters.find(c => c.id === a.costCenterId);
                return cc?.name.toLowerCase().includes(searchTerm.toLowerCase()) || cc?.code.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        return filtered;
    }, [budgetAllocations, budgetPeriods, dashYear, dashPeriodType, dashQuarter, searchTerm, costCenters]);

    const dashStats = useMemo(() => {
        const total = dashFiltered.reduce((sum, a) => sum + Number(a.allocatedAmount), 0);
        const spent = dashFiltered.reduce((sum, a) => sum + Number(a.spentAmount), 0);
        return { total, spent, remaining: total - spent, percent: total > 0 ? (spent / total) * 100 : 0 };
    }, [dashFiltered]);

    const dashGroupedByCC = useMemo(() => {
        const groups: Record<string, { 
            costCenterId: string, 
            allocatedAmount: number, 
            spentAmount: number,
            ccCode: string,
            ccName: string,
            deptName: string
        }> = {};

        dashFiltered.forEach(a => {
            const cc = costCenters.find(c => c.id === a.costCenterId);
            const dept = departments.find(d => d.id === cc?.deptId);
            const key = a.costCenterId;

            if (!groups[key]) {
                groups[key] = {
                    costCenterId: a.costCenterId,
                    allocatedAmount: 0,
                    spentAmount: 0,
                    ccCode: cc?.code || "N/A",
                    ccName: cc?.name || "Unknown",
                    deptName: dept?.name || "Chung"
                };
            }
            groups[key].allocatedAmount += Number(a.allocatedAmount);
            groups[key].spentAmount += Number(a.spentAmount);
        });

        return Object.values(groups);
    }, [dashFiltered, costCenters, departments]);

    const dashLabel = useMemo(() => {
        if (dashPeriodType === 'QUARTERLY') return `Q${dashQuarter}/${dashYear}`;
        if (dashPeriodType === 'ANNUAL') return `Năm ${dashYear}`;
        if (dashPeriodType === 'RESERVE') return `Quỹ dự phòng ${dashYear}`;
        return `Năm ${dashYear} (Tất cả)`;
    }, [dashYear, dashPeriodType, dashQuarter]);

    const currentSum = useMemo(() => buckets.q1 + buckets.q2 + buckets.q3 + buckets.q4 + buckets.reserve, [buckets]);
    const difference = totalAnnualBudget - currentSum;
    const isValid = totalAnnualBudget > 0 && difference === 0;

    const getBucketPercentage = (val: number) => totalAnnualBudget === 0 ? 0 : (val / totalAnnualBudget) * 100;

    return (
        <div className="budget-page-container p-8 bg-[#F5F7FA] min-h-screen animate-in fade-in duration-700 relative">
            {/* Success Toast */}
            {saveSuccess && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-top-10 duration-500">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-erp-navy/20 border border-slate-100 p-6 pr-10 flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <CheckCircle2 size={32} className="animate-bounce" />
                        </div>
                        <div>
                            <div className="text-lg font-black text-erp-navy uppercase tracking-tight">Phân bổ thành công!</div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Đang chuyển về Dashboard...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav Tabs */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
                <div className="flex bg-white p-1.5 rounded-[22px] shadow-sm border border-slate-200/60">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-xs font-black uppercase tracking-wider transition-all ${
                            activeTab === 'dashboard' ? 'bg-erp-navy text-white shadow-lg shadow-erp-navy/20' : 'text-slate-400 hover:text-erp-navy'
                        }`}
                    >
                        <LayoutDashboard size={14} /> Tổng quan
                    </button>
                    <button 
                        onClick={() => setActiveTab('tools')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-xs font-black uppercase tracking-wider transition-all ${
                            activeTab === 'tools' ? 'bg-erp-navy text-white shadow-lg shadow-erp-navy/20' : 'text-slate-400 hover:text-erp-navy'
                        }`}
                    >
                        <PlusCircle size={14} /> Phân bổ định biên
                    </button>
                </div>

                {activeTab === 'dashboard' && (
                    <div className="flex gap-4">
                        <select 
                            value={dashYear} 
                            onChange={e => setDashYear(Number(e.target.value))}
                            className="bg-white px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black outline-none"
                        >
                            {fiscalYears.map(y => <option key={y} value={y}>Năm {y}</option>)}
                        </select>
                        <select 
                            value={dashPeriodType} 
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={e => setDashPeriodType(e.target.value as any)}
                            className="bg-white px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black outline-none"
                        >
                            <option value="ALL">Tất cả chu kỳ</option>
                            <option value="ANNUAL">Chỉ Ngân sách Năm</option>
                            <option value="QUARTERLY">Chỉ Ngân sách Quý</option>
                            <option value="RESERVE">Quỹ dự phòng các phòng ban</option>
                        </select>
                        {dashPeriodType === 'QUARTERLY' && (
                            <select 
                                value={dashQuarter} 
                                onChange={e => setDashQuarter(Number(e.target.value))}
                                className="bg-white px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black outline-none"
                            >
                                {[1, 2, 3, 4].map(q => <option key={q} value={q}>Quý {q}</option>)}
                            </select>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm Cost Center..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold w-64 outline-none focus:ring-2 focus:ring-erp-blue/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            {activeTab === 'dashboard' ? (
                <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: `Ngân sách cấp (${dashLabel})`, val: dashStats.total, color: 'text-erp-navy', bg: 'bg-blue-50', icon: Target },
                            { label: `Đã giải ngân (${dashLabel})`, val: dashStats.spent, color: 'text-amber-600', bg: 'bg-amber-50', icon: ArrowUpRight },
                            { label: `Số dư khả dụng (${dashLabel})`, val: dashStats.remaining, color: 'text-green-600', bg: 'bg-green-50', icon: ShieldCheck },
                        ].map((s, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-4 ${s.bg} rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity`}>
                                    <s.icon size={20} className={s.color} />
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">{s.label}</div>
                                <div className={`text-2xl font-black ${s.color}`}>{formatVND(s.val, true)}</div>
                                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${idx === 1 ? 'bg-amber-500' : 'bg-erp-navy'} transition-all duration-1000`} style={{ width: idx === 0 ? '100%' : `${dashStats.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Monitoring Table */}
                    <div className="bg-white rounded-[40px] shadow-xl shadow-erp-navy/5 border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="text-sm font-black text-erp-navy uppercase tracking-widest flex items-center gap-3">
                                <Filter size={18} className="text-erp-blue" /> Giám sát sử dụng Ngân sách
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest ">Đơn vị / Cost Center</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest ">Định mức</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest  text-center">Tiến độ sử dụng</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest ">Còn lại</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest ">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dashGroupedByCC.length > 0 ? dashGroupedByCC.map((g) => {
                                        const p = (g.spentAmount / g.allocatedAmount) * 100;
                                        return (
                                            <tr key={g.costCenterId} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-erp-navy text-sm">{g.deptName}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">{g.ccCode} - {g.ccName}</div>
                                                </td>
                                                <td className="px-8 py-6 font-black text-slate-600">{formatVND(g.allocatedAmount, true)}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full ${p > 90 ? 'bg-red-500' : p > 70 ? 'bg-amber-500' : 'bg-erp-blue'} transition-all duration-1000`} style={{ width: `${Math.min(p, 100)}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-erp-navy">{p.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-black text-erp-navy">{formatVND(g.allocatedAmount - g.spentAmount, true)}</td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        p > 100 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                                                    }`}>
                                                        {p > 100 ? 'Vượt định mức' : 'An toàn'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <AlertCircle size={48} />
                                                    <p className="text-xs font-black uppercase tracking-widest">Chưa có dữ liệu phân bổ</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* ALLOCATION TOOL VIEW (STUCTURED CARD) */
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-erp-navy/5 border border-slate-50">
                            {/* Department / Year selectors inside the tool */}
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h2 className="text-2xl font-black text-erp-navy uppercase tracking-tighter">Cấu hình Định biên</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Quy tắc phân bổ 5 phân đoạn</p>
                                </div>
                                <div className="flex gap-4">
                                    <select 
                                        className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-black border border-slate-100 outline-none w-64"
                                        value={selectedCCId}
                                        onChange={e => handleCCChange(e.target.value)}
                                    >
                                        <option value="">Chọn Trung tâm chi phí (Cost Center)</option>
                                        {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>)}
                                    </select>
                                    <select 
                                        className="bg-slate-50 px-4 py-2 rounded-xl text-xs font-black border border-slate-100 outline-none"
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(Number(e.target.value))}
                                    >
                                        {fiscalYears.map(y => <option key={y} value={y}>FY {y}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Total Display */}
                            <div className="relative mb-12 group">
                                <label className="absolute -top-2.5 left-8 px-2 bg-white text-[10px] font-black text-erp-blue uppercase tracking-widest z-10">Tổng Ngân sách Năm (VND)</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-10 text-3xl text-slate-200">₫</span>
                                    <input 
                                        readOnly
                                        type="text"
                                        value={formatVND(totalAnnualBudget) || ''}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[35px] pl-20 pr-8 py-10 text-5xl font-black text-erp-navy outline-none cursor-not-allowed"
                                    />
                                    <div className="absolute right-10 flex flex-col items-end">
                                        <span className="text-[9px] font-black text-erp-blue bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">Auto-Synced</span>
                                        {selectedCCId && <span className="text-[8px] text-slate-400 mt-2">Dựa trên Cost Centers</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { key: 'q1', label: 'Quý 1', color: 'bg-blue-500' },
                                    { key: 'q2', label: 'Quý 2', color: 'bg-indigo-500' },
                                    { key: 'q3', label: 'Quý 3', color: 'bg-purple-500' },
                                    { key: 'q4', label: 'Quý 4', color: 'bg-pink-500' },
                                    { key: 'reserve', label: 'Dự phòng', color: 'bg-amber-500' },
                                ].map((item) => (
                                    <div key={item.key} className="p-6 rounded-4xl bg-slate-50/50 border border-slate-100 hover:border-erp-blue/30 transition-all group">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                            <div className="h-1.5 w-8 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.color}`} style={{ width: `${getBucketPercentage(buckets[item.key as keyof typeof buckets])}%` }}></div>
                                            </div>
                                        </div>
                                        <input 
                                            type="text"
                                            value={formatVND(buckets[item.key as keyof typeof buckets]) || ''}
                                            onChange={(e) => handleBucketEdit(item.key as keyof typeof buckets, parseMoney(e.target.value))}
                                            className="w-full bg-transparent text-2xl font-black text-erp-navy outline-none"
                                        />
                                        <div className="text-[10px] font-bold text-slate-400 mt-1">{getBucketPercentage(buckets[item.key as keyof typeof buckets]).toFixed(1)}% / Năm</div>
                                    </div>
                                ))}

                                <div className={`p-6 rounded-4xl border-2 flex flex-col justify-center items-center ${
                                    isValid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100 animate-pulse'
                                }`}>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Check Balance</div>
                                    <div className={`text-sm font-black ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                        {isValid ? "Hạch toán Khớp" : (difference > 0 ? `+${formatVND(difference, true)}` : formatVND(difference, true))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-erp-navy rounded-[40px] p-8 text-white shadow-2xl shadow-erp-navy/30">
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Lưu cấu hình</h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-10">
                                Hệ thống sẽ chốt số liệu cho năm tài chính {selectedYear}. Định mức của từng quý sẽ được dùng làm căn cứ phê duyệt PR.
                            </p>
                            
                            <button 
                                disabled={!isValid || !selectedCCId || isSaving}
                                onClick={handleSave}
                                className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                                    isValid && selectedCCId 
                                    ? 'bg-white text-erp-navy hover:scale-[1.02] shadow-xl' 
                                    : 'bg-white/10 text-white/30'
                                }`}
                            >
                                {isSaving ? <RefreshCcw className="animate-spin" /> : (saveSuccess ? "Xác nhận thành công" : "Lưu phân bổ ngay")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                input[type="number"]::-webkit-inner-spin-button { appearance: none; }
            `}</style>
        </div>
    );
}
