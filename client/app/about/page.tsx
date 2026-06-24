"use client";

import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
    Building2, Database, Layers, Server, Globe, Shield,
    Cpu, Zap, Package, FileText, CreditCard, Scale,
    Users, Award, Bot, Mail, Bell, Search,
    ChevronRight, CheckCircle,
    Monitor, HardDrive, Wifi, Lock, ShoppingBag, Truck, Wallet,
    GitBranch, ArrowRight, Star, Code2, Boxes
} from "lucide-react";

// --- Tab types ---
type TabId = "intro" | "architecture" | "database";

interface TabConfig {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabConfig[] = [
    { id: "intro", label: "Giới thiệu", icon: <Building2 size={16} /> },
    { id: "architecture", label: "Kiến trúc & Nghiệp vụ", icon: <Layers size={16} /> },
    { id: "database", label: "Database", icon: <Database size={16} /> },
];

// --- Technology data ---
const FRONTEND_TECH = [
    { name: "Next.js 16", desc: "App Router, SSR/CSR hybrid", icon: <Globe size={16} /> },
    { name: "React 19", desc: "UI framework mới nhất", icon: <Monitor size={16} /> },
    { name: "Tailwind CSS 4", desc: "Utility-first styling", icon: <Code2 size={16} /> },
    { name: "React Hook Form + Zod", desc: "Form validation type-safe", icon: <Shield size={16} /> },
    { name: "Lucide React", desc: "Icon system", icon: <Star size={16} /> },
    { name: "Socket.io Client", desc: "Real-time WebSocket", icon: <Wifi size={16} /> },
];

const BACKEND_TECH = [
    { name: "NestJS 11", desc: "Module-based Node.js framework", icon: <Server size={16} /> },
    { name: "Prisma 7", desc: "Type-safe ORM", icon: <Database size={16} /> },
    { name: "PostgreSQL 16", desc: "Primary relational database", icon: <HardDrive size={16} /> },
    { name: "Redis 7", desc: "Cache & BullMQ queue backend", icon: <Cpu size={16} /> },
    { name: "Google Gemini AI", desc: "AI analysis & NL queries", icon: <Bot size={16} /> },
    { name: "Passport.js + JWT", desc: "Authentication & RBAC", icon: <Lock size={16} /> },
];

// --- Features data ---
const FEATURES = [
    {
        title: "Procure-to-Pay hoàn chỉnh",
        desc: "Từ yêu cầu mua hàng → phê duyệt → đấu thầu → đặt hàng → nhận hàng → thanh toán → đánh giá NCC",
        icon: <GitBranch size={20} />,
        color: "from-blue-500 to-blue-600"
    },
    {
        title: "AI Scoring & Đề xuất",
        desc: "Gemini AI chấm điểm báo giá đa tiêu chí (Giá 40%, Lead Time 30%, KPI 30%) và đề xuất NCC tối ưu",
        icon: <Bot size={20} />,
        color: "from-purple-500 to-purple-600"
    },
    {
        title: "3-Way Matching tự động",
        desc: "So khớp PO ↔ GRN ↔ Invoice tự động, phát hiện sai lệch real-time",
        icon: <Scale size={20} />,
        color: "from-cyan-500 to-cyan-600"
    },
    {
        title: "Ma trận phê duyệt động",
        desc: "Multi-level approval (L1→L4) với SLA, auto-escalate, delegation khi vắng mặt",
        icon: <Shield size={20} />,
        color: "from-emerald-500 to-emerald-600"
    },
    {
        title: "Quản lý ngân sách 3 tầng",
        desc: "Soft Commit → Hard Commit, kiểm soát theo Category + Cost Center + Period",
        icon: <Wallet size={20} />,
        color: "from-amber-500 to-amber-600"
    },
    {
        title: "Supplier KPI & Tier",
        desc: "Đánh giá NCC tự động: On-time, Quality, Price, Response, Fulfillment → xếp hạng Tier",
        icon: <Award size={20} />,
        color: "from-rose-500 to-rose-600"
    },
];

// --- Modules data ---
const MODULE_GROUPS = [
    {
        group: "Core & Admin",
        color: "text-blue-600 bg-blue-50 border-blue-200",
        modules: [
            { name: "auth-module", desc: "JWT auth, RBAC, login/refresh token" },
            { name: "user-module", desc: "Quản lý người dùng, delegation" },
            { name: "organization-module", desc: "Tổ chức, phòng ban, chi nhánh" },
            { name: "system-config-module", desc: "Cấu hình hệ thống, approval thresholds" },
            { name: "audit-module", desc: "Ghi log mọi thay đổi dữ liệu" },
            { name: "admin-module", desc: "Admin panel, seed data" },
            { name: "external-token-module", desc: "JWT riêng cho supplier portal" },
        ]
    },
    {
        group: "Procurement & Sourcing",
        color: "text-violet-600 bg-violet-50 border-violet-200",
        modules: [
            { name: "prmodule", desc: "Purchase Request CRUD, budget check, approval routing" },
            { name: "rfqmodule", desc: "RFQ lifecycle, mời thầu, so sánh báo giá" },
            { name: "pomodule", desc: "Purchase Order, PO consolidation" },
            { name: "po-automation", desc: "Tự động hoá PO → GRN khi supplier ACKNOWLEDGE" },
            { name: "product-module", desc: "Danh mục sản phẩm, SKU, giá tham chiếu" },
            { name: "supplier-vetting-module", desc: "Thẩm định NCC: KYC, tài liệu pháp lý" },
            { name: "supplier-discovery", desc: "Tìm kiếm NCC mới qua AI" },
            { name: "supplier-kpimodule", desc: "Đánh giá KPI NCC" },
            { name: "contract-module", desc: "Hợp đồng tự động (≥ 50M VND)" },
        ]
    },
    {
        group: "Finance & Compliance",
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        modules: [
            { name: "budget-module", desc: "BudgetPeriod, BudgetAllocation, Override" },
            { name: "cost-center-module", desc: "Trung tâm chi phí theo bộ phận" },
            { name: "approval-module", desc: "Approval matrix, workflow engine" },
            { name: "invoice-module", desc: "Invoice CRUD, 3-way matching" },
            { name: "payment-module", desc: "Lập kế hoạch và thực hiện thanh toán" },
            { name: "report-module", desc: "Spend analytics, category/supplier spend" },
        ]
    },
    {
        group: "Operations & Logistics",
        color: "text-teal-600 bg-teal-50 border-teal-200",
        modules: [
            { name: "grnmodule", desc: "Goods Receipt Note: nhận hàng, QC" },
            { name: "quality-module", desc: "Kiểm định chất lượng chi tiết" },
            { name: "dispute-module", desc: "Khiếu nại, tranh chấp hàng hóa" },
            { name: "review-module", desc: "Đánh giá NCC sau nhận hàng" },
        ]
    },
    {
        group: "Intelligence & Communication",
        color: "text-purple-600 bg-purple-50 border-purple-200",
        modules: [
            { name: "ai-service", desc: "Gemini AI: phân tích, gợi ý, NL query" },
            { name: "rag", desc: "Retrieval-Augmented Generation" },
            { name: "notification-module", desc: "Email, SMS (Twilio), in-app" },
            { name: "email-processor", desc: "Hàng đợi email qua BullMQ" },
            { name: "gateway", desc: "WebSocket Socket.io real-time" },
        ]
    },
];

// --- Roles data ---
const ROLES = [
    { role: "REQUESTER", desc: "Tạo PR, xem PO của mình", icon: <Users size={14} />, pages: "/pr, /po" },
    { role: "DEPT_APPROVER", desc: "Duyệt PR cấp L1 (Trưởng phòng)", icon: <Shield size={14} />, pages: "/manager" },
    { role: "DIRECTOR", desc: "Duyệt PR L2, xem spend report", icon: <Shield size={14} />, pages: "/manager" },
    { role: "CEO", desc: "Duyệt PR L3/L4, budget override", icon: <Shield size={14} />, pages: "/manager" },
    { role: "PROCUREMENT", desc: "Quản lý RFQ, PO, NCC", icon: <Package size={14} />, pages: "/sourcing, /po" },
    { role: "FINANCE", desc: "3-way match, phê duyệt thanh toán", icon: <CreditCard size={14} />, pages: "/finance" },
    { role: "WAREHOUSE", desc: "Nhận hàng, QC, tạo GRN", icon: <Truck size={14} />, pages: "/warehouse" },
    { role: "SUPPLIER", desc: "Báo giá, xác nhận PO, nộp Invoice", icon: <Building2 size={14} />, pages: "/supplier" },
    { role: "PLATFORM_ADMIN", desc: "Toàn quyền hệ thống", icon: <Lock size={14} />, pages: "Tất cả" },
];

// --- Database tables ---
const DB_TABLES = [
    { name: "organizations", desc: "Tổ chức (Buyer/Supplier)", cols: 35, relations: "users, departments, POs, invoices..." },
    { name: "users", desc: "Người dùng hệ thống", cols: 22, relations: "organization, department, approvals, POs..." },
    { name: "departments", desc: "Phòng ban", cols: 12, relations: "organization, users, costCenters, POs..." },
    { name: "cost_centers", desc: "Trung tâm chi phí", cols: 11, relations: "department, organization, budgetAllocations..." },
    { name: "purchase_requisitions", desc: "Yêu cầu mua hàng (PR)", cols: 20, relations: "items, POs, RFQs, approvals..." },
    { name: "pr_items", desc: "Line item trong PR", cols: 12, relations: "PR, product, category, POItems..." },
    { name: "rfq_requests", desc: "Request for Quotation", cols: 22, relations: "PR, suppliers, quotations, items..." },
    { name: "rfq_items", desc: "Line item trong RFQ", cols: 10, relations: "RFQ, prItem, category, quotationItems..." },
    { name: "rfq_quotations", desc: "Báo giá từ NCC", cols: 17, relations: "RFQ, supplier, items, POs..." },
    { name: "purchase_orders", desc: "Đơn hàng (PO)", cols: 30, relations: "PR, RFQ, supplier, items, GRNs, invoices..." },
    { name: "po_items", desc: "Line item trong PO", cols: 14, relations: "PO, prItem, quotationItem, GRN items..." },
    { name: "goods_receipts", desc: "Biên bản nhận hàng (GRN)", cols: 18, relations: "PO, items, photos, invoices, disputes..." },
    { name: "grn_items", desc: "Chi tiết nhận hàng", cols: 14, relations: "GRN, poItem, QC result..." },
    { name: "supplier_invoices", desc: "Hóa đơn NCC", cols: 22, relations: "PO, GRN, items, payments, matching..." },
    { name: "payments", desc: "Thanh toán", cols: 18, relations: "invoice, PO, supplier..." },
    { name: "approval_workflows", desc: "Luồng phê duyệt", cols: 14, relations: "approver, document..." },
    { name: "approval_matrix_rules", desc: "Ma trận phê duyệt", cols: 14, relations: "organization, role, thresholds..." },
    { name: "contracts", desc: "Hợp đồng", cols: 18, relations: "buyer, supplier, POs, milestones..." },
    { name: "supplier_kpi_scores", desc: "Điểm KPI NCC", cols: 18, relations: "supplier, buyer, manual reviews..." },
    { name: "budget_allocations", desc: "Phân bổ ngân sách", cols: 12, relations: "organization, department, category..." },
    { name: "disputes", desc: "Khiếu nại/tranh chấp", cols: 16, relations: "PO, GRN, invoice, messages..." },
    { name: "notifications", desc: "Thông báo", cols: 12, relations: "user, channel, status..." },
];

const DB_ENUMS = [
    { name: "UserRole", values: "REQUESTER, DEPT_APPROVER, DIRECTOR, CEO, PROCUREMENT, WAREHOUSE, QA, FINANCE, SUPPLIER, PLATFORM_ADMIN, SYSTEM", count: 11 },
    { name: "PrStatus", values: "DRAFT → PENDING_APPROVAL → APPROVED → IN_SOURCING → PO_CREATED → COMPLETED / REJECTED / CANCELLED", count: 11 },
    { name: "RfqStatus", values: "DRAFT → SENT → QUOTATION_RECEIVED → AI_ANALYZING → AI_RECOMMENDED → AWARDED / CLOSED", count: 12 },
    { name: "PoStatus", values: "DRAFT → APPROVED → ISSUED → ACKNOWLEDGED → SHIPPED → GRN_CREATED → COMPLETED", count: 14 },
    { name: "GrnStatus", values: "DRAFT → COUNTING → INSPECTING → CONFIRMED → POSTED", count: 8 },
    { name: "InvoiceStatus", values: "DRAFT → SUBMITTED → MATCHING → AUTO_APPROVED / EXCEPTION_REVIEW → PAID", count: 11 },
    { name: "PaymentStatus", values: "PENDING → PROCESSING → COMPLETED / FAILED", count: 6 },
    { name: "ApprovalStatus", values: "PENDING → APPROVED / REJECTED / ESCALATED / DELEGATED", count: 7 },
    { name: "SupplierTier", values: "STRATEGIC, PREFERRED, APPROVED, CONDITIONAL, DISQUALIFIED, PENDING", count: 6 },
    { name: "ContractStatus", values: "DRAFT → PENDING_SIGNATURE → ACTIVE → EXPIRED / TERMINATED", count: 6 },
];

// --- P2P Steps for architecture tab ---
const P2P_STEPS_SUMMARY = [
    { step: 1, title: "Tạo PR", actor: "Requester", result: "PR DRAFT → Budget check" },
    { step: 2, title: "Phê duyệt", actor: "Manager/Director/CEO", result: "PR APPROVED, budget committed" },
    { step: 3, title: "Tạo RFQ", actor: "AutomationService", result: "RFQ SENT, email mời NCC" },
    { step: 4, title: "Báo giá", actor: "Supplier", result: "Quotation submitted" },
    { step: 5, title: "AI Scoring", actor: "AI Service", result: "Score + đề xuất NCC" },
    { step: 6, title: "Award & PO", actor: "Procurement", result: "PO ISSUED, contract auto" },
    { step: 7, title: "GRN", actor: "Warehouse", result: "Nhận hàng + QC" },
    { step: 8, title: "3-Way Match", actor: "System", result: "PO ↔ GRN ↔ Invoice" },
    { step: 9, title: "Thanh toán", actor: "Finance", result: "Payment COMPLETED" },
    { step: 10, title: "KPI", actor: "System", result: "Supplier evaluation" },
];

// --- Main Component ---

export default function AboutPage() {
    const [activeTab, setActiveTab] = useState<TabId>("intro");
    const [expandedModuleGroup, setExpandedModuleGroup] = useState<string | null>("Core & Admin");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-600/20">
                                <Boxes className="text-white" size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                    Smart E-Procurement OMS
                                </h1>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Kiến trúc hệ thống • Nghiệp vụ • Database
                                </p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === tab.id
                                            ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-[1400px] mx-auto px-6 py-8">

                {/* ========== TAB 1: GIỚI THIỆU ========== */}
                {activeTab === "intro" && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                        {/* Hero */}
                        <section className="text-center max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-6">
                                <Zap size={12} /> Enterprise E-Procurement Platform
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                                Smart E-Procurement &<br />Order Management System
                            </h2>
                            <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
                                Hệ thống quản trị mua sắm tập trung toàn diện, tích hợp Trí tuệ nhân tạo (AI) để tối ưu hóa
                                quy trình từ yêu cầu mua sắm đến thanh toán (<strong className="text-slate-700">Procure-to-Pay / P2P</strong>).
                                Thiết kế theo kiến trúc module, tự động hóa cao và giao diện Enterprise ERP hiện đại.
                            </p>
                        </section>

                        {/* Key Features */}
                        <section>
                            <h3 className="text-center text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Tính năng nổi bật
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {FEATURES.map((f, i) => (
                                    <div key={i} className="group p-5 bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className={`p-3 bg-gradient-to-br ${f.color} rounded-xl text-white inline-block mb-3 shadow-lg group-hover:scale-105 transition-transform`}>
                                            {f.icon}
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-1.5">{f.title}</h4>
                                        <p className="text-[12px] text-slate-500 leading-relaxed">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Tech Stack */}
                        <section>
                            <h3 className="text-center text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Công nghệ sử dụng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Frontend */}
                                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-blue-50 rounded-lg"><Monitor size={16} className="text-blue-600" /></div>
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Frontend</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {FRONTEND_TECH.map((t, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-blue-500">{t.icon}</span>
                                                <div>
                                                    <span className="text-[12px] font-bold text-slate-800">{t.name}</span>
                                                    <span className="text-[11px] text-slate-400 ml-2">{t.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Backend */}
                                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-emerald-50 rounded-lg"><Server size={16} className="text-emerald-600" /></div>
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Backend</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {BACKEND_TECH.map((t, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-emerald-500">{t.icon}</span>
                                                <div>
                                                    <span className="text-[12px] font-bold text-slate-800">{t.name}</span>
                                                    <span className="text-[11px] text-slate-400 ml-2">{t.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Stats */}
                        <section>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Backend Modules", value: "38+", icon: <Server size={16} /> },
                                    { label: "Database Tables", value: "40+", icon: <Database size={16} /> },
                                    { label: "User Roles", value: "11", icon: <Users size={16} /> },
                                    { label: "API Endpoints", value: "100+", icon: <Globe size={16} /> },
                                ].map((s, i) => (
                                    <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/60 text-center shadow-sm">
                                        <div className="text-slate-400 flex justify-center mb-2">{s.icon}</div>
                                        <div className="text-2xl font-extrabold text-slate-900 mb-1">{s.value}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* ========== TAB 2: KIẾN TRÚC & NGHIỆP VỤ ========== */}
                {activeTab === "architecture" && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                        {/* System Architecture */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Kiến trúc tổng quan
                            </h3>
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm">
                                {/* Architecture diagram using CSS */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                    {/* Client */}
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                                        <Monitor size={24} className="mx-auto text-blue-600 mb-2" />
                                        <div className="text-xs font-extrabold text-blue-700 mb-1">Client</div>
                                        <div className="text-[10px] text-blue-500">Next.js 16</div>
                                        <div className="text-[10px] text-blue-500">React 19</div>
                                        <div className="text-[10px] text-blue-500">Tailwind 4</div>
                                        <div className="text-[10px] text-blue-500 mt-1 font-bold">Port 3000</div>
                                    </div>

                                    <div className="hidden md:flex justify-center">
                                        <ArrowRight size={20} className="text-slate-300" />
                                    </div>

                                    {/* API Server */}
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                                        <Server size={24} className="mx-auto text-emerald-600 mb-2" />
                                        <div className="text-xs font-extrabold text-emerald-700 mb-1">API Server</div>
                                        <div className="text-[10px] text-emerald-500">NestJS 11</div>
                                        <div className="text-[10px] text-emerald-500">38 Modules</div>
                                        <div className="text-[10px] text-emerald-500">WebSocket</div>
                                        <div className="text-[10px] text-emerald-500 mt-1 font-bold">Port 3001</div>
                                    </div>

                                    <div className="hidden md:flex justify-center">
                                        <ArrowRight size={20} className="text-slate-300" />
                                    </div>

                                    {/* Data Layer */}
                                    <div className="space-y-3">
                                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                                            <HardDrive size={18} className="mx-auto text-indigo-600 mb-1" />
                                            <div className="text-[11px] font-bold text-indigo-700">PostgreSQL 16</div>
                                            <div className="text-[10px] text-indigo-500">Prisma ORM</div>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
                                            <Cpu size={18} className="mx-auto text-red-600 mb-1" />
                                            <div className="text-[11px] font-bold text-red-700">Redis 7</div>
                                            <div className="text-[10px] text-red-500">Cache + BullMQ</div>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                                            <Bot size={18} className="mx-auto text-purple-600 mb-1" />
                                            <div className="text-[11px] font-bold text-purple-700">Gemini AI</div>
                                            <div className="text-[10px] text-purple-500">Scoring + RAG</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Supporting Services */}
                                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { name: "Nodemailer", desc: "Email SMTP", icon: <Mail size={14} /> },
                                        { name: "Twilio", desc: "SMS", icon: <Bell size={14} /> },
                                        { name: "Socket.io", desc: "Real-time", icon: <Wifi size={14} /> },
                                        { name: "Docker", desc: "Container", icon: <Boxes size={14} /> },
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-slate-400">{s.icon}</span>
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-700">{s.name}</div>
                                                <div className="text-[10px] text-slate-400">{s.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* P2P Business Flow */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Luồng nghiệp vụ P2P (Procure-to-Pay)
                            </h3>
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {P2P_STEPS_SUMMARY.map((s, i) => (
                                        <div key={i} className="relative">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md text-white text-[9px] font-bold flex items-center justify-center">{s.step}</span>
                                                    <span className="text-[11px] font-bold text-slate-800">{s.title}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mb-1">{s.actor}</div>
                                                <div className="text-[10px] text-slate-400">{s.result}</div>
                                            </div>
                                            {i < P2P_STEPS_SUMMARY.length - 1 && i % 5 !== 4 && (
                                                <ChevronRight size={12} className="absolute top-1/2 -right-2.5 text-slate-300 hidden md:block" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Backend Modules */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                38 Module Backend
                            </h3>
                            <div className="space-y-3">
                                {MODULE_GROUPS.map(group => (
                                    <div key={group.group} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                                        <button
                                            onClick={() => setExpandedModuleGroup(expandedModuleGroup === group.group ? null : group.group)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${group.color}`}>
                                                    {group.group}
                                                </span>
                                                <span className="text-xs text-slate-400">{group.modules.length} modules</span>
                                            </div>
                                            <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandedModuleGroup === group.group ? "rotate-90" : ""}`} />
                                        </button>
                                        {expandedModuleGroup === group.group && (
                                            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                                                {group.modules.map(m => (
                                                    <div key={m.name} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                                        <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <span className="text-[11px] font-bold text-slate-700">{m.name}</span>
                                                            <p className="text-[10px] text-slate-400">{m.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Module Distribution Chart */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Phân bổ Module Backend
                            </h3>
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={MODULE_GROUPS.map(g => ({ name: g.group, value: g.modules.length }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {MODULE_GROUPS.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#14b8a6', '#a855f7'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* User Roles */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Vai trò người dùng (RBAC)
                            </h3>
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-2.5 px-3">Role</th>
                                            <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-2.5 px-3">Quyền chính</th>
                                            <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-2.5 px-3">Trang</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ROLES.map(r => (
                                            <tr key={r.role} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-2.5 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-blue-500">{r.icon}</span>
                                                        <span className="text-[11px] font-bold text-slate-800">{r.role}</span>
                                                    </div>
                                                </td>
                                                <td className="text-[11px] text-slate-600 py-2.5 px-3">{r.desc}</td>
                                                <td className="text-[10px] text-slate-400 py-2.5 px-3 font-mono">{r.pages}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {/* ========== TAB 3: DATABASE ========== */}
                {activeTab === "database" && (
                    <div className="space-y-10 animate-in fade-in duration-300">
                        {/* DB Stats */}
                        <section>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Tables", value: "40+", color: "text-blue-600 bg-blue-50 border-blue-200" },
                                    { label: "Enums", value: "20+", color: "text-purple-600 bg-purple-50 border-purple-200" },
                                    { label: "Relations", value: "100+", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                                    { label: "Database", value: "PostgreSQL 16", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
                                ].map((s, i) => (
                                    <div key={i} className={`p-4 rounded-2xl border text-center ${s.color}`}>
                                        <div className="text-xl font-extrabold mb-0.5">{s.value}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ER Diagram Visual */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Sơ đồ quan hệ chính (ER Overview)
                            </h3>
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Core entities with relations shown */}
                                    {[
                                        { name: "Organization", icon: <Building2 size={16} />, color: "border-blue-200 bg-blue-50", relations: ["Users", "Departments", "POs", "Invoices"] },
                                        { name: "User", icon: <Users size={16} />, color: "border-indigo-200 bg-indigo-50", relations: ["PRs", "Approvals", "POs", "GRNs"] },
                                        { name: "PR", icon: <FileText size={16} />, color: "border-violet-200 bg-violet-50", relations: ["Items", "RFQs", "POs", "Approvals"] },
                                        { name: "RFQ", icon: <Search size={16} />, color: "border-amber-200 bg-amber-50", relations: ["Items", "Quotations", "Suppliers", "POs"] },
                                        { name: "PO", icon: <ShoppingBag size={16} />, color: "border-emerald-200 bg-emerald-50", relations: ["Items", "GRNs", "Invoices", "Payments"] },
                                        { name: "GRN", icon: <Package size={16} />, color: "border-teal-200 bg-teal-50", relations: ["Items", "Photos", "QC", "Disputes"] },
                                        { name: "Invoice", icon: <CreditCard size={16} />, color: "border-cyan-200 bg-cyan-50", relations: ["Items", "Matching", "Payments", "DCN"] },
                                        { name: "Payment", icon: <Wallet size={16} />, color: "border-rose-200 bg-rose-50", relations: ["Invoice", "PO", "Supplier", "Escrow"] },
                                    ].map((e, i) => (
                                        <div key={i} className={`p-4 rounded-xl border ${e.color}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {e.icon}
                                                <span className="text-[12px] font-extrabold text-slate-800">{e.name}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {e.relations.map((r, ri) => (
                                                    <div key={ri} className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <ArrowRight size={8} className="text-slate-300" />
                                                        {r}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* DB Tables Chart */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Top 10 Bảng Dữ Liệu Phức Tạp Nhất (Theo số lượng cột)
                            </h3>
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[...DB_TABLES].sort((a, b) => b.cols - a.cols).slice(0, 10).map(t => ({ name: t.name, Columns: t.cols }))} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-35} textAnchor="end" tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{fill: '#f8fafc'}}
                                            contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                                        />
                                        <Bar dataKey="Columns" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                            {[...DB_TABLES].sort((a, b) => b.cols - a.cols).slice(0, 10).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index < 3 ? '#4f46e5' : '#818cf8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* Tables List */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Danh sách bảng chính ({DB_TABLES.length} tables)
                            </h3>
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 px-4">#</th>
                                                <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 px-4">Table</th>
                                                <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 px-4">Mô tả</th>
                                                <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 px-4">Columns</th>
                                                <th className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 px-4">Relations</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {DB_TABLES.map((t, i) => (
                                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <td className="text-[10px] text-slate-400 py-2.5 px-4">{i + 1}</td>
                                                    <td className="py-2.5 px-4">
                                                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">{t.name}</span>
                                                    </td>
                                                    <td className="text-[11px] text-slate-600 py-2.5 px-4">{t.desc}</td>
                                                    <td className="text-[11px] text-slate-500 py-2.5 px-4 font-bold">{t.cols}</td>
                                                    <td className="text-[10px] text-slate-400 py-2.5 px-4 max-w-[200px] truncate">{t.relations}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Enums */}
                        <section>
                            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mb-6">
                                Enums quan trọng ({DB_ENUMS.length} enums)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {DB_ENUMS.map((e, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[12px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded font-mono">{e.name}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{e.count} values</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-mono">{e.values}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Schema info */}
                        <section className="text-center py-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                                <Database size={14} className="text-slate-400" />
                                <span>Schema location: <code className="font-mono text-indigo-600 font-bold">server/prisma/schema.prisma</code> • 1856 dòng • ORM: Prisma 7</span>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
