"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Loader2, Building2, MoreVertical, Edit2, Trash2,
    MapPin, Landmark, Banknote, Check, Wallet, ShieldAlert, X, ChevronDown, Search, CreditCard
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- SMART DIRECTORY RESOLVER ---
// Scans the IFSC code or Account Name and pulls the exact matching configuration 
// directly from your INDIAN_BANK_DIRECTORY so we never get wrong/default logos.
const getDirectoryBank = (ifsc: string | null, alias: string) => {
    // 1. Resolve via IFSC Prefix (Standard FinTech Logic)
    if (ifsc && ifsc.length >= 4) {
        const prefix = ifsc.substring(0, 4).toUpperCase();
        const prefixMap: Record<string, string> = {
            'SBIN': 'sbi', 'HDFC': 'hdfc', 'ICIC': 'icici', 'UTIB': 'axis',
            'KKBK': 'kotak', 'PUNB': 'pnb', 'BARB': 'bob', 'BKID': 'boi',
            'CNRB': 'canara', 'UBIN': 'union', 'IDIB': 'indian', 'IOBA': 'iob',
            'YESB': 'yes', 'FDRL': 'federal', 'IDFB': 'idfc', 'INDX': 'indusind'
        };

        if (prefixMap[prefix]) {
            const matched = INDIAN_BANK_DIRECTORY.find(b => b.id === prefixMap[prefix]);
            if (matched) return matched;
        }
    }

    // 2. Fallback: Search the user's alias against the directory names
    const aliasLower = alias.toLowerCase();
    const matchedByName = INDIAN_BANK_DIRECTORY.find(b =>
        aliasLower.includes(b.name.toLowerCase()) ||
        aliasLower.includes(b.id.toLowerCase())
    );

    if (matchedByName) return matchedByName;

    // 3. Ultimate Fallback
    return { name: "Financial Institution", domain: "" };
};

// Premium Light-Theme Logo Component
const BankLogo = ({ isCash, name, domain }: { isCash: boolean, name: string, domain?: string }) => {
    const [error, setError] = useState(false);

    if (isCash) {
        return (
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Banknote className="w-6 h-6 text-emerald-600" />
            </div>
        );
    }

    if (error || !domain) {
        return (
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 className="w-5 h-5 text-slate-400" />
            </div>
        );
    }

    return (
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-2 flex-shrink-0 shadow-sm">
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

    const [dialogMode, setDialogMode] = useState<"BANK" | "CASH" | null>(null);
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        accountNumber: "",
        ifscCode: "",
        branch: "",
        currentBalance: ""
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const [selectedBankId, setSelectedBankId] = useState("sbi");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchAccounts = async () => {
        try {
            setFetching(true);
            const res = await api.get("/accounts");
            setAccounts(res.data || []);
        } catch (err) {
            toast.error("Failed to sync your ledger records.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!loading && user) fetchAccounts();
    }, [user, loading]);

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
        setForm({ name: "", accountNumber: "", ifscCode: "", branch: "", currentBalance: "" });
        setEditingAccountId(null);
        setDialogMode(null);
    };

    const openNewForm = (mode: "BANK" | "CASH") => {
        resetForm();
        setDialogMode(mode);
    };

    const handleEditClick = (account: any) => {
        setEditingAccountId(account.id);
        const mode = account.type === "CASH" || account.isLiquid && !account.accountNumber ? "CASH" : "BANK";
        setDialogMode(mode);
        setForm({
            name: account.name,
            accountNumber: account.accountNumber || "",
            ifscCode: account.ifscCode || "",
            branch: account.branch || "",
            currentBalance: account.currentBalance.toString()
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) return toast.error("Please provide an alias.");

        try {
            setSubmitting(true);
            const isCash = dialogMode === "CASH";

            const payload = {
                name: form.name,
                type: isCash ? "CASH" : "BANK",
                accountNumber: isCash ? null : form.accountNumber || null,
                ifscCode: isCash ? null : form.ifscCode?.toUpperCase() || null,
                branch: isCash ? null : form.branch || null,
                currentBalance: parseFloat(form.currentBalance) || 0
            };

            if (editingAccountId) {
                await api.put(`/accounts/${editingAccountId}`, payload);
                toast.success("Ledger configuration updated.");
            } else {
                await api.post("/accounts", payload);
                toast.success("New asset ledger mapped.");
            }
            resetForm();
            fetchAccounts();
        } catch (err) {
            toast.error("Failed to commit ledger transaction.");
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeletion = async () => {
        if (!accountToDelete) return;
        try {
            setSubmitting(true);
            toast.loading("Purging ledger...", { id: "del" });
            await api.delete(`/accounts/${accountToDelete}`);
            toast.success("Ledger destroyed safely.", { id: "del" });
            fetchAccounts();
        } catch (err) {
            toast.error("Failed to erase account.", { id: "del" });
        } finally {
            setSubmitting(false);
            setAccountToDelete(null);
        }
    };

    const filteredBanks = INDIAN_BANK_DIRECTORY.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
    const selectedBankData = INDIAN_BANK_DIRECTORY.find(b => b.id === selectedBankId);

    // --- High-End Animation Variants ---
    const fadeUp: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 400 } },
        exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans font-medium antialiased selection:bg-blue-100">
                <Navbar />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-10 relative">

                    {/* Top UX Header */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Financial Assets</h1>
                            <p className="text-slate-500 text-sm mt-2 font-semibold">Manage institutional bank accounts and physical cash reserves.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => openNewForm("CASH")}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                            >
                                <Wallet className="w-4 h-4 text-emerald-600" /> Add Cash Wallet
                            </button>
                            <button
                                onClick={() => openNewForm("BANK")}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                            >
                                <Landmark className="w-4 h-4" /> Link Institution
                            </button>
                        </div>
                    </motion.div>

                    {/* --- CUSTOM GLASSMORPHISM DELETE ALERT --- */}
                    <AnimatePresence>
                        {accountToDelete && (
                            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                                    onClick={() => setAccountToDelete(null)}
                                />
                                <motion.div
                                    variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                                    className="relative bg-white border border-slate-200 rounded-[2rem] p-8 max-w-md w-full shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>
                                    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-6 border border-rose-100">
                                        <ShieldAlert className="w-6 h-6 text-rose-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Decouple Ledger?</h3>
                                    <p className="text-sm text-slate-500 mb-8 leading-relaxed font-semibold">
                                        This action is irreversible. It will sever the connection to this asset and permanently drop all associated transaction history from your global ledger.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setAccountToDelete(null)}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold py-3 rounded-xl transition-colors"
                                        >
                                            Abort
                                        </button>
                                        <button
                                            onClick={confirmDeletion} disabled={submitting}
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-3 rounded-xl transition-colors shadow-md flex justify-center items-center"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : "Confirm Purge"}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* --- CUSTOM GLASSMORPHISM FORM MODAL --- */}
                    <AnimatePresence>
                        {dialogMode && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                                    onClick={resetForm}
                                />

                                <motion.div
                                    variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                                    className="relative bg-white border border-slate-200 rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                                >
                                    {/* Modal Header */}
                                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 shrink-0 bg-slate-50/80">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl border shadow-sm ${dialogMode === "CASH" ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
                                                {dialogMode === "CASH" ? <Banknote className="w-6 h-6 text-emerald-600" /> : <Landmark className="w-6 h-6 text-blue-600" />}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                                                    {editingAccountId ? "Update Configuration" : (dialogMode === "CASH" ? "Initialize Cash Reserve" : "Link Institution")}
                                                </h2>
                                                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                                    {dialogMode === "CASH" ? "Physical Asset Tracking" : "Digital Ledger Mapping"}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full transition-colors shadow-sm font-bold">
                                            <X className="w-5 h-5 font-bold" />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="overflow-y-auto p-6 sm:p-8">
                                        <form id="accountForm" onSubmit={handleSubmit} className="space-y-6">
                                            {dialogMode === "BANK" && (
                                                <div className="relative z-50" ref={dropdownRef}>
                                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Select Institution Template</label>
                                                    <div
                                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                        className="w-full bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 cursor-pointer flex justify-between items-center transition-all shadow-sm"
                                                    >
                                                        <span className="truncate flex items-center gap-3">
                                                            {selectedBankData ? (
                                                                <>
                                                                    <div className="w-6 h-6 bg-slate-50 border border-slate-200 rounded-md p-0.5"><img src={`https://img.logo.dev/${selectedBankData.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} alt="logo" className="w-full h-full object-contain font-medium" /></div>
                                                                    {selectedBankData.name}
                                                                </>
                                                            ) : "Search directory..."}
                                                        </span>
                                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    <AnimatePresence>
                                                        {isDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden"
                                                            >
                                                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                                        <input
                                                                            type="text" autoFocus placeholder="Search institutions..."
                                                                            value={bankSearch} onChange={(e) => setBankSearch(e.target.value)}
                                                                            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="max-h-56 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                                                                    {filteredBanks.length === 0 ? (
                                                                        <p className="p-4 text-center text-sm font-semibold text-slate-500">No institutions found.</p>
                                                                    ) : (
                                                                        filteredBanks.map(bank => (
                                                                            <div
                                                                                key={bank.id}
                                                                                onClick={() => {
                                                                                    setSelectedBankId(bank.id);
                                                                                    if (!form.name) setForm(prev => ({ ...prev, name: bank.name }));
                                                                                    setIsDropdownOpen(false);
                                                                                    setBankSearch("");
                                                                                }}
                                                                                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-6 h-6 bg-white border border-slate-200 rounded-sm p-0.5"><img src={`https://img.logo.dev/${bank.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} className="w-full h-full object-contain font-medium" /></div>
                                                                                    <span className={`text-sm ${selectedBankId === bank.id ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{bank.name}</span>
                                                                                </div>
                                                                                {selectedBankId === bank.id && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                                        {dialogMode === "CASH" ? "Wallet Alias" : "Account Alias"}
                                                    </label>
                                                    <input
                                                        type="text" required placeholder={dialogMode === "CASH" ? "e.g., Safe Box" : "e.g., Salary Account"}
                                                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Starting Balance (₹)</label>
                                                    <input
                                                        type="number" step="0.01" required placeholder="0.00"
                                                        value={form.currentBalance} onChange={(e) => setForm({ ...form, currentBalance: e.target.value })}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-base font-bold font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            {dialogMode === "BANK" && (
                                                <>
                                                    <div className="border-t border-slate-200/60 my-4"></div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Account No.</label>
                                                            <input
                                                                type="text" placeholder="Optional"
                                                                value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">IFSC Code</label>
                                                            <input
                                                                type="text" placeholder="e.g. SBIN0001234" maxLength={11}
                                                                value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-semibold uppercase focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                            />
                                                            <p className="text-[10px] text-slate-400 mt-2 leading-tight font-semibold">
                                                                Prefix dictates auto-branding.
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Branch Name</label>
                                                            <input
                                                                type="text" placeholder="Optional"
                                                                value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
                                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </form>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-6 border-t border-slate-100 bg-slate-50/80 shrink-0 flex justify-end gap-3">
                                        <button onClick={resetForm} className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm">
                                            Cancel
                                        </button>
                                        <button form="accountForm" type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : <Check className="w-4 h-4 font-bold" />}
                                            {editingAccountId ? "Save Changes" : "Provision Ledger"}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Premium Ledger Cards Grid */}
                    {fetching ? (
                        <div className="py-32 flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" /><p className="text-sm font-bold text-slate-500">Decrypting assets...</p></div>
                    ) : accounts.length === 0 ? (
                        <motion.div initial="hidden" animate="show" variants={fadeUp} className="border border-slate-200 bg-white rounded-[2rem] p-16 text-center max-w-xl mx-auto shadow-sm relative overflow-hidden">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-6 border border-slate-100 relative z-10">
                                <Landmark className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 relative z-10 tracking-tight">No Assets Configured</h3>
                            <p className="text-slate-500 text-sm mt-3 max-w-sm mx-auto leading-relaxed font-semibold relative z-10">
                                Link your institutional bank accounts or provision a physical cash wallet to initialize your matrix.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial="hidden" animate="show"
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        >
                            {accounts.map((account) => {
                                const isCash = account.type === "CASH" || account.isLiquid && !account.accountNumber;
                                const bankIdentity = getDirectoryBank(account.ifscCode, account.name);

                                return (
                                    <motion.div
                                        key={account.id}
                                        variants={fadeUp}
                                        whileHover={{ y: -6, scale: 1.01 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        className="bg-white border border-slate-200/80 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col relative group overflow-hidden"
                                    >
                                        {/* Sweeping Glare Animation on Hover */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/60 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -translate-x-full group-hover:translate-x-full ease-in-out z-20"></div>

                                        <div className="p-6 relative z-10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <BankLogo isCash={isCash} name={bankIdentity.name} domain={bankIdentity.domain} />
                                                    <div className="min-w-0">
                                                        {/* Primary Bank Name */}
                                                        <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">
                                                            {isCash ? "Physical Cash Wallet" : bankIdentity.name}
                                                        </h3>
                                                        {/* Secondary Custom Alias */}
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 truncate ${isCash ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                            {account.name}
                                                        </p>
                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="p-2 rounded-xl hover:bg-slate-100 border border-transparent text-slate-400 hover:text-slate-700 transition-all focus:outline-none">
                                                        <MoreVertical className="w-5 h-5 font-bold" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white border border-slate-200 w-48 p-2 rounded-2xl shadow-xl mt-2">
                                                        <DropdownMenuItem onClick={() => handleEditClick(account)} className="flex items-center gap-3 font-bold text-sm text-slate-700 py-3 px-3 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900">
                                                            <Edit2 className="w-4 h-4 text-slate-400 font-bold" /> Edit Config
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-100 mx-2 my-1" />
                                                        <DropdownMenuItem onClick={() => setAccountToDelete(account.id)} className="flex items-center gap-3 font-bold text-sm text-rose-600 py-3 px-3 rounded-xl cursor-pointer hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-700">
                                                            <Trash2 className="w-4 h-4 font-bold" /> Decouple Asset
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="mt-8 mb-2">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Available Capital</span>
                                                <span className="text-3xl font-bold text-slate-900 block tracking-tight font-mono">
                                                    ₹{account.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto p-5 border-t border-slate-100 bg-slate-50/80 relative z-10">
                                            {isCash ? (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <Banknote className="w-4 h-4 font-bold" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Untraceable Physical Cash</span>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                                            <CreditCard className="w-3 h-3 font-bold" /> ACC
                                                        </span>
                                                        <p className="text-xs font-bold font-mono text-slate-700 truncate">{account.accountNumber || "—"}</p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                                            <Landmark className="w-3 h-3 font-bold" /> IFSC
                                                        </span>
                                                        <p className="text-xs font-bold font-mono text-slate-700 truncate uppercase">{account.ifscCode || "—"}</p>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                                            <MapPin className="w-3 h-3 font-bold" /> BRANCH
                                                        </span>
                                                        <p className="text-xs font-bold text-slate-600 truncate">{account.branch || "—"}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}