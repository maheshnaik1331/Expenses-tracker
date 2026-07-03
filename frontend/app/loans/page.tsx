"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Loader2, Plus, ArrowDownRight, ArrowUpRight,
    Scale, Calendar, CheckCircle2, MoreVertical, ShieldCheck,
    User, Building2, Percent, Wallet, Home, Briefcase, Coins
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const LOAN_TYPES = [
    { id: "PERSONAL", label: "Personal", icon: User },
    { id: "HOME", label: "Home", icon: Home },
    { id: "BUSINESS", label: "Business", icon: Briefcase },
    { id: "GOLD", label: "Gold", icon: Coins },
];

export default function LoansPage() {
    const { user, loading } = useAuth();

    const [loans, setLoans] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [filterMode, setFilterMode] = useState<"ALL" | "BORROWED" | "LENT">("ALL");

    const [form, setForm] = useState({
        direction: "BORROWED" as "BORROWED" | "LENT",
        counterparty: "",
        type: "PERSONAL",
        principal: "",
        monthlyRate: "",
        startDate: new Date().toISOString().split('T')[0]
    });

    const fetchLoans = async () => {
        try {
            setFetching(true);
            const res = await api.get("/loans");
            setLoans(res.data || []);
        } catch (err) {
            toast.error("Failed to synchronize credit records.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && user) fetchLoans();
    }, [user, loading]);

    const resetForm = () => {
        setForm({
            direction: "BORROWED",
            counterparty: "",
            type: "PERSONAL",
            principal: "",
            monthlyRate: "",
            startDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.counterparty || !form.principal) return toast.error("Please provide a counterparty and principal amount.");

        try {
            setSubmitting(true);
            await api.post("/loans", {
                counterparty: form.counterparty,
                direction: form.direction,
                type: form.type,
                principal: parseFloat(form.principal),
                monthlyRate: form.monthlyRate ? parseFloat(form.monthlyRate) : 0,
                startDate: new Date(form.startDate).toISOString(),
            });

            toast.success(form.direction === "BORROWED" ? "Liability recorded." : "Receivable asset recorded.");
            setIsDialogOpen(false);
            resetForm();
            fetchLoans();
        } catch (err) {
            toast.error("Failed to commit ledger transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkCleared = async (id: string, counterparty: string) => {
        if (!confirm(`Are you sure you want to mark the agreement with ${counterparty} as CLEARED? This will close the record.`)) return;
        try {
            toast.loading("Closing financial instrument...", { id: "clear" });
            await api.patch(`/loans/${id}/clear`);
            toast.success("Instrument successfully closed.", { id: "clear" });
            fetchLoans();
        } catch (err) {
            toast.error("Failed to update status.", { id: "clear" });
        }
    };

    const totalBorrowed = loans.filter(l => l.direction === "BORROWED").reduce((sum, l) => sum + l.principal, 0);
    const totalLent = loans.filter(l => l.direction === "LENT").reduce((sum, l) => sum + l.principal, 0);
    const netExposure = totalLent - totalBorrowed;
    const filteredLoans = loans.filter(l => filterMode === "ALL" || l.direction === filterMode);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="h-8 w-8 animate-spin text-zinc-900" /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans">
                <Navbar />

                {/* Global CSS for the modern Date Picker hack */}
                <style dangerouslySetInnerHTML={{
                    __html: `
        .modern-date-input::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Credit Matrix</h1>
                            <p className="text-zinc-500 text-xs sm:text-sm mt-1">Manage institutional liabilities and personal receivables.</p>
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                            <DialogTrigger className="flex items-center justify-center gap-2 bg-zinc-900 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto">
                                <Plus className="w-4 h-4" /> Log Agreement
                            </DialogTrigger>

                            {/* APP-LIKE MODAL DESIGN: Bottom sheet on mobile, wide modal on desktop */}
                            <DialogContent className="bg-white p-0 rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] max-w-2xl w-full shadow-2xl border-0 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh] mt-auto sm:mt-0 !mb-0 sm:!mb-auto align-bottom sm:align-middle">

                                {/* Sticky Header */}
                                <div className="bg-slate-50 border-b border-slate-100 p-5 sm:p-6 flex items-center gap-4 shrink-0">
                                    <div className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-2xl shadow-sm shrink-0">
                                        <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-900">Establish Credit Instrument</DialogTitle>
                                        <p className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-0.5 uppercase tracking-wider">Deploy Liability or Asset</p>
                                    </div>
                                </div>

                                {/* Scrollable Form Body */}
                                <div className="overflow-y-auto flex-1 p-5 sm:p-8">
                                    <form id="loan-form" onSubmit={handleSubmit} className="space-y-8">

                                        {/* UX Toggle */}
                                        <div>
                                            <label className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-3">Direction of Capital</label>
                                            <div className="flex p-1.5 bg-slate-100 rounded-2xl shadow-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, direction: "BORROWED" })}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${form.direction === "BORROWED" ? "bg-white text-rose-600 shadow-md border border-slate-200/60 scale-[1.02]" : "text-zinc-500 hover:text-zinc-700"}`}
                                                >
                                                    <ArrowDownRight className={`w-4 h-4 ${form.direction === "BORROWED" ? "text-rose-500" : "text-zinc-400"}`} />
                                                    I Borrowed Money
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, direction: "LENT" })}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${form.direction === "LENT" ? "bg-white text-emerald-600 shadow-md border border-slate-200/60 scale-[1.02]" : "text-zinc-500 hover:text-zinc-700"}`}
                                                >
                                                    <ArrowUpRight className={`w-4 h-4 ${form.direction === "LENT" ? "text-emerald-500" : "text-zinc-400"}`} />
                                                    I Lent Money
                                                </button>
                                            </div>
                                        </div>

                                        {/* Interactive Icon Grid */}
                                        <div>
                                            <label className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-3">Instrument Category</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {LOAN_TYPES.map((type) => {
                                                    const Icon = type.icon;
                                                    const isSelected = form.type === type.id;
                                                    return (
                                                        <button
                                                            key={type.id}
                                                            type="button"
                                                            onClick={() => setForm({ ...form, type: type.id })}
                                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${isSelected
                                                                ? "border-zinc-900 bg-zinc-900 text-white shadow-lg scale-[1.03]"
                                                                : "border-slate-200 bg-white text-zinc-500 hover:border-zinc-400 hover:bg-slate-50 hover:shadow-sm"
                                                                }`}
                                                        >
                                                            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 sm:mb-3 ${isSelected ? "text-white" : "text-zinc-400"}`} />
                                                            <span className={`text-[10px] sm:text-xs font-bold tracking-wide uppercase ${isSelected ? "text-white" : "text-zinc-700"}`}>
                                                                {type.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Counterparty Entity</label>
                                                <input
                                                    type="text" required placeholder="e.g., HDFC Bank, John Doe"
                                                    value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-400"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Principal Amount (₹)</label>
                                                <input
                                                    type="number" step="0.01" required placeholder="0.00"
                                                    value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-lg sm:text-xl font-bold font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Interest / mo</label>
                                                    <div className="relative">
                                                        <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                        <input
                                                            type="number" step="0.01" placeholder="0.0"
                                                            value={form.monthlyRate} onChange={(e) => setForm({ ...form, monthlyRate: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3.5 text-sm font-bold font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all shadow-inner"
                                                        />
                                                    </div>
                                                </div>

                                                {/* MODERN CUSTOM DATE PICKER TRICK */}
                                                <div>
                                                    <label className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Start Date</label>
                                                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner focus-within:ring-2 focus-within:ring-zinc-900 transition-all">
                                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                                        <input
                                                            type="date" required
                                                            value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                                            className="w-full bg-transparent pl-10 pr-4 py-3.5 text-sm font-bold text-zinc-900 outline-none modern-date-input"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* Sticky Action Footer */}
                                <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                                    <button type="button" onClick={() => setIsDialogOpen(false)} className="bg-white hover:bg-slate-50 border border-slate-200 text-zinc-700 text-sm font-bold px-6 py-3.5 rounded-xl transition-all shadow-sm w-full sm:w-auto">
                                        Cancel
                                    </button>
                                    <button form="loan-form" type="submit" disabled={submitting} className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50 w-full sm:w-auto">
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                        Lock Agreement
                                    </button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Premium KPI Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-rose-100 flex items-center gap-4 sm:gap-5 hover:shadow-md transition-all">
                            <div className="p-3 sm:p-4 bg-rose-50 text-rose-600 rounded-2xl shrink-0"><ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 truncate">Total Liabilities</p>
                                <h2 className="text-xl sm:text-2xl font-bold text-rose-600 truncate">₹{totalBorrowed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                            </div>
                        </div>

                        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4 sm:gap-5 hover:shadow-md transition-all">
                            <div className="p-3 sm:p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 truncate">Total Assets</p>
                                <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 truncate">₹{totalLent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                            </div>
                        </div>

                        <div className="bg-zinc-900 p-5 sm:p-6 rounded-3xl shadow-lg border border-zinc-800 flex items-center gap-4 sm:gap-5 text-white transform hover:-translate-y-1 transition-all">
                            <div className="p-3 sm:p-4 bg-zinc-800 rounded-2xl shrink-0"><Wallet className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 truncate">Net Exposure</p>
                                <h2 className="text-xl sm:text-2xl font-bold truncate">
                                    {netExposure < 0 ? "-" : ""}₹{Math.abs(netExposure).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Scroll Filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                        {["ALL", "BORROWED", "LENT"].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode as any)}
                                className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${filterMode === mode
                                    ? "bg-white text-zinc-900 shadow-sm border border-slate-200"
                                    : "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-white border border-transparent"
                                    }`}
                            >
                                {mode === "ALL" ? "All Agreements" : mode === "BORROWED" ? "My Liabilities" : "My Receivables"}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Card Grid */}
                    {fetching ? (
                        <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-zinc-400" /></div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-16 text-center max-w-xl mx-auto shadow-sm mt-4 sm:mt-8">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-50 flex items-center justify-center text-zinc-400 mx-auto mb-4 sm:mb-6 border border-slate-100">
                                <Scale className="w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900">No Active Agreements</h3>
                            <p className="text-zinc-500 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed max-w-sm mx-auto">
                                You do not have any active financial liabilities or receivables matching this filter.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                            {filteredLoans.map((loan) => {
                                const isBorrowed = loan.direction === "BORROWED";
                                const typeIcon = LOAN_TYPES.find(t => t.id === loan.type)?.icon || Building2;
                                const Icon = typeIcon;

                                return (
                                    <div key={loan.id} className={`bg-white rounded-[24px] shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative group ${isBorrowed ? 'border-rose-100/50' : 'border-emerald-100/50'}`}>

                                        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start gap-4">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border ${isBorrowed ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 truncate tracking-tight">{loan.counterparty}</h3>
                                                    <div className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5 ${isBorrowed ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {isBorrowed ? <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                                        {isBorrowed ? "To Be Repaid" : "To Be Collected"}
                                                    </div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-50 border border-transparent text-zinc-400 hover:text-zinc-900 transition-all focus:outline-none">
                                                    <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white w-48 p-2 rounded-2xl shadow-xl border border-slate-100 mt-2">
                                                    <DropdownMenuItem onClick={() => handleMarkCleared(loan.id, loan.counterparty)} className="flex items-center gap-3 font-bold text-sm text-emerald-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-emerald-50">
                                                        <CheckCircle2 className="w-4 h-4" /> Mark as Settled
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="p-5 sm:p-6 flex-1">
                                            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Principal Amount</span>
                                            <span className="text-3xl sm:text-4xl font-bold text-zinc-900 block tracking-tight truncate">
                                                ₹{loan.principal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </span>

                                            <div className="mt-6 sm:mt-8 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Interest</span>
                                                    <span className="text-xs sm:text-sm font-bold text-zinc-700 font-mono">{loan.monthlyRate}% / mo</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Category</span>
                                                    <span className="text-xs sm:text-sm font-bold text-zinc-700">{loan.type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto p-4 sm:p-5 rounded-b-[24px] border-t bg-slate-50/50 border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Originated</span>
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold text-zinc-700 font-mono">
                                                {new Date(loan.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}