"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Sparkles, X, ChevronDown, ChevronUp, Globe, Phone, Mail,
  MapPin, Star, CheckCircle2, Clock, Download, ArrowUpRight,
  Loader2, AlertCircle, Building2, Shield, Zap, DollarSign,
  Send, MessageSquare, Import, Filter, RefreshCw, BadgeCheck,
} from "lucide-react";
import {
  searchSuppliers, importSupplier, fetchDiscoveryCategories, enrichSupplier,
  DiscoveredSupplier, DiscoverSupplierDto, ProductCategory, SearchPriority,
} from "../../services/supplierDiscoveryService";

// ─── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: DiscoveredSupplier['status'] }) => {
  if (status === 'WORKED_BEFORE')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-black border border-emerald-500/30"><BadgeCheck size={10} />Đã hợp tác</span>;
  if (status === 'IN_SYSTEM')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B4533A]/15 text-[#CB7A62] border border-[#B4533A]/30"><CheckCircle2 size={10} />Trong hệ thống</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-black border border-slate-500/30"><Sparkles size={10} />Mới</span>;
};

// ─── AI Score bar ────────────────────────────────────────────────────────────
const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[rgba(240,246,252,0.06)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-black tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
};

// ─── Supplier Detail Modal ───────────────────────────────────────────────────
const SupplierDetailModal = ({
  supplier, onClose, onImport, importing,
}: {
  supplier: DiscoveredSupplier;
  onClose: () => void;
  onImport: (s: DiscoveredSupplier) => void;
  importing: boolean;
}) => {
  const [enriched, setEnriched] = useState<Partial<DiscoveredSupplier> | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState('');

  const s = enriched
    ? { ...supplier, ...Object.fromEntries(Object.entries(enriched).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && (v as unknown[]).length === 0))) }
    : supplier;

  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichError('');
    try {
      const data = await enrichSupplier(supplier.website || supplier.sourceUrl);
      setEnriched(data as Partial<DiscoveredSupplier>);
    } catch {
      setEnrichError('Không thể tải thêm thông tin. Thử lại sau.');
    } finally {
      setEnriching(false);
    }
  };

  const scoreColor = s.aiScore >= 80 ? '#10B981' : s.aiScore >= 60 ? '#F59E0B' : '#EF4444';
  const scoreLabel = s.aiScore >= 80 ? 'Rất phù hợp' : s.aiScore >= 60 ? 'Phù hợp' : 'Ít phù hợp';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#FFFFFF]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF8F5] rounded-2xl border border-[rgba(240,246,252,0.1)] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-base font-black text-[#000000] truncate">{s.name}</h2>
              <StatusBadge status={s.status} />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#000000]">
              {s.province && <span className="flex items-center gap-1"><MapPin size={10} />{s.province}</span>}
              {s.industry && <span className="flex items-center gap-1"><Building2 size={10} />{s.industry}</span>}
              {s.website && (
                <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#CB7A62] hover:underline">
                  <Globe size={10} />{s.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#000000] hover:text-[#000000] hover:bg-[rgba(240,246,252,0.06)] rounded-lg transition-all shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── AI Score section ── */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(240,246,252,0.08)] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-3 flex items-center gap-1.5">
              <Sparkles size={11} className="text-violet-400" /> Đánh giá AI
            </p>
            {/* Score row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl border-2 shrink-0" style={{ borderColor: scoreColor + '40', background: scoreColor + '15' }}>
                <span className="text-2xl font-black tabular-nums" style={{ color: scoreColor }}>{s.aiScore}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
                  <span className="text-[10px] text-[#000000]">/ 100</span>
                </div>
                <div className="h-2 bg-[rgba(240,246,252,0.06)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.aiScore}%`, background: scoreColor }} />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {s.aiSummary && (
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#000000] mb-1.5">Nhận xét AI</p>
                <p className="text-[12.5px] text-[#C9D1D9] leading-relaxed">{s.aiSummary}</p>
              </div>
            )}

            {/* Match reasons */}
            {s.matchReasons.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#000000] mb-2">Lý do chấm điểm</p>
                <div className="space-y-1.5">
                  {s.matchReasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-violet-400 shrink-0 mt-0.5" />
                      <span className="text-[12px] text-[#C9D1D9]">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {s.matchReasons.length === 0 && !s.aiSummary && (
              <p className="text-[11px] text-[#000000] italic">AI chưa cung cấp lý do chi tiết cho lần tìm kiếm này.</p>
            )}
          </div>

          {/* ── Company info section ── */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(240,246,252,0.08)] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] flex items-center gap-1.5">
                <Building2 size={11} /> Thông tin liên hệ
              </p>
              <button
                onClick={handleEnrich}
                disabled={enriching}
                title="Scrape website để lấy thêm thông tin liên hệ"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-violet-400 border border-violet-500/25 hover:bg-violet-500/10 disabled:opacity-50 transition-colors"
              >
                {enriching ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                {enriched ? 'Tải lại' : 'Tìm thêm thông tin'}
              </button>
            </div>

            {enrichError && (
              <p className="text-[11px] text-black mb-2 flex items-center gap-1"><AlertCircle size={11} />{enrichError}</p>
            )}
            {enriched && !enrichError && (
              <p className="text-[10px] text-black mb-2 flex items-center gap-1"><CheckCircle2 size={10} />Đã cập nhật từ website nhà cung cấp</p>
            )}

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[12px]">
                <Phone size={12} className="text-[#000000] shrink-0" />
                <span className="text-[#000000] w-24 shrink-0">Điện thoại</span>
                {s.phone
                  ? <a href={`tel:${s.phone}`} className="text-[#000000] font-medium hover:text-[#CB7A62] transition-colors">{s.phone}</a>
                  : <span className="text-[#000000] italic text-[11px]">Chưa có thông tin</span>}
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <Mail size={12} className="text-[#000000] shrink-0" />
                <span className="text-[#000000] w-24 shrink-0">Email</span>
                {s.email
                  ? <a href={`mailto:${s.email}`} className="text-black hover:underline">{s.email}</a>
                  : <span className="text-[#000000] italic text-[11px]">Chưa có thông tin</span>}
              </div>
              <div className="flex items-start gap-2 text-[12px]">
                <MapPin size={12} className="text-[#000000] shrink-0 mt-0.5" />
                <span className="text-[#000000] w-24 shrink-0">Địa chỉ</span>
                {s.address
                  ? <span className="text-[#000000]">{s.address}</span>
                  : <span className="text-[#000000] italic text-[11px]">{s.province || 'Chưa có thông tin'}</span>}
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <Star size={12} className="text-[#000000] shrink-0" />
                <span className="text-[#000000] w-24 shrink-0">Mã số thuế</span>
                {s.taxCode
                  ? <span className="text-[#000000] font-mono">{s.taxCode}</span>
                  : <span className="text-[#000000] italic text-[11px]">Chưa có thông tin</span>}
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <Globe size={12} className="text-[#000000] shrink-0" />
                <span className="text-[#000000] w-24 shrink-0">Website</span>
                {s.website
                  ? <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[#CB7A62] hover:underline flex items-center gap-1">
                      {s.website.replace(/^https?:\/\//, '')} <ArrowUpRight size={10} />
                    </a>
                  : <span className="text-[#000000] italic text-[11px]">Chưa có thông tin</span>}
              </div>
            </div>
          </div>

          {/* ── Products & Certifications ── */}
          {(s.products.length > 0 || s.certifications.length > 0) && (
            <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(240,246,252,0.08)] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-3 flex items-center gap-1.5">
                <Zap size={11} /> Năng lực & Chứng chỉ
              </p>
              {s.products.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-[#000000] uppercase mb-1.5">Sản phẩm / Dịch vụ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.products.map((p, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(240,246,252,0.05)] text-[#C9D1D9] border border-[rgba(240,246,252,0.08)]">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {s.certifications.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[#000000] uppercase mb-1.5">Chứng chỉ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.certifications.map((c, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-black border border-emerald-500/20 flex items-center gap-1">
                        <Shield size={9} />{c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Source ── */}
          <div className="flex items-center gap-2">
            <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-[#CB7A62] hover:underline">
              <ArrowUpRight size={12} />Xem nguồn dữ liệu gốc
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-5 py-4 flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] text-[#000000] hover:text-[#000000] border border-[rgba(240,246,252,0.08)] hover:border-[rgba(240,246,252,0.15)] transition-all">
            Đóng
          </button>
          {s.status === 'NEW' && (
            <button
              onClick={() => { onImport(s as DiscoveredSupplier); onClose(); }}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold bg-[#A85032] text-[#000000] hover:bg-[#B4533A] disabled:opacity-50 transition-all"
            >
              {importing ? <Loader2 size={13} className="animate-spin" /> : <Import size={13} />}
              Thêm vào hệ thống
            </button>
          )}
          {s.status === 'IN_SYSTEM' && (
            <span className="text-[11px] text-[#000000] flex items-center gap-1"><CheckCircle2 size={12} className="text-[#CB7A62]" />Đã có trong hệ thống</span>
          )}
          {s.status === 'WORKED_BEFORE' && (
            <span className="text-[11px] text-black flex items-center gap-1"><CheckCircle2 size={12} />Đã từng hợp tác</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Supplier Card ───────────────────────────────────────────────────────────
const SupplierCard = ({
  supplier, selected, onToggleSelect, onImport, importing, onViewDetail,
}: {
  supplier: DiscoveredSupplier;
  selected: boolean;
  onToggleSelect: () => void;
  onImport: (s: DiscoveredSupplier) => void;
  importing: boolean;
  onViewDetail: (s: DiscoveredSupplier) => void;
}) => {
  return (
    <div className={`rounded-xl border transition-all duration-200 ${selected ? 'border-[#B4533A]/50 bg-[#B4533A]/5' : 'border-[rgba(240,246,252,0.08)] bg-[#FAF8F5]'} hover:border-[rgba(240,246,252,0.15)]`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 rounded border-[rgba(240,246,252,0.2)] accent-[#B4533A]"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-[#000000] truncate">{supplier.name}</h3>
              <StatusBadge status={supplier.status} />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#000000]">
              {supplier.province && <span className="flex items-center gap-1"><MapPin size={10} />{supplier.province}</span>}
              {supplier.industry && <span className="flex items-center gap-1"><Building2 size={10} />{supplier.industry}</span>}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#CB7A62] hover:underline" onClick={e => e.stopPropagation()}>
                  <Globe size={10} />{supplier.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
          {/* AI Score */}
          <div className="shrink-0 w-28">
            <p className="text-[9px] font-semibold text-[#000000] uppercase tracking-wider mb-1">AI Score</p>
            <ScoreBar score={supplier.aiScore} />
          </div>
        </div>

        {/* AI Summary — inline preview */}
        {supplier.aiSummary && (
          <p className="mt-2.5 text-[11.5px] text-[#000000] leading-relaxed line-clamp-2 pl-6">
            {supplier.aiSummary}
          </p>
        )}

        {/* Match reason tags — inline preview */}
        {supplier.matchReasons.length > 0 && (
          <div className="mt-2 pl-6 flex flex-wrap gap-1.5">
            {supplier.matchReasons.slice(0, 3).map((r, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgba(59,130,246,0.1)] text-[#D99B89] border border-[#B4533A]/20">{r}</span>
            ))}
            {supplier.matchReasons.length > 3 && (
              <span className="text-[10px] text-[#000000]">+{supplier.matchReasons.length - 3}</span>
            )}
          </div>
        )}

        {/* Contacts row */}
        <div className="mt-3 pl-6 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {supplier.phone && <span className="flex items-center gap-1 text-[#000000]"><Phone size={10} />{supplier.phone}</span>}
          {supplier.email && <span className="flex items-center gap-1 text-[#000000]"><Mail size={10} />{supplier.email}</span>}
        </div>

        {/* Action bar */}
        <div className="mt-3 pl-6 flex items-center gap-2">
          <button
            onClick={() => onViewDetail(supplier)}
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Sparkles size={11} /> Chi tiết AI
          </button>

          {supplier.status === 'NEW' && (
            <button
              onClick={() => onImport(supplier)}
              disabled={importing}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#B4533A]/15 text-[#CB7A62] border border-[#B4533A]/30 hover:bg-[#B4533A]/25 transition-colors disabled:opacity-50"
            >
              {importing ? <Loader2 size={11} className="animate-spin" /> : <Import size={11} />}
              Thêm vào hệ thống
            </button>
          )}
          {supplier.status === 'IN_SYSTEM' && (
            <span className="ml-auto text-[10px] text-[#000000]">Đã có trong hệ thống</span>
          )}
          {supplier.status === 'WORKED_BEFORE' && (
            <span className="ml-auto text-[10px] text-emerald-500">Đã từng hợp tác</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Compare Panel ───────────────────────────────────────────────────────────
const ComparePanel = ({ suppliers, onClose }: { suppliers: DiscoveredSupplier[]; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-[#FAF8F5] border border-[rgba(240,246,252,0.1)] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-[rgba(240,246,252,0.08)]">
        <h3 className="font-bold text-[#000000]">So sánh Nhà cung cấp</h3>
        <button onClick={onClose} className="text-[#000000] hover:text-[#000000] transition-colors"><X size={16} /></button>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <td className="text-[10px] text-[#000000] uppercase font-semibold pr-4 pb-3 w-28">Tiêu chí</td>
              {suppliers.map((s, i) => (
                <th key={i} className="text-left pb-3 px-3 font-bold text-[#000000]">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(240,246,252,0.05)]">
            {[
              { label: 'AI Score', render: (s: DiscoveredSupplier) => <ScoreBar score={s.aiScore} /> },
              { label: 'Tỉnh/Thành', render: (s: DiscoveredSupplier) => s.province || '—' },
              { label: 'Ngành', render: (s: DiscoveredSupplier) => s.industry || '—' },
              { label: 'Email', render: (s: DiscoveredSupplier) => s.email || '—' },
              { label: 'Điện thoại', render: (s: DiscoveredSupplier) => s.phone || '—' },
              { label: 'Chứng chỉ', render: (s: DiscoveredSupplier) => s.certifications.join(', ') || '—' },
              { label: 'Sản phẩm', render: (s: DiscoveredSupplier) => s.products.slice(0, 3).join(', ') || '—' },
              { label: 'Trạng thái', render: (s: DiscoveredSupplier) => <StatusBadge status={s.status} /> },
            ].map(row => (
              <tr key={row.label}>
                <td className="text-[10px] text-[#000000] uppercase font-semibold py-2.5 pr-4">{row.label}</td>
                {suppliers.map((s, i) => (
                  <td key={i} className="py-2.5 px-3 text-[12px] text-[#000000]">{row.render(s)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SupplierDiscoveryPage() {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState('');
  const [location, setLocation] = useState('');
  const [companySize, setCompanySize] = useState<'' | 'STARTUP' | 'SME' | 'ENTERPRISE'>('');
  const [priorities, setPriorities] = useState<SearchPriority[]>([]);
  const [limit, setLimit] = useState(10);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<DiscoveredSupplier[] | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [queryUsed, setQueryUsed] = useState('');

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [comparing, setComparing] = useState(false);
  const [importingIdx, setImportingIdx] = useState<number | null>(null);
  const [importedSet, setImportedSet] = useState<Set<number>>(new Set());

  const [detailSupplier, setDetailSupplier] = useState<DiscoveredSupplier | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchDiscoveryCategories().then(setCategories).catch(() => {});
  }, []);

  const togglePriority = (p: SearchPriority) =>
    setPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const toggleCategory = (name: string) =>
    setSelectedCategories(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    setSelected(new Set());
    try {
      const dto: DiscoverSupplierDto = {
        query: query.trim(),
        categories: selectedCategories.length ? selectedCategories : undefined,
        products: products.trim() || undefined,
        location: location.trim() || undefined,
        companySize: companySize || undefined,
        priorities: priorities.length ? priorities : undefined,
        limit,
      };
      const res = await searchSuppliers(dto);
      setResults(res.suppliers);
      setQueryUsed(res.query);
      setIsDemoData(res.isDemoData ?? false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategories, products, location, companySize, priorities, limit]);

  const handleImport = async (supplier: DiscoveredSupplier, idx: number) => {
    setImportingIdx(idx);
    try {
      await importSupplier({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        address: supplier.address,
        province: supplier.province,
        industry: supplier.industry,
        taxCode: supplier.taxCode,
      });
      setImportedSet(prev => new Set([...prev, idx]));
      if (results) {
        const updated = [...results];
        updated[idx] = { ...updated[idx], status: 'IN_SYSTEM' };
        setResults(updated);
      }
    } catch {
      alert('Import thất bại. Vui lòng thử lại.');
    } finally {
      setImportingIdx(null);
    }
  };

  const selectedSuppliers = results ? [...selected].map(i => results[i]).filter(Boolean) : [];

  const handleExport = () => {
    if (!results) return;
    const rows = [
      ['Tên', 'Website', 'Email', 'Điện thoại', 'Địa chỉ', 'Tỉnh/Thành', 'Ngành', 'AI Score', 'Trạng thái'],
      ...results.map(s => [s.name, s.website, s.email ?? '', s.phone ?? '', s.address ?? '', s.province ?? '', s.industry ?? '', s.aiScore, s.status]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-discovery.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAiChat = async () => {
    if (!chatInput.trim() || !results) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const supplierSummary = results.slice(0, 5).map(s =>
        `${s.name} (score: ${s.aiScore}, tỉnh: ${s.province ?? 'N/A'}, ngành: ${s.industry ?? 'N/A'})`
      ).join('\n');
      const res = await fetch(`${'http://localhost:5000'}/ai-service/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: `Dưới đây là danh sách nhà cung cấp tìm được:\n${supplierSummary}\n\nCâu hỏi: ${userMsg}`,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { reply?: string; response?: string };
        setChatMessages(prev => [...prev, { role: 'ai', text: data.reply ?? data.response ?? 'AI không trả lời được lúc này.' }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: 'Không thể kết nối AI lúc này.' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Lỗi kết nối AI.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const PRIORITY_OPTIONS: { key: SearchPriority; label: string; icon: React.ReactNode }[] = [
    { key: 'PRICE', label: 'Giá tốt', icon: <DollarSign size={11} /> },
    { key: 'DELIVERY_SPEED', label: 'Giao nhanh', icon: <Zap size={11} /> },
    { key: 'ISO_CERTIFIED', label: 'Chứng chỉ ISO', icon: <Shield size={11} /> },
    { key: 'EXPERIENCE', label: 'Kinh nghiệm', icon: <Star size={11} /> },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Page header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-[#A85032] flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={15} className="text-[#000000]" />
            </div>
            <h1 className="text-xl font-black text-[#000000]">Khám phá Nhà Cung Cấp <span className="text-violet-400">(AI)</span></h1>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30 uppercase tracking-wider">Beta</span>
          </div>
          <p className="text-[12px] text-[#000000]">Tìm kiếm nhà cung cấp từ nguồn bên ngoài bằng AI · Gemini + Tavily Search</p>
        </div>

        {/* ── Search form ── */}
        <div className="bg-[#FAF8F5] border border-[rgba(240,246,252,0.08)] rounded-2xl p-4 mb-5">
          {/* Main query */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="VD: nhà cung cấp laptop văn phòng Hà Nội..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#FFFFFF] border border-[rgba(240,246,252,0.1)] rounded-xl text-sm text-[#000000] placeholder-[#000000] focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-[#A85032] text-[#000000] hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Tìm kiếm AI
            </button>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Khu vực..."
              className="w-32 px-3 py-1.5 text-[12px] bg-[#FFFFFF] border border-[rgba(240,246,252,0.08)] rounded-lg text-[#000000] placeholder-[#000000] focus:outline-none focus:border-violet-500/40"
            />
            <select
              value={companySize}
              onChange={e => setCompanySize(e.target.value as '' | 'STARTUP' | 'SME' | 'ENTERPRISE')}
              className="px-3 py-1.5 text-[12px] bg-[#FFFFFF] border border-[rgba(240,246,252,0.08)] rounded-lg text-[#000000] focus:outline-none focus:border-violet-500/40"
            >
              <option value="">Quy mô</option>
              <option value="STARTUP">Startup</option>
              <option value="SME">SME</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            {PRIORITY_OPTIONS.map(p => (
              <button
                key={p.key}
                onClick={() => togglePriority(p.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${priorities.includes(p.key) ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-transparent text-[#000000] border-[rgba(240,246,252,0.08)] hover:border-[rgba(240,246,252,0.2)]'}`}
              >
                {p.icon}{p.label}
              </button>
            ))}
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1 text-[11px] text-[#000000] hover:text-[#000000] ml-auto"
            >
              <Filter size={11} />Nâng cao {showAdvanced ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="mt-3 pt-3 border-t border-[rgba(240,246,252,0.06)] grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-[#000000] uppercase font-semibold mb-2">Sản phẩm cụ thể</p>
                <input
                  value={products}
                  onChange={e => setProducts(e.target.value)}
                  placeholder="VD: laptop Dell, máy in HP..."
                  className="w-full px-3 py-2 text-[12px] bg-[#FFFFFF] border border-[rgba(240,246,252,0.08)] rounded-lg text-[#000000] placeholder-[#000000] focus:outline-none focus:border-violet-500/40"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#000000] uppercase font-semibold mb-2">Số kết quả (1-20)</p>
                <input
                  type="number"
                  min={1} max={20}
                  value={limit}
                  onChange={e => setLimit(Math.min(20, Math.max(1, Number(e.target.value))))}
                  className="w-24 px-3 py-2 text-[12px] bg-[#FFFFFF] border border-[rgba(240,246,252,0.08)] rounded-lg text-[#000000] focus:outline-none focus:border-violet-500/40"
                />
              </div>
              {categories.length > 0 && (
                <div className="col-span-full">
                  <p className="text-[10px] text-text-muted uppercase font-semibold mb-2">Danh mục sản phẩm</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleCategory(c.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${selectedCategories.includes(c.name) ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-transparent text-[#000000] border-[rgba(240,246,252,0.08)] hover:border-[rgba(240,246,252,0.2)]'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={14} />{error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] p-4 animate-pulse">
                <div className="h-4 w-48 bg-[rgba(240,246,252,0.05)] rounded mb-2" />
                <div className="h-3 w-72 bg-[rgba(240,246,252,0.03)] rounded mb-3" />
                <div className="h-3 w-full bg-[rgba(240,246,252,0.03)] rounded" />
              </div>
            ))}
            <p className="text-center text-[12px] text-text-muted flex items-center justify-center gap-2">
              <Loader2 size={12} className="animate-spin" />AI đang tìm kiếm và phân tích nhà cung cấp...
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {results && !loading && (
          <>
            {/* Demo data warning banner */}
            {isDemoData && (
              <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
                <AlertCircle size={15} className="text-black shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-black">Kết quả demo — Tavily API key chưa hợp lệ</p>
                  <p className="text-[11px] text-black/70 mt-0.5">
                    Các nhà cung cấp bên dưới là dữ liệu mẫu. Để tìm kiếm thật, hãy cập nhật <code className="bg-amber-500/15 px-1 rounded">TAVILY_API_KEY</code> trong file <code className="bg-amber-500/15 px-1 rounded">.env</code> của server.
                  </p>
                </div>
              </div>
            )}

            {/* Results header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-[#000000]">{results.length} nhà cung cấp tìm thấy</p>
                {queryUsed && <p className="text-[10px] text-[#000000] mt-0.5">Query: &quot;{queryUsed}&quot;</p>}
              </div>
              <div className="flex items-center gap-2">
                {selected.size >= 2 && (
                  <button
                    onClick={() => setComparing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-black border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    <RefreshCw size={11} />So sánh ({selected.size})
                  </button>
                )}
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[rgba(240,246,252,0.05)] text-[#000000] border border-[rgba(240,246,252,0.08)] hover:border-[rgba(240,246,252,0.15)] transition-colors"
                >
                  <Download size={11} />Export CSV
                </button>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 text-[#000000]">
                <Search size={32} className="mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Không tìm thấy kết quả</p>
                <p className="text-[12px] mt-1">Thử thay đổi từ khóa hoặc mở rộng tiêu chí tìm kiếm</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((s, i) => (
                  <SupplierCard
                    key={i}
                    supplier={s}
                    selected={selected.has(i)}
                    onToggleSelect={() => setSelected(prev => {
                      const n = new Set(prev);
                      n.has(i) ? n.delete(i) : n.add(i);
                      return n;
                    })}
                    onImport={(sup) => handleImport(sup, i)}
                    importing={importingIdx === i}
                    onViewDetail={setDetailSupplier}
                  />
                ))}
              </div>
            )}

            {/* ── AI Chat ── */}
            <div className="mt-8 bg-[#FAF8F5] border border-[rgba(240,246,252,0.08)] rounded-2xl overflow-hidden">
              <button
                onClick={() => setChatOpen(v => !v)}
                className="w-full flex items-center gap-2 p-4 text-left hover:bg-[rgba(240,246,252,0.03)] transition-colors"
              >
                <MessageSquare size={14} className="text-violet-400" />
                <span className="font-bold text-sm text-[#000000]">Hỏi AI về kết quả tìm kiếm</span>
                {chatOpen ? <ChevronUp size={14} className="ml-auto text-[#000000]" /> : <ChevronDown size={14} className="ml-auto text-[#000000]" />}
              </button>

              {chatOpen && (
                <div className="border-t border-[rgba(240,246,252,0.06)]">
                  {/* Messages */}
                  <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                    {chatMessages.length === 0 && (
                      <div className="space-y-1.5">
                        {['Tại sao nhà cung cấp đầu điểm cao nhất?', 'So sánh 2 nhà cung cấp hàng đầu', 'Nhà nào phù hợp nhất nếu cần giao nhanh?'].map(q => (
                          <button
                            key={q}
                            onClick={() => setChatInput(q)}
                            className="block w-full text-left text-[11px] px-3 py-2 rounded-lg bg-[rgba(240,246,252,0.03)] border border-[rgba(240,246,252,0.06)] text-[#000000] hover:border-violet-500/30 hover:text-violet-300 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${m.role === 'user' ? 'bg-violet-500/20 text-violet-200' : 'bg-[rgba(240,246,252,0.05)] text-[#000000]'}`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="px-3 py-2 rounded-xl bg-[rgba(240,246,252,0.05)] text-[#000000] text-[12px] flex items-center gap-2">
                          <Loader2 size={11} className="animate-spin" />AI đang phân tích...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-[rgba(240,246,252,0.06)] flex gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAiChat()}
                      placeholder="Hỏi AI về nhà cung cấp trong kết quả..."
                      className="flex-1 px-3 py-2 text-[12px] bg-[#FFFFFF] border border-[rgba(240,246,252,0.08)] rounded-lg text-[#000000] placeholder-[#000000] focus:outline-none focus:border-violet-500/40"
                    />
                    <button
                      onClick={handleAiChat}
                      disabled={chatLoading || !chatInput.trim()}
                      className="px-3 py-2 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {!results && !loading && !error && (
          <div className="text-center py-20 text-[#000000]">
            <Sparkles size={40} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-[#000000]">Nhập từ khóa để bắt đầu tìm kiếm</p>
            <p className="text-[12px] mt-1">AI sẽ tìm kiếm và phân tích nhà cung cấp từ nguồn dữ liệu bên ngoài</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['nhà cung cấp laptop văn phòng Hà Nội', 'vật tư y tế TP.HCM', 'dịch vụ in ấn Đà Nẵng'].map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] bg-[rgba(240,246,252,0.04)] border border-[rgba(240,246,252,0.08)] text-[#000000] hover:border-violet-500/30 hover:text-violet-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Supplier Detail Modal ── */}
      {detailSupplier && (
        <SupplierDetailModal
          supplier={detailSupplier}
          onClose={() => setDetailSupplier(null)}
          onImport={(s) => {
            const idx = results?.indexOf(s) ?? -1;
            if (idx >= 0) handleImport(s, idx);
          }}
          importing={importingIdx !== null}
        />
      )}

      {/* ── Compare modal ── */}
      {comparing && selectedSuppliers.length >= 2 && (
        <ComparePanel suppliers={selectedSuppliers} onClose={() => setComparing(false)} />
      )}
    </div>
  );
}

