"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
    Loader2, Plus, Building2, MoreVertical, Edit2, Trash2,
    Search, MapPin, CreditCard, Landmark, Banknote, ChevronDown, Check, Wallet
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Fallback Logo Component
const BankLogo = ({ type, name, domain }: { type: string, name: string, domain: string }) => {
    const [error, setError] = useState(false);
    const isCash = type === "cash_wallet";

    if (isCash) {
        return (
            <div className="w-12 h-12 rounded-full bg-emerald-100/80 border border-emerald-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Banknote className="w-6 h-6 text-emerald-700" />
            </div>
        );
    }

    if (error || !domain) {
        return (
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 className="w-6 h-6 text-slate-400" />
            </div>
        );
    }

    return (
        <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center p-2 flex-shrink-0 shadow-sm">
            <img
                src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`}
                alt={name}
                className="w-full h-full object-contain"
                onError={() => setError(true)}
            />
        </div>
    );
};

export default function AccountsPage() {
    const { user, loading } = useAuth();

    const [accounts, setAccounts] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // UX UI State
    const [dialogMode, setDialogMode] = useState<"BANK" | "CASH" | null>(null);
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

    // Custom Searchable Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        name: "",
        type: "sbi",
        accountNumber: "",
        ifscCode: "",
        branch: "",
        currentBalance: ""
    });

    const fetchAccounts = async () => {
        try {
            setFetching(true);
            const res = await api.get("/accounts");
            setAccounts(res.data || []);
        } catch (err) {
            toast.error("Failed to sync your bank records.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && user) fetchAccounts();
    }, [user, loading]);

    // Handle clicking outside the custom dropdown to close it safely
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const resetForm = () => {
        setForm({ name: "", type: "sbi", accountNumber: "", ifscCode: "", branch: "", currentBalance: "" });
        setEditingAccountId(null);
        setBankSearch("");
        setDialogMode(null);
    };

    const openNewForm = (mode: "BANK" | "CASH") => {
        resetForm();
        setForm(prev => ({ ...prev, type: mode === "CASH" ? "cash_wallet" : "sbi" }));
        setDialogMode(mode);
    };

    const handleEditClick = (account: any) => {
        setEditingAccountId(account.id);
        const mode = account.type === "cash_wallet" ? "CASH" : "BANK";
        setDialogMode(mode);
        setForm({
            name: account.name,
            type: account.type,
            accountNumber: account.accountNumber || "",
            ifscCode: account.ifscCode || "",
            branch: account.branch || "",
            currentBalance: account.currentBalance.toString()
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.type) return toast.error("Please provide an alias and select a type.");

        try {
            setSubmitting(true);
            const isCash = form.type === "cash_wallet";
            const payload = {
                name: form.name,
                type: form.type,
                accountNumber: isCash ? null : form.accountNumber || null,
                ifscCode: isCash ? null : form.ifscCode || null,
                branch: isCash ? null : form.branch || null,
                currentBalance: parseFloat(form.currentBalance) || 0
            };

            if (editingAccountId) {
                await api.put(`/accounts/${editingAccountId}`, payload);
                toast.success("Ledger updated.");
            } else {
                await api.post("/accounts", payload);
                toast.success("New ledger mapped.");
            }
            resetForm();
            fetchAccounts();
        } catch (err) {
            toast.error("Failed to commit ledger transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm("Are you sure? This will decouple the ledger and drop associated transaction visibility.")) return;
        try {
            toast.loading("Purging ledger...", { id: "del" });
            await api.delete(`/accounts/${id}`);
            toast.success("Ledger destroyed safely.", { id: "del" });
            fetchAccounts();
        } catch (err) {
            toast.error("Failed to erase account.", { id: "del" });
        }
    };

    const filteredBanks = INDIAN_BANK_DIRECTORY.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
    const selectedBankData = INDIAN_BANK_DIRECTORY.find(b => b.id === form.type);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="h-8 w-8 animate-spin text-zinc-900" /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans">
                <Navbar />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-10">

                    {/* Top UX Header with Split Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Financial Assets</h1>
                            <p className="text-zinc-500 text-sm mt-1">Manage institutional bank accounts and physical cash wallets.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => openNewForm("CASH")}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-zinc-700 font-bold text-sm px-5 py-3 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                            >
                                <Wallet className="w-4 h-4 text-emerald-600" /> Add Cash Wallet
                            </button>
                            <button
                                onClick={() => openNewForm("BANK")}
                                className="flex items-center justify-center gap-2 bg-zinc-900 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-95"
                            >
                                <Landmark className="w-4 h-4" /> Add Bank Account
                            </button>
                        </div>
                    </div>

                    {/* Unified Modal (Handles both Bank and Cash flows beautifully) */}
                    <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) resetForm(); }}>
                        <DialogContent className="bg-transparent border-0 shadow-none p-0 max-w-2xl w-full" style={{ overflow: 'visible' }}>
                            <div className="bg-white rounded-3xl overflow-visible shadow-2xl">

                                {/* Modal Header */}
                                <div className={`p-6 sm:px-8 flex items-center gap-4 rounded-t-3xl border-b ${dialogMode === "CASH" ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className={`p-3 rounded-2xl shadow-sm border ${dialogMode === "CASH" ? 'bg-white border-emerald-200' : 'bg-white border-slate-200'}`}>
                                        {dialogMode === "CASH" ? <Banknote className="w-6 h-6 text-emerald-600" /> : <Landmark className="w-6 h-6 text-blue-600" />}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-bold text-zinc-900">
                                            {editingAccountId ? "Update Configuration" : (dialogMode === "CASH" ? "Initialize Cash Wallet" : "Link Bank Account")}
                                        </DialogTitle>
                                        <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-wider">
                                            {dialogMode === "CASH" ? "Physical Reserve Tracking" : "Institutional Ledger Mapping"}
                                        </p>
                                    </div>
                                </div>

                                {/* Modal Form */}
                                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

                                    {dialogMode === "BANK" && (
                                        <div className="relative z-[100]" ref={dropdownRef}>
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Select Financial Institution</label>
                                            <div
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold text-zinc-900 cursor-pointer flex justify-between items-center shadow-sm transition-all"
                                            >
                                                <span className="truncate">{selectedBankData?.name || "Select Institution..."}</span>
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            </div>

                                            {isDropdownOpen && (
                                                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[999]">
                                                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                                                        <div className="relative">
                                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                            <input
                                                                type="text" autoFocus placeholder="Search for your bank..."
                                                                value={bankSearch} onChange={(e) => setBankSearch(e.target.value)}
                                                                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto p-2">
                                                        {filteredBanks.length === 0 ? (
                                                            <p className="p-4 text-center text-sm text-zinc-400">No banks found.</p>
                                                        ) : (
                                                            filteredBanks.map(bank => (
                                                                <div
                                                                    key={bank.id}
                                                                    onClick={() => { setForm({ ...form, type: bank.id }); setIsDropdownOpen(false); setBankSearch(""); }}
                                                                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Building2 className="w-4 h-4 text-zinc-400" />
                                                                        <span className={`text-sm ${form.type === bank.id ? 'font-bold text-zinc-900' : 'font-medium text-zinc-600'}`}>{bank.name}</span>
                                                                    </div>
                                                                    {form.type === bank.id && <Check className="w-4 h-4 text-blue-600" />}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                                                {dialogMode === "CASH" ? "Wallet Alias / Name" : "Account Alias"}
                                            </label>
                                            <input
                                                type="text" required placeholder={dialogMode === "CASH" ? "e.g., Emergency Cash" : "e.g., Primary Salary Acc"}
                                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Current Balance (₹)</label>
                                            <input
                                                type="number" step="0.01" required placeholder="0.00"
                                                value={form.currentBalance} onChange={(e) => setForm({ ...form, currentBalance: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base font-bold font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {/* Only render Banking Details if it is a Bank Account */}
                                    {dialogMode === "BANK" && (
                                        <>
                                            <div className="border-t border-slate-100 my-2"></div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Account No</label>
                                                    <input
                                                        type="text" placeholder="Optional"
                                                        value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">IFSC Code</label>
                                                    <input
                                                        type="text" placeholder="Optional" maxLength={11}
                                                        value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Branch Name</label>
                                                    <input
                                                        type="text" placeholder="Optional"
                                                        value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                                        <button type="button" onClick={resetForm} className="bg-white hover:bg-slate-50 border border-slate-200 text-zinc-700 text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={submitting} className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50">
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                            {editingAccountId ? "Save Changes" : "Confirm & Add"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Premium Ledger Cards Grid */}
                    {fetching ? (
                        <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-400" /></div>
                    ) : accounts.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm">
                            <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-400 mx-auto mb-6 border border-slate-100">
                                <Landmark className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">No Assets Configured</h3>
                            <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                                Start by adding your bank accounts or a physical cash wallet to build your financial matrix.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {accounts.map((account) => {
                                const isCash = account.type === "cash_wallet";
                                const bankConfig = INDIAN_BANK_DIRECTORY.find(b => b.id === account.type);

                                return (
                                    <div key={account.id} className={`bg-white border rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative group ${isCash ? 'border-emerald-200' : 'border-slate-200'}`}>

                                        {/* Card Body */}
                                        <div className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <BankLogo type={account.type} name={account.name} domain={bankConfig?.domain || ""} />
                                                    <div className="min-w-0">
                                                        <h3 className="text-base font-bold text-zinc-900 truncate tracking-tight capitalize">{account.name}</h3>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 truncate ${isCash ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                                            {isCash ? "Physical Wallet" : bankConfig?.name || "Institution"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-zinc-400 hover:text-zinc-900 transition-all focus:outline-none">
                                                        <MoreVertical className="w-5 h-5" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white w-48 p-2 rounded-2xl shadow-xl border border-slate-100 mt-2">
                                                        <DropdownMenuItem onClick={() => handleEditClick(account)} className="flex items-center gap-3 font-semibold text-sm text-zinc-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50">
                                                            <Edit2 className="w-4 h-4 text-zinc-400" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100 mx-2 my-1" />
                                                        <DropdownMenuItem onClick={() => handleDeleteAccount(account.id)} className="flex items-center gap-3 font-bold text-sm text-rose-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-rose-50 hover:text-rose-700">
                                                            <Trash2 className="w-4 h-4" /> Delete Asset
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="mt-8 mb-2">
                                                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Available Liquidity</span>
                                                <span className="text-4xl font-bold text-zinc-900 block tracking-tight">
                                                    ₹{account.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Footer (Fintech Style) */}
                                        <div className={`mt-auto p-5 rounded-b-3xl border-t ${isCash ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                            {isCash ? (
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <Banknote className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Untraceable Cash Reserve</span>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                                            <CreditCard className="w-3 h-3" /> Acc No
                                                        </span>
                                                        <p className="text-xs font-mono font-bold text-zinc-700 truncate">{account.accountNumber || "—"}</p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                                            <Landmark className="w-3 h-3" /> IFSC
                                                        </span>
                                                        <p className="text-xs font-mono font-bold text-zinc-700 truncate">{account.ifscCode || "—"}</p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                                            <MapPin className="w-3 h-3" /> Branch
                                                        </span>
                                                        <p className="text-xs font-semibold text-zinc-700 truncate">{account.branch || "—"}</p>
                                                    </div>
                                                </div>
                                            )}
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