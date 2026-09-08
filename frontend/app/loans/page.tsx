"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Loader2, Plus, ArrowDownRight, ArrowUpRight,
    Scale, Calendar, CheckCircle2, MoreVertical, ShieldCheck,
    User, Building2, Percent, Wallet, Home, Briefcase, Coins,
    Pencil, Trash2, Clock, X, ChevronDown, Check, ShieldAlert,
    CheckSquare, Banknote, ListCollapse, Receipt, History, TrendingUp, Landmark
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const LOAN_TYPES = [
    { id: "PERSONAL", label: "Personal", icon: User },
    { id: "HOME", label: "Home", icon: Home },
    { id: "BUSINESS", label: "Business", icon: Briefcase },
    { id: "GOLD", label: "Gold", icon: Coins },
];

// --- UTILITIES ---
const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const parseAccountName = (nameStr: string) => nameStr?.includes("::") ? nameStr.split("::")[1] : nameStr;

const getAccountIconNode = (acc: any, sizeClass = "w-5 h-5") => {
    if (!acc) return <Landmark className={`${sizeClass} text-slate-400`} />;
    const [parsedBankId] = acc.name.includes("::") ? acc.name.split("::") : [null];
    const bankConfig = parsedBankId ? INDIAN_BANK_DIRECTORY.find(b => b.id === parsedBankId) : null;
    const isCash = acc.type === 'CASH';

    if (isCash) return <Banknote className={`${sizeClass} text-emerald-600 font-bold`} />;
    if (bankConfig) return <img src={`https://img.logo.dev/${bankConfig.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} className={`${sizeClass} object-contain`} />;
    return <Landmark className={`${sizeClass} text-blue-600 font-bold`} />;
};

// --- ULTRA-PREMIUM INTERACTIVE DROPDOWN WITH ICONS & WRAPPING TEXT ---
const PremiumDropdown = ({ value, options, onChange, icon: Icon, label, placeholder = "Select..." }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-300 hover:border-blue-400 rounded-xl px-4 min-h-[56px] flex justify-between items-center transition-all shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 cursor-pointer"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1 py-2">
                    {selectedOption?.iconNode ? selectedOption.iconNode : (Icon && <Icon className="w-5 h-5 text-slate-400 font-bold shrink-0" />)}

                    <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-sm font-bold text-slate-900 break-words whitespace-normal leading-tight w-full pr-2">
                            {selectedOption?.label || placeholder}
                        </span>
                        {selectedOption?.balance && (
                            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest mt-1 bg-blue-50 px-2 py-0.5 rounded-md">
                                {selectedOption.balance} Available
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col z-[9999]"
                    >
                        <div className="max-h-72 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {options.map((opt: any) => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {opt.iconNode}
                                        <div className="flex flex-col items-start min-w-0 flex-1 pr-2">
                                            <span className={`text-sm break-words whitespace-normal leading-tight w-full ${value === opt.value ? 'font-black text-blue-600' : 'font-bold text-slate-700'}`}>
                                                {opt.label}
                                            </span>
                                            {opt.balance && (
                                                <span className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 rounded-md ${value === opt.value ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {opt.balance}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {value === opt.value && <Check className="w-4 h-4 text-blue-600 font-bold shrink-0 ml-2" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- STRICT BANKING MATHEMATICS ENGINE ---
const calculateFinancials = (loan: any) => {
    const originalPrincipal = parseFloat(loan.principal) || 0;
    const rate = parseFloat(loan.monthlyRate) || 0;
    const isCompound = loan.interestType === 'COMPOUND';

    let currentPrincipal = originalPrincipal;
    let historicalAccruedInterest = 0;
    let totalPaidInterest = 0;
    let totalPaidPrincipal = 0;

    const stripTime = (dateInput: any) => {
        const d = new Date(dateInput);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };

    const calculateInterestForPeriod = (principal: number, startDate: number, endDate: number, accruedInterestSoFar: number) => {
        if (endDate <= startDate) return 0;
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        const monthsAccrued = diffDays / (365 / 12);

        if (isCompound) {
            const principalForInterest = principal + Math.max(0, accruedInterestSoFar - totalPaidInterest);
            return principalForInterest * (Math.pow(1 + (rate / 100), monthsAccrued) - 1);
        } else {
            return principal * (rate / 100) * monthsAccrued;
        }
    };

    const sortedTxs = [...(loan.transactions || [])].sort((a, b) => stripTime(a.date) - stripTime(b.date));
    let lastDate = stripTime(loan.startDate);

    sortedTxs.forEach((tx: any) => {
        const txDate = stripTime(tx.date);
        historicalAccruedInterest += calculateInterestForPeriod(currentPrincipal, lastDate, txDate, historicalAccruedInterest);

        if (tx.paymentType === 'PRINCIPAL') {
            currentPrincipal -= tx.amount;
            totalPaidPrincipal += tx.amount;
        } else if (tx.paymentType === 'INTEREST') {
            totalPaidInterest += tx.amount;
        }
        lastDate = txDate;
    });

    const today = stripTime(new Date());
    const clearedDate = loan.clearedDate ? stripTime(loan.clearedDate) : null;
    const activeEndDate = clearedDate || today;

    let currentAccruedInterest = historicalAccruedInterest;
    if (activeEndDate > lastDate) {
        currentAccruedInterest += calculateInterestForPeriod(currentPrincipal, lastDate, activeEndDate, historicalAccruedInterest);
    }

    let projectedAccruedInterest = currentAccruedInterest;
    const dueDate = loan.dueDate ? stripTime(loan.dueDate) : null;

    if (!clearedDate && dueDate && dueDate > today) {
        projectedAccruedInterest += calculateInterestForPeriod(currentPrincipal, today, dueDate, currentAccruedInterest);
    }

    const currentOutstandingInterest = Math.max(0, currentAccruedInterest - totalPaidInterest);
    const projectedOutstandingInterest = Math.max(0, projectedAccruedInterest - totalPaidInterest);

    return {
        originalPrincipal,
        currentPrincipal: Math.max(0, currentPrincipal),
        currentAccruedInterest,
        currentOutstandingInterest,
        totalCurrentOutstanding: Math.max(0, currentPrincipal) + currentOutstandingInterest,
        projectedOutstandingInterest,
        totalProjectedOutstanding: Math.max(0, currentPrincipal) + projectedOutstandingInterest,
        totalPaidInterest,
        totalPaidPrincipal,
    };
};

// --- LIFECYCLE TIMELINE BUILDER ---
const buildLedgerTimeline = (loan: any) => {
    const timeline: any[] = [];

    if (loan.status === "CLEARED" && loan.clearedDate) {
        timeline.push({
            id: "settlement-event",
            isSynthetic: true,
            title: "Instrument Settled & Closed",
            date: loan.clearedDate,
            icon: CheckCircle2,
            color: "emerald"
        });
    }

    const sortedTxs = [...(loan.transactions || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sortedTxs.forEach(tx => {
        timeline.push({
            id: tx.id,
            isSynthetic: false,
            title: tx.paymentType === 'PRINCIPAL' ? 'Principal Repayment' : 'Interest Payment',
            date: tx.date,
            icon: tx.paymentType === 'PRINCIPAL' ? Building2 : Percent,
            color: "blue",
            amount: tx.amount
        });
    });

    timeline.push({
        id: "origination-event",
        isSynthetic: true,
        title: "Instrument Originated",
        date: loan.startDate,
        icon: Calendar,
        color: "slate",
        amount: loan.principal
    });

    return timeline;
};

export default function LoansPage() {
    const { user, loading } = useAuth();

    const [loans, setLoans] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
    const [loanToSettle, setLoanToSettle] = useState<any | null>(null);
    const [loanToPay, setLoanToPay] = useState<any | null>(null);
    const [loanHistory, setLoanHistory] = useState<any | null>(null);

    const [filterMode, setFilterMode] = useState<"ALL" | "BORROWED" | "LENT">("ALL");
    const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "CLEARED">("ACTIVE");

    const [form, setForm] = useState({
        direction: "BORROWED" as "BORROWED" | "LENT",
        interestType: "SIMPLE",
        counterparty: "",
        type: "PERSONAL",
        principal: "",
        monthlyRate: "",
        startDate: new Date().toISOString().split('T')[0],
        dueDate: ""
    });

    const [paymentPrincipal, setPaymentPrincipal] = useState("");
    const [paymentInterest, setPaymentInterest] = useState("");
    const [paymentAccountId, setPaymentAccountId] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchLedgerData = async () => {
        try {
            setFetching(true);
            const [loansRes, accountsRes] = await Promise.all([
                api.get("/loans"),
                api.get("/accounts")
            ]);
            setLoans(loansRes.data || []);
            setAccounts(accountsRes.data || []);

            if (accountsRes.data.length > 0 && !paymentAccountId) {
                setPaymentAccountId(accountsRes.data[0].id);
            }
        } catch (err) {
            toast.error("Failed to synchronize ledger records.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && user) fetchLedgerData();
    }, [user, loading]);

    const resetForm = () => {
        setForm({
            direction: "BORROWED",
            interestType: "SIMPLE",
            counterparty: "",
            type: "PERSONAL",
            principal: "",
            monthlyRate: "",
            startDate: new Date().toISOString().split('T')[0],
            dueDate: ""
        });
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (loan: any) => {
        setForm({
            direction: loan.direction,
            interestType: loan.interestType || "SIMPLE",
            counterparty: loan.counterparty,
            type: loan.type,
            principal: loan.principal.toLocaleString("en-IN", { maximumFractionDigits: 2 }),
            monthlyRate: loan.monthlyRate ? loan.monthlyRate.toString() : "",
            startDate: new Date(loan.startDate).toISOString().split('T')[0],
            dueDate: loan.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : ""
        });
        setEditingId(loan.id);
        setIsFormOpen(true);
    };

    const openPaymentModal = (loan: any) => {
        setLoanToPay(loan);
        setPaymentPrincipal("");
        setPaymentInterest("");
        setPaymentDate(new Date().toISOString().split('T')[0]);
        if (accounts.length > 0) setPaymentAccountId(accounts[0].id);
    };

    // Number Format Handlers
    const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "") return setForm({ ...form, principal: "" });
        if (!isNaN(Number(rawValue))) setForm({ ...form, principal: Number(rawValue).toLocaleString("en-IN") });
    };

    const handlePaymentPrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "") return setPaymentPrincipal("");
        if (!isNaN(Number(rawValue))) setPaymentPrincipal(Number(rawValue).toLocaleString("en-IN"));
    };

    const handlePaymentInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "") return setPaymentInterest("");
        if (!isNaN(Number(rawValue))) setPaymentInterest(Number(rawValue).toLocaleString("en-IN"));
    };

    const confirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loanToPay || !paymentAccountId || !paymentDate) return;

        const cleanPrin = paymentPrincipal.replace(/,/g, "");
        const cleanInt = paymentInterest.replace(/,/g, "");
        const pAmount = parseFloat(cleanPrin) || 0;
        const iAmount = parseFloat(cleanInt) || 0;

        if (pAmount <= 0 && iAmount <= 0) {
            return toast.error("Payment amount must be greater than zero.");
        }

        try {
            setSubmitting(true);
            await api.patch(`/loans/${loanToPay.id}/pay`, {
                accountId: paymentAccountId,
                principalAmount: pAmount,
                interestAmount: iAmount,
                date: new Date(paymentDate).toISOString()
            });
            toast.success("Payment recorded and ledger updated.");
            fetchLedgerData();
            setLoanToPay(null);
        } catch (err) {
            toast.error("Failed to process payment.");
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeletion = async () => {
        if (!loanToDelete) return;
        try {
            setSubmitting(true);
            await api.delete(`/loans/${loanToDelete}`);
            toast.success("Agreement deleted from ledger.");
            fetchLedgerData();
        } catch (err) {
            toast.error("Failed to delete agreement.");
        } finally {
            setSubmitting(false);
            setLoanToDelete(null);
        }
    };

    const confirmSettlement = async () => {
        if (!loanToSettle) return;
        try {
            setSubmitting(true);
            await api.patch(`/loans/${loanToSettle.id}/clear`);
            toast.success(`${loanToSettle.counterparty} agreement marked as settled.`);
            fetchLedgerData();
        } catch (err) {
            toast.error("Failed to update agreement status.");
        } finally {
            setSubmitting(false);
            setLoanToSettle(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPrincipal = form.principal.replace(/,/g, "");
        if (!form.counterparty || !cleanPrincipal) return toast.error("Counterparty and principal required.");

        try {
            setSubmitting(true);
            const payload = {
                counterparty: form.counterparty,
                direction: form.direction,
                type: form.type,
                interestType: form.interestType,
                principal: parseFloat(cleanPrincipal),
                monthlyRate: form.monthlyRate ? parseFloat(form.monthlyRate) : 0,
                startDate: new Date(form.startDate).toISOString(),
                dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null
            };

            if (editingId) {
                await api.patch(`/loans/${editingId}`, payload);
                toast.success("Credit instrument updated.");
            } else {
                await api.post("/loans", payload);
                toast.success(form.direction === "BORROWED" ? "Liability instrument recorded." : "Receivable asset recorded.");
            }

            setIsFormOpen(false);
            fetchLedgerData();
        } catch (err) {
            toast.error("Failed to commit ledger transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    const activeLoans = loans.filter(l => l.status === "ACTIVE");
    const totalBorrowed = activeLoans.filter(l => l.direction === "BORROWED").reduce((sum, l) => sum + calculateFinancials(l).totalCurrentOutstanding, 0);
    const totalLent = activeLoans.filter(l => l.direction === "LENT").reduce((sum, l) => sum + calculateFinancials(l).totalCurrentOutstanding, 0);
    const netExposure = totalLent - totalBorrowed;

    const filteredLoans = loans.filter(l => (filterMode === "ALL" || l.direction === filterMode) && l.status === statusFilter);

    const accountOptions = accounts.map(a => ({
        label: parseAccountName(a.name),
        balance: formatINR(a.currentBalance),
        value: a.id,
        iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-white shrink-0 p-1.5">{getAccountIconNode(a, "w-full h-full")}</div>
    }));

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };
    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]"><Loader2 className="h-8 w-8 animate-spin text-blue-600 font-bold" strokeWidth={3} /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-100 relative">
                <Navbar />

                <style dangerouslySetInnerHTML={{
                    __html: `
        .modern-date-input::-webkit-calendar-picker-indicator {
          background: transparent; bottom: 0; color: transparent; cursor: pointer;
          height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 relative overflow-x-hidden">

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-200/80 pb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Credit Matrix</h1>
                            <p className="text-slate-500 text-sm mt-2 font-bold tracking-wide">Manage active liabilities, receivables, and processed settlements.</p>
                        </div>

                        <button onClick={resetForm} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 w-full sm:w-auto">
                            <Plus className="w-4 h-4 font-bold" strokeWidth={3} /> Log Agreement
                        </button>
                    </motion.div>

                    {/* KPI Strip */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow group">
                            <div>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-rose-600 transition-colors">Active Liabilities</p>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 truncate font-mono">₹{totalBorrowed.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</h2>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform"><ArrowDownRight className="w-6 h-6 font-bold" strokeWidth={3} /></div>
                        </div>

                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow group">
                            <div>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-emerald-600 transition-colors">Active Receivables</p>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 truncate font-mono">₹{totalLent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</h2>
                            </div>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform"><ArrowUpRight className="w-6 h-6 font-bold" strokeWidth={3} /></div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#312e81] p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-indigo-900/20 text-white border border-slate-700 relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute -top-4 -right-4 p-4 opacity-10 transform rotate-12"><Scale className="w-32 h-32 text-white" /></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-black text-indigo-200 uppercase tracking-widest leading-tight flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5" /> Net Exposure
                                    </p>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 font-mono">
                                        {netExposure < 0 ? "-" : ""}₹{Math.abs(netExposure).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Filters */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                        <div className="flex p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm w-full md:w-auto">
                            <button onClick={() => setStatusFilter("ACTIVE")} className={`flex-1 px-8 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${statusFilter === "ACTIVE" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Active</button>
                            <button onClick={() => setStatusFilter("CLEARED")} className={`flex-1 px-8 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${statusFilter === "CLEARED" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Settled</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {["ALL", "BORROWED", "LENT"].map((mode) => (
                                <button key={mode} onClick={() => setFilterMode(mode as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${filterMode === mode ? "bg-white text-blue-600 shadow-sm border border-slate-200/80" : "bg-transparent text-slate-500 hover:text-slate-900 border border-transparent"}`}>
                                    {mode === "ALL" ? "All Types" : mode === "BORROWED" ? "Liabilities" : "Receivables"}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Main Grid */}
                    {fetching ? (
                        <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 font-bold" strokeWidth={3} /></div>
                    ) : filteredLoans.length === 0 ? (
                        <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white border border-slate-200/80 rounded-[2rem] p-16 text-center max-w-xl mx-auto shadow-sm mt-8">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100">
                                <Scale className="w-8 h-8 font-bold" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">No {statusFilter === "ACTIVE" ? "Active" : "Settled"} Agreements</h3>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed font-bold">
                                There are no {filterMode !== "ALL" ? filterMode.toLowerCase() : ""} financial instruments matching this criteria.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredLoans.map((loan) => {
                                const isBorrowed = loan.direction === "BORROWED";
                                const isCleared = loan.status === "CLEARED";
                                const typeIcon = LOAN_TYPES.find(t => t.id === loan.type)?.icon || Building2;
                                const Icon = typeIcon;

                                const metrics = calculateFinancials(loan);

                                return (
                                    <motion.div key={loan.id} variants={fadeUp} whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className={`bg-white rounded-[2rem] shadow-sm border hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col relative group overflow-hidden ${isCleared ? 'opacity-90 bg-slate-50 border-slate-200' : 'border-slate-200/80'}`}>

                                        <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isCleared ? 'bg-white border border-slate-200 text-slate-400' : 'bg-slate-900 text-white'}`}>
                                                    <Icon className="w-6 h-6 font-bold" strokeWidth={2.5} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">{loan.counterparty}</h3>
                                                    <div className={`text-[10px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5 ${isCleared ? 'text-slate-400' : isBorrowed ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {isBorrowed ? <ArrowDownRight className="w-3.5 h-3.5 font-bold" strokeWidth={3} /> : <ArrowUpRight className="w-3.5 h-3.5 font-bold" strokeWidth={3} />}
                                                        {isCleared ? "Settled Archive" : isBorrowed ? "Liability" : "Receivable"}
                                                    </div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="p-2.5 rounded-xl hover:bg-slate-100 border border-transparent text-slate-400 hover:text-slate-900 transition-all focus:outline-none">
                                                    <MoreVertical className="w-5 h-5 font-bold" strokeWidth={2.5} />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-slate-200 w-56 p-2 rounded-2xl shadow-xl mt-2">

                                                    <DropdownMenuItem onClick={() => setLoanHistory(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-900 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-100 focus:bg-slate-100">
                                                        <History className="w-4 h-4 font-bold" strokeWidth={2.5} /> Timeline History
                                                    </DropdownMenuItem>

                                                    {!isCleared && (
                                                        <>
                                                            <DropdownMenuSeparator className="bg-slate-100 mx-2 my-1" />
                                                            <DropdownMenuItem onClick={() => openPaymentModal(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                                                                <Banknote className="w-4 h-4 font-bold" strokeWidth={2.5} /> Record Payment
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditClick(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                                                                <Pencil className="w-4 h-4 font-bold" strokeWidth={2.5} /> Edit Contract
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setLoanToSettle(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                                                                <CheckCircle2 className="w-4 h-4 font-bold" strokeWidth={2.5} /> Mark Settled
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    <DropdownMenuSeparator className="bg-slate-100 mx-2 my-1" />
                                                    <DropdownMenuItem onClick={() => setLoanToDelete(loan.id)} className="flex items-center gap-3 font-bold text-sm text-rose-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-rose-50 focus:bg-rose-50">
                                                        <Trash2 className="w-4 h-4 font-bold" strokeWidth={2.5} /> Delete Record
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="p-6 sm:p-8 flex-1">
                                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                                                {isCleared ? "Final Settled Value" : "Current Outstanding (Today)"}
                                            </span>
                                            <span className={`text-3xl sm:text-4xl font-black block tracking-tight font-mono truncate ${isCleared ? 'text-slate-600' : 'text-slate-900'}`}>
                                                ₹{metrics.totalCurrentOutstanding.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                            </span>

                                            {!isCleared && loan.dueDate && new Date(loan.dueDate).getTime() > new Date().getTime() && (
                                                <div className="mt-6 p-4 sm:p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" strokeWidth={3} /> Target Payoff
                                                        </span>
                                                        <span className="text-sm font-black text-indigo-900 font-mono">
                                                            ₹{metrics.totalProjectedOutstanding.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2">
                                                        <span>(Prin + ₹{metrics.projectedOutstandingInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Int)</span>
                                                        <span>{new Date(loan.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-6 p-4 sm:p-5 bg-white border border-slate-200/80 rounded-xl space-y-3 shadow-sm">
                                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Principal Balance</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Orig ₹{metrics.originalPrincipal.toLocaleString("en-IN")}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-slate-900 font-mono">₹{metrics.currentPrincipal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                                        {metrics.totalPaidPrincipal > 0 && (
                                                            <span className="text-[9px] font-black text-emerald-500 block uppercase tracking-wider">(-₹{metrics.totalPaidPrincipal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} paid)</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Accrued Interest</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Up to Today</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-sm font-black font-mono ${isCleared ? 'text-slate-500' : 'text-rose-500'}`}>+₹{metrics.currentOutstandingInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                                        {metrics.totalPaidInterest > 0 && (
                                                            <span className="text-[9px] font-black text-emerald-500 block uppercase tracking-wider">(-₹{metrics.totalPaidInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })} paid)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between px-1">
                                                <div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Interest Logic</span>
                                                    <span className="text-sm font-black text-slate-900 font-mono">{loan.monthlyRate}% / mo ({loan.interestType})</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Category</span>
                                                    <span className="text-sm font-black text-slate-900">{loan.type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex divide-x divide-slate-200/60 border-t border-slate-200/60">
                                            <div className="flex-1 p-5 sm:p-6 bg-slate-50 rounded-bl-[2rem]">
                                                <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
                                                    <Calendar className="w-3.5 h-3.5 font-bold" strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Originated</span>
                                                </div>
                                                <span className="text-xs font-black text-slate-900 block truncate">
                                                    {new Date(loan.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className={`flex-1 p-5 sm:p-6 rounded-br-[2rem] ${isCleared ? 'bg-slate-100' : 'bg-slate-50'}`}>
                                                <div className={`flex items-center gap-1.5 mb-1.5 text-slate-500`}>
                                                    {isCleared ? <CheckSquare className="w-3.5 h-3.5 font-bold" strokeWidth={3} /> : <Clock className="w-3.5 h-3.5 font-bold" strokeWidth={3} />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{isCleared ? "Cleared On" : "Target Payoff"}</span>
                                                </div>
                                                <span className={`text-xs font-black block truncate text-slate-900`}>
                                                    {isCleared ? new Date(loan.clearedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "Not Set"}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </main>

                {/* --- INTELLIGENT LIFECYCLE TIMELINE MODAL --- */}
                <AnimatePresence>
                    {loanHistory && (
                        <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setLoanHistory(null)} />

                            <div className="min-h-full flex items-center justify-center w-full my-4 sm:my-8">
                                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col">

                                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem] shrink-0">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Lifecycle Timeline</h3>
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mt-1">{loanHistory.counterparty}</p>
                                        </div>
                                        <button onClick={() => setLoanHistory(null)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-colors shadow-sm focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                    </div>

                                    <div className="p-6 sm:p-8 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200">
                                        <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-4">
                                            {buildLedgerTimeline(loanHistory).map((event: any, index: number) => {
                                                const Icon = event.icon;
                                                return (
                                                    <div key={event.id} className="relative pl-6 sm:pl-8">
                                                        {/* Timeline Node */}
                                                        <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm
                                                            ${event.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                                                event.color === 'slate' ? 'bg-slate-100 text-slate-500' :
                                                                    'bg-blue-50 text-blue-600'}`}>
                                                            <Icon className="w-3.5 h-3.5 font-bold" strokeWidth={3} />
                                                        </div>

                                                        {/* Event Card */}
                                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 tracking-tight">{event.title}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                        {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                                {event.amount && (
                                                                    <div className="text-left sm:text-right mt-1 sm:mt-0">
                                                                        <p className={`text-base font-black font-mono ${event.color === 'emerald' ? 'text-emerald-600' : event.color === 'slate' ? 'text-slate-900' : 'text-blue-600'}`}>
                                                                            {event.isSynthetic && event.color === 'slate' ? '' : event.isSynthetic ? '' : '-'}₹{event.amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- GLASSMORPHISM PAYMENT MODAL --- */}
                <AnimatePresence>
                    {loanToPay && (
                        <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !submitting && setLoanToPay(null)} />

                            <div className="min-h-full flex items-center justify-center w-full my-4 sm:my-8">
                                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col">

                                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem] shrink-0">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Record Settlement</h2>
                                        <button onClick={() => setLoanToPay(null)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-colors shadow-sm focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        <form id="payForm" onSubmit={confirmPayment} className="space-y-8">
                                            <div className="text-center bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Instrument</p>
                                                <p className="font-black text-xl text-slate-900 tracking-tight">{loanToPay.counterparty}</p>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Transaction Date</label>
                                                <div className="relative w-full">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                    <input
                                                        type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Toward Principal</label>
                                                    <input
                                                        type="text" inputMode="numeric" placeholder="0" value={paymentPrincipal} onChange={handlePaymentPrincipalChange}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Toward Interest</label>
                                                    <input
                                                        type="text" inputMode="numeric" placeholder="0" value={paymentInterest} onChange={handlePaymentInterestChange}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300"
                                                    />
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-100 pt-6">
                                                <PremiumDropdown label="Funding Source" value={paymentAccountId} options={accountOptions} onChange={setPaymentAccountId} icon={Wallet} />
                                            </div>
                                        </form>
                                    </div>

                                    <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 bg-slate-50/80 rounded-b-[2rem] flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                                        <button onClick={() => setLoanToPay(null)} className="w-full sm:w-auto bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-black px-6 py-3.5 rounded-xl transition-all shadow-sm focus:outline-none">Cancel</button>
                                        <button form="payForm" type="submit" disabled={submitting || accounts.length === 0} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-8 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 focus:outline-none">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : <CheckCircle2 className="w-4 h-4 font-bold" strokeWidth={3} />}
                                            Process Payment
                                        </button>
                                    </div>

                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- GLASSMORPHISM SETTLE MODAL --- */}
                <AnimatePresence>
                    {loanToSettle && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !submitting && setLoanToSettle(null)} />
                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-200">
                                    <CheckCircle2 className="w-6 h-6 text-slate-900 font-bold" strokeWidth={3} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Mark Agreement Settled?</h3>
                                <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">This will lock the instrument, freeze all interest calculations at today's date, and move it to your settled archives.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setLoanToSettle(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-black py-3.5 rounded-xl transition-colors shadow-sm focus:outline-none">Cancel</button>
                                    <button onClick={confirmSettlement} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black py-3.5 rounded-xl flex justify-center items-center shadow-md disabled:opacity-50 shadow-blue-600/20 focus:outline-none">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : "Confirm Settlement"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- GLASSMORPHISM DELETE MODAL --- */}
                <AnimatePresence>
                    {loanToDelete && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !submitting && setLoanToDelete(null)} />
                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
                                    <ShieldAlert className="w-6 h-6 text-rose-600 font-bold" strokeWidth={3} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Delete Agreement?</h3>
                                <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">This will completely erase the contract from your matrix. This action cannot be reversed.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setLoanToDelete(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-black py-3.5 rounded-xl transition-colors shadow-sm focus:outline-none">Cancel</button>
                                    <button onClick={confirmDeletion} disabled={submitting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black py-3.5 rounded-xl flex justify-center items-center shadow-md disabled:opacity-50 shadow-rose-600/20 focus:outline-none">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : "Confirm Delete"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- GLASSMORPHISM FORM MODAL --- */}
                <AnimatePresence>
                    {isFormOpen && (
                        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />

                            <div className="min-h-full flex items-center justify-center w-full my-4 sm:my-8">
                                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-xl shadow-2xl flex flex-col">

                                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem] shrink-0">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingId ? "Update Instrument" : "Establish Instrument"}</h2>
                                        <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-full shadow-sm transition-colors focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        <form id="loanForm" onSubmit={handleSubmit} className="space-y-8">

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Direction</label>
                                                    <div className="flex p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                                                        <button type="button" onClick={() => setForm({ ...form, direction: "BORROWED" })} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.direction === "BORROWED" ? "bg-white text-rose-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>
                                                            Liability
                                                        </button>
                                                        <button type="button" onClick={() => setForm({ ...form, direction: "LENT" })} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.direction === "LENT" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>
                                                            Asset
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Logic</label>
                                                    <div className="flex p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                                                        <button type="button" onClick={() => setForm({ ...form, interestType: "SIMPLE" })} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.interestType === "SIMPLE" ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>
                                                            Simple
                                                        </button>
                                                        <button type="button" onClick={() => setForm({ ...form, interestType: "COMPOUND" })} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.interestType === "COMPOUND" ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>
                                                            Compound
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Instrument Category</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {LOAN_TYPES.map((type) => {
                                                        const Icon = type.icon;
                                                        const isSelected = form.type === type.id;
                                                        return (
                                                            <button key={type.id} type="button" onClick={() => setForm({ ...form, type: type.id })} className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all duration-200 ${isSelected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"}`}>
                                                                <Icon className={`w-5 h-5 mb-2 font-bold ${isSelected ? "text-blue-600" : "text-slate-400"}`} strokeWidth={2.5} />
                                                                <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-blue-700" : "text-slate-500"}`}>{type.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-100 pt-6">
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Counterparty Entity</label>
                                                <input type="text" required placeholder="e.g., HDFC Bank, John Doe" value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Principal Amount (₹)</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        required
                                                        placeholder="0"
                                                        value={form.principal}
                                                        onChange={handlePrincipalChange}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Interest Rate (% / mo)</label>
                                                    <div className="relative">
                                                        <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                                                        <input type="number" step="0.01" placeholder="0.0" value={form.monthlyRate} onChange={(e) => setForm({ ...form, monthlyRate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3.5 text-base font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Origination Date</label>
                                                    <div className="relative w-full">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                        <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Target Payoff Date</label>
                                                    <div className="relative w-full">
                                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer" />
                                                    </div>
                                                </div>
                                            </div>

                                        </form>
                                    </div>

                                    <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 bg-slate-50/80 rounded-b-[2rem] flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                                        <button onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-black px-6 py-3.5 rounded-xl transition-all shadow-sm focus:outline-none">Cancel</button>
                                        <button form="loanForm" type="submit" disabled={submitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-8 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 focus:outline-none">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : editingId ? <Pencil className="w-4 h-4 font-bold" strokeWidth={3} /> : <ShieldCheck className="w-4 h-4 font-bold" strokeWidth={3} />}
                                            {editingId ? "Update Instrument" : "Lock Agreement"}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </ProtectedRoute>
    );
}