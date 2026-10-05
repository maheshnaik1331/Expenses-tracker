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
    Pencil, Trash2, Calendar, ShieldAlert, X, Repeat, ChevronDown, Check, Landmark, Banknote,
    TrendingUp, Clock, ArrowRight, Sparkles, Layers
} from "lucide-react";

// --- UTILITIES ---
const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investments", "Refund", "Other"];
const EXPENSE_CATEGORIES = ["Housing", "Food & Dining", "Transportation", "Utilities", "Subscriptions", "Debt Repayment", "Shopping", "Other"];
const TRANSFER_CATEGORIES = ["Self Transfer", "Investment Deposit", "Credit Card Payment"];

const getCategoryIcon = (category: string, type: string, sizeClass = "w-5 h-5") => {
    if (type === "TRANSFER") return <Repeat className={`${sizeClass} font-bold`} />;
    if (type === "INCOME") return <Briefcase className={`${sizeClass} font-bold`} />;
    switch (category) {
        case "Food & Dining": return <Coffee className={`${sizeClass} font-bold`} />;
        case "Housing": return <Home className={`${sizeClass} font-bold`} />;
        case "Transportation": return <Car className={`${sizeClass} font-bold`} />;
        case "Subscriptions": return <Receipt className={`${sizeClass} font-bold`} />;
        default: return <Wallet className={`${sizeClass} font-bold`} />;
    }
};

// --- AMBIENT FLOATING BACKGROUND ENGINE ---
const AmbientLedgerCanvas = () => {
    const floaters = [
        { id: 1, Icon: Sparkles, color: "text-blue-300", size: "w-8 h-8", left: "8%", duration: 22, delay: 0 },
        { id: 2, Icon: TrendingUp, color: "text-emerald-300", size: "w-10 h-10", left: "88%", duration: 26, delay: 3 },
        { id: 3, Icon: Wallet, color: "text-indigo-200", size: "w-12 h-12", left: "45%", duration: 28, delay: 6 },
        { id: 4, Icon: Layers, color: "text-sky-200", size: "w-9 h-9", left: "72%", duration: 24, delay: 2 },
        { id: 5, Icon: ArrowRightLeft, color: "text-purple-200", size: "w-7 h-7", left: "22%", duration: 20, delay: 5 },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Soft Ambient Mesh Orbs */}
            <motion.div
                animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-blue-400/10 rounded-full blur-[110px]"
            />
            <motion.div
                animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-[110px]"
            />
            <motion.div
                animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-emerald-400/10 rounded-full blur-[100px]"
            />

            {/* Drifting Micro-Icons */}
            {floaters.map((el) => (
                <motion.div
                    key={el.id}
                    className={`absolute bottom-[-10%] ${el.color}`}
                    style={{ left: el.left }}
                    animate={{
                        y: ["0vh", "-115vh"],
                        x: [0, 25, -25, 0],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: el.duration,
                        repeat: Infinity,
                        delay: el.delay,
                        ease: "linear"
                    }}
                >
                    <el.Icon className={`${el.size} opacity-25`} />
                </motion.div>
            ))}
        </div>
    );
};

// --- ULTRA-PREMIUM INTERACTIVE DROPDOWN ---
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
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-blue-400 rounded-2xl px-4 min-h-[50px] flex justify-between items-center transition-all shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgb(59,130,246,0.08)] cursor-pointer"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1 py-1.5">
                    {selectedOption?.iconNode ? selectedOption.iconNode : (Icon && <Icon className="w-4 h-4 text-blue-600 font-bold shrink-0" />)}

                    <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate w-full pr-1">
                            {selectedOption?.label || "Select..."}
                        </span>
                        {selectedOption?.balance && (
                            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest mt-0.5 bg-blue-50 px-2 py-0.5 rounded-md">
                                {selectedOption.balance} Available
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="absolute top-[calc(100%+8px)] right-0 sm:left-0 w-full min-w-[230px] max-w-[92vw] bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-[0_20px_50px_rgb(15,23,42,0.15)] flex flex-col z-[9999]"
                    >
                        <div className="max-h-72 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                            {options.map((opt: any) => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${value === opt.value ? 'bg-blue-50/80 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {opt.iconNode}
                                        <div className="flex flex-col items-start min-w-0 flex-1 pr-2">
                                            <span className={`text-xs sm:text-sm truncate w-full ${value === opt.value ? 'font-black text-blue-600' : 'font-bold text-slate-700'}`}>
                                                {opt.label}
                                            </span>
                                            {opt.balance && (
                                                <span className={`text-[10px] font-mono font-bold mt-0.5 px-2 py-0.5 rounded-md ${value === opt.value ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
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

export default function TransactionsPage() {
    const { user, loading } = useAuth();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [txToDelete, setTxToDelete] = useState<string | null>(null);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [timeFilter, setTimeFilter] = useState("THIS_MONTH");

    const now = new Date();
    const initialH = now.getHours().toString().padStart(2, '0');
    const initialM = now.getMinutes().toString().padStart(2, '0');

    const [form, setForm] = useState({
        type: "EXPENSE",
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        note: "",
        date: now.toISOString().split('T')[0],
        time: `${initialH}:${initialM}`,
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
        const resetNow = new Date();
        const h = resetNow.getHours().toString().padStart(2, '0');
        const m = resetNow.getMinutes().toString().padStart(2, '0');

        setForm({
            type: "EXPENSE",
            amount: "",
            category: EXPENSE_CATEGORIES[0],
            note: "",
            date: resetNow.toISOString().split('T')[0],
            time: `${h}:${m}`,
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

    const handleEditClick = (tx: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const txDate = new Date(tx.date);
        const h = txDate.getHours().toString().padStart(2, '0');
        const m = txDate.getMinutes().toString().padStart(2, '0');

        setForm({
            type: tx.type,
            amount: tx.amount.toString(),
            category: tx.category,
            note: tx.note || "",
            date: txDate.toLocaleDateString('en-CA'),
            time: `${h}:${m}`,
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
            toast.success("Transaction erased from ledger.");
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

            // FLAWLESS TIMEZONE BINDING
            const [year, month, day] = form.date.split('-').map(Number);
            const [hours, minutes] = form.time.split(':').map(Number);
            const preciseDate = new Date(year, month - 1, day, hours, minutes).toISOString();

            const payload = {
                type: form.type,
                amount: parseFloat(cleanAmount),
                category: form.category,
                note: form.note,
                date: preciseDate,
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
        if (rawValue === "") return setForm({ ...form, amount: "" });
        const numericValue = Number(rawValue);
        if (!isNaN(numericValue)) setForm({ ...form, amount: numericValue.toLocaleString("en-IN") });
    };

    // --- DYNAMIC FILTERING & FLAWLESS LOG-ORDER SORTING ENGINE ---
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        const filtered = transactions.filter((tx) => {
            const txDate = new Date(tx.date);
            const txTime = txDate.getTime();

            const matchesSearch = tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesType = typeFilter === "ALL" || tx.type === typeFilter;

            let matchesTime = true;
            if (timeFilter === "TODAY") matchesTime = txTime >= todayStart;
            else if (timeFilter === "LAST_2_DAYS") matchesTime = txTime >= todayStart - (2 * 24 * 60 * 60 * 1000);
            else if (timeFilter === "LAST_3_DAYS") matchesTime = txTime >= todayStart - (3 * 24 * 60 * 60 * 1000);
            else if (timeFilter === "LAST_7_DAYS") matchesTime = txTime >= todayStart - (7 * 24 * 60 * 60 * 1000);
            else if (timeFilter === "THIS_MONTH") matchesTime = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            else if (timeFilter === "LAST_MONTH") {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                matchesTime = txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
            } else if (timeFilter === "THIS_YEAR") matchesTime = txDate.getFullYear() === now.getFullYear();

            return matchesSearch && matchesType && matchesTime;
        });

        // Strict Chronological Sort using Absolute Epoch Timestamps
        return filtered.sort((a, b) => {
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            if (timeB !== timeA) return timeB - timeA;
            const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return createdB - createdA;
        });
    }, [transactions, searchTerm, typeFilter, timeFilter]);

    // --- STRICT ARRAY-BASED DAY GROUPING & SIMULATED RUNNING BALANCES ---
    const groupedTransactions = useMemo(() => {
        const groups: { label: string, timestamp: number, dailyNet: number, transactions: any[] }[] = [];
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 86400000;

        filteredTransactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const dayStart = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()).getTime();

            let label = "";
            if (dayStart === todayStart) label = "Today";
            else if (dayStart === yesterdayStart) label = "Yesterday";
            else label = txDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

            let group = groups.find(g => g.timestamp === dayStart);
            if (!group) {
                group = { label, timestamp: dayStart, dailyNet: 0, transactions: [] };
                groups.push(group);
            }
            if (tx.type === "INCOME") group.dailyNet += tx.amount;
            if (tx.type === "EXPENSE") group.dailyNet -= tx.amount;
            group.transactions.push(tx);
        });

        groups.sort((a, b) => b.timestamp - a.timestamp);

        const runningBalances: { [accId: string]: number } = {};
        accounts.forEach(a => { runningBalances[a.id] = a.currentBalance; });

        groups.forEach(group => {
            group.transactions.forEach(tx => {
                const accId = tx.accountId;
                tx._balanceAfter = runningBalances[accId];

                if (tx.type === 'EXPENSE') runningBalances[accId] += tx.amount;
                if (tx.type === 'INCOME') runningBalances[accId] -= tx.amount;
                if (tx.type === 'TRANSFER') {
                    runningBalances[accId] += tx.amount;
                    if (tx.toAccountId && runningBalances[tx.toAccountId] !== undefined) {
                        tx._destBalanceAfter = runningBalances[tx.toAccountId];
                        runningBalances[tx.toAccountId] -= tx.amount;
                        tx._destBalanceBefore = runningBalances[tx.toAccountId];
                    }
                }
                tx._balanceBefore = runningBalances[accId];
            });
        });

        return groups;
    }, [filteredTransactions, accounts]);

    const kpis = useMemo(() => {
        let income = 0; let expense = 0; let transferVol = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === "INCOME") income += tx.amount;
            if (tx.type === "EXPENSE") expense += tx.amount;
            if (tx.type === "TRANSFER") transferVol += tx.amount;
        });
        return { income, expense, transferVol, net: income - expense };
    }, [filteredTransactions]);

    const fadeUp: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 24, stiffness: 260 } } };
    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    const parseAccountName = (nameStr: string) => nameStr?.includes("::") ? nameStr.split("::")[1] : nameStr;
    const getAccountIconNode = (acc: any, sizeClass = "w-6 h-6") => {
        if (!acc) return <Landmark className={`${sizeClass} text-slate-400`} />;
        const [parsedBankId] = acc.name.includes("::") ? acc.name.split("::") : [null];
        const bankConfig = parsedBankId ? INDIAN_BANK_DIRECTORY.find(b => b.id === parsedBankId) : null;
        if (acc.type === 'CASH') return <Banknote className={`${sizeClass} text-emerald-600 font-bold`} />;
        if (bankConfig) return <img src={`https://img.logo.dev/${bankConfig.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} className={`${sizeClass} object-contain`} />;
        return <Landmark className={`${sizeClass} text-blue-600 font-bold`} />;
    };

    const typePills = [
        { label: "All", value: "ALL" },
        { label: "Inflows", value: "INCOME" },
        { label: "Outflows", value: "EXPENSE" },
        { label: "Transfers", value: "TRANSFER" }
    ];

    const timeOptions = [
        { label: "Today", value: "TODAY" },
        { label: "Last 2 Days", value: "LAST_2_DAYS" },
        { label: "Last 3 Days", value: "LAST_3_DAYS" },
        { label: "Last 7 Days", value: "LAST_7_DAYS" },
        { label: "This Month", value: "THIS_MONTH" },
        { label: "Last Month", value: "LAST_MONTH" },
        { label: "This Year", value: "THIS_YEAR" },
        { label: "All Time", value: "ALL" }
    ];

    const categoryOptions = (form.type === "INCOME" ? INCOME_CATEGORIES : form.type === "TRANSFER" ? TRANSFER_CATEGORIES : EXPENSE_CATEGORIES).map(c => ({
        label: c,
        value: c,
        iconNode: <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${form.type === 'INCOME' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : form.type === 'TRANSFER' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>{getCategoryIcon(c, form.type, "w-4 h-4")}</div>
    }));

    const accountOptions = accounts.map(a => ({
        label: parseAccountName(a.name),
        balance: formatINR(a.currentBalance),
        value: a.id,
        iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-white shrink-0 p-1.5">{getAccountIconNode(a, "w-full h-full")}</div>
    }));

    const targetAccountOptions = accounts.filter(a => a.id !== form.accountId).map(a => ({
        label: parseAccountName(a.name),
        balance: formatINR(a.currentBalance),
        value: a.id,
        iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-white shrink-0 p-1.5">{getAccountIconNode(a, "w-full h-full")}</div>
    }));

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]"><Loader2 className="h-8 w-8 animate-spin text-blue-600 font-bold" strokeWidth={3} /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#EFF6FF] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 relative">

                {/* Ambient Floating Canvas */}
                <AmbientLedgerCanvas />

                <div className="relative z-20">
                    <Navbar />
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
        .modern-date-input::-webkit-calendar-picker-indicator,
        .modern-time-input::-webkit-calendar-picker-indicator {
          background: transparent; bottom: 0; color: transparent; cursor: pointer;
          height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
        }
      `}} />

                <main className="flex-1 max-w-[1280px] w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-10 relative z-10">

                    {/* HERO HEADER */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 sm:mb-10">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-2.5">
                                <Sparkles className="w-3 h-3" /> Live Capital Stream
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Global Ledger</h1>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1 font-bold">Real-time inflows, outflows, and balance trajectory.</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            disabled={accounts.length === 0}
                            onClick={resetForm}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-sm px-7 py-4 rounded-2xl shadow-[0_10px_30px_rgb(37,99,235,0.3)] hover:shadow-[0_15px_35px_rgb(37,99,235,0.45)] transition-all disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4 font-bold" strokeWidth={3} /> Log Movement
                        </motion.button>
                    </motion.div>

                    {/* FLOATING GLASS KPI CARDS */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-7 sm:mb-9">
                        <motion.div whileHover={{ y: -4 }} className="bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between group transition-all">
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Period Inflow</p>
                                <p className="text-lg sm:text-2xl font-black text-emerald-600 mt-1.5 font-mono tracking-tight truncate">+{formatINR(kpis.income)}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-50 to-teal-100/60 border border-emerald-200/60 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                <ArrowDownLeft className="w-5 h-5 font-bold" strokeWidth={2.5} />
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -4 }} className="bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between group transition-all">
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Period Outflow</p>
                                <p className="text-lg sm:text-2xl font-black text-rose-600 mt-1.5 font-mono tracking-tight truncate">-{formatINR(kpis.expense)}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-rose-50 to-pink-100/60 border border-rose-200/60 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                                <ArrowUpRight className="w-5 h-5 font-bold" strokeWidth={2.5} />
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -4 }} className="bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between group transition-all">
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Transfers</p>
                                <p className="text-lg sm:text-2xl font-black text-indigo-600 mt-1.5 font-mono tracking-tight truncate">{formatINR(kpis.transferVol)}</p>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-50 to-blue-100/60 border border-indigo-200/60 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <ArrowRightLeft className="w-5 h-5 font-bold" strokeWidth={2.5} />
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -4 }} className="bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#312e81] p-4 sm:p-6 rounded-3xl shadow-[0_12px_35px_rgb(49,46,129,0.25)] text-white relative overflow-hidden flex items-center justify-between">
                            <div className="absolute -top-6 -right-6 opacity-10 transform rotate-12 pointer-events-none"><Wallet className="w-28 h-28 text-white" /></div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-1.5 truncate">
                                    <TrendingUp className="w-3 h-3 shrink-0" /> Net Cashflow
                                </p>
                                <p className={`text-lg sm:text-2xl font-black font-mono tracking-tight mt-1.5 truncate ${kpis.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {kpis.net > 0 ? "+" : ""}{formatINR(kpis.net)}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* INTERACTIVE CONTROL BAR: Search + Sliding Type Pills + Time Range */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-8">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 font-bold" strokeWidth={3} />
                            <input
                                type="text" placeholder="Search category, notes, bank..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl pl-11 pr-4 min-h-[50px] text-xs sm:text-sm font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
                            />
                        </div>

                        {/* Interactive Sliding Type Pills (Replaces Clunky Dropdown) */}
                        <div className="flex items-center p-1 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-x-auto no-scrollbar">
                            {typePills.map((pill) => {
                                const active = typeFilter === pill.value;
                                return (
                                    <button
                                        key={pill.value}
                                        onClick={() => setTypeFilter(pill.value)}
                                        className={`relative flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors z-10 whitespace-nowrap ${active ? "text-white" : "text-slate-500 hover:text-slate-900"}`}
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId="activeTypeFilterPill"
                                                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                                                className="absolute inset-0 bg-slate-900 rounded-xl -z-10 shadow-md"
                                            />
                                        )}
                                        {pill.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Time Filter Dropdown */}
                        <div className="w-full lg:w-52 shrink-0">
                            <PremiumDropdown value={timeFilter} options={timeOptions} onChange={setTimeFilter} icon={Calendar} />
                        </div>
                    </motion.div>

                    {/* --- FLOATING TIMELINE STREAM (NO RIGID OUTER BOX) --- */}
                    {fetching ? (
                        <div className="py-28 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm">
                            <Loader2 className="w-9 h-9 animate-spin text-blue-600 font-bold mb-4" strokeWidth={3} />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing Ledger Stream...</span>
                        </div>
                    ) : groupedTransactions.length === 0 ? (
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-28 text-center flex flex-col items-center justify-center bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_10px_40px_rgb(0,0,0,0.03)]">
                            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl mb-4 shadow-inner">
                                <Receipt className="w-9 h-9 text-blue-500" strokeWidth={2} />
                            </motion.div>
                            <p className="text-slate-900 font-black text-xl">No Capital Movements</p>
                            <p className="text-slate-500 font-bold text-sm mt-1">Adjust your time range or log a new transaction above.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-8">
                            {groupedTransactions.map((group, groupIndex) => (
                                <motion.div
                                    key={group.timestamp}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: groupIndex * 0.05, type: "spring", stiffness: 260, damping: 25 }}
                                    className="space-y-3"
                                >
                                    {/* Floating Date Pill Header + Daily Net Summary */}
                                    <div className="flex items-center justify-between px-2">
                                        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
                                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                                {group.label}
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400 pl-1 border-l border-slate-200">
                                                {group.transactions.length}
                                            </span>
                                        </div>

                                        {group.dailyNet !== 0 && (
                                            <span className={`text-xs font-mono font-black px-3 py-1 rounded-full border backdrop-blur-md ${group.dailyNet > 0 ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/60" : "bg-slate-100/80 text-slate-600 border-slate-200/60"}`}>
                                                {group.dailyNet > 0 ? "+" : ""}{formatINR(group.dailyNet)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Floating Interactive Cards List */}
                                    <div className="space-y-3">
                                        {group.transactions.map((tx: any) => {
                                            const isIncome = tx.type === "INCOME";
                                            const isTransfer = tx.type === "TRANSFER";
                                            const isSelected = activeCardId === tx.id;

                                            const account = accounts.find(a => a.id === tx.accountId);
                                            const toAccount = accounts.find(a => a.id === tx.toAccountId);

                                            const sourceAlias = parseAccountName(account?.name || "");
                                            const destAlias = isTransfer ? parseAccountName(toAccount?.name || "") : null;

                                            const timeString = new Date(tx.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                                            return (
                                                <motion.div
                                                    key={tx.id}
                                                    layout
                                                    whileHover={{ y: -3, scale: 1.004 }}
                                                    whileTap={{ scale: 0.995 }}
                                                    onClick={() => setActiveCardId(isSelected ? null : tx.id)}
                                                    className={`group relative bg-white/90 backdrop-blur-xl rounded-[1.75rem] p-4 sm:p-5 border transition-all duration-300 cursor-pointer overflow-hidden
                                                        ${isSelected
                                                            ? "border-blue-400 shadow-[0_15px_40px_rgb(37,99,235,0.12)] ring-4 ring-blue-500/10"
                                                            : "border-white/90 shadow-[0_6px_25px_rgb(15,23,42,0.04)] hover:shadow-[0_12px_35px_rgb(15,23,42,0.08)] hover:border-blue-200/80"
                                                        }`}
                                                >
                                                    {/* Subtle Left Neon Accent Bar */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isIncome ? "bg-gradient-to-b from-emerald-400 to-teal-500" : isTransfer ? "bg-gradient-to-b from-indigo-400 to-purple-500" : "bg-gradient-to-b from-rose-400 to-pink-500"}`} />

                                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pl-2">

                                                        {/* Left Section: Icon + Category + Note + Time */}
                                                        <div className="flex items-start sm:items-center justify-between lg:justify-start gap-3.5 min-w-0 lg:w-[38%]">
                                                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                                <motion.div
                                                                    whileHover={{ rotate: 8, scale: 1.08 }}
                                                                    className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border
                                                                        ${isIncome
                                                                            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/70 text-emerald-600'
                                                                            : isTransfer
                                                                                ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200/70 text-indigo-600'
                                                                                : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/70 text-rose-600'
                                                                        }`}
                                                                >
                                                                    {getCategoryIcon(tx.category, tx.type, "w-5 h-5")}
                                                                </motion.div>

                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-base font-black text-slate-900 truncate tracking-tight">
                                                                            {tx.category}
                                                                        </p>
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 shrink-0">
                                                                            <Clock className="w-2.5 h-2.5" /> {timeString}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-400 truncate mt-0.5">
                                                                        {tx.note || (isTransfer ? "Internal Capital Transfer" : "Standard Ledger Entry")}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Mobile Amount Display */}
                                                            <div className="lg:hidden text-right shrink-0">
                                                                <p className={`text-lg font-black font-mono tracking-tight ${isIncome ? 'text-emerald-600' : isTransfer ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                                    {isIncome ? "+" : isTransfer ? "⇄" : "-"}{formatINR(tx.amount)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Center Section: Sleek Floating Balance Flow Ribbon(s) */}
                                                        <div className="flex flex-wrap items-center gap-2 lg:flex-1 lg:justify-center">
                                                            {/* Source Account Flow Pill */}
                                                            <div className="flex items-center gap-2 bg-slate-50/90 hover:bg-slate-100/80 px-3 py-1.5 rounded-2xl border border-slate-200/60 transition-colors max-w-full">
                                                                <div className="w-5 h-5 rounded-md bg-white p-0.5 shadow-2xs flex items-center justify-center shrink-0">
                                                                    {getAccountIconNode(account, "w-full h-full")}
                                                                </div>
                                                                <span className="text-[11px] font-black text-slate-700 truncate max-w-[110px] sm:max-w-[140px]">
                                                                    {sourceAlias}
                                                                </span>
                                                                <div className="flex items-center gap-1 text-[11px] font-mono font-bold pl-1.5 border-l border-slate-200 shrink-0">
                                                                    <span className="text-slate-400">{formatINR(tx._balanceBefore)}</span>
                                                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                                                    <span className={`font-black px-1.5 py-0.5 rounded-md ${isIncome ? 'bg-emerald-100/70 text-emerald-800' : 'bg-blue-100/70 text-blue-800'}`}>
                                                                        {formatINR(tx._balanceAfter)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Destination Account Flow Pill (If Transfer) */}
                                                            {isTransfer && toAccount && (
                                                                <div className="flex items-center gap-2 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 rounded-2xl border border-indigo-100 transition-colors max-w-full">
                                                                    <div className="w-5 h-5 rounded-md bg-white p-0.5 shadow-2xs flex items-center justify-center shrink-0">
                                                                        {getAccountIconNode(toAccount, "w-full h-full")}
                                                                    </div>
                                                                    <span className="text-[11px] font-black text-indigo-950 truncate max-w-[110px] sm:max-w-[140px]">
                                                                        {destAlias}
                                                                    </span>
                                                                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold pl-1.5 border-l border-indigo-200/60 shrink-0">
                                                                        <span className="text-slate-400">{formatINR(tx._destBalanceBefore)}</span>
                                                                        <ArrowRight className="w-3 h-3 text-indigo-300" />
                                                                        <span className="font-black bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded-md">
                                                                            {formatINR(tx._destBalanceAfter)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right Section: Desktop Amount + Quick Action Pills */}
                                                        <div className="flex items-center justify-end gap-3 lg:w-[20%] shrink-0">
                                                            <div className="hidden lg:block text-right">
                                                                <p className={`text-xl font-black font-mono tracking-tight ${isIncome ? 'text-emerald-600' : isTransfer ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                                    {isIncome ? "+" : isTransfer ? "⇄" : "-"}{formatINR(tx.amount)}
                                                                </p>
                                                            </div>

                                                            {/* Floating Action Pill */}
                                                            <div className={`flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 transition-all ${isSelected ? "opacity-100" : "opacity-100 lg:opacity-0 group-hover:opacity-100"}`}>
                                                                <button
                                                                    onClick={(e) => handleEditClick(tx, e)}
                                                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-2xs focus:outline-none"
                                                                    title="Edit Entry"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setTxToDelete(tx.id); }}
                                                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-2xs focus:outline-none"
                                                                    title="Purge Entry"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

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

                    {/* --- THE FLAWLESS, BREAKOUT ENTRY MODAL --- */}
                    <AnimatePresence>
                        {isFormOpen && (
                            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />

                                <div className="min-h-full flex items-center justify-center w-full my-4 sm:my-8">
                                    <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-xl shadow-2xl flex flex-col">
                                        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem]">
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingId ? "Update Record" : "Log Capital Movement"}</h2>
                                            <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-full shadow-sm transition-colors focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                        </div>

                                        <div className="p-6 sm:p-8">
                                            <form id="txForm" onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

                                                <div className="grid grid-cols-3 p-1.5 gap-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                                                    <button type="button" onClick={() => handleTypeChange("EXPENSE")} className={`py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.type === "EXPENSE" ? "bg-white text-rose-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Expense</button>
                                                    <button type="button" onClick={() => handleTypeChange("INCOME")} className={`py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.type === "INCOME" ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Income</button>
                                                    <button type="button" onClick={() => handleTypeChange("TRANSFER")} className={`py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${form.type === "TRANSFER" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-900"}`}>Transfer</button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                                    <div className="sm:col-span-1">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Amount (₹)</label>
                                                        <input
                                                            type="text" inputMode="numeric" required value={form.amount} onChange={handleAmountChange}
                                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-black font-mono text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm outline-none placeholder:text-slate-300"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-1">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Date</label>
                                                        <div className="relative w-full">
                                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                            <input
                                                                type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                                                                className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm outline-none modern-date-input cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="sm:col-span-1">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Time</label>
                                                        <div className="relative w-full">
                                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                            <input
                                                                type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                                                                className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm outline-none modern-time-input cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-slate-100 pt-6">
                                                    <div className="w-full min-w-0">
                                                        <PremiumDropdown label={form.type === "TRANSFER" ? "Source Account" : "Account"} value={form.accountId} options={accountOptions} onChange={(val: any) => setForm({ ...form, accountId: val })} />
                                                    </div>

                                                    {form.type === "TRANSFER" ? (
                                                        <div className="w-full min-w-0">
                                                            <PremiumDropdown label="Destination Account" value={form.toAccountId} options={targetAccountOptions} onChange={(val: any) => setForm({ ...form, toAccountId: val })} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full min-w-0">
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

                                        <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 bg-slate-50/80 rounded-b-[2rem] flex flex-col sm:flex-row justify-end gap-3">
                                            <button onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-black px-6 py-3.5 rounded-xl transition-all shadow-sm focus:outline-none">Cancel</button>
                                            <button form="txForm" type="submit" disabled={submitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-8 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 focus:outline-none">
                                                {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : editingId ? <Pencil className="w-4 h-4 font-bold" strokeWidth={3} /> : <Plus className="w-4 h-4 font-bold" strokeWidth={3} />}
                                                {editingId ? "Save Changes" : "Confirm Entry"}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                </main>
            </div>
        </ProtectedRoute>
    );
}