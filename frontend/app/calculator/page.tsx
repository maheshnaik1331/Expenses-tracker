"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import {
    IndianRupee, Percent, Calculator, TrendingUp,
    Landmark, PieChart, Clock, ChevronDown, Check, Sparkles
} from "lucide-react";

type CalcMode = "SIP" | "SIMPLE" | "COMPOUND" | "EMI";
type TimeUnit = "YEARS" | "MONTHS" | "DAYS";
type CompFreq = 1 | 2 | 4 | 12 | 365;

/* ------------------------------ COUNT-UP HOOK -------------------------------- */
function useCountUp(target: number, duration = 400) {
    const [display, setDisplay] = useState(target);
    const fromRef = useRef(target);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            setDisplay(target);
            fromRef.current = target;
            return;
        }

        const from = fromRef.current;
        const start = performance.now();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // Cubic ease-out
            setDisplay(from + (target - from) * eased);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                fromRef.current = target;
            }
        };
        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return display;
}

/* ----------------------------- MATH ENGINE ----------------------------- */
function computeFinancials(
    mode: CalcMode, sipType: "SIP" | "LUMPSUM", principal: number, rate: number,
    timeValue: number, timeUnit: TimeUnit, compFreq: CompFreq
) {
    let invested = 0;
    let maturity = 0;
    let emi = 0;

    let exactYears = timeValue;
    if (timeUnit === "MONTHS") exactYears = timeValue / 12;
    if (timeUnit === "DAYS") exactYears = timeValue / 365;

    const exactMonths = exactYears * 12;

    if (mode === "SIP") {
        if (sipType === "SIP") {
            const monthlyRate = rate / 12 / 100;
            invested = principal * exactMonths;
            if (monthlyRate > 0) {
                maturity = principal * ((Math.pow(1 + monthlyRate, exactMonths) - 1) / monthlyRate) * (1 + monthlyRate);
            } else {
                maturity = invested;
            }
        } else {
            invested = principal;
            maturity = principal * Math.pow(1 + rate / 100, exactYears);
        }
    }
    else if (mode === "SIMPLE") {
        invested = principal;
        const interest = principal * (rate / 100) * exactYears;
        maturity = principal + interest;
    }
    else if (mode === "COMPOUND") {
        invested = principal;
        const r = rate / 100;
        const n = compFreq;
        maturity = principal * Math.pow(1 + r / n, n * exactYears);
    }
    else if (mode === "EMI") {
        invested = principal;
        const monthlyRate = rate / 12 / 100;
        if (monthlyRate > 0 && exactMonths > 0) {
            emi = principal * monthlyRate * (Math.pow(1 + monthlyRate, exactMonths) / (Math.pow(1 + monthlyRate, exactMonths) - 1));
            maturity = emi * exactMonths;
        } else {
            maturity = principal;
            emi = principal / exactMonths;
        }
    }

    const returns = Math.max(0, maturity - invested);
    const total = invested + returns;
    const percentage = total > 0 ? (invested / total) * 100 : 50;

    return { invested, returns, total, percentage, emi: emi || 0 };
}

/* ------------------------- UI COMPONENTS ------------------------- */
const CustomDropdown = ({ value, options, onChange }: { value: string, options: { id: string, label: string }[], onChange: (val: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selected = options.find(o => o.id === value);

    return (
        <div className="relative" ref={ref}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
                <span className="text-xs font-black uppercase tracking-wider">{selected?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                        {options.map((opt) => (
                            <div
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <span className={`text-xs font-black uppercase tracking-wider ${value === opt.id ? 'text-blue-600' : 'text-slate-600'}`}>{opt.label}</span>
                                {value === opt.id && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function CalculatorsPage() {
    const [mode, setMode] = useState<CalcMode>("COMPOUND");

    const [principal, setPrincipal] = useState<number>(100000);
    const [rate, setRate] = useState<number>(12);
    const [timeValue, setTimeValue] = useState<number>(5);
    const [timeUnit, setTimeUnit] = useState<TimeUnit>("YEARS");
    const [compFreq, setCompFreq] = useState<CompFreq>(12);
    const [sipType, setSipType] = useState<"SIP" | "LUMPSUM">("SIP");

    const isLiability = mode === "EMI";
    const themeColor = isLiability ? "rose" : "blue";

    // 1. Calculate pure numbers
    const rawResults = useMemo(() => computeFinancials(
        mode, sipType, principal, rate, timeValue, timeUnit, compFreq
    ), [mode, sipType, principal, rate, timeValue, timeUnit, compFreq]);

    // 2. Wrap them in the custom fluid animation hook
    const animatedInvested = useCountUp(rawResults.invested);
    const animatedReturns = useCountUp(rawResults.returns);
    const animatedTotal = useCountUp(rawResults.total);
    const animatedEmi = useCountUp(rawResults.emi);

    // SVG Math
    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const investedOffset = circumference - (rawResults.percentage / 100) * circumference;

    const tabs: { id: CalcMode; label: string; icon: any }[] = [
        { id: "COMPOUND", label: "Compound", icon: TrendingUp },
        { id: "SIMPLE", label: "Simple", icon: PieChart },
        { id: "SIP", label: "SIP / Lumpsum", icon: Calculator },
        { id: "EMI", label: "Loan EMI", icon: Landmark },
    ];

    // --- INDIAN NUMBER FORMATTER LOGIC ---
    const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip out the commas so we get a raw string of numbers
        const rawValue = e.target.value.replace(/,/g, "");

        if (rawValue === "") {
            setPrincipal(0);
            return;
        }

        const numericValue = Number(rawValue);
        if (!isNaN(numericValue)) {
            setPrincipal(numericValue);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans antialiased selection:bg-blue-100 relative">
                <Navbar />

                <style dangerouslySetInnerHTML={{
                    __html: `
                    input[type='number']::-webkit-inner-spin-button, 
                    input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                    input[type='range'] { -webkit-appearance: none; background: transparent; }
                    input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: #ffffff; border: 3px solid ${isLiability ? '#e11d48' : '#2563eb'}; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.1); margin-top: -6px;}
                    input[type='range']::-webkit-slider-runnable-track { width: 100%; height: 8px; cursor: pointer; background: #f1f5f9; border-radius: 9999px; }
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                `}} />

                <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10">

                    <div className="mb-10 text-center sm:text-left border-b border-slate-200/60 pb-8">
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Financial Calculators</h1>
                        <p className="text-slate-500 text-sm mt-2 font-bold">Simulate investments, exact daily interest, and loan amortization dynamically.</p>
                    </div>

                    {/* Premium Tab Navigation */}
                    <div className="flex overflow-x-auto gap-2 p-1.5 bg-white border border-slate-200 shadow-sm rounded-2xl mb-8 scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = mode === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setMode(tab.id)}
                                    className={`relative flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all z-10 ${isActive ? (tab.id === "EMI" ? "text-rose-700" : "text-blue-700") : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="calc-active-tab"
                                            className={`absolute inset-0 rounded-xl -z-10 shadow-sm border ${tab.id === "EMI" ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'}`}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon className="w-4 h-4 font-bold" strokeWidth={2.5} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-100/60">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                            {/* Left Column: Deep Customization Inputs */}
                            <div className="lg:col-span-7 space-y-10">

                                <AnimatePresence mode="wait">
                                    {mode === "SIP" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex p-1.5 bg-slate-100 border border-slate-200/60 rounded-xl w-fit">
                                            <button onClick={() => setSipType("SIP")} className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${sipType === "SIP" ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>SIP</button>
                                            <button onClick={() => setSipType("LUMPSUM")} className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${sipType === "LUMPSUM" ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Lumpsum</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            {mode === "SIP" && sipType === "SIP" ? "Monthly Installment" : mode === "EMI" ? "Total Loan Amount" : "Principal Capital"}
                                        </label>
                                        <div className={`flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus-within:ring-2 focus-within:ring-${themeColor}-500/20 focus-within:border-${themeColor}-400 transition-all`}>
                                            <IndianRupee className={`w-4 h-4 text-slate-400 font-bold`} strokeWidth={2.5} />
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={principal === 0 ? "" : principal.toLocaleString("en-IN")}
                                                onChange={handlePrincipalChange}
                                                className={`w-36 bg-transparent text-right text-lg font-black font-mono text-slate-900 outline-none`}
                                            />
                                        </div>
                                    </div>
                                    <div className="relative pt-2">
                                        <div className={`absolute left-0 top-3 h-2 rounded-l-full pointer-events-none ${isLiability ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (principal / 1000000) * 100)}%` }}></div>
                                        <input
                                            type="range" min={1000} max={1000000} step={1000} value={principal} onChange={(e) => setPrincipal(Number(e.target.value))}
                                            className="w-full relative z-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            Interest Rate (p.a.)
                                        </label>
                                        <div className={`flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus-within:ring-2 focus-within:ring-${themeColor}-500/20 focus-within:border-${themeColor}-400 transition-all`}>
                                            <input
                                                type="number" min={0} max={30} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))}
                                                className={`w-16 bg-transparent text-right text-lg font-black font-mono text-slate-900 outline-none`}
                                            />
                                            <Percent className={`w-4 h-4 text-slate-400 font-bold`} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    <div className="relative pt-2">
                                        <div className={`absolute left-0 top-3 h-2 rounded-l-full pointer-events-none ${isLiability ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (rate / 30) * 100)}%` }}></div>
                                        <input
                                            type="range" min={1} max={30} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))}
                                            className="w-full relative z-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            Investment Duration
                                        </label>
                                        <div className={`flex items-center gap-3 bg-slate-50 border border-slate-200 pl-4 pr-1.5 py-1.5 rounded-xl focus-within:ring-2 focus-within:ring-${themeColor}-500/20 focus-within:border-${themeColor}-400 transition-all`}>
                                            <Clock className="w-4 h-4 text-slate-400 font-bold" strokeWidth={2.5} />
                                            <input
                                                type="number" min={1} value={timeValue} onChange={(e) => setTimeValue(Number(e.target.value))}
                                                className={`w-12 bg-transparent text-right text-lg font-black font-mono text-slate-900 outline-none`}
                                            />
                                            <CustomDropdown
                                                value={timeUnit}
                                                onChange={setTimeUnit}
                                                options={[{ id: "YEARS", label: "Yrs" }, { id: "MONTHS", label: "Mo" }, { id: "DAYS", label: "Days" }]}
                                            />
                                        </div>
                                    </div>
                                    <div className="relative pt-2">
                                        <div className={`absolute left-0 top-3 h-2 rounded-l-full pointer-events-none ${isLiability ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (timeValue / (timeUnit === "YEARS" ? 40 : timeUnit === "MONTHS" ? 120 : 3650)) * 100)}%` }}></div>
                                        <input
                                            type="range" min={1} max={timeUnit === "YEARS" ? 40 : timeUnit === "MONTHS" ? 120 : 3650} step={1} value={timeValue} onChange={(e) => setTimeValue(Number(e.target.value))}
                                            className="w-full relative z-10"
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {mode === "COMPOUND" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-4">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-3">
                                                Compounding Frequency
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {[
                                                    { val: 1, label: "Annually" },
                                                    { val: 4, label: "Quarterly" },
                                                    { val: 12, label: "Monthly" },
                                                    { val: 365, label: "Daily" },
                                                ].map((freq) => (
                                                    <button
                                                        key={freq.val} type="button"
                                                        onClick={() => setCompFreq(freq.val as CompFreq)}
                                                        className={`py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${compFreq === freq.val ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                                                    >
                                                        {freq.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right Column: Dynamic SVG Donut & Results */}
                            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-slate-200/60 rounded-[2rem]">

                                {/* Donut Chart */}
                                <div className="relative w-56 h-56 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 180 180">
                                        <circle
                                            cx="90" cy="90" r={radius}
                                            className={isLiability ? "stroke-rose-400" : "stroke-blue-500"}
                                            strokeWidth="22" fill="transparent"
                                        />
                                        <circle
                                            cx="90" cy="90" r={radius}
                                            className="stroke-slate-900 transition-all duration-700 ease-out"
                                            strokeWidth="22" fill="transparent"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={investedOffset}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {isLiability ? "Monthly EMI" : "Final Value"}
                                        </span>
                                        <span className={`text-2xl font-black font-mono tracking-tight mt-0.5 ${isLiability ? "text-rose-600" : "text-slate-900"}`}>
                                            ₹{isLiability ? Math.round(animatedEmi).toLocaleString("en-IN") : Math.round(animatedTotal).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>

                                {/* Animated Data Breakdown Cards */}
                                <div className="w-full mt-10 space-y-4">
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                                <span className="w-3 h-3 rounded-full bg-slate-900 shadow-sm" />
                                            </div>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{isLiability ? "Principal Loan" : "Total Invested"}</span>
                                        </div>
                                        <span className="font-mono text-sm font-black text-slate-900">₹{Math.round(animatedInvested).toLocaleString("en-IN")}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isLiability ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'}`}>
                                                <span className={`w-3 h-3 rounded-full shadow-sm ${isLiability ? "bg-rose-500" : "bg-blue-600"}`} />
                                            </div>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{isLiability ? "Total Interest Payable" : "Wealth Generated"}</span>
                                        </div>
                                        <span className={`font-mono text-sm font-black ${isLiability ? "text-rose-600" : "text-blue-600"}`}>
                                            {isLiability ? "" : "+"}₹{Math.round(animatedReturns).toLocaleString("en-IN")}
                                        </span>
                                    </div>

                                    {isLiability && (
                                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg mt-2">
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-rose-400" /> Total Repayment
                                            </span>
                                            <span className="font-mono text-base font-black text-white">₹{Math.round(animatedTotal).toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}