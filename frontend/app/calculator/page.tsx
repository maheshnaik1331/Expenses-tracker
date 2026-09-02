"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import {
    IndianRupee, Percent, Calendar, Sparkles,
    Calculator, TrendingUp, Landmark, PieChart,
    ChevronDown, Clock
} from "lucide-react";

type CalcMode = "SIP" | "SIMPLE" | "COMPOUND" | "EMI";
type TimeUnit = "YEARS" | "MONTHS" | "DAYS";
type CompFreq = 1 | 2 | 4 | 12 | 365;

export default function CalculatorsPage() {
    const [mode, setMode] = useState<CalcMode>("COMPOUND");

    // Shared State
    const [principal, setPrincipal] = useState<number>(100000);
    const [rate, setRate] = useState<number>(12);

    // Highly Customized Temporal State
    const [timeValue, setTimeValue] = useState<number>(5);
    const [timeUnit, setTimeUnit] = useState<TimeUnit>("YEARS");
    const [compFreq, setCompFreq] = useState<CompFreq>(12); // Default Monthly compounding

    // SIP Specific State
    const [sipType, setSipType] = useState<"SIP" | "LUMPSUM">("SIP");

    // --- PURE CLIENT-SIDE FINANCIAL ENGINE ---
    const results = useMemo(() => {
        let invested = 0;
        let maturity = 0;
        let emi = 0;

        // Temporal Conversion to exact Years
        let exactYears = timeValue;
        if (timeUnit === "MONTHS") exactYears = timeValue / 12;
        if (timeUnit === "DAYS") exactYears = timeValue / 365;

        const exactMonths = exactYears * 12;

        if (mode === "SIP") {
            if (sipType === "SIP") {
                const monthlyRate = rate / 12 / 100;
                invested = principal * exactMonths; // principal acts as monthly installment here
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
            invested = principal; // Loan amount
            const monthlyRate = rate / 12 / 100;
            if (monthlyRate > 0 && exactMonths > 0) {
                emi = principal * monthlyRate * (Math.pow(1 + monthlyRate, exactMonths) / (Math.pow(1 + monthlyRate, exactMonths) - 1));
                maturity = emi * exactMonths; // Total payable
            } else {
                maturity = principal;
                emi = principal / exactMonths;
            }
        }

        const returns = Math.max(0, maturity - invested);
        const total = invested + returns;
        const percentage = total > 0 ? (invested / total) * 100 : 50;

        return {
            invested: Math.round(invested),
            returns: Math.round(returns),
            total: Math.round(maturity),
            percentage,
            emi: Math.round(emi || 0)
        };
    }, [mode, principal, rate, timeValue, timeUnit, compFreq, sipType]);

    // Donut Chart SVG Math
    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    const investedOffset = circumference - (results.percentage / 100) * circumference;

    const tabs: { id: CalcMode; label: string; icon: any }[] = [
        { id: "COMPOUND", label: "Compound", icon: TrendingUp },
        { id: "SIMPLE", label: "Simple", icon: PieChart },
        { id: "SIP", label: "SIP / Lumpsum", icon: Calculator },
        { id: "EMI", label: "Loan EMI", icon: Landmark },
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans antialiased selection:bg-blue-100 relative">
                <Navbar />

                <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10">

                    <div className="mb-10 text-center sm:text-left border-b border-slate-200/60 pb-8">
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Financial Calculators</h1>
                        <p className="text-slate-500 text-sm mt-2 font-bold">Simulate investments, exact daily interest, and loan amortization without saving data.</p>
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
                                    className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${isActive ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon className="w-4 h-4 font-bold" strokeWidth={2.5} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-100/60">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                            {/* Left Column: Deep Customization Inputs */}
                            <div className="lg:col-span-7 space-y-8">

                                {/* Header Toggle for SIP mode */}
                                {mode === "SIP" && (
                                    <div className="flex p-1.5 bg-slate-100 border border-slate-200/60 rounded-xl w-fit mb-4">
                                        <button onClick={() => setSipType("SIP")} className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${sipType === "SIP" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>SIP</button>
                                        <button onClick={() => setSipType("LUMPSUM")} className={`px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${sipType === "LUMPSUM" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Lumpsum</button>
                                    </div>
                                )}

                                {/* Input 1: Principal / Amount */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-3">
                                        {mode === "SIP" && sipType === "SIP" ? "Monthly Installment" : mode === "EMI" ? "Total Loan Amount" : "Principal Amount"}
                                    </label>
                                    <div className="flex items-center bg-slate-50 border border-slate-200/60 px-4 py-3 rounded-xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                                        <IndianRupee className="w-5 h-5 text-slate-400 font-bold" />
                                        <input
                                            type="number" min={0}
                                            value={principal} onChange={(e) => setPrincipal(Number(e.target.value))}
                                            className="w-full bg-transparent text-xl font-black font-mono text-slate-900 px-3 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Input 2: Interest Rate */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-3">
                                        Interest Rate (Annual % p.a.)
                                    </label>
                                    <div className="flex items-center bg-slate-50 border border-slate-200/60 px-4 py-3 rounded-xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                                        <Percent className="w-5 h-5 text-slate-400 font-bold" />
                                        <input
                                            type="number" min={0} step={0.1}
                                            value={rate} onChange={(e) => setRate(Number(e.target.value))}
                                            className="w-full bg-transparent text-xl font-black font-mono text-slate-900 px-3 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Input 3: Super Customized Temporal Input */}
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-3">
                                        Temporal Duration
                                    </label>
                                    <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all p-1.5 overflow-hidden">
                                        <div className="flex items-center pl-3">
                                            <Clock className="w-5 h-5 text-slate-400 font-bold" />
                                        </div>
                                        <input
                                            type="number" min={1}
                                            value={timeValue} onChange={(e) => setTimeValue(Number(e.target.value))}
                                            className="w-full bg-transparent text-xl font-black font-mono text-slate-900 px-3 focus:outline-none border-r border-slate-200/60"
                                        />
                                        <select
                                            value={timeUnit} onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
                                            className="bg-transparent text-sm font-black text-slate-700 px-4 py-2 cursor-pointer focus:outline-none appearance-none pr-8 relative"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 8px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
                                        >
                                            <option value="YEARS">Years</option>
                                            <option value="MONTHS">Months</option>
                                            <option value="DAYS">Days</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Input 4: Compounding Frequency (Only visible in COMPOUND mode) */}
                                <AnimatePresence>
                                    {mode === "COMPOUND" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
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
                                                        className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${compFreq === freq.val ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
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
                                    <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 180 180">
                                        {/* Background Arc (Returns/Interest - Blue/Rose) */}
                                        <circle
                                            cx="90" cy="90" r={radius}
                                            className={mode === "EMI" ? "stroke-rose-400" : "stroke-blue-500"}
                                            strokeWidth="24" fill="transparent"
                                        />
                                        {/* Foreground Arc (Invested/Principal - Indigo) */}
                                        <circle
                                            cx="90" cy="90" r={radius}
                                            className="stroke-slate-900 transition-all duration-700 ease-out"
                                            strokeWidth="24" fill="transparent"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={investedOffset}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {mode === "EMI" ? "Monthly EMI" : "Final Value"}
                                        </span>
                                        <span className={`text-2xl font-black font-mono tracking-tight mt-0.5 ${mode === "EMI" ? "text-rose-600" : "text-slate-900"}`}>
                                            ₹{mode === "EMI" ? results.emi.toLocaleString("en-IN") : results.total.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>

                                {/* Data Breakdown */}
                                <div className="w-full mt-10 space-y-4">
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-slate-900 shadow-sm" />
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{mode === "EMI" ? "Principal Loan" : "Total Invested"}</span>
                                        </div>
                                        <span className="font-mono text-sm font-black text-slate-900">₹{results.invested.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full shadow-sm ${mode === "EMI" ? "bg-rose-400" : "bg-blue-500"}`} />
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{mode === "EMI" ? "Total Interest Payable" : "Wealth Generated"}</span>
                                        </div>
                                        <span className={`font-mono text-sm font-black ${mode === "EMI" ? "text-rose-600" : "text-blue-600"}`}>
                                            {mode === "EMI" ? "" : "+"}₹{results.returns.toLocaleString("en-IN")}
                                        </span>
                                    </div>

                                    {mode === "EMI" && (
                                        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Total Repayment</span>
                                            <span className="font-mono text-base font-black text-white">₹{results.total.toLocaleString("en-IN")}</span>
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