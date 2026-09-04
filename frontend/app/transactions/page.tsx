"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Loader2, Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft,
    Search, Filter, Receipt, Coffee, Home, Car, Wallet, Briefcase,
    Pencil, Trash2, Calendar, ShieldAlert, X, Repeat, ChevronDown, Check, Landmark,
    TrendingUp,
    Banknote
} from "lucide-react";

// --- UTILITIES ---
const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investments", "Refund", "Other"];
const EXPENSE_CATEGORIES = ["Housing", "Food & Dining", "Transportation", "Utilities", "Subscriptions", "Debt Repayment", "Shopping", "Other"];
const TRANSFER_CATEGORIES = ["Self Transfer", "Investment Deposit", "Credit Card Payment"];

const getCategoryIcon = (category: string, type: string) => {
    if (type === "TRANSFER") return <Repeat className="w-5 h-5 font-bold" />;
    if (type === "INCOME") return <Briefcase className="w-5 h-5 font-bold" />;
    switch (category) {
        case "Food & Dining": return <Coffee className="w-5 h-5 font-bold" />;
        case "Housing": return <Home className="w-5 h-5 font-bold" />;
        case "Transportation": return <Car className="w-5 h-5 font-bold" />;
        case "Subscriptions": return <Receipt className="w-5 h-5 font-bold" />;
        default: return <Wallet className="w-5 h-5 font-bold" />;
    }
};

// --- CUSTOM INTERACTIVE DROPDOWN COMPONENT ---
const PremiumDropdown = ({ value, options, onChange, icon: Icon, label }: any) => {
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
                className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 cursor-pointer flex justify-between items-center transition-all shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10"
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon className="w-4 h-4 text-slate-400 font-bold" />}
                    <span className="truncate">{selectedOption?.label || "Select..."}</span>
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
                            {options.map((opt: any) => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <span className={`text-sm ${value === opt.value ? 'font-black text-blue-600' : 'font-bold text-slate-700'}`}>{opt.label}</span>
                                    {value === opt.value && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function TransactionsPage() {
    const { user, loading } = useAuth();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [txToDelete, setTxToDelete] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [timeFilter, setTimeFilter] = useState("THIS_MONTH");

    const [form, setForm] = useState({
        type: "EXPENSE",
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        note: "",
        date: new Date().toISOString().split('T')[0],
        accountId: "",
        toAccountId: ""
    });

    const fetchLedgerData = async () => {
        try {
            setFetching(true);
            const [txRes, accRes] = await Promise.all([
                api.get("/transactions"),
                api.get("/accounts")
            ]);

            setTransactions(txRes.data || []);
            setAccounts(accRes.data || []);

            if (accRes.data && accRes.data.length > 0 && !form.accountId) {
                setForm(prev => ({ ...prev, accountId: accRes.data[0].id }));
            }
        } catch (err) {
            toast.error("Failed to synchronize transaction history.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && user) fetchLedgerData();
    }, [user, loading]);

    const resetForm = () => {
        setForm({
            type: "EXPENSE",
            amount: "",
            category: EXPENSE_CATEGORIES[0],
            note: "",
            date: new Date().toISOString().split('T')[0],
            accountId: accounts.length > 0 ? accounts[0].id : "",
            toAccountId: ""
        });
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleTypeChange = (newType: string) => {
        setForm({
            ...form,
            type: newType,
            category: newType === "INCOME" ? INCOME_CATEGORIES[0] : newType === "TRANSFER" ? TRANSFER_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
        });
    };

    const handleEditClick = (tx: any) => {
        setForm({
            type: tx.type,
            amount: tx.amount.toString(),
            category: tx.category,
            note: tx.note || "",
            date: new Date(tx.date).toISOString().split('T')[0],
            accountId: tx.accountId,
            toAccountId: tx.toAccountId || ""
        });
        setEditingId(tx.id);
        setIsFormOpen(true);
    };

    const confirmDeletion = async () => {
        if (!txToDelete) return;
        try {
            setSubmitting(true);
            await api.delete(`/transactions/${txToDelete}`);
            toast.success("Transaction purged from ledger.");
            fetchLedgerData();
        } catch (err) {
            toast.error("Failed to delete transaction.");
        } finally {
            setSubmitting(false);
            setTxToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanAmount = form.amount.replace(/,/g, "");
        if (!cleanAmount || parseFloat(cleanAmount) <= 0) return toast.error("Invalid capital amount.");
        if (!form.accountId) return toast.error("Source account required.");
        if (form.type === "TRANSFER" && (!form.toAccountId || form.accountId === form.toAccountId)) {
            return toast.error("Transfers require a distinct destination account.");
        }

        try {
            setSubmitting(true);
            const payload = {
                type: form.type,
                amount: parseFloat(cleanAmount),
                category: form.category,
                note: form.note,
                date: new Date(form.date).toISOString(),
                accountId: form.accountId,
                toAccountId: form.type === "TRANSFER" ? form.toAccountId : null
            };

            if (editingId) {
                await api.patch(`/transactions/${editingId}`, payload);
                toast.success("Ledger entry updated.");
            } else {
                await api.post("/transactions", payload);
                toast.success("Capital movement recorded.");
            }

            setIsFormOpen(false);
            fetchLedgerData();
        } catch (err) {
            toast.error("Failed to commit transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "") {
            setForm({ ...form, amount: "" });
            return;
        }
        const numericValue = Number(rawValue);
        if (!isNaN(numericValue)) {
            setForm({ ...form, amount: numericValue.toLocaleString("en-IN") });
        }
    };

    // --- DYNAMIC FILTERING & CHRONOLOGICAL SORTING ENGINE ---
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const filtered = transactions.filter((tx) => {
            const txDate = new Date(tx.date);

            const matchesSearch = tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesType = typeFilter === "ALL" || tx.type === typeFilter;

            let matchesTime = true;
            if (timeFilter === "THIS_MONTH") {
                matchesTime = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (timeFilter === "LAST_MONTH") {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                matchesTime = txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
            } else if (timeFilter === "THIS_YEAR") {
                matchesTime = txDate.getFullYear() === now.getFullYear();
            }

            return matchesSearch && matchesType && matchesTime;
        });

        // BUG FIX: Ensure chronological sorting (Newest first)
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, searchTerm, typeFilter, timeFilter]);

    // --- DYNAMIC KPI CALCULATOR ---
    const kpis = useMemo(() => {
        let income = 0;
        let expense = 0;
        let transferVol = 0;

        filteredTransactions.forEach(tx => {
            if (tx.type === "INCOME") income += tx.amount;
            if (tx.type === "EXPENSE") expense += tx.amount;
            if (tx.type === "TRANSFER") transferVol += tx.amount;
        });

        return { income, expense, transferVol, net: income - expense };
    }, [filteredTransactions]);

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };
    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    const typeOptions = [
        { label: "All Movements", value: "ALL" },
        { label: "Income Only", value: "INCOME" },
        { label: "Expenses Only", value: "EXPENSE" },
        { label: "Transfers Only", value: "TRANSFER" }
    ];

    const timeOptions = [
        { label: "This Month", value: "THIS_MONTH" },
        { label: "Last Month", value: "LAST_MONTH" },
        { label: "This Year", value: "THIS_YEAR" },
        { label: "All Time", value: "ALL" }
    ];

    const categoryOptions = (form.type === "INCOME" ? INCOME_CATEGORIES : form.type === "TRANSFER" ? TRANSFER_CATEGORIES : EXPENSE_CATEGORIES).map(c => ({ label: c, value: c }));

    // Safely parse account names for the dropdown
    const parseAccountName = (nameStr: string) => nameStr.includes("::") ? nameStr.split("::")[1] : nameStr;
    const accountOptions = accounts.map(a => ({ label: `${parseAccountName(a.name)} (${formatINR(a.currentBalance)})`, value: a.id }));
    const targetAccountOptions = accounts.filter(a => a.id !== form.accountId).map(a => ({ label: `${parseAccountName(a.name)} (${formatINR(a.currentBalance)})`, value: a.id }));

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]"><Loader2 className="h-8 w-8 animate-spin text-blue-600 font-bold" strokeWidth={3} /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F0F4F8] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100">
                <Navbar />

                <style dangerouslySetInnerHTML={{
                    __html: `
        .modern-date-input::-webkit-calendar-picker-indicator {
          background: transparent; bottom: 0; color: transparent; cursor: pointer;
          height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
        }
      `}} />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 relative overflow-x-hidden">

                    {/* Header Section */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-200/80 pb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Global Ledger</h1>
                            <p className="text-slate-500 text-sm mt-2 font-bold tracking-wide">Trace inflows, outflows, and internal capital transfers.</p>
                        </div>
                        <button
                            disabled={accounts.length === 0}
                            onClick={resetForm}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4 font-bold" strokeWidth={3} /> Log Movement
                        </button>
                    </motion.div>

                    {/* --- DYNAMIC KPI STRIP (Premium Aesthetic) --- */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-emerald-600 transition-colors">Period Inflow</p>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">{formatINR(kpis.income)}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><ArrowDownLeft className="w-5 h-5 font-bold" strokeWidth={3} /></div>
                        </div>
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-rose-600 transition-colors">Period Outflow</p>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">{formatINR(kpis.expense)}</p>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl group-hover:scale-110 transition-transform"><ArrowUpRight className="w-5 h-5 font-bold" strokeWidth={3} /></div>
                        </div>
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-indigo-600 transition-colors">Transfer Vol</p>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono tracking-tight">{formatINR(kpis.transferVol)}</p>
                            </div>
                            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><ArrowRightLeft className="w-5 h-5 font-bold" strokeWidth={3} /></div>
                        </div>
                        <div className="bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#312e81] p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-indigo-900/20 text-white border border-slate-700 relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute -top-4 -right-4 p-4 opacity-10 transform rotate-12"><Wallet className="w-32 h-32 text-white" /></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[11px] font-black text-indigo-200 uppercase tracking-widest leading-tight flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5" /> Net Cashflow
                                    </p>
                                    <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-2 ${kpis.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {kpis.net > 0 ? "+" : ""}{formatINR(kpis.net)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* --- FILTER ENGINE --- */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 font-bold" strokeWidth={3} />
                            <input
                                type="text" placeholder="Search category, notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="w-full md:w-48">
                                <PremiumDropdown value={typeFilter} options={typeOptions} onChange={setTypeFilter} icon={Filter} />
                            </div>
                            <div className="w-full md:w-48">
                                <PremiumDropdown value={timeFilter} options={timeOptions} onChange={setTimeFilter} icon={Calendar} />
                            </div>
                        </div>
                    </motion.div>

                    {/* --- MAIN LEDGER TABLE --- */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {fetching ? (
                                <div className="py-24 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 font-bold mb-4" strokeWidth={3} />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Decrypting Ledger...</span>
                                </div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="py-32 text-center flex flex-col items-center justify-center bg-slate-50/50">
                                    <div className="p-4 bg-white border border-slate-200 border-dashed rounded-2xl mb-4">
                                        <Receipt className="w-8 h-8 text-slate-300" strokeWidth={2} />
                                    </div>
                                    <p className="text-slate-900 font-black text-lg">No Records Found</p>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Adjust your filters or log a new capital movement.</p>
                                </div>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const isIncome = tx.type === "INCOME";
                                    const isTransfer = tx.type === "TRANSFER";

                                    // Parse accounts
                                    const account = accounts.find(a => a.id === tx.accountId);
                                    const toAccount = accounts.find(a => a.id === tx.toAccountId);

                                    const parseAccount = (acc: any) => {
                                        if (!acc) return { alias: "Unknown", domain: null, isCash: false };
                                        const [parsedBankId, parsedAlias] = acc.name.includes("::") ? acc.name.split("::") : [null, acc.name];
                                        const bankConfig = parsedBankId ? INDIAN_BANK_DIRECTORY.find(b => b.id === parsedBankId) : null;
                                        return { alias: parsedAlias || "Institution", domain: bankConfig?.domain, isCash: acc.type === 'CASH' };
                                    };

                                    const sourceAcc = parseAccount(account);
                                    const destAcc = isTransfer ? parseAccount(toAccount) : null;

                                    return (
                                        <div key={tx.id} className="group p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">

                                            {/* Hover Accent Bar */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500 transition-colors"></div>

                                            <div className="flex items-center gap-4 min-w-0 flex-1 pl-2 sm:pl-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${isIncome ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                    isTransfer ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                                        'bg-rose-50 border-rose-100 text-rose-600'
                                                    }`}>
                                                    {getCategoryIcon(tx.category, tx.type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black text-slate-900 truncate tracking-tight">{tx.category}</p>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1.5">
                                                        <span className="truncate max-w-[150px] sm:max-w-[250px]">{tx.note || (isTransfer ? "Internal Transfer" : "No description")}</span>
                                                        <span className="hidden sm:inline text-slate-300">•</span>

                                                        {/* Bank Entity Display */}
                                                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                                                            {sourceAcc.isCash ? <Banknote className="w-3 h-3 text-emerald-500" /> : sourceAcc.domain ? <img src={`https://img.logo.dev/${sourceAcc.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} className="w-3 h-3 object-contain" /> : <Landmark className="w-3 h-3 text-blue-500" />}
                                                            <span className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-700 truncate max-w-[80px]">{sourceAcc.alias}</span>
                                                        </div>

                                                        {isTransfer && destAcc && (
                                                            <>
                                                                <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
                                                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                                                                    {destAcc.isCash ? <Banknote className="w-3 h-3 text-emerald-500" /> : destAcc.domain ? <img src={`https://img.logo.dev/${destAcc.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} className="w-3 h-3 object-contain" /> : <Landmark className="w-3 h-3 text-blue-500" />}
                                                                    <span className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-700 truncate max-w-[80px]">{destAcc.alias}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-4 sm:pt-0 border-slate-100 pl-2 sm:pl-0">
                                                <div className="text-left sm:text-right">
                                                    <p className={`text-lg font-black font-mono tracking-tight ${isIncome ? 'text-emerald-600' : isTransfer ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                        {isIncome ? "+" : isTransfer ? "⇄" : "-"}{formatINR(tx.amount)}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">
                                                        {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditClick(tx)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-colors shadow-sm focus:outline-none">
                                                        <Pencil className="w-4 h-4 font-bold" strokeWidth={2.5} />
                                                    </button>
                                                    <button onClick={() => setTxToDelete(tx.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-colors shadow-sm focus:outline-none">
                                                        <Trash2 className="w-4 h-4 font-bold" strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* --- GLASSMORPHISM DELETE MODAL --- */}
                    <AnimatePresence>
                        {txToDelete && (
                            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setTxToDelete(null)} />
                                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                                    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
                                        <ShieldAlert className="w-6 h-6 text-rose-600 font-bold" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Purge Transaction?</h3>
                                    <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">This will erase the record and mathematically reverse its impact on your associated account balances. Proceed?</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setTxToDelete(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-black py-3.5 rounded-xl transition-colors">Cancel</button>
                                        <button onClick={confirmDeletion} disabled={submitting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black py-3.5 rounded-xl flex justify-center items-center shadow-md shadow-rose-600/20">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : "Confirm Purge"}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* --- GLASSMORPHISM TRANSACTION ENTRY MODAL --- */}
                    <AnimatePresence>
                        {isFormOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />

                                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 shrink-0">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingId ? "Update Record" : "Log Capital Movement"}</h2>
                                        <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-full shadow-sm transition-colors focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                    </div>

                                    <div className="overflow-y-auto p-6 sm:p-8">
                                        <form id="txForm" onSubmit={handleSubmit} className="space-y-8">

                                            {/* Tri-State Type Switcher */}
                                            <div className="flex p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                                                <button type="button" onClick={() => handleTypeChange("EXPENSE")} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.type === "EXPENSE" ? "bg-white text-rose-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Expense</button>
                                                <button type="button" onClick={() => handleTypeChange("INCOME")} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.type === "INCOME" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Income</button>
                                                <button type="button" onClick={() => handleTypeChange("TRANSFER")} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.type === "TRANSFER" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Transfer</button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Amount (₹)</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        required
                                                        value={form.amount}
                                                        onChange={handleAmountChange}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-black font-mono text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm outline-none placeholder:text-slate-300"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Date</label>
                                                    <div className="relative w-full">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                        <input
                                                            type="date"
                                                            required
                                                            value={form.date}
                                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                                            className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm outline-none modern-date-input cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <PremiumDropdown label={form.type === "TRANSFER" ? "Source Account" : "Account"} value={form.accountId} options={accountOptions} onChange={(val: any) => setForm({ ...form, accountId: val })} />
                                                </div>

                                                {form.type === "TRANSFER" ? (
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <PremiumDropdown label="Destination Account" value={form.toAccountId} options={targetAccountOptions} onChange={(val: any) => setForm({ ...form, toAccountId: val })} />
                                                    </div>
                                                ) : (
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <PremiumDropdown label="Category" value={form.category} options={categoryOptions} onChange={(val: any) => setForm({ ...form, category: val })} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="border-t border-slate-100 pt-6">
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Note (Optional)</label>
                                                <input type="text" placeholder="E.g., Dinner with client..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm outline-none" />
                                            </div>
                                        </form>
                                    </div>

                                    <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 bg-slate-50/80 shrink-0 flex justify-end gap-3">
                                        <button onClick={() => setIsFormOpen(false)} className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-black px-6 py-3.5 rounded-xl transition-all shadow-sm focus:outline-none">Cancel</button>
                                        <button form="txForm" type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-8 py-3.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 focus:outline-none">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : editingId ? <Pencil className="w-4 h-4 font-bold" strokeWidth={3} /> : <Plus className="w-4 h-4 font-bold" strokeWidth={3} />}
                                            {editingId ? "Save Changes" : "Confirm Entry"}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                </main>
            </div>
        </ProtectedRoute>
    );
}