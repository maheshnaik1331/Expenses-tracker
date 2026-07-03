"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useState } from "react";
import {
    Sparkles,
    LogOut,
    Settings,
    UserRound,
    LayoutDashboard,
    Building2,
    Scale,
    ReceiptText,
    FileText,
    Menu,
    X
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { user, loading } = useAuth();

    // HEAVILY LOGGED SECURE SIGN OUT LOGIC
    const handleSignOut = async () => {
        console.log("--- DEBUG: SIGN OUT SEQUENCE INITIATED ---");

        try {
            console.log("1. Triggering loading toast...");
            toast.loading("Securing session and signing out...", { id: "signout-toast" });

            console.log("2. Pinging Firebase to destroy session token...");
            await signOut(auth);

            console.log("3. Firebase successfully cleared the session.");
            toast.success("Successfully signed out.", { id: "signout-toast" });

            console.log("4. Pushing Next.js router to the landing page (/)");
            router.push("/");

            console.log("--- DEBUG: SIGN OUT SEQUENCE COMPLETE ---");
        } catch (error) {
            console.error("❌ SIGN OUT ERROR TRAPPED:", error);
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
        { name: "Accounts", path: "/accounts", icon: Building2 },
        { name: "Transactions", path: "/transactions", icon: ReceiptText },
        { name: "Bills", path: "/bills", icon: FileText },
        { name: "Loans", path: "/loans", icon: Scale },
    ];

    return (
        <nav className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Left Side: Logo & Desktop Links */}
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-xl text-zinc-900 transition-transform hover:scale-105 z-50">
                        <div className="bg-zinc-900 text-white p-1.5 rounded-lg shadow-sm">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        FPMS
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive
                                        ? "bg-zinc-900 text-white shadow-md scale-105"
                                        : "text-zinc-500 hover:text-zinc-900 hover:bg-slate-100"
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Side: Profile & Mobile Toggle */}
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="h-10 w-10 bg-slate-100 animate-pulse rounded-full border border-slate-200"></div>
                    ) : (
                        <div className="hidden sm:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="focus:outline-none group">
                                    <div className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group-data-[state=open]:ring-2 group-data-[state=open]:ring-zinc-900 group-data-[state=open]:border-transparent">
                                        <div className="flex flex-col text-right">
                                            <span className="text-sm font-bold text-zinc-900 leading-none mb-1 truncate max-w-[120px] capitalize">
                                                {getDisplayName()}
                                            </span>
                                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider leading-none">
                                                Workspace Admin
                                            </span>
                                        </div>

                                        <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-inner border border-zinc-900">
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                getInitials()
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-slate-100 bg-white mt-2">
                                    <div className="p-3 px-4">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-bold text-zinc-900 leading-none truncate capitalize">
                                                {getDisplayName()}
                                            </p>
                                            <p className="text-xs text-zinc-500 font-medium truncate">
                                                {user?.email || "No email registered"}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator className="bg-slate-100 mx-1 my-1" />

                                    <DropdownMenuItem className="cursor-pointer font-medium text-zinc-700 focus:bg-slate-50 focus:text-zinc-900 rounded-xl py-2.5 px-3 mb-1">
                                        <UserRound className="mr-3 h-4 w-4 text-zinc-400" /> Account Profile
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="cursor-pointer font-medium text-zinc-700 focus:bg-slate-50 focus:text-zinc-900 rounded-xl py-2.5 px-3">
                                        <Settings className="mr-3 h-4 w-4 text-zinc-400" /> System Preferences
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-slate-100 mx-1 my-2" />

                                    <DropdownMenuItem
                                        onClick={() => {
                                            console.log("--- DEBUG: Dropdown onClick triggered! ---");
                                            handleSignOut();
                                        }}
                                        onSelect={(e) => {
                                            console.log("--- DEBUG: Dropdown onSelect triggered! ---");
                                            e.preventDefault();
                                            handleSignOut();
                                        }}
                                        className="cursor-pointer font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 rounded-xl py-2.5 px-3"
                                    >
                                        <LogOut className="mr-3 h-4 w-4" /> Secure Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Mobile Menu Hamburger Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-xl text-zinc-600 hover:bg-slate-100 transition-colors focus:outline-none"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl px-4 py-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.path;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                    ? "bg-zinc-900 text-white shadow-md"
                                    : "text-zinc-600 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-zinc-400"}`} />
                                {link.name}
                            </Link>
                        );
                    })}

                    <div className="border-t border-slate-100 my-2"></div>

                    {/* Mobile Profile & Signout */}
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-zinc-900 capitalize truncate">{getDisplayName()}</span>
                            <span className="text-xs text-zinc-500 truncate">{user?.email}</span>
                        </div>
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleSignOut();
                            }}
                            className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}