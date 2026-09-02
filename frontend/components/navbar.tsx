"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    LogOut,
    LayoutDashboard,
    Building2,
    Scale,
    ReceiptText,
    FileText,
    Calculator,
    Menu,
    X,
    ChevronDown
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { user, loading } = useAuth();

    const handleSignOut = async () => {
        try {
            toast.loading("Securing session and signing out...", { id: "signout-toast" });
            await signOut(auth);
            toast.success("Successfully signed out.", { id: "signout-toast" });
            router.push("/");
        } catch (error) {
            console.error("❌ SIGN OUT ERROR:", error);
            toast.error("Failed to sign out.", { id: "signout-toast" });
        }
    };

    const getDisplayName = () => {
        if (user?.displayName) return user.displayName;
        if (user?.email) return user.email.split('@')[0];
        return "Executive User";
    };

    const getInitials = () => {
        if (user?.displayName) {
            const parts = user.displayName.split(" ");
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return parts[0].substring(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return "US";
    };

    const navLinks = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Assets", path: "/accounts", icon: Building2 },
        { name: "Ledger", path: "/transactions", icon: ReceiptText },
        { name: "Contracts", path: "/bills", icon: FileText },
        { name: "Matrix", path: "/loans", icon: Scale },
        { name: "Calculators", path: "/calculator", icon: Calculator }, // <-- ADDED CALCULATOR HERE
    ];

    return (
        <nav className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Left Side: Logo & Desktop Links */}
                <div className="flex items-center gap-10">
                    <Link href="/dashboard" className="flex items-center gap-2.5 font-black tracking-tight text-xl text-slate-900 transition-transform hover:scale-105 z-50">
                        <div className="bg-blue-600 text-white p-1.5 rounded-xl shadow-md shadow-blue-600/20">
                            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                        </div>
                        FPMS
                    </Link>

                    {/* Fluid Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1 relative">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors duration-300 z-10 ${isActive ? "text-blue-700" : "text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-active-pill"
                                            className="absolute inset-0 bg-blue-50 border border-blue-100 rounded-xl -z-10 shadow-sm"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} strokeWidth={2.5} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Profile & Mobile Toggle */}
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-full border border-slate-200"></div>
                    ) : (
                        <div className="hidden sm:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="focus:outline-none group">
                                    <div className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group-data-[state=open]:ring-4 group-data-[state=open]:ring-blue-500/10 group-data-[state=open]:border-blue-300">
                                        <div className="flex flex-col text-right">
                                            <span className="text-sm font-extrabold text-slate-900 leading-none mb-1 truncate max-w-[120px] capitalize tracking-tight">
                                                {getDisplayName()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center justify-end gap-1">
                                                Admin <ChevronDown className="w-3 h-3" strokeWidth={3} />
                                            </span>
                                        </div>

                                        <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black overflow-hidden shadow-inner border border-blue-700">
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                getInitials()
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuTrigger>

                                {/* Minimalist Fintech Dropdown */}
                                <DropdownMenuContent align="end" className="w-64 p-2 rounded-[1.5rem] shadow-2xl border-slate-200 bg-white mt-2">
                                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-[1rem] mb-2 shadow-inner">
                                        <div className="flex flex-col space-y-1.5">
                                            <p className="text-sm font-black text-slate-900 leading-none truncate capitalize tracking-tight">
                                                {getDisplayName()}
                                            </p>
                                            <p className="text-[11px] font-bold text-slate-500 truncate tracking-wide">
                                                {user?.email || "Unregistered Identity"}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSignOut();
                                        }}
                                        className="cursor-pointer font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 rounded-xl py-3 px-4 flex items-center transition-all"
                                    >
                                        <LogOut className="mr-3 h-4 w-4" strokeWidth={2.5} /> Secure Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Mobile Menu Hamburger Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors focus:outline-none"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" strokeWidth={2.5} /> : <Menu className="h-6 w-6" strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            {/* Framer Motion Animated Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="lg:hidden bg-white border-b border-slate-200 shadow-xl overflow-hidden"
                    >
                        <div className="px-4 py-4 flex flex-col gap-2">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.path;
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.path}
                                        href={link.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-extrabold transition-all ${isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                                            : "text-slate-600 hover:bg-slate-50 border border-transparent"
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} strokeWidth={2.5} />
                                        {link.name}
                                    </Link>
                                );
                            })}

                            <div className="border-t border-slate-100 my-2"></div>

                            {/* Mobile Profile & Signout */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-black text-slate-900 capitalize truncate">{getDisplayName()}</span>
                                    <span className="text-[11px] font-bold text-slate-500 truncate mt-0.5">{user?.email}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleSignOut();
                                    }}
                                    className="p-3 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors shadow-sm"
                                >
                                    <LogOut className="h-5 w-5" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}