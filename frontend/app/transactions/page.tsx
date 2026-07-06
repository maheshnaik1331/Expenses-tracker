"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Loader2, Plus, ArrowUpRight, ArrowDownRight,
    Search, Filter, Receipt, Coffee, Home, Car, Wallet, Briefcase, IndianRupee,
    Pencil, Trash2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Category configurations for UI rendering
const INCOME_CATEGORIES = ["Salary", "Freelance", "Investments", "Refund", "Other"];
const EXPENSE_CATEGORIES = ["Housing", "Food & Dining", "Transportation", "Utilities", "Subscriptions", "Debt Repayment", "Shopping", "Other"];

// Helper to map categories to icons
const getCategoryIcon = (category: string, type: string) => {
    if (type === "INCOME") return <Briefcase className="w-4 h-4" />;
    switch (category) {
        case "Food & Dining": return <Coffee className="w-4 h-4" />;
        case "Housing": return <Home className="w-4 h-4" />;
        case "Transportation": return <Car className="w-4 h-4" />;
        case "Subscriptions": return <Receipt className="w-4 h-4" />;
        default: return <Wallet className="w-4 h-4" />;
    }
};

export default function TransactionsPage() {
    const { user, loading } = useAuth();

    // App State
    const [transactions, setTransactions] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modal & Edit State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, INCOME, EXPENSE

    // Form State
    const [form, setForm] = useState({
        type: "EXPENSE",
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        note: "",
        accountId: ""
    });

    // Fetch all required data (Transactions & Accounts)
    const fetchDashboardData = async () => {
        try {
            setFetching(true);
            const [txRes, accRes] = await Promise.all([
                api.get("/transactions"),
                api.get("/accounts")
            ]);

            setTransactions(txRes.data || []);
            setAccounts(accRes.data || []);

            // Auto-select the first account in the form if available
            if (accRes.data && accRes.data.length > 0 && !form.accountId) {
                setForm(prev => ({ ...prev, accountId: accRes.data[0].id }));
            }
        } catch (err) {
            console.error("Error fetching ledger data:", err);
            toast.error("Failed to synchronize transaction history.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && user) {
            fetchDashboardData();
        }
    }, [user, loading]);

    // Handle Form Reset
    const resetForm = () => {
        setForm({
            type: "EXPENSE",
            amount: "",
            category: EXPENSE_CATEGORIES[0],
            note: "",
            accountId: accounts.length > 0 ? accounts[0].id : ""
        });
        setEditingId(null);
    };

    // Switch between Income and Expense categories dynamically
    const handleTypeChange = (newType: string) => {
        setForm({
            ...form,
            type: newType,
            category: newType === "INCOME" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
        });
    };

    // Open Edit Modal with Pre-filled Data
    const handleEditClick = (tx: any) => {
        setForm({
            type: tx.type,
            amount: tx.amount.toString(),
            category: tx.category,
            note: tx.note || "",
            accountId: tx.accountId
        });
        setEditingId(tx.id);
        setIsDialogOpen(true);
    };

    // Handle Delete Transaction
    const handleDeleteClick = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this transaction? This action will impact your account balance and cannot be undone.")) return;

        try {
            await api.delete(`/transactions/${id}`);
            toast.success("Transaction deleted successfully.");
            fetchDashboardData(); // Refresh the list and balances
        } catch (err) {
            console.error("Deletion failed:", err);
            toast.error("Failed to delete transaction.");
        }
    };

    // Submit New OR Edited Transaction
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) return toast.error("Please enter a valid amount.");
        if (!form.accountId) return toast.error("Please select a bank account to link this transaction.");

        try {
            setSubmitting(true);

            const payload = {
                type: form.type,
                amount: parseFloat(form.amount),
                category: form.category,
                note: form.note,
                accountId: form.accountId
            };

            if (editingId) {
                // UPDATE EXISTING
                await api.patch(`/transactions/${editingId}`, payload);
                toast.success("Transaction updated successfully.");
            } else {
                // CREATE NEW
                await api.post("/transactions", payload);
                toast.success(`${form.type === "INCOME" ? "Income" : "Expense"} logged successfully.`);
            }

            setIsDialogOpen(false);
            resetForm();
            fetchDashboardData(); // Refresh the list and balances
        } catch (err) {
            console.error("Submission failed:", err);
            toast.error(editingId ? "Failed to update transaction." : "Failed to record transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    // KPI Calculations based on current data
    const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((acc, curr) => acc + curr.amount, 0);
    const netCashflow = totalIncome - totalExpense;

    // Filter Logic
    const filteredTransactions = transactions.filter((tx) => {
        const matchesSearch =
            tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
                <Navbar />

                <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-slate-200/60 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Cashflow Ledger</h1>
                            <p className="text-zinc-500 text-sm mt-1">
                                Log, categorize, edit, and monitor your enterprise income and expenses.
                            </p>
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                            <DialogTrigger
                                disabled={accounts.length === 0}
                                onClick={() => resetForm()} // Ensure form is clean for new entries
                                className="flex items-center justify-center gap-2 bg-zinc-900 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-md hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={accounts.length === 0 ? "Add a bank account first" : ""}
                            >
                                <Plus className="w-4 h-4" /> Log Transaction
                            </DialogTrigger>
                            <DialogContent className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-zinc-900 mb-2">
                                        {editingId ? "Edit Record" : "Record Entry"}
                                    </DialogTitle>
                                </DialogHeader>

                                <form onSubmit={handleSubmit} className="space-y-4">

                                    {/* Type Switcher */}
                                    <div className="flex p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange("EXPENSE")}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.type === "EXPENSE" ? "bg-white text-rose-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                                        >
                                            Expense
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTypeChange("INCOME")}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${form.type === "INCOME" ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                                        >
                                            Income
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Amount */}
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Amount</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    placeholder="0.00"
                                                    value={form.amount}
                                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                                                />
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Category</label>
                                            <select
                                                value={form.category}
                                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-800 cursor-pointer"
                                            >
                                                {(form.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Account Selection */}
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Source / Destination Account</label>
                                        <select
                                            required
                                            value={form.accountId}
                                            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-800 cursor-pointer"
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.currentBalance})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Note */}
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Note (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="E.g., Client payment, Dinner with team..."
                                            value={form.note}
                                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-900"
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsDialogOpen(false)}
                                            className="bg-slate-100 hover:bg-slate-200 text-zinc-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                            {editingId ? "Update Record" : "Save Record"}
                                        </button>
                                    </div>

                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Real-time KPI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Inflow</p>
                                <p className="text-xl font-bold text-zinc-900 mt-0.5">₹{totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Outflow</p>
                                <p className="text-xl font-bold text-zinc-900 mt-0.5">₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center gap-4 text-white">
                            <div className="p-3 bg-zinc-800 rounded-xl"><Wallet className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Net Cashflow</p>
                                <p className="text-xl font-bold mt-0.5">
                                    {netCashflow < 0 ? "-" : ""}₹{Math.abs(netCashflow).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Data Table / List Area */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">

                        {/* Table Toolbar */}
                        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search category, notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-zinc-900"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Filter className="w-4 h-4 text-zinc-400" />
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-700 cursor-pointer"
                                >
                                    <option value="ALL">All Transactions</option>
                                    <option value="INCOME">Income Only</option>
                                    <option value="EXPENSE">Expenses Only</option>
                                </select>
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="divide-y divide-slate-100">
                            {fetching ? (
                                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-zinc-500 font-medium text-sm">No transactions found.</p>
                                </div>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const isIncome = tx.type === "INCOME";
                                    const account = accounts.find(a => a.id === tx.accountId);

                                    return (
                                        <div key={tx.id} className="group p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                            {/* Transaction Info */}
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className={`p-3 rounded-xl flex-shrink-0 ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-zinc-600'}`}>
                                                    {getCategoryIcon(tx.category, tx.type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-zinc-900 truncate">{tx.category}</p>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{tx.note || "No notes"}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline font-medium text-zinc-600">{account?.name || "Unknown Account"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amount & Actions */}
                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto border-t sm:border-0 pt-4 sm:pt-0 border-slate-100">
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`text-base font-bold font-mono ${isIncome ? 'text-emerald-600' : 'text-zinc-900'}`}>
                                                        {isIncome ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-1">
                                                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>

                                                {/* Action Buttons (Edit / Delete) */}
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditClick(tx)}
                                                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Transaction"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(tx.id)}
                                                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    )
                                })
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}