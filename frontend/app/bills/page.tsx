"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    CalendarDays, CreditCard, Repeat, CheckCircle2,
    Plus, Loader2, Receipt, X, ChevronDown, Check,
    Laptop, Zap, Home, Shield,
    Wallet
} from "lucide-react";

interface Account {
    currentBalance: ReactNode;
    id: string;
    name: string;
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
    account: { id: string; name: string };
}

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
                    {Icon && <Icon className="w-4 h-4 text-slate-400" />}
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

export default function BillsPage() {
    const [bills, setBills] = useState<RecurringBill[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("UTILITIES");
    const [interval, setInterval] = useState("MONTHLY");
    const [nextDueDate, setNextDueDate] = useState("");
    const [accountId, setAccountId] = useState("");

    // Payment Modal State
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [activeBill, setActiveBill] = useState<RecurringBill | null>(null);
    const [payAmount, setPayAmount] = useState("");
    const [payAccountId, setPayAccountId] = useState("");
    const [processingPayment, setProcessingPayment] = useState(false);

    const fetchData = async () => {
        try {
            const [billsRes, accountsRes] = await Promise.all([
                api.get("/recurring-bills"),
                api.get("/accounts"),
            ]);
            setBills(billsRes.data);
            setAccounts(accountsRes.data);

            if (accountsRes.data.length > 0 && !accountId) {
                setAccountId(accountsRes.data[0].id);
            }
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to sync your bills.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount || !nextDueDate || !accountId) return toast.error("Please fill all fields.");

        setSubmitting(true);
        try {
            await api.post("/recurring-bills", {
                name,
                amount: parseFloat(amount),
                category,
                interval,
                nextDueDate: new Date(nextDueDate).toISOString(),
                accountId,
            });
            toast.success("Recurring bill activated.");
            setName(""); setAmount(""); setNextDueDate("");
            fetchData();
        } catch (error) {
            toast.error("Failed to create bill.");
        } finally {
            setSubmitting(false);
        }
    };

    const openPayModal = (bill: RecurringBill) => {
        setActiveBill(bill);
        setPayAmount(bill.amount.toString());
        setPayAccountId(bill.account?.id || bill.accountId);
        setPayModalOpen(true);
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBill) return;

        setProcessingPayment(true);
        try {
            await api.patch(`/recurring-bills/${activeBill.id}/pay`, {
                amount: parseFloat(payAmount),
                accountId: payAccountId
            });

            toast.success(`${activeBill.name} marked as paid!`);
            setPayModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to process payment.");
        } finally {
            setProcessingPayment(false);
        }
    };

    // --- Configuration for Custom Dropdowns ---
    const accountOptions = accounts.map(a => ({ label: `${a.name} (₹${a.currentBalance})`, value: a.id }));
    const intervalOptions = [
        { label: "Weekly", value: "WEEKLY" },
        { label: "Monthly", value: "MONTHLY" },
        { label: "Yearly", value: "YEARLY" }
    ];
    const categoryOptions = [
        { label: "Software & SaaS", value: "SOFTWARE" },
        { label: "Utilities", value: "UTILITIES" },
        { label: "Housing & Rent", value: "HOUSING" },
        { label: "Insurance", value: "INSURANCE" }
    ];

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "SOFTWARE": return <Laptop className="w-5 h-5 text-indigo-500" />;
            case "UTILITIES": return <Zap className="w-5 h-5 text-amber-500" />;
            case "HOUSING": return <Home className="w-5 h-5 text-blue-500" />;
            case "INSURANCE": return <Shield className="w-5 h-5 text-emerald-500" />;
            default: return <Receipt className="w-5 h-5 text-slate-500" />;
        }
    };

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };
    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-100 relative">
                <Navbar />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex items-center justify-between mb-10 border-b border-slate-200/60 pb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm"><Repeat className="h-6 w-6 text-blue-600 font-bold" /></div>
                                Subscription Engine
                            </h1>
                            <p className="text-sm font-semibold text-slate-500 mt-3">
                                Automate, track, and dynamically fund your recurring obligations.
                            </p>
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-32">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 font-bold" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column: Active Bills List */}
                            <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="lg:col-span-2 space-y-5">
                                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                                    Active Obligations ({bills.length})
                                </h2>

                                {bills.length === 0 ? (
                                    <motion.div variants={fadeUp} className="bg-white border border-slate-200 rounded-[2rem] p-16 text-center shadow-sm">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100">
                                            <Receipt className="h-8 w-8 font-bold" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">No active commitments</h3>
                                        <p className="text-slate-500 text-sm font-semibold mt-2">Initialize your first recurring contract on the right.</p>
                                    </motion.div>
                                ) : (
                                    bills.map((bill) => {
                                        const dueDate = new Date(bill.nextDueDate);
                                        const isDueSoon = dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

                                        return (
                                            <motion.div key={bill.id} variants={fadeUp} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all hover:shadow-lg hover:border-slate-300 relative overflow-hidden group">
                                                {/* Soft Glare Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/60 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full ease-in-out z-20"></div>

                                                <div className="flex items-center gap-5 relative z-10">
                                                    <div className={`p-4 rounded-2xl border shadow-sm ${isDueSoon ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                                        {getCategoryIcon(bill.category)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{bill.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                            <span className={isDueSoon ? 'text-rose-600' : 'text-blue-600'}>{bill.interval}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="truncate">{bill.account?.name || 'Default Source'}</span>
                                                        </div>
                                                        {bill.lastPaidDate && (
                                                            <p className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-wider">
                                                                Last Cleared: {new Date(bill.lastPaidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-5 sm:pt-0 border-slate-100 relative z-10">
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold font-mono text-slate-900 tracking-tight">₹{bill.amount.toLocaleString()}</p>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isDueSoon ? 'text-rose-600' : 'text-slate-400'}`}>
                                                            Due: {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => openPayModal(bill)}
                                                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-slate-900/10"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 font-bold" />
                                                        Settle
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>

                            {/* Right Column: Add Bill Form */}
                            <motion.div initial="hidden" animate="show" variants={fadeUp} className="lg:col-span-1">
                                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm sticky top-24">
                                    <h2 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2 border-b border-slate-100 pb-4">
                                        <Plus className="h-4 w-4 font-bold text-blue-600" /> Construct Contract
                                    </h2>

                                    <form onSubmit={handleCreateBill} className="space-y-6">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Contract Name</label>
                                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., AWS Hosting" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Estimated Amount (₹)</label>
                                            <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base font-bold font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 sm:col-span-1">
                                                <PremiumDropdown label="Frequency" value={interval} options={intervalOptions} onChange={setInterval} />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <PremiumDropdown label="Category" value={category} options={categoryOptions} onChange={setCategory} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Target Date</label>
                                            <div className="relative w-full">
                                                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold pointer-events-none" />
                                                <input
                                                    type="date"
                                                    required
                                                    value={nextDueDate}
                                                    onChange={(e) => setNextDueDate(e.target.value)}
                                                    // Magic CSS to hide the ugly browser calendar icon but keep the native picker
                                                    className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <PremiumDropdown label="Funding Source" value={accountId} options={accountOptions} onChange={setAccountId} icon={Wallet} />
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <button type="submit" disabled={submitting || accounts.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95 flex justify-center items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50">
                                                {submitting ? <Loader2 className="h-4 w-4 animate-spin font-bold" /> : <><CreditCard className="h-4 w-4 font-bold" /> Initialize Contract</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>

                        </div>
                    )}
                </main>

                {/* --- CUSTOM GLASSMORPHISM PAYMENT MODAL --- */}
                <AnimatePresence>
                    {payModalOpen && activeBill && (
                        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => !processingPayment && setPayModalOpen(false)} />

                            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Execute Settlement</h3>
                                    <button onClick={() => setPayModalOpen(false)} className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors shadow-sm"><X className="h-5 w-5 font-bold" /></button>
                                </div>

                                <form onSubmit={handleConfirmPayment} className="p-8 space-y-6">
                                    <div className="text-center bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-inner">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Contract</p>
                                        <p className="font-black text-xl text-slate-900 tracking-tight">{activeBill.name}</p>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Final Settlement Amount (₹)</label>
                                        <input
                                            type="number" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-4 text-lg font-bold font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                        />
                                        <p className="text-[10px] text-slate-400 font-semibold mt-2">Adjust this value if the bill has fluctuated.</p>
                                    </div>

                                    <div>
                                        <PremiumDropdown label="Deduct Capital From" value={payAccountId} options={accountOptions} onChange={setPayAccountId} icon={Wallet} />
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <button type="submit" disabled={processingPayment} className="w-full bg-slate-900 hover:bg-black text-white rounded-xl py-4 text-sm font-bold transition-all active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20 disabled:opacity-50">
                                            {processingPayment ? <Loader2 className="h-5 w-5 animate-spin font-bold" /> : <><CheckCircle2 className="h-5 w-5 font-bold" /> Confirm Deduction</>}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </ProtectedRoute>
    );
}