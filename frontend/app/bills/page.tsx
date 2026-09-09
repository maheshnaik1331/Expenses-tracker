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
    Loader2, Plus, Search, Filter, Receipt, Wallet,
    Pencil, Trash2, Calendar, ShieldAlert, X, ChevronDown, Check, Landmark, Banknote,
    FileText, CheckCircle2, Clock, AlertCircle
} from "lucide-react";

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

export default function ContractsPage() {
    const { user, loading } = useAuth();

    const [bills, setBills] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);
    const [billToPay, setBillToPay] = useState<any | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("PENDING");

    const [form, setForm] = useState({
        title: "",
        amount: "",
        dueDate: new Date().toISOString().split('T')[0],
        category: "Subscription"
    });

    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentAccountId, setPaymentAccountId] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchLedgerData = async () => {
        try {
            setFetching(true);
            const [billsRes, accountsRes] = await Promise.all([
                api.get("/bills"), // Assuming your endpoint is /bills or /contracts
                api.get("/accounts")
            ]);
            setBills(billsRes.data || []);
            setAccounts(accountsRes.data || []);
        } catch (err) {
            toast.error("Failed to synchronize contracts.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && user) fetchLedgerData();
    }, [user, loading]);

    const resetForm = () => {
        setForm({
            title: "",
            amount: "",
            dueDate: new Date().toISOString().split('T')[0],
            category: "Subscription"
        });
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (bill: any) => {
        setForm({
            title: bill.title,
            amount: bill.amount.toString(),
            dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
            category: bill.category || "Subscription"
        });
        setEditingId(bill.id);
        setIsFormOpen(true);
    };

    const openPaymentModal = (bill: any) => {
        setBillToPay(bill);
        setPaymentAmount(bill.amount.toString());
        setPaymentDate(new Date().toISOString().split('T')[0]);
        if (accounts.length > 0) setPaymentAccountId(accounts[0].id);
    };

    // Number format handlers
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>, field?: string) => {
        const rawValue = e.target.value.replace(/,/g, "");
        if (rawValue === "") {
            if (field) setter((prev: any) => ({ ...prev, [field]: "" }));
            else setter("");
            return;
        }
        if (!isNaN(Number(rawValue))) {
            const formatted = Number(rawValue).toLocaleString("en-IN");
            if (field) setter((prev: any) => ({ ...prev, [field]: formatted }));
            else setter(formatted);
        }
    };

    const confirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanAmount = paymentAmount.replace(/,/g, "");
        if (!billToPay || !paymentAccountId || !paymentDate || !cleanAmount) return;

        try {
            setSubmitting(true);
            await api.patch(`/bills/${billToPay.id}/pay`, {
                accountId: paymentAccountId,
                amount: parseFloat(cleanAmount),
                date: new Date(paymentDate).toISOString()
            });
            toast.success("Settlement executed successfully.");
            fetchLedgerData();
            setBillToPay(null);
        } catch (err) {
            toast.error("Failed to process settlement.");
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeletion = async () => {
        if (!billToDelete) return;
        try {
            setSubmitting(true);
            await api.delete(`/bills/${billToDelete}`);
            toast.success("Contract purged from system.");
            fetchLedgerData();
        } catch (err) {
            toast.error("Failed to delete contract.");
        } finally {
            setSubmitting(false);
            setBillToDelete(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanAmount = form.amount.replace(/,/g, "");
        if (!form.title || !cleanAmount) return toast.error("Title and amount required.");

        try {
            setSubmitting(true);
            const payload = {
                title: form.title,
                amount: parseFloat(cleanAmount),
                dueDate: new Date(form.dueDate).toISOString(),
                category: form.category
            };

            if (editingId) {
                await api.patch(`/bills/${editingId}`, payload);
                toast.success("Contract updated.");
            } else {
                await api.post("/bills", payload);
                toast.success("Contract established.");
            }

            setIsFormOpen(false);
            fetchLedgerData();
        } catch (err) {
            toast.error("Failed to commit contract.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBills = useMemo(() => {
        return bills.filter(b => {
            const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [bills, searchTerm, statusFilter]);

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };
    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    const accountOptions = accounts.map(a => ({
        label: parseAccountName(a.name),
        balance: formatINR(a.currentBalance),
        value: a.id,
        iconNode: <div className="w-8 h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center bg-white shrink-0 p-1.5">{getAccountIconNode(a, "w-full h-full")}</div>
    }));

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

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-200/80 pb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Contractual Obligations</h1>
                            <p className="text-slate-500 text-sm mt-2 font-bold tracking-wide">Manage recurring bills, subscriptions, and outstanding payables.</p>
                        </div>
                        <button onClick={resetForm} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
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
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {fetching ? (
                                <div className="py-24 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 font-bold mb-4" strokeWidth={3} />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Decrypting Contracts...</span>
                                </div>
                            ) : filteredBills.length === 0 ? (
                                <div className="py-32 text-center flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl">
                                    <div className="p-4 bg-white border border-slate-200 border-dashed rounded-2xl mb-4">
                                        <FileText className="w-8 h-8 text-slate-300" strokeWidth={2} />
                                    </div>
                                    <p className="text-slate-900 font-black text-lg">No Contracts Found</p>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Adjust your filters or establish a new payable.</p>
                                </div>
                            ) : (
                                filteredBills.map((bill) => {
                                    const isPaid = bill.status === "PAID";
                                    const isOverdue = !isPaid && new Date(bill.dueDate).getTime() < new Date().getTime();

                                    return (
                                        <div key={bill.id} className="p-5 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-transparent hover:border-blue-500 group">
                                            <div className="flex items-center gap-4 min-w-0 flex-1 pl-1">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 
                                                    ${isPaid ? 'bg-slate-50 border-slate-200 text-slate-400' : isOverdue ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                    <Receipt className="w-6 h-6 font-bold" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-base font-black truncate tracking-tight mb-1 ${isPaid ? 'text-slate-500' : 'text-slate-900'}`}>{bill.title}</p>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" /> {new Date(bill.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="hidden sm:inline text-slate-300">•</span>
                                                        <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-black ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isOverdue ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
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
                                                        <button onClick={() => openPaymentModal(bill)} className="px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm focus:outline-none">
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

                    {/* --- THE FLAWLESS, BREAKOUT SETTLEMENT MODAL --- */}
                    <AnimatePresence>
                        {billToPay && (
                            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !submitting && setBillToPay(null)} />

                                <div className="min-h-full flex items-center justify-center w-full my-4 sm:my-8">
                                    <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col">

                                        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 rounded-t-[2rem] shrink-0">
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Execute Settlement</h2>
                                            <button onClick={() => setBillToPay(null)} className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-full shadow-sm transition-colors focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                        </div>

                                        <div className="p-6 sm:p-8">
                                            <form id="payForm" onSubmit={confirmPayment} className="space-y-6">
                                                <div className="text-center bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Contract</p>
                                                    <p className="font-black text-xl text-slate-900 tracking-tight">{billToPay.title}</p>
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

                                                <div>
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Final Settlement Amount (₹)</label>
                                                    <input
                                                        type="text" inputMode="numeric" required value={paymentAmount} onChange={(e) => handleAmountChange(e, setPaymentAmount)}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-lg font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Adjust this value if the bill has fluctuated.</p>
                                                </div>

                                                {/* Breakout Dropdown - No overflow-hidden on parent! */}
                                                <div className="border-t border-slate-100 pt-6">
                                                    <PremiumDropdown label="Deduct Capital From" value={paymentAccountId} options={accountOptions} onChange={setPaymentAccountId} icon={Wallet} />
                                                </div>
                                            </form>
                                        </div>

                                        <div className="p-6 sm:px-8 sm:py-6 border-t border-slate-100 bg-slate-50/80 rounded-b-[2rem] flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                                            <button onClick={() => setBillToPay(null)} className="w-full sm:w-auto bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm font-black px-6 py-3.5 rounded-xl transition-all shadow-sm focus:outline-none">Cancel</button>
                                            <button form="payForm" type="submit" disabled={submitting || accounts.length === 0} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-black px-8 py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 focus:outline-none">
                                                {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : <CheckCircle2 className="w-4 h-4 font-bold" strokeWidth={3} />}
                                                Execute
                                            </button>
                                        </div>

                                    </motion.div>
                                </div>
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
                                                    <input type="text" required placeholder="e.g., Netflix, Rent, Electricity..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:font-semibold placeholder:text-slate-400" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Amount Due (₹)</label>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            required
                                                            placeholder="0"
                                                            value={form.amount}
                                                            onChange={(e) => handleAmountChange(e, setForm, 'amount')}
                                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-black font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Target Date</label>
                                                        <div className="relative w-full">
                                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                            <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm modern-date-input cursor-pointer" />
                                                        </div>
                                                    </div>
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

                </main>
            </div>
        </ProtectedRoute>
    );
}