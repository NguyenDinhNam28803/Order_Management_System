"use client";

import React, { useState } from "react";
import { 
    DollarSign, 
    Calendar, 
    Plus, 
    BarChart2, 
    TrendingUp, 
    AlertCircle, 
    Building2,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronDown,
    MoreVertical,
    Edit2,
    Trash2
} from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";

export default function FinanceBudgetsPage() {
    const { 
        budgetPeriods, 
        budgetAllocations, 
        departments, 
        costCenters, 
        addBudgetPeriod, 
        addBudgetAllocation,
        removeBudgetAllocation,
        currentUser 
    } = useProcurement();

    const [activeTab, setActiveTab] = useState<'allocations' | 'periods'>('allocations');
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);

    // Stats calculations
    const totalAllocated = budgetAllocations.reduce((sum: number, a: any) => sum + Number(a.allocatedAmount), 0);
    const totalSpent = budgetAllocations.reduce((sum: number, a: any) => sum + Number(a.spentAmount), 0);
    const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    const [newPeriod, setNewPeriod] = useState({
        fiscalYear: new Date().getFullYear(),
        periodType: 'ANNUAL',
        startDate: `${new Date().getFullYear()}-01-01`,
        endDate: `${new Date().getFullYear()}-12-31`,
        isActive: true
    });

    const [newAlloc, setNewAlloc] = useState({
        budgetPeriodId: '',
        costCenterId: '',
        deptId: '',
        allocatedAmount: 0,
        notes: ''
    });

    const handleCreatePeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await addBudgetPeriod(newPeriod);
        if (success) setIsPeriodModalOpen(false);
    };

    const handleCreateAlloc = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await addBudgetAllocation(newAlloc);
        if (success) setIsAllocModalOpen(false);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    return (
        <div className="finance-container">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1>Quản lý Ngân sách</h1>
                    <p className="subtitle">Thiết lập chu kỳ và phân bổ ngân sách cho các phòng ban</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setIsPeriodModalOpen(true)}>
                        <Calendar size={18} />
                        <span>Chu kỳ mới</span>
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAllocModalOpen(true)}>
                        <Plus size={18} />
                        <span>Phân bổ ngân sách</span>
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Tổng Ngân sách Phân bổ</span>
                        <h2 className="stat-value">{formatCurrency(totalAllocated)}</h2>
                        <span className="stat-trend trend-up">
                            <ArrowUpRight size={14} /> +12% so với năm ngoái
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-purple">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Ngân sách Đã sử dụng</span>
                        <h2 className="stat-value">{formatCurrency(totalSpent)}</h2>
                        <div className="progress-bar-small">
                            <div className="progress-fill" style={{ width: `${utilizationRate}%` }}></div>
                        </div>
                        <span className="stat-meta">{utilizationRate.toFixed(1)}% tỉ lệ sử dụng</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-orange">
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Các Phòng ban Vượt định mức</span>
                        <h2 className="stat-value">0</h2>
                        <span className="stat-trend text-muted">Mọi thứ vẫn trong tầm kiểm soát</span>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="content-tabs">
                <button 
                    className={`tab-item ${activeTab === 'allocations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('allocations')}
                >
                    <BarChart2 size={18} />
                    Phân bổ Ngân sách
                </button>
                <button 
                    className={`tab-item ${activeTab === 'periods' ? 'active' : ''}`}
                    onClick={() => setActiveTab('periods')}
                >
                    <Clock size={18} />
                    Chu kỳ Ngân sách
                </button>
            </div>

            {activeTab === 'allocations' ? (
                <div className="table-section">
                    <div className="table-filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input type="text" placeholder="Tìm kiếm phòng ban, trung tâm chi phí..." />
                        </div>
                        <div className="filter-actions">
                            <button className="btn btn-outline">
                                <Filter size={18} />
                                Lọc
                            </button>
                        </div>
                    </div>

                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Phòng ban / Cost Center</th>
                                    <th>Chu kỳ</th>
                                    <th>Định mức (Allocated)</th>
                                    <th>Đã dùng (Spent)</th>
                                    <th>Còn lại</th>
                                    <th>Trạng thái</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgetAllocations.length > 0 ? budgetAllocations.map((alloc: any) => {
                                    const remaining = Number(alloc.allocatedAmount) - Number(alloc.spentAmount);
                                    const percent = (Number(alloc.spentAmount) / Number(alloc.allocatedAmount)) * 100;
                                    
                                    return (
                                        <tr key={alloc.id}>
                                            <td>
                                                <div className="flex-col">
                                                    <span className="font-medium">{alloc.department?.name || 'Phòng ban Chung'}</span>
                                                    <span className="text-muted text-xs">{alloc.costCenter?.name || alloc.costCenter?.code}</span>
                                                </div>
                                            </td>
                                            <td>{alloc.budgetPeriod?.fiscalYear} - {alloc.budgetPeriod?.periodType}</td>
                                            <td>{formatCurrency(Number(alloc.allocatedAmount))}</td>
                                            <td>{formatCurrency(Number(alloc.spentAmount))}</td>
                                            <td className={remaining < 0 ? 'text-danger' : 'text-success'}>
                                                {formatCurrency(remaining)}
                                            </td>
                                            <td>
                                                <div className="usage-indicator">
                                                    <div className="progress-mini">
                                                        <div 
                                                            className={`progress-fill ${percent > 90 ? 'bg-danger' : percent > 70 ? 'bg-warning' : 'bg-primary'}`} 
                                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs">{percent.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn-icon">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-muted">Chưa có dữ liệu phân bổ ngân sách</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="periods-grid">
                    {budgetPeriods.map((period: any) => (
                        <div key={period.id} className="period-card">
                            <div className="period-header">
                                <Calendar className="text-primary" />
                                <h3>Năm tài chính {period.fiscalYear}</h3>
                                <span className={`badge ${period.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                    {period.isActive ? 'Đang hoạt động' : 'Đã kết thúc'}
                                </span>
                            </div>
                            <div className="period-body">
                                <div className="period-info">
                                    <span className="label">Loại kỳ:</span>
                                    <span className="value">{period.periodType}</span>
                                </div>
                                <div className="period-info">
                                    <span className="label">Bắt đầu:</span>
                                    <span className="value">{new Date(period.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="period-info">
                                    <span className="label">Kết thúc:</span>
                                    <span className="value">{new Date(period.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="period-footer">
                                <button className="btn-icon text-primary"><Edit2 size={16} /></button>
                                <button className="btn-icon text-danger"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals - Simplified for now */}
            {isPeriodModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Thiết lập Chu kỳ Ngân sách</h2>
                            <button className="close-btn" onClick={() => setIsPeriodModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreatePeriod} className="modal-form">
                            <div className="form-group">
                                <label>Năm tài chính</label>
                                <input 
                                    type="number" 
                                    value={newPeriod.fiscalYear} 
                                    onChange={e => setNewPeriod({...newPeriod, fiscalYear: Number(e.target.value)})}
                                    required 
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Từ ngày</label>
                                    <input 
                                        type="date" 
                                        value={newPeriod.startDate}
                                        onChange={e => setNewPeriod({...newPeriod, startDate: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Đến ngày</label>
                                    <input 
                                        type="date" 
                                        value={newPeriod.endDate}
                                        onChange={e => setNewPeriod({...newPeriod, endDate: e.target.value})}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsPeriodModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu chu kỳ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAllocModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Phân bổ Ngân sách mới</h2>
                            <button className="close-btn" onClick={() => setIsAllocModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateAlloc} className="modal-form">
                            <div className="form-group">
                                <label>Chu kỳ ngân sách</label>
                                <select 
                                    value={newAlloc.budgetPeriodId} 
                                    onChange={e => setNewAlloc({...newAlloc, budgetPeriodId: e.target.value})}
                                    required
                                >
                                    <option value="">Chọn chu kỳ...</option>
                                    {budgetPeriods.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.fiscalYear} ({p.periodType})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cost Center (Trung tâm chi phí)</label>
                                <select 
                                    value={newAlloc.costCenterId} 
                                    onChange={e => {
                                        const cc = costCenters.find((c: any) => c.id === e.target.value);
                                        setNewAlloc({...newAlloc, costCenterId: e.target.value, deptId: cc?.deptId || ''});
                                    }}
                                    required
                                >
                                    <option value="">Chọn cost center...</option>
                                    {costCenters.map((cc: any) => (
                                        <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Số tiền ngân sách (VND)</label>
                                <input 
                                    type="number" 
                                    placeholder="0"
                                    onChange={e => setNewAlloc({...newAlloc, allocatedAmount: Number(e.target.value)})}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Ghi chú</label>
                                <textarea 
                                    rows={3} 
                                    placeholder="Lý do phân bổ..."
                                    onChange={e => setNewAlloc({...newAlloc, notes: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsAllocModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Xác nhận phân bổ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .finance-container {
                    padding: 2rem;
                    background: #f8fafc;
                    min-height: 100vh;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                h1 { font-size: 1.875rem; color: #1e293b; margin: 0; }
                .subtitle { color: #64748b; margin-top: 0.25rem; }
                .header-actions { display: flex; gap: 1rem; }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 1rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    display: flex;
                    gap: 1.25rem;
                    align-items: center;
                }
                .stat-icon {
                    width: 3.5rem;
                    height: 3.5rem;
                    border-radius: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .bg-blue { background: #3b82f6; }
                .bg-purple { background: #8b5cf6; }
                .bg-orange { background: #f59e0b; }
                
                .stat-label { font-size: 0.875rem; color: #64748b; display: block; }
                .stat-value { font-size: 1.5rem; margin: 0.25rem 0; color: #1e293b; }
                .stat-trend { font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; }
                .trend-up { color: #10b981; }
                
                .progress-bar-small {
                    width: 100%;
                    height: 6px;
                    background: #f1f5f9;
                    border-radius: 3px;
                    margin: 0.5rem 0;
                    overflow: hidden;
                }
                .progress-fill { height: 100%; background: #3b82f6; border-radius: 3px; }
                .bg-warning { background: #f59e0b; }
                .bg-danger { background: #ef4444; }

                .content-tabs {
                    display: flex;
                    gap: 2rem;
                    border-bottom: 1px solid #e2e8f0;
                    margin-bottom: 2rem;
                }
                .tab-item {
                    padding: 1rem 0;
                    background: none;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                    cursor: pointer;
                    font-weight: 500;
                    position: relative;
                }
                .tab-item.active { color: #3b82f6; }
                .tab-item.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #3b82f6;
                }

                .table-section {
                    background: white;
                    border-radius: 1rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .table-filters {
                    padding: 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #f1f5f9;
                }
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: #f8fafc;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    width: 300px;
                }
                .search-box input {
                    background: none;
                    border: none;
                    outline: none;
                    font-size: 0.875rem;
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .data-table th {
                    text-align: left;
                    padding: 1rem 1.25rem;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: #64748b;
                    background: #f8fafc;
                }
                .data-table td {
                    padding: 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 0.875rem;
                }
                .flex-col { display: flex; flex-direction: column; gap: 0.25rem; }
                .font-medium { font-weight: 500; color: #1e293b; }
                .text-muted { color: #64748b; }
                .text-xs { font-size: 0.75rem; }
                
                .usage-indicator { display: flex; align-items: center; gap: 0.75rem; width: 120px; }
                .progress-mini { flex: 1; height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden; }
                
                .periods-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .period-card {
                    background: white;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .period-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.25rem;
                    position: relative;
                }
                h3 { font-size: 1.125rem; margin: 0; flex: 1; }
                .badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-secondary { background: #f1f5f9; color: #475569; }

                .period-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.75rem;
                    font-size: 0.875rem;
                }
                .period-info .label { color: #64748b; }
                .period-info .value { color: #1e293b; font-weight: 500; }
                
                .period-footer {
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                }

                .btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-weight: 500;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                .btn-primary { background: #3b82f6; color: white; }
                .btn-secondary { background: #f1f5f9; color: #1e293b; }
                .btn-outline { background: white; border: 1px solid #e2e8f0; color: #1e293b; }
                .btn-icon { background: none; border: none; cursor: pointer; color: #94a3b8; }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 1rem;
                    width: 500px;
                    max-width: 90%;
                    padding: 1.5rem;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                }
                .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
                .modal-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.875rem; font-weight: 500; color: #475569; }
                .form-group input, .form-group select, .form-group textarea {
                    padding: 0.625rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .modal-footer {
                    margin-top: 1rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
            `}</style>
        </div>
    );
}
