"use client";

import { useEffect, useState, useMemo, useRef, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    CalendarDays, Repeat, CheckCircle2,
    Plus, Loader2, Receipt, X, ChevronDown, Check,
    Laptop, Zap, Home, Shield, MoreVertical, Edit2, Trash2, ShieldAlert, Wallet,
    ListCollapse, Calendar, Landmark, Banknote, Search, FileText,
    Pencil, Briefcase
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Account {
    currentBalance: number;
    id: string;
    name: string;
    type: string;
}

interface RecurringBill {
    id: string;
    name: string;
    amount: number;
    category: string;
    interval: string;
    nextDueDate: string;
    lastPaidDate?: string;
    accountId: string;
    transactions?: any[];
    account: { id: string; name: string, type: string };
    status?: string;
}

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

const getCategoryIcon = (cat: string) => {
    switch (cat) {
        case "SOFTWARE": return <Laptop className="w-5 h-5 text-indigo-500 font-bold" />;
        case "UTILITIES": return <Zap className="w-5 h-5 text-amber-500 font-bold" />;
        case "HOUSING": return <Home className="w-5 h-5 text-blue-500 font-bold" />;
        case "INSURANCE": return <Shield className="w-5 h-5 text-emerald-500 font-bold" />;
        default: return <Receipt className="w-5 h-5 text-slate-500 font-bold" />;
    }
};

// --- FLAWLESS BREAKOUT DROPDOWN ---
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
                        className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[9999]"
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

export default function BillsPage() {
    const { user, loading: authLoading } = useAuth();
    const [bills, setBills] = useState<RecurringBill[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("PENDING");

    // Form State (Handles both Create and Edit)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("UTILITIES");
    const [interval, setInterval] = useState("MONTHLY");
    const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState("");

    // Modals & History State Restored
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [activeBill, setActiveBill] = useState<RecurringBill | null>(null);
    const [billHistory, setBillHistory] = useState<RecurringBill | null>(null);

    // Payment Overrides
    const [payAmount, setPayAmount] = useState("");
    const [payAccountId, setPayAccountId] = useState("");
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [processingPayment, setProcessingPayment] = useState(false);

    const fetchData = async () => {
        try {
            const [billsRes, accountsRes] = await Promise.all([
                api.get("/recurring-bills"),
                api.get("/accounts"),
            ]);
            setBills(billsRes.data);
            setAccounts(accountsRes.data);

            if (accountsRes.data.length > 0 && !accountId && !editingId) {
                setAccountId(accountsRes.data[0].id);
            }
        } catch (error) {
            toast.error("Failed to sync your bills.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) fetchData();
    }, [authLoading, user]);

    const resetForm = () => {
        setName("");
        setAmount("");
        setCategory("UTILITIES");
        setInterval("MONTHLY");
        setNextDueDate(new Date().toISOString().split('T')[0]);
        setAccountId(accounts.length > 0 ? accounts[0].id : "");
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (bill: RecurringBill) => {
        setEditingId(bill.id);
        setName(bill.name);
        setAmount(bill.amount.toString());
        setCategory(bill.category);
        setInterval(bill.interval);
        setNextDueDate(new Date(bill.nextDueDate).toISOString().split('T')[0]);
        setAccountId(bill.accountId);
        setIsFormOpen(true);
    };

    const confirmDeletion = async () => {
        if (!billToDelete) return;
        try {
            setSubmitting(true);
            await api.delete(`/recurring-bills/${billToDelete}`);
            toast.success("Subscription contract terminated.");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete contract.");
        } finally {
            setSubmitting(false);
            setBillToDelete(null);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>) => {
        const rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "") return setter("");
        if (!isNaN(Number(rawValue))) setter(Number(rawValue).toLocaleString("en-IN"));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanAmount = amount.replace(/,/g, "");
        if (!name || !cleanAmount || !nextDueDate || !accountId) return toast.error("Please fill all required fields.");

        setSubmitting(true);
        try {
            const payload = {
                name,
                amount: parseFloat(cleanAmount),
                category,
                interval,
                nextDueDate: new Date(nextDueDate).toISOString(),
                accountId,
            };

            if (editingId) {
                await api.patch(`/recurring-bills/${editingId}`, payload);
                toast.success("Contract updated successfully.");
            } else {
                await api.post("/recurring-bills", payload);
                toast.success("Recurring bill activated.");
            }

            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to save contract.");
        } finally {
            setSubmitting(false);
        }
    };

    const openPayModal = (bill: RecurringBill) => {
        setActiveBill(bill);
        setPayAmount(bill.amount.toString());
        setPayAccountId(bill.account?.id || bill.accountId);
        setPayDate(new Date().toISOString().split('T')[0]);
        setPayModalOpen(true);
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanAmount = payAmount.replace(/,/g, "");
        if (!activeBill || !cleanAmount) return;

        setProcessingPayment(true);
        try {
            await api.patch(`/recurring-bills/${activeBill.id}/pay`, {
                amount: parseFloat(cleanAmount),
                accountId: payAccountId,
                date: new Date(payDate).toISOString()
            });

            toast.success(`${activeBill.name} marked as paid!`);
            setPayModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to process payment.");
        } finally {
            setProcessingPayment(false);
        }
    };

    // --- REPAIRED FILTER ENGINE ---
    // Respects the original code's data flow, ensuring paid bills are tracked via transactions or DB status.
    const filteredBills = useMemo(() => {
        return bills.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Allow DB status, OR check if it has a populated transactions array
            const isPaid = b.status === "PAID" || (b.transactions && b.transactions.length > 0);
            const matchesStatus = statusFilter === "ALL" ||
                (statusFilter === "PAID" && isPaid) ||
                (statusFilter === "PENDING" && !isPaid);

            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    }, [bills, searchTerm, statusFilter]);

    const accountOptions = accounts.map(a => ({
        label: parseAccountName(a.name),
        balance: formatINR(a.currentBalance),
        value: a.id,
        iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-white shrink-0 p-1.5">{getAccountIconNode(a, "w-full h-full")}</div>
    }));

    const intervalOptions = [
        { label: "Weekly", value: "WEEKLY" },
        { label: "Monthly", value: "MONTHLY" },
        { label: "Yearly", value: "YEARLY" }
    ];

    const categoryOptions = [
        { label: "Software & SaaS", value: "SOFTWARE", iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-slate-50 shrink-0 p-1.5"><Laptop className="w-full h-full text-indigo-500 font-bold" /></div> },
        { label: "Utilities", value: "UTILITIES", iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-slate-50 shrink-0 p-1.5"><Zap className="w-full h-full text-amber-500 font-bold" /></div> },
        { label: "Housing & Rent", value: "HOUSING", iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-slate-50 shrink-0 p-1.5"><Home className="w-full h-full text-blue-500 font-bold" /></div> },
        { label: "Insurance", value: "INSURANCE", iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-slate-50 shrink-0 p-1.5"><Shield className="w-full h-full text-emerald-500 font-bold" /></div> }
    ];

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };
    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]"><Loader2 className="h-8 w-8 animate-spin text-blue-600 font-bold" strokeWidth={3} /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-100 relative">
                <Navbar />

                <style dangerouslySetInnerHTML={{
                    __html: `
        .modern-date-input::-webkit-calendar-picker-indicator {
          background: transparent; bottom: 0; color: transparent; cursor: pointer;
          height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
        }
      `}} />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative overflow-x-hidden">
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-200/80 pb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Contractual Obligations
                            </h1>
                            <p className="text-sm font-bold text-slate-500 mt-2 tracking-wide">
                                Automate, track, and dynamically fund your recurring obligations.
                            </p>
                        </div>
                        <button onClick={resetForm} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                            <Plus className="w-4 h-4 font-bold" strokeWidth={3} /> Establish Contract
                        </button>
                    </motion.div>

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 font-bold" strokeWidth={3} />
                            <input
                                type="text" placeholder="Search contracts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm w-full md:w-auto shrink-0">
                            <button onClick={() => setStatusFilter("PENDING")} className={`flex-1 px-8 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${statusFilter === "PENDING" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Pending</button>
                            <button onClick={() => setStatusFilter("PAID")} className={`flex-1 px-8 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${statusFilter === "PAID" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>Settled</button>
                            <button onClick={() => setStatusFilter("ALL")} className={`flex-1 px-8 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${statusFilter === "ALL" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>All</button>
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {filteredBills.length === 0 ? (
                                <div className="py-32 text-center flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl">
                                    <div className="p-4 bg-white border border-slate-200 border-dashed rounded-2xl mb-4">
                                        <FileText className="w-8 h-8 text-slate-300" strokeWidth={2} />
                                    </div>
                                    <p className="text-slate-900 font-black text-lg">No Contracts Found</p>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Adjust your filters or establish a new payable.</p>
                                </div>
                            ) : (
                                filteredBills.map((bill) => {
                                    const dueDate = new Date(bill.nextDueDate);
                                    const isPaid = bill.status === "PAID" || (bill.transactions && bill.transactions.length > 0);
                                    const isDueSoon = dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
                                    const isOverdue = !isPaid && dueDate.getTime() < new Date().getTime();

                                    const acc = accounts.find(a => a.id === bill.accountId) || bill.account;
                                    const sourceAlias = parseAccountName(acc?.name || "");

                                    return (
                                        <div key={bill.id} className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-transparent hover:border-blue-500 group">
                                            <div className="flex items-center gap-4 min-w-0 flex-1 pl-1">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 
                                                    ${isPaid ? 'bg-slate-50 border-slate-200 text-slate-400' : isOverdue ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                    {getCategoryIcon(bill.category)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className={`text-lg font-black tracking-tight truncate pr-4 ${isPaid ? 'text-slate-500' : 'text-slate-900'}`}>{bill.name}</h3>

                                                        {/* Ledger History Dropdown Context Menu */}
                                                        <div className="shrink-0">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger className="p-1 rounded-lg hover:bg-slate-100 border border-transparent text-slate-400 hover:text-slate-900 transition-all focus:outline-none">
                                                                    <MoreVertical className="w-5 h-5 font-bold" />
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-white border border-slate-200 w-48 p-2 rounded-2xl shadow-xl mt-2">
                                                                    <DropdownMenuItem onClick={() => setBillHistory(bill)} className="flex items-center gap-3 font-bold text-sm text-slate-900 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-100 focus:bg-slate-100">
                                                                        <ListCollapse className="w-4 h-4 font-bold" /> Ledger History
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap mt-1">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" /> {new Date(bill.nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="hidden sm:inline text-slate-300">•</span>

                                                        {/* UNBOXED BANK ICONS */}
                                                        <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100/50 px-2 py-0.5 rounded-md">
                                                            {getAccountIconNode(acc, "w-3.5 h-3.5")}
                                                            <span className="font-bold text-[11px] uppercase tracking-wider truncate max-w-[150px]">{sourceAlias}</span>
                                                        </span>

                                                        <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-black ml-2 ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isOverdue ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                            {isPaid ? "Settled" : isOverdue ? "Overdue" : "Pending"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-4 sm:pt-0 border-slate-100 pl-2 sm:pl-0 shrink-0">
                                                <div className="text-left sm:text-right">
                                                    <p className={`text-xl font-black font-mono tracking-tight ${isPaid ? 'text-slate-400' : 'text-slate-900'}`}>
                                                        {formatINR(bill.amount)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {!isPaid && (
                                                        <button onClick={() => openPayModal(bill)} className="px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm focus:outline-none">
                                                            Execute
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleEditClick(bill)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-colors shadow-sm focus:outline-none">
                                                        <Pencil className="w-4 h-4 font-bold" strokeWidth={2.5} />
                                                    </button>
                                                    <button onClick={() => setBillToDelete(bill.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-colors shadow-sm focus:outline-none">
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
                </main>

                {/* --- RESTORED LEDGER HISTORY MODAL --- */}
                <AnimatePresence>
                    {billHistory && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setBillHistory(null)} />
                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Ledger History</h3>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{billHistory.name}</p>
                                    </div>
                                    <button onClick={() => setBillHistory(null)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-full transition-colors shadow-sm"><X className="h-5 w-5 font-bold" /></button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 bg-white">
                                    {!billHistory.transactions || billHistory.transactions.length === 0 ? (
                                        <div className="py-12 text-center flex flex-col items-center">
                                            <Receipt className="w-10 h-10 text-slate-300 mb-4" />
                                            <p className="text-sm font-bold text-slate-500">No payment history recorded.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {billHistory.transactions.map((tx: any) => (
                                                <div key={tx.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                                                            <CheckCircle2 className="w-4 h-4 text-slate-700 font-bold" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">Contract Settlement</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                                {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-base font-black font-mono text-slate-900">
                                                        ₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
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

                {/* --- GLASSMORPHISM DELETE MODAL --- */}
                <AnimatePresence>
                    {billToDelete && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !submitting && setBillToDelete(null)} />
                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
                                    <ShieldAlert className="w-6 h-6 text-rose-600 font-bold" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Purge Contract?</h3>
                                <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">This will erase the bill from your pending obligations. It will not affect past ledger transactions. Proceed?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setBillToDelete(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-black py-3.5 rounded-xl transition-colors shadow-sm focus:outline-none">Cancel</button>
                                    <button onClick={confirmDeletion} disabled={submitting} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black py-3.5 rounded-xl flex justify-center items-center shadow-md disabled:opacity-50 shadow-rose-600/20 focus:outline-none">
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : "Confirm Purge"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- THE FLAWLESS, BREAKOUT SETTLEMENT MODAL --- */}
                <AnimatePresence>
                    {payModalOpen && activeBill && (
                        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !processingPayment && setPayModalOpen(false)} />

                            <div className="min-h-full flex items-center justify-center w-full my-4 sm:my-8">
                                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col">

                                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem] shrink-0">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Execute Settlement</h2>
                                        <button onClick={() => setPayModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-full shadow-sm transition-colors focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        <form id="payForm" onSubmit={handleConfirmPayment} className="space-y-6">
                                            <div className="text-center bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Contract</p>
                                                <p className="font-black text-xl text-slate-900 tracking-tight">{activeBill.name}</p>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Transaction Date</label>
                                                <div className="relative w-full">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                    <input
                                                        type="date" required value={payDate} onChange={(e) => setPayDate(e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Final Settlement Amount (₹)</label>
                                                <input
                                                    type="text" inputMode="numeric" required value={payAmount} onChange={(e) => handleAmountChange(e, setPayAmount)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-lg font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                />
                                                <p className="text-[10px] font-bold text-slate-400 mt-2">Adjust this value if the bill has fluctuated.</p>
                                            </div>

                                            <div className="border-t border-slate-100 pt-6">
                                                <PremiumDropdown label="Deduct Capital From" value={payAccountId} options={accountOptions} onChange={setPayAccountId} icon={Wallet} />
                                            </div>
                                        </form>
                                    </div>

                                    <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 bg-slate-50/80 rounded-b-[2rem] flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                                        <button onClick={() => setPayModalOpen(false)} className="w-full sm:w-auto bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-black px-6 py-3.5 rounded-xl transition-all shadow-sm focus:outline-none">Cancel</button>
                                        <button form="payForm" type="submit" disabled={processingPayment || accounts.length === 0} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-8 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 focus:outline-none">
                                            {processingPayment ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : <CheckCircle2 className="w-4 h-4 font-bold" strokeWidth={3} />}
                                            Execute
                                        </button>
                                    </div>

                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- ESTABLISH CONTRACT MODAL --- */}
                <AnimatePresence>
                    {isFormOpen && (
                        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />

                            <div className="min-h-full flex items-center justify-center w-full my-4 sm:my-8">
                                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col">

                                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem] shrink-0">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingId ? "Update Contract" : "Establish Contract"}</h2>
                                        <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-full shadow-sm transition-colors focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                    </div>

                                    <div className="p-6 sm:p-8">
                                        <form id="contractForm" onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Contract Title</label>
                                                <input type="text" required placeholder="e.g., Netflix, Rent, Electricity..." value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:font-semibold placeholder:text-slate-400" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Amount Due (₹)</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        required
                                                        placeholder="0"
                                                        value={amount}
                                                        onChange={(e) => handleAmountChange(e, setAmount)}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Target Date</label>
                                                    <div className="relative w-full">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                        <input type="date" required value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <PremiumDropdown label="Frequency" value={interval} options={intervalOptions} onChange={setInterval} icon={Repeat} />
                                                </div>
                                                <div className="col-span-2 sm:col-span-1">
                                                    <PremiumDropdown label="Category" value={category} options={categoryOptions} onChange={setCategory} icon={Briefcase} />
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-100">
                                                <PremiumDropdown label="Funding Source" value={accountId} options={accountOptions} onChange={setAccountId} icon={Wallet} />
                                            </div>

                                        </form>
                                    </div>

                                    <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 bg-slate-50/80 rounded-b-[2rem] flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                                        <button onClick={() => setIsFormOpen(false)} className="w-full sm:w-auto bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-black px-6 py-3.5 rounded-xl transition-all shadow-sm focus:outline-none">Cancel</button>
                                        <button form="contractForm" type="submit" disabled={submitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-8 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 focus:outline-none">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : editingId ? <Pencil className="w-4 h-4 font-bold" strokeWidth={3} /> : <FileText className="w-4 h-4 font-bold" strokeWidth={3} />}
                                            {editingId ? "Update Contract" : "Establish Contract"}
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