"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, Loader2, CreditCard, Lock, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);

    // Auth Animation Phases: "idle" -> "processing" (card inserts) -> "success" (data flows)
    const [authPhase, setAuthPhase] = useState<"idle" | "processing" | "success">("idle");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthPhase("processing");
        setEmailLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setAuthPhase("success");
                toast.success("Identity verified. Accessing ledger...");

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1800);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, {
                    displayName: `${firstName} ${lastName}`.trim()
                });

                setAuthPhase("success");
                toast.success("Workspace provisioned successfully.");

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1800);
            }
        } catch (error: any) {
            console.error(error);
            setAuthPhase("idle");
            setEmailLoading(false);
            toast.error(error.message || "Authentication failed. Please try again.");
        }
    };

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        setAuthPhase("processing");
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);

            setAuthPhase("success");
            toast.success("Authenticated with Google successfully.");

            setTimeout(() => {
                router.push("/dashboard");
            }, 1800);
        } catch (error: any) {
            console.error(error);
            setAuthPhase("idle");
            setGoogleLoading(false);
            if (error.code !== "auth/popup-closed-by-user") {
                toast.error(error.message || "Google Authentication failed.");
            }
        }
    };

    return (
        <div className="min-h-screen flex bg-[#050505] text-white font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">

            {/* --- Left Panel: The FinTech Animation Terminal --- */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center bg-[#0A0A0B] border-r border-white/5 overflow-hidden">
                {/* Subtle Background Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.07)_0%,transparent_70%)]"></div>

                <div className="relative z-10 flex flex-col items-center w-full max-w-md perspective-[1000px]">

                    {/* The Floating Obsidian Card */}
                    <motion.div
                        animate={
                            authPhase === "idle"
                                ? { y: [-10, 10, -10], rotateX: [5, -5, 5], rotateY: [-10, 10, -10] }
                                : authPhase === "processing"
                                    ? { y: 150, rotateX: 60, scale: 0.85, opacity: 0.5 }
                                    : { y: 150, rotateX: 60, scale: 0.85, opacity: 0 }
                        }
                        transition={{
                            duration: authPhase === "idle" ? 6 : 0.8,
                            repeat: authPhase === "idle" ? Infinity : 0,
                            ease: "easeInOut"
                        }}
                        className="relative z-20 w-[320px] h-[200px] rounded-[1.5rem] p-6 flex flex-col justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white mb-12 overflow-hidden group"
                    >
                        {/* Metallic Glare Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-50 transform -translate-x-[50%] rotate-45 pointer-events-none"></div>

                        {/* Card Chip / Logo */}
                        <div className="flex justify-between items-start relative z-10">
                            <div className="w-12 h-10 bg-yellow-500/20 rounded-md border border-yellow-500/30 flex items-center justify-center shadow-inner">
                                <div className="w-8 h-6 border border-yellow-500/40 rounded-sm"></div>
                            </div>
                            <span className="font-extrabold tracking-widest text-[10px] text-zinc-400 uppercase">FPMS Access</span>
                        </div>

                        <div className="relative z-10">
                            <div className="flex gap-4 mb-2 font-mono font-bold tracking-widest text-lg text-zinc-300 drop-shadow-sm">
                                <span>****</span><span>****</span><span>****</span><span className="text-white">AUTH</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                                    Enterprise Ledger
                                </div>
                                <Sparkles className="w-6 h-6 text-indigo-400" strokeWidth={2.5} />
                            </div>
                        </div>
                    </motion.div>

                    {/* The Secure Glassmorphism Terminal */}
                    <div className="relative z-30 w-[380px] h-[110px] bg-[#121214]/80 border border-white/10 rounded-[2rem] p-5 flex flex-col items-center justify-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                        <div className="w-[300px] h-3 bg-black rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                            {/* Scanning Light */}
                            <motion.div
                                animate={authPhase === "processing" ? { x: ["-100%", "300%"] } : { opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-1/3 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                            {authPhase === "idle" && <><Lock className="h-4 w-4" strokeWidth={2.5} /> Awaiting Credentials</>}
                            {authPhase === "processing" && <><Loader2 className="h-4 w-4 animate-spin text-indigo-400" strokeWidth={2.5} /> Authenticating...</>}
                            {authPhase === "success" && <><ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={2.5} /> Access Granted</>}
                        </div>
                    </div>

                    {/* Data Stream Sync Animation */}
                    <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[350px] pointer-events-none z-10 flex justify-center">
                        <AnimatePresence>
                            {authPhase === "success" && (
                                <>
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ y: 50, opacity: 0, scale: 0.8 }}
                                            animate={{ y: -180 - (i * 25), opacity: [0, 1, 0], scale: 1 }}
                                            transition={{ duration: 1.5, delay: i * 0.15, ease: "easeOut" }}
                                            className="absolute bg-emerald-500/10 border border-emerald-500/20 px-5 py-2.5 rounded-xl flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold shadow-xl shadow-emerald-500/5 backdrop-blur-md"
                                        >
                                            <Activity className="h-4 w-4" strokeWidth={2.5} />
                                            SYNC_LEDGER_{i + 1}
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* --- Right Panel: The Form --- */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-20 bg-[#050505]">

                <div className="w-full max-w-md relative">

                    <div className="flex items-center gap-3 mb-12">
                        <Link href="/" className="flex items-center gap-2.5 font-black tracking-tight text-2xl text-white">
                            <div className="bg-white text-black p-2 rounded-xl shadow-md shadow-white/10">
                                <Sparkles className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                            FPMS Studio
                        </Link>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                        {isLogin ? "Welcome back." : "Initialize workspace."}
                    </h2>
                    <p className="text-zinc-400 mb-8 text-sm font-bold">
                        {isLogin ? "Authenticate to access your real-time financial engine." : "Set up your secure enterprise ledger environment."}
                    </p>

                    {/* Google Authentication */}
                    <Button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={authPhase !== "idle" || googleLoading}
                        className="w-full bg-[#0A0A0B] hover:bg-[#121214] border border-white/10 text-white rounded-xl h-14 font-bold transition-all mb-8 shadow-sm focus:ring-4 focus:ring-indigo-500/20"
                    >
                        {googleLoading ? <Loader2 className="h-5 w-5 animate-spin text-zinc-500" strokeWidth={2.5} /> : (
                            <>
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </Button>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-[10px]">
                            <span className="bg-[#050505] px-4 text-zinc-500 font-extrabold uppercase tracking-widest">Or continue with email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleAuth} className="space-y-5">
                        <AnimatePresence>
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-2 gap-4 overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">First Name</label>
                                        <Input
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            required={!isLogin}
                                            className="bg-[#0A0A0B] border-white/10 text-white font-bold placeholder:text-zinc-600 rounded-xl h-14 focus-visible:ring-4 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 shadow-sm transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Last Name</label>
                                        <Input
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            required={!isLogin}
                                            className="bg-[#0A0A0B] border-white/10 text-white font-bold placeholder:text-zinc-600 rounded-xl h-14 focus-visible:ring-4 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 shadow-sm transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Work Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[#0A0A0B] border-white/10 text-white font-bold placeholder:text-zinc-600 rounded-xl h-14 focus-visible:ring-4 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 shadow-sm transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-[#0A0A0B] border-white/10 text-white font-bold placeholder:text-zinc-600 rounded-xl h-14 focus-visible:ring-4 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 shadow-sm transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={authPhase !== "idle"}
                            className={`w-full rounded-xl h-14 font-extrabold text-sm mt-6 transition-all shadow-md ${authPhase === "success"
                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                    : "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                                }`}
                        >
                            {emailLoading && authPhase === "processing" ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} /> :
                                authPhase === "success" ? <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} /> :
                                    (
                                        <>
                                            {isLogin ? "Secure Login" : "Provision Environment"} <ArrowRight className="ml-2 h-4 w-4" strokeWidth={3} />
                                        </>
                                    )}
                        </Button>
                    </form>

                    <div className="mt-10 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setAuthPhase("idle");
                            }}
                            className="text-[13px] font-bold text-zinc-500 hover:text-white transition-colors"
                        >
                            {isLogin ? "Need a workspace? Create an account" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}