"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Loader2, Plus, ArrowDownRight, ArrowUpRight,
    Scale, Calendar, CheckCircle2, MoreVertical, ShieldCheck,
    User, Building2, Percent, Wallet, Home, Briefcase, Coins,
    Pencil, Trash2, Clock, X, ChevronDown, Check, ShieldAlert,
    CheckSquare, Banknote, ListCollapse, Receipt
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

// --- ULTRA PREMIUM INTERACTIVE DROPDOWN ---
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
            {label && <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-300 hover:border-blue-400 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 cursor-pointer flex justify-between items-center transition-all shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10"
            >
                <div className="flex items-center gap-3 truncate">
                    {Icon && <Icon className="w-4 h-4 text-slate-400 font-bold" />}
                    <span className="truncate">{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden z-50"
                    >
                        <div className="max-h-56 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                            {options.length === 0 ? (
                                <p className="p-3 text-xs font-semibold text-slate-400 text-center">No options available</p>
                            ) : (
                                options.map((opt: any) => (
                                    <div
                                        key={opt.value}
                                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <span className={`text-sm ${value === opt.value ? 'font-bold text-blue-600' : 'font-semibold text-slate-700'}`}>{opt.label}</span>
                                        {value === opt.value && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                                    </div>
                                ))
                            )}
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

    // Normalizes dates to prevent timezone drift from affecting day-counts
    const stripTime = (dateInput: any) => {
        const d = new Date(dateInput);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };

    // The Official Banking Standard: Fractional Months based on exact days / (365/12)
    const calculateInterestForPeriod = (principal: number, startDate: number, endDate: number, accruedInterestSoFar: number) => {
        if (endDate <= startDate) return 0;
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        const monthsAccrued = diffDays / (365 / 12);

        if (isCompound) {
            // Unpaid interest is capitalized into the principal base
            const principalForInterest = principal + Math.max(0, accruedInterestSoFar - totalPaidInterest);
            return principalForInterest * (Math.pow(1 + (rate / 100), monthsAccrued) - 1);
        } else {
            // Strict simple interest
            return principal * (rate / 100) * monthsAccrued;
        }
    };

    // 1. Process historical transactions sequentially
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

    // 2. Calculate CURRENT real-time ledger status (up to Today)
    const today = stripTime(new Date());
    const clearedDate = loan.clearedDate ? stripTime(loan.clearedDate) : null;
    const activeEndDate = clearedDate || today;

    let currentAccruedInterest = historicalAccruedInterest;
    if (activeEndDate > lastDate) {
        currentAccruedInterest += calculateInterestForPeriod(currentPrincipal, lastDate, activeEndDate, historicalAccruedInterest);
    }

    // 3. Calculate PROJECTED status (up to Maturity Date)
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

        // Current Snapshots
        currentAccruedInterest,
        currentOutstandingInterest,
        totalCurrentOutstanding: Math.max(0, currentPrincipal) + currentOutstandingInterest,

        // Projected Snapshots
        projectedOutstandingInterest,
        totalProjectedOutstanding: Math.max(0, currentPrincipal) + projectedOutstandingInterest,

        totalPaidInterest,
        totalPaidPrincipal,
    };
};

export default function LoansPage() {
    const { user, loading } = useAuth();

    const [loans, setLoans] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modal UX State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
    const [loanToSettle, setLoanToSettle] = useState<any | null>(null);
    const [loanToPay, setLoanToPay] = useState<any | null>(null);
    const [loanHistory, setLoanHistory] = useState<any | null>(null);

    // Filters
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
            principal: loan.principal.toString(),
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

    const confirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loanToPay || !paymentAccountId || !paymentDate) return;

        const pAmount = parseFloat(paymentPrincipal) || 0;
        const iAmount = parseFloat(paymentInterest) || 0;

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
            toast.success("Agreement purged from ledger.");
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
        if (!form.counterparty || !form.principal) return toast.error("Counterparty and principal required.");

        try {
            setSubmitting(true);
            const payload = {
                counterparty: form.counterparty,
                direction: form.direction,
                type: form.type,
                interestType: form.interestType,
                principal: parseFloat(form.principal),
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
    const accountOptions = accounts.map(a => ({ label: `${a.name} (₹${a.currentBalance})`, value: a.id }));

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };
    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="h-8 w-8 animate-spin text-blue-600 font-bold" /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-100 relative">
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

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-10 relative">

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-200/60 pb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Credit Matrix</h1>
                            <p className="text-slate-500 text-sm mt-2 font-semibold">Manage active liabilities, receivables, and processed settlements.</p>
                        </div>

                        <button onClick={resetForm} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 w-full sm:w-auto">
                            <Plus className="w-4 h-4 font-bold" /> Log Agreement
                        </button>
                    </motion.div>

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200/60 flex items-center gap-5 hover:shadow-md transition-all group">
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl shrink-0 group-hover:scale-105 transition-transform"><ArrowDownRight className="w-6 h-6 font-bold" /></div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Active Liabilities</p>
                                <h2 className="text-2xl font-black text-rose-600 truncate font-mono">₹{totalBorrowed.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</h2>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200/60 flex items-center gap-5 hover:shadow-md transition-all group">
                            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl shrink-0 group-hover:scale-105 transition-transform"><ArrowUpRight className="w-6 h-6 font-bold" /></div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 truncate">Active Receivables</p>
                                <h2 className="text-2xl font-black text-emerald-600 truncate font-mono">₹{totalLent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</h2>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[1.5rem] shadow-md border border-blue-500 flex items-center gap-5 text-white">
                            <div className="p-4 bg-white/10 rounded-2xl shrink-0"><Wallet className="w-6 h-6 font-bold text-white" /></div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest mb-1 truncate">Net Exposure</p>
                                <h2 className="text-2xl font-black truncate font-mono">
                                    {netExposure < 0 ? "-" : ""}₹{Math.abs(netExposure).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                </h2>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                        <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm w-full md:w-auto">
                            <button onClick={() => setStatusFilter("ACTIVE")} className={`flex-1 px-8 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${statusFilter === "ACTIVE" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Active</button>
                            <button onClick={() => setStatusFilter("CLEARED")} className={`flex-1 px-8 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${statusFilter === "CLEARED" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Settled</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {["ALL", "BORROWED", "LENT"].map((mode) => (
                                <button key={mode} onClick={() => setFilterMode(mode as any)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${filterMode === mode ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "bg-transparent text-slate-500 hover:text-slate-900 border border-transparent"}`}>
                                    {mode === "ALL" ? "All Types" : mode === "BORROWED" ? "Liabilities" : "Receivables"}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {fetching ? (
                        <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 font-bold" /></div>
                    ) : filteredLoans.length === 0 ? (
                        <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center max-w-xl mx-auto shadow-sm mt-8">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100">
                                <Scale className="w-8 h-8 font-bold" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">No {statusFilter === "ACTIVE" ? "Active" : "Settled"} Agreements</h3>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed font-semibold">
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
                                    <motion.div key={loan.id} variants={fadeUp} whileHover={{ y: -6, scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className={`bg-white rounded-[2rem] shadow-sm border hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col relative group overflow-hidden ${isCleared ? 'opacity-80 grayscale-[0.2]' : ''}`}>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-slate-100/60 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full ease-in-out z-20"></div>

                                        <div className="p-6 border-b border-slate-100 flex justify-between items-start gap-4 relative z-10">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${isCleared ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white border-slate-200 text-slate-900'}`}>
                                                    <Icon className="w-7 h-7 font-bold" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">{loan.counterparty}</h3>
                                                    <div className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5 ${isCleared ? 'text-slate-500' : 'text-slate-600'}`}>
                                                        {isBorrowed ? <ArrowDownRight className="w-3.5 h-3.5 font-bold" /> : <ArrowUpRight className="w-3.5 h-3.5 font-bold" />}
                                                        {isCleared ? "Settled Agreement" : isBorrowed ? "Liability" : "Receivable"}
                                                    </div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="p-2.5 rounded-xl hover:bg-slate-100 border border-transparent text-slate-400 hover:text-slate-900 transition-all focus:outline-none">
                                                    <MoreVertical className="w-5 h-5 font-bold" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-slate-200 w-56 p-2 rounded-2xl shadow-xl mt-2">

                                                    <DropdownMenuItem onClick={() => setLoanHistory(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-900 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-100 focus:bg-slate-100">
                                                        <ListCollapse className="w-4 h-4 font-bold" /> View Ledger History
                                                    </DropdownMenuItem>

                                                    {!isCleared && (
                                                        <>
                                                            <DropdownMenuSeparator className="bg-slate-100 mx-2 my-1" />
                                                            <DropdownMenuItem onClick={() => openPaymentModal(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                                                                <Banknote className="w-4 h-4 font-bold" /> Record Payment
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditClick(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                                                                <Pencil className="w-4 h-4 font-bold" /> Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setLoanToSettle(loan)} className="flex items-center gap-3 font-bold text-sm text-slate-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50">
                                                                <CheckCircle2 className="w-4 h-4 font-bold" /> Mark Settled
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    <DropdownMenuSeparator className="bg-slate-100 mx-2 my-1" />
                                                    <DropdownMenuItem onClick={() => setLoanToDelete(loan.id)} className="flex items-center gap-3 font-bold text-sm text-rose-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-rose-50 focus:bg-rose-50">
                                                        <Trash2 className="w-4 h-4 font-bold" /> Purge Record
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="p-6 flex-1 relative z-10">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                                {isCleared ? "Final Settled Value" : "Current Outstanding (Today)"}
                                            </span>
                                            <span className={`text-4xl font-black block tracking-tight font-mono truncate ${isCleared ? 'text-slate-700' : 'text-slate-900'}`}>
                                                ₹{metrics.totalCurrentOutstanding.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                            </span>

                                            {/* --- NEW: CLEAR TARGET DATE PROJECTION BOX --- */}
                                            {!isCleared && loan.dueDate && new Date(loan.dueDate).getTime() > new Date().getTime() && (
                                                <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" strokeWidth={3} /> At Target Payoff
                                                        </span>
                                                        <span className="text-sm font-black text-indigo-900 font-mono">
                                                            ₹{metrics.totalProjectedOutstanding.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1.5">
                                                        <span>(₹{metrics.currentPrincipal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Prin + ₹{metrics.projectedOutstandingInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Int)</span>
                                                        <span>{new Date(loan.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Current Snapshot Breakdown */}
                                            <div className="mt-5 p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Principal Balance</span>
                                                        <span className="text-[9px] font-semibold text-slate-400">Originally ₹{metrics.originalPrincipal.toLocaleString("en-IN")}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-bold text-slate-900 font-mono">₹{metrics.currentPrincipal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                                        {metrics.totalPaidPrincipal > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-500 block">(-₹{metrics.totalPaidPrincipal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} paid)</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Accrued Interest</span>
                                                        <span className="text-[9px] font-semibold text-slate-400">Up to Today</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-sm font-bold font-mono ${isCleared ? 'text-slate-500' : 'text-rose-500'}`}>+₹{metrics.currentOutstandingInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                                                        {metrics.totalPaidInterest > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-500 block">(-₹{metrics.totalPaidInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })} paid)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Interest Logic</span>
                                                    <span className="text-sm font-bold text-slate-900 font-mono">{loan.monthlyRate}% / mo ({loan.interestType})</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Category</span>
                                                    <span className="text-sm font-bold text-slate-900">{loan.type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex divide-x divide-slate-100 border-t border-slate-100 relative z-10">
                                            <div className="flex-1 p-5 bg-slate-50/80 rounded-bl-[2rem]">
                                                <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
                                                    <Calendar className="w-3.5 h-3.5 font-bold" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Originated</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-900 block truncate">
                                                    {new Date(loan.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className={`flex-1 p-5 rounded-br-[2rem] ${isCleared ? 'bg-slate-100' : 'bg-slate-100/50'}`}>
                                                <div className={`flex items-center gap-1.5 mb-1.5 text-slate-500`}>
                                                    {isCleared ? <CheckSquare className="w-3.5 h-3.5 font-bold" /> : <Clock className="w-3.5 h-3.5 font-bold" />}
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{isCleared ? "Cleared On" : "Target Payoff"}</span>
                                                </div>
                                                <span className={`text-xs font-bold block truncate text-slate-900`}>
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

                {/* --- GLASSMORPHISM LEDGER HISTORY MODAL --- */}
                <AnimatePresence>
                    {loanHistory && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setLoanHistory(null)} />
                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Ledger History</h3>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{loanHistory.counterparty}</p>
                                    </div>
                                    <button onClick={() => setLoanHistory(null)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-colors shadow-sm"><X className="h-5 w-5 font-bold" /></button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 bg-white">
                                    {!loanHistory.transactions || loanHistory.transactions.length === 0 ? (
                                        <div className="py-12 text-center flex flex-col items-center">
                                            <Receipt className="w-10 h-10 text-slate-300 mb-4" />
                                            <p className="text-sm font-bold text-slate-500">No payment history recorded.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {loanHistory.transactions.map((tx: any) => (
                                                <div key={tx.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                                                            {tx.paymentType === 'PRINCIPAL' ? <Building2 className="w-4 h-4 text-slate-700" /> : <Percent className="w-4 h-4 text-slate-700" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{tx.paymentType === 'PRINCIPAL' ? 'Principal Payment' : 'Interest Payment'}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                                {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-base font-bold font-mono text-slate-900">
                                                        ₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- GLASSMORPHISM PAYMENT MODAL (SPLIT + DATE) --- */}
                <AnimatePresence>
                    {loanToPay && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !submitting && setLoanToPay(null)} />
                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">

                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Record Settlement</h3>
                                    <button onClick={() => setLoanToPay(null)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-colors shadow-sm"><X className="h-5 w-5 font-bold" /></button>
                                </div>

                                <form onSubmit={confirmPayment} className="p-8 space-y-6">
                                    <div className="text-center bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Instrument</p>
                                        <p className="font-bold text-xl text-slate-900 tracking-tight">{loanToPay.counterparty}</p>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Transaction Date</label>
                                        <div className="relative w-full">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                            <input
                                                type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Toward Principal</label>
                                            <input
                                                type="number" step="0.01" placeholder="0.00" value={paymentPrincipal} onChange={(e) => setPaymentPrincipal(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Toward Interest</label>
                                            <input
                                                type="number" step="0.01" placeholder="0.00" value={paymentInterest} onChange={(e) => setPaymentInterest(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <PremiumDropdown label="Funding Source" value={paymentAccountId} options={accountOptions} onChange={setPaymentAccountId} icon={Wallet} />
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <button type="submit" disabled={submitting || accounts.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 text-sm font-bold transition-all active:scale-95 flex justify-center items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50">
                                            {submitting ? <Loader2 className="h-5 w-5 animate-spin font-bold" /> : <><CheckCircle2 className="h-5 w-5 font-bold" /> Process Payment</>}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
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
                                    <CheckCircle2 className="w-6 h-6 text-slate-900 font-bold" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Mark Agreement Settled?</h3>
                                <p className="text-sm font-bold text-slate-500 mb-8">This will lock the instrument, freeze all interest calculations at today's date, and move it to your settled archives.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setLoanToSettle(null)} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold py-3 rounded-xl transition-colors shadow-sm">Cancel</button>
                                    <button onClick={confirmSettlement} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl flex justify-center items-center shadow-md disabled:opacity-50 shadow-blue-600/20">
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
                                    <ShieldAlert className="w-6 h-6 text-rose-600 font-bold" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Purge Agreement?</h3>
                                <p className="text-sm font-bold text-slate-500 mb-8">This will completely erase the contract from your matrix. This action cannot be reversed.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setLoanToDelete(null)} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold py-3 rounded-xl transition-colors shadow-sm">Cancel</button>
                                    <button onClick={confirmDeletion} disabled={submitting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-3 rounded-xl flex justify-center items-center shadow-md disabled:opacity-50">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : "Confirm Purge"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- GLASSMORPHISM FORM MODAL --- */}
                <AnimatePresence>
                    {isFormOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">

                                <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem]">
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{editingId ? "Update Instrument" : "Establish Instrument"}</h2>
                                    <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-full shadow-sm"><X className="w-4 h-4 font-bold" /></button>
                                </div>

                                <div className="overflow-y-auto p-6 sm:p-8">
                                    <form id="loanForm" onSubmit={handleSubmit} className="space-y-6">

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Direction</label>
                                                <div className="flex p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                                                    <button type="button" onClick={() => setForm({ ...form, direction: "BORROWED" })} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${form.direction === "BORROWED" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                                                        Liability
                                                    </button>
                                                    <button type="button" onClick={() => setForm({ ...form, direction: "LENT" })} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${form.direction === "LENT" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                                                        Asset
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Logic</label>
                                                <div className="flex p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                                                    <button type="button" onClick={() => setForm({ ...form, interestType: "SIMPLE" })} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${form.interestType === "SIMPLE" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                                                        Simple
                                                    </button>
                                                    <button type="button" onClick={() => setForm({ ...form, interestType: "COMPOUND" })} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${form.interestType === "COMPOUND" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                                                        Compound
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Instrument Category</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {LOAN_TYPES.map((type) => {
                                                    const Icon = type.icon;
                                                    const isSelected = form.type === type.id;
                                                    return (
                                                        <button key={type.id} type="button" onClick={() => setForm({ ...form, type: type.id })} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isSelected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"}`}>
                                                            <Icon className={`w-5 h-5 mb-2 font-bold ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-700" : "text-slate-500"}`}>{type.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Counterparty Entity</label>
                                            <input type="text" required placeholder="e.g., HDFC Bank, John Doe" value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:font-semibold placeholder:text-slate-400" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Principal Amount (₹)</label>
                                                <input type="number" step="0.01" required placeholder="0.00" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:font-semibold placeholder:text-slate-400" />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Interest Rate (% / mo)</label>
                                                <div className="relative">
                                                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
                                                    <input type="number" step="0.01" placeholder="0.0" value={form.monthlyRate} onChange={(e) => setForm({ ...form, monthlyRate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3.5 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:font-semibold placeholder:text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Origination Date</label>
                                                <div className="relative w-full">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                    <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer" />
                                                </div>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Target Payoff Date</label>
                                                <div className="relative w-full">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                    <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer" />
                                                </div>
                                            </div>
                                        </div>

                                    </form>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-slate-50/80 rounded-b-[2rem] flex justify-end gap-3 shrink-0">
                                    <button onClick={() => setIsFormOpen(false)} className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm">Cancel</button>
                                    <button form="loanForm" type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : editingId ? <Pencil className="w-4 h-4 font-bold" /> : <ShieldCheck className="w-4 h-4 font-bold" />}
                                        {editingId ? "Update Instrument" : "Lock Agreement"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </ProtectedRoute>
    );
}