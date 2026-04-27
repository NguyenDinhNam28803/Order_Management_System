"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    PenTool, CheckCircle2, X, Building2, Calendar, Banknote,
    AlertCircle, ShieldCheck, FileText,
} from "lucide-react";
import { Contract } from "../types/api-types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalStep = "review" | "verify" | "signing" | "success";

export interface ContractSignModalProps {
    contract: Contract | null;       // null = closed
    isBuyer: boolean;
    signerName: string;              // currentUser?.name || currentUser?.email
    onClose: () => void;
    onConfirm: (id: string, isBuyer: boolean) => Promise<boolean>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function buildSigRef(): string {
    const now = new Date();
    const year = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const suffix = String(Math.floor(100000 + Math.random() * 900000));
    return `SIG-${year}-${mm}${dd}-${suffix}`;
}

function fmtCurrency(value: number, currency: string) {
    return `${Number(value).toLocaleString("vi-VN")} ${currency}`;
}

function fmtDate(s?: string) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("vi-VN");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContractSignModal({
    contract,
    isBuyer,
    signerName,
    onClose,
    onConfirm,
}: ContractSignModalProps) {
    const [step, setStep]         = useState<ModalStep>("review");
    const [agreed, setAgreed]     = useState(false);
    const [code, setCode]         = useState(() => generateCode());
    const [inputs, setInputs]     = useState<string[]>(["","","","","",""]);
    const [countdown, setCountdown] = useState(60);
    const [error, setError]       = useState<string | null>(null);
    const [sigRef, setSigRef]     = useState("");
    const [signedAt, setSignedAt] = useState<Date | null>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Reset when contract changes (new modal opened)
    useEffect(() => {
        if (contract) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStep("review");
            setAgreed(false);
            setCode(generateCode());
            setInputs(["","","","","",""]);
            setCountdown(60);
            setError(null);
            setSigRef("");
            setSignedAt(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contract?.id]);

    // ── Prevent background scroll when modal is open ──
    useEffect(() => {
        const mainEl = document.querySelector('main.flex-1.overflow-y-auto');
        if (contract) {
            document.body.style.overflow = "hidden";
            if (mainEl instanceof HTMLElement) mainEl.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            if (mainEl instanceof HTMLElement) mainEl.style.overflow = "auto";
        }
        return () => { 
            document.body.style.overflow = "unset";
            if (mainEl instanceof HTMLElement) mainEl.style.overflow = "auto";
        };
    }, [contract]);

    // Countdown timer while on verify step
    useEffect(() => {
        if (step !== "verify") return;
        const id = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setCode(generateCode());
                    setInputs(["","","","","",""]);
                    setError(null);
                    inputRefs.current[0]?.focus();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [step]);

    const enterVerify = useCallback(() => {
        setCode(generateCode());
        setInputs(["","","","","",""]);
        setCountdown(60);
        setError(null);
        setStep("verify");
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }, []);

    const handleOtpChange = (idx: number, val: string) => {
        const digit = val.replace(/\D/g, "").slice(-1);
        const next = [...inputs];
        next[idx] = digit;
        setInputs(next);
        setError(null);
        if (digit && idx < 5) {
            setTimeout(() => inputRefs.current[idx + 1]?.focus(), 10);
        }
    };

    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !inputs[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const handleConfirm = async () => {
        const entered = inputs.join("");
        if (entered !== code) {
            setError("Mã không đúng. Vui lòng kiểm tra lại.");
            setInputs(["","","","","",""]);
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
            return;
        }
        setStep("signing");
        const ok = await onConfirm(contract!.id, isBuyer);
        if (ok) {
            setSigRef(buildSigRef());
            setSignedAt(new Date());
            setStep("success");
        } else {
            setError("Ký hợp đồng thất bại. Vui lòng thử lại.");
            setStep("verify");
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
    };

    if (!contract) return null;

    const enteredCode = inputs.join("");
    const codeMatches = enteredCode.length === 6 && enteredCode === code;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            {/* Backdrop — locked during signing */}
            <div
                className="absolute inset-0 bg-[#FFFFFF]/60 backdrop-blur-md pointer-events-auto"
                onClick={step !== "signing" ? onClose : undefined}
            />

            <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-[2rem] border border-[rgba(148,163,184,0.1)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col max-h-[92vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200">

                {/* ── Header ── */}
                <div className="px-8 py-6 border-b border-[rgba(148,163,184,0.08)] bg-[#FFFFFF] rounded-t-[2rem] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <PenTool size={16} className="text-black" />
                        </div>
                        <div>
                            <p className="font-black text-[#000000] text-sm">Ký hợp đồng điện tử</p>
                            <p className="text-[10px] text-[#000000] font-mono">#{contract.contractNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <StepIndicator step={step} />
                        {step !== "signing" && (
                            <button
                                onClick={onClose}
                                className="p-1.5 text-[#000000] hover:text-[#000000] hover:bg-[rgba(148,163,184,0.08)] rounded-lg transition-all"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">

                    {/* STEP 1: Review */}
                    {step === "review" && (
                        <div className="p-6 space-y-5">
                            {/* Contract info grid */}
                            <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.08)] p-4 space-y-3">
                                <InfoRow icon={<FileText size={13} className="text-[#000000]" />} label="Tiêu đề">
                                    <span className="font-bold text-[#000000]">{contract.title}</span>
                                </InfoRow>
                                <InfoRow icon={<Building2 size={13} className="text-[#000000]" />} label="Nhà cung cấp">
                                    <span className="text-[#000000]">{contract.supplier?.name || "—"}</span>
                                </InfoRow>
                                <InfoRow icon={<Banknote size={13} className="text-[#000000]" />} label="Giá trị">
                                    <span className="font-bold text-black">
                                        {fmtCurrency(contract.totalValue, contract.currency)}
                                    </span>
                                </InfoRow>
                                <InfoRow icon={<Calendar size={13} className="text-[#000000]" />} label="Thời hạn">
                                    <span className="text-[#000000]">
                                        {fmtDate(contract.startDate)} → {fmtDate(contract.endDate)}
                                    </span>
                                </InfoRow>
                            </div>

                            {/* Description / terms */}
                            {contract.description && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-2">Mô tả</p>
                                    <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.08)] p-3 max-h-28 overflow-y-auto">
                                        <p className="text-xs text-[#000000] leading-relaxed">{contract.description}</p>
                                    </div>
                                </div>
                            )}

                            {/* Legal notice */}
                            <div className="flex gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                                <AlertCircle size={15} className="text-black shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                    Bằng cách ký hợp đồng này, bạn đồng ý chịu ràng buộc pháp lý bởi tất cả các điều khoản và điều kiện được nêu trong tài liệu.
                                </p>
                            </div>

                            {/* Agreement checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={e => setAgreed(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-[rgba(148,163,184,0.3)] accent-emerald-500 cursor-pointer"
                                />
                                <span className="text-sm text-[#000000] group-hover:text-[#000000] transition-colors leading-relaxed">
                                    Tôi đã đọc, hiểu và đồng ý với tất cả các điều khoản hợp đồng
                                </span>
                            </label>
                        </div>
                    )}

                    {/* STEP 2: Verify */}
                    {step === "verify" && (
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-[#000000] leading-relaxed">
                                    Nhập lại mã xác nhận bên dưới để tiến hành ký số
                                </p>
                            </div>

                            {/* Code display */}
                            <div className="bg-[#FFFFFF] border border-emerald-500/30 rounded-2xl p-5 text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#000000] mb-2">
                                    Mã xác nhận của bạn
                                </p>
                                <p className="font-mono font-black text-4xl tracking-[0.35em] text-black select-all">
                                    {code}
                                </p>
                                <p className={`text-xs mt-2 font-medium ${countdown <= 10 ? "text-black" : "text-[#000000]"}`}>
                                    Mã hết hạn sau: <span className="font-black">{countdown}s</span>
                                </p>
                            </div>

                            {/* OTP input boxes */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] text-center mb-3">
                                    Nhập mã xác nhận
                                </p>
                                <div className="flex justify-center gap-2">
                                    {inputs.map((val, idx) => (
                                        <input
                                            key={idx}
                                            ref={el => { inputRefs.current[idx] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength={1}
                                            value={val}
                                            onChange={e => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                                            className={`w-11 h-14 text-center text-xl font-black rounded-xl border bg-[#FFFFFF] text-[#000000] outline-none transition-all
                                                ${val ? "border-emerald-500/60 text-black" : "border-[rgba(148,163,184,0.15)]"}
                                                focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30`}
                                        />
                                    ))}
                                </div>
                                {error && (
                                    <p className="text-black text-xs text-center mt-3 font-medium">{error}</p>
                                )}
                            </div>

                            {/* Back link */}
                            <div className="text-center">
                                <button
                                    onClick={() => { setStep("review"); setError(null); }}
                                    className="text-xs text-[#000000] hover:text-[#000000] underline underline-offset-2 transition-colors"
                                >
                                    ← Quay lại xem hợp đồng
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Signing */}
                    {step === "signing" && (
                        <div className="p-10 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
                                <PenTool size={32} className="text-black" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-[#000000] text-base">Đang xử lý chữ ký số...</p>
                                <p className="text-xs text-[#000000] mt-1">Vui lòng không đóng cửa sổ này</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Success */}
                    {step === "success" && (
                        <div className="p-6 space-y-5">
                            {/* Animated checkmark */}
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center animate-in zoom-in duration-300">
                                    <CheckCircle2 size={40} className="text-black" />
                                </div>
                            </div>
                            <p className="text-center font-black text-[#000000] text-lg">Ký hợp đồng thành công!</p>

                            {/* Signature receipt */}
                            <div className="bg-[#FFFFFF] rounded-xl border border-emerald-500/20 p-4 space-y-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#000000] flex items-center gap-1.5">
                                    <ShieldCheck size={11} className="text-black" /> Phiếu xác nhận chữ ký số
                                </p>
                                <div className="space-y-2">
                                    <ReceiptRow label="Mã tham chiếu">
                                        <span className="font-mono font-black text-black text-sm">{sigRef}</span>
                                    </ReceiptRow>
                                    <ReceiptRow label="Người ký">
                                        <span className="text-[#000000] font-medium text-sm">{signerName}</span>
                                    </ReceiptRow>
                                    <ReceiptRow label="Vai trò">
                                        <span className="text-[#000000] text-sm">{isBuyer ? "Bên mua (Buyer)" : "Nhà cung cấp (Supplier)"}</span>
                                    </ReceiptRow>
                                    <ReceiptRow label="Thời gian">
                                        <span className="text-[#000000] text-sm">
                                            {signedAt?.toLocaleString("vi-VN")}
                                        </span>
                                    </ReceiptRow>
                                    <ReceiptRow label="Hợp đồng">
                                        <span className="font-mono text-[#000000] text-sm">#{contract.contractNumber}</span>
                                    </ReceiptRow>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-8 py-6 border-t border-[rgba(148,163,184,0.08)] bg-[#FFFFFF] rounded-b-[2rem] shrink-0">
                    {step === "review" && (
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] text-[#000000] font-bold text-sm hover:bg-[#1A1D23] transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={enterVerify}
                                disabled={!agreed}
                                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#000000] font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <PenTool size={14} /> Tiếp tục ký
                            </button>
                        </div>
                    )}

                    {step === "verify" && (
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] text-[#000000] font-bold text-sm hover:bg-[#1A1D23] transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!codeMatches}
                                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#000000] font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <ShieldCheck size={14} /> Xác nhận ký
                            </button>
                        </div>
                    )}

                    {step === "signing" && (
                        <div className="h-10 flex items-center justify-center">
                            <span className="text-xs text-[#000000]">Đang xử lý...</span>
                        </div>
                    )}

                    {step === "success" && (
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#000000] font-black text-sm transition-all"
                        >
                            Hoàn tất
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: ModalStep }) {
    const steps: ModalStep[] = ["review", "verify", "signing", "success"];
    const current = steps.indexOf(step) + 1;
    const total = 3; // success doesn't count as a "step" to complete
    if (step === "signing" || step === "success") return null;
    return (
        <span className="text-[10px] font-bold text-[#000000] bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] px-2 py-0.5 rounded-full">
            Bước {current} / {total}
        </span>
    );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 w-32 shrink-0">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-wider text-[#000000]">{label}</span>
            </div>
            <div className="text-sm">{children}</div>
        </div>
    );
}

function ReceiptRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 py-1 border-b border-[rgba(148,163,184,0.06)] last:border-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#000000] shrink-0">{label}</span>
            {children}
        </div>
    );
}

