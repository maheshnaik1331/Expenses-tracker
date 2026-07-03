"use client";

import { useState, useEffect, ReactNode } from "react";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    CalendarDays, CreditCard, Repeat, CheckCircle2,
    Plus, Loader2, Receipt, X
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

export default function BillsPage() {
    const [bills, setBills] = useState<RecurringBill[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // New Bill Form State
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("UTILITIES");
    const [interval, setInterval] = useState("MONTHLY");
    const [nextDueDate, setNextDueDate] = useState("");
    const [accountId, setAccountId] = useState("");

    // --- NEW: Payment Modal State ---
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

            if (accountsRes.data.length > 0) {
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

    // 1. Open the dynamic modal
    const openPayModal = (bill: RecurringBill) => {
        setActiveBill(bill);
        setPayAmount(bill.amount.toString());
        // Use the backend's provided account ID if it exists, otherwise fallback
        setPayAccountId(bill.account?.id || bill.accountId);
        setPayModalOpen(true);
    };

    // 2. Submit the dynamic payment
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
            fetchData(); // Refresh the list to update nextDueDate and lastPaidDate
        } catch (error) {
            console.error(error);
            toast.error("Failed to process payment.");
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans relative">
                <Navbar />

                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                                <Repeat className="h-6 w-6 text-zinc-900" />
                                Subscription Engine
                            </h1>
                            <p className="text-sm font-semibold text-zinc-500 mt-1">
                                Automate and track your fixed monthly outflows.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column: Active Bills List */}
                            <div className="lg:col-span-2 space-y-4">
                                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4">
                                    Active Subscriptions ({bills.length})
                                </h2>

                                {bills.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                                        <Receipt className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold text-zinc-900">No active bills</h3>
                                        <p className="text-zinc-500 text-sm mt-1">Set up your first recurring payment on the right.</p>
                                    </div>
                                ) : (
                                    bills.map((bill) => {
                                        const dueDate = new Date(bill.nextDueDate);
                                        const isDueSoon = dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

                                        return (
                                            <div key={bill.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${isDueSoon ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-zinc-600'}`}>
                                                        <CalendarDays className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-zinc-900 leading-tight">{bill.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                                            <span>{bill.interval}</span>
                                                            <span>•</span>
                                                            <span>{bill.account?.name || 'Unknown Account'}</span>
                                                        </div>
                                                        {bill.lastPaidDate && (
                                                            <p className="text-[11px] font-medium text-emerald-600 mt-1">
                                                                Last Paid: {new Date(bill.lastPaidDate).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0 border-slate-100">
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-zinc-900">₹{bill.amount.toLocaleString()}</p>
                                                        <p className={`text-xs font-bold uppercase tracking-wider ${isDueSoon ? 'text-rose-500' : 'text-zinc-500'}`}>
                                                            Due: {dueDate.toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => openPayModal(bill)}
                                                        className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Pay Now
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Right Column: Add Bill Form */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
                                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> New Bill
                                    </h2>

                                    <form onSubmit={handleCreateBill} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Bill Name</label>
                                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Netflix, Rent" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none transition-all" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Amount (₹)</label>
                                            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none transition-all" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Interval</label>
                                                <select value={interval} onChange={(e) => setInterval(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none transition-all">
                                                    <option value="WEEKLY">Weekly</option>
                                                    <option value="MONTHLY">Monthly</option>
                                                    <option value="YEARLY">Yearly</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Category</label>
                                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none transition-all">
                                                    <option value="SOFTWARE">Software</option>
                                                    <option value="UTILITIES">Utilities</option>
                                                    <option value="HOUSING">Housing</option>
                                                    <option value="INSURANCE">Insurance</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Next Due Date</label>
                                            <input type="date" required value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none transition-all" />
                                        </div>

                                        <div className="space-y-1.5 mb-6">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Default Account</label>
                                            <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none transition-all">
                                                {accounts.length === 0 && <option value="">No accounts found</option>}
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button type="submit" disabled={submitting || accounts.length === 0} className="w-full bg-zinc-900 hover:bg-black text-white rounded-xl py-3 text-sm font-bold transition-all active:scale-95 flex justify-center items-center gap-2 shadow-md disabled:opacity-50">
                                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                                <><CreditCard className="h-4 w-4" /> Save Subscription</>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>

                        </div>
                    )}
                </main>

                {/* --- DYNAMIC PAYMENT MODAL --- */}
                {payModalOpen && activeBill && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-zinc-900">Confirm Payment Details</h3>
                                <button
                                    onClick={() => setPayModalOpen(false)}
                                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-zinc-600 rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleConfirmPayment} className="p-6 space-y-5">
                                <div>
                                    <p className="text-sm text-zinc-500 mb-1">Paying bill</p>
                                    <p className="font-black text-xl text-zinc-900">{activeBill.name}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Actual Amount Paid (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                                    />
                                    <p className="text-xs text-zinc-400 ml-1">Change this if your bill fluctuates this month.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Paid From Account</label>
                                    <select
                                        required
                                        value={payAccountId}
                                        onChange={(e) => setPayAccountId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} - Bal: ₹{acc.currentBalance}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={processingPayment}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95 flex justify-center items-center gap-2 shadow-md disabled:opacity-50"
                                    >
                                        {processingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                            <><CheckCircle2 className="h-5 w-5" /> Confirm & Execute Payment</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </ProtectedRoute>
    );
}