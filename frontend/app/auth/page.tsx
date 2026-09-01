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
import { Sparkles, ArrowRight, Loader2, CreditCard, Lock, CheckCircle2, DollarSign } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);

    // Auth Animation Phases: "idle" -> "processing" (card inserts) -> "success" (cash flows)
    const [authPhase, setAuthPhase] = useState<"idle" | "processing" | "success">("idle");
    const [googleLoading, setGoogleLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthPhase("processing");

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setAuthPhase("success");
                toast.success("Identity verified. Accessing ledger...");

                // Delay redirect slightly to allow the "cash/success" animation to play
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1500);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, {
                    displayName: `${firstName} ${lastName}`.trim()
                });

                setAuthPhase("success");
                toast.success("Workspace provisioned successfully.");

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1500);
            }
        } catch (error: any) {
            console.error(error);
            setAuthPhase("idle");
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
            }, 1500);
        } catch (error: any) {
            console.error(error);
            setAuthPhase("idle");
            if (error.code !== "auth/popup-closed-by-user") {
                toast.error(error.message || "Google Authentication failed.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-hidden">

            {/* --- Left Panel: The "ATM" Animation Terminal (Hidden on small mobile) --- */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center bg-[#0A0A0B] border-r border-white/5 overflow-hidden">
                {/* Subtle Background Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)]"></div>

                <div className="relative z-10 flex flex-col items-center w-full max-w-md perspective-[1000px]">

                    {/* The Floating Card */}
                    <motion.div
                        animate={
                            authPhase === "idle"
                                ? { y: [-10, 10, -10], rotateX: [5, -5, 5], rotateY: [-10, 10, -10] }
                                : authPhase === "processing"
                                    ? { y: 140, rotateX: 60, scale: 0.8, opacity: 0.5 }
                                    : { y: 140, rotateX: 60, scale: 0.8, opacity: 0 }
                        }
                        transition={{
                            duration: authPhase === "idle" ? 6 : 0.8,
                            repeat: authPhase === "idle" ? Infinity : 0,
                            ease: "easeInOut"
                        }}
                        className="relative z-20 w-[300px] h-[190px] rounded-2xl p-6 flex flex-col justify-between shadow-[0_20px_50px_-15px_rgba(255,255,255,0.1)] border border-white/20 bg-gradient-to-br from-zinc-200 to-zinc-400 text-black mb-12"
                    >
                        <div className="flex justify-between items-start">
                            <CreditCard className="h-8 w-8 text-black/80" />
                            <span className="font-bold tracking-widest text-xs opacity-70">FPMS ACCESS</span>
                        </div>
                        <div>
                            <div className="flex gap-4 mb-2 font-mono tracking-widest text-lg opacity-80">
                                <span>****</span><span>****</span><span>****</span><span>SECURE</span>
                            </div>
                            <div className="text-xs font-semibold opacity-70">
                                ENTERPRISE LEDGER
                            </div>
                        </div>
                    </motion.div>

                    {/* The Secure "Slot" Terminal */}
                    <div className="relative z-30 w-[360px] h-[100px] bg-[#121214] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl">
                        <div className="w-[280px] h-3 bg-black rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                            {/* Scanning Light */}
                            <motion.div
                                animate={authPhase === "processing" ? { x: ["-100%", "300%"] } : { opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-1/3 h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                            />
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500">
                            {authPhase === "idle" && <><Lock className="h-3 w-3" /> Awaiting Credentials</>}
                            {authPhase === "processing" && <><Loader2 className="h-3 w-3 animate-spin text-indigo-400" /> Authenticating...</>}
                            {authPhase === "success" && <><CheckCircle2 className="h-3 w-3 text-green-400" /> Access Granted</>}
                        </div>
                    </div>

                    {/* Money / Data Dispensing Animation */}
                    <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[300px] pointer-events-none z-10 flex justify-center">
                        <AnimatePresence>
                            {authPhase === "success" && (
                                <>
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ y: 50, opacity: 0, scale: 0.5 }}
                                            animate={{ y: -150 - (i * 20), opacity: [0, 1, 0], scale: 1 }}
                                            transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                                            className="absolute bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-lg flex items-center gap-2 text-green-400 font-mono text-sm backdrop-blur-md"
                                        >
                                            <DollarSign className="h-4 w-4" />
                                            SYNC_LEDGER_{i}
                                        </motion.div>
                                    ))}
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* --- Right Panel: The Form --- */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-20">

                {/* Mobile Background Decor */}
                <div className="absolute inset-0 lg:hidden bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.1)_0%,transparent_70%)] pointer-events-none"></div>

                <div className="w-full max-w-md relative">

                    <div className="flex items-center gap-3 mb-10">
                        <Link href="/" className="flex items-center gap-2 font-bold tracking-wide text-xl text-white">
                            <div className="bg-white text-black p-2 rounded-xl shadow-lg shadow-white/5">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            FPMS Studio
                        </Link>
                    </div>

                    <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">
                        {isLogin ? "Welcome back." : "Initialize workspace."}
                    </h2>
                    <p className="text-zinc-400 mb-8 text-sm font-light">
                        {isLogin ? "Authenticate to access your real-time financial engine." : "Set up your secure enterprise ledger environment."}
                    </p>

                    {/* Google Authentication */}
                    <Button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={authPhase !== "idle" || googleLoading}
                        className="w-full bg-[#121214] hover:bg-[#1A1A1C] border border-white/10 text-white rounded-xl h-12 font-semibold transition-all mb-6 shadow-md relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                        {googleLoading ? <Loader2 className="h-5 w-5 animate-spin text-zinc-400" /> : (
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

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#050505] px-3 text-zinc-500 font-semibold tracking-wider">Or continue with email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">First Name</label>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required={!isLogin}
                                        className="bg-[#121214] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-12 focus-visible:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Last Name</label>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required={!isLogin}
                                        className="bg-[#121214] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-12 focus-visible:ring-indigo-500/50"
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Work Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[#121214] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-12 focus-visible:ring-indigo-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-[#121214] border-white/10 text-white placeholder:text-zinc-600 rounded-xl h-12 focus-visible:ring-indigo-500/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={authPhase !== "idle"}
                            className={`w-full text-black rounded-xl h-12 font-bold mt-4 transition-all shadow-md ${authPhase === "success" ? "bg-green-400 hover:bg-green-500" : "bg-white hover:bg-zinc-200"
                                }`}
                        >
                            {authPhase === "processing" ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                authPhase === "success" ? <CheckCircle2 className="h-5 w-5" /> :
                                    (
                                        <>
                                            {isLogin ? "Secure Login" : "Provision Environment"} <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setAuthPhase("idle");
                            }}
                            className="text-sm font-medium text-zinc-500 hover:text-white transition-colors"
                        >
                            {isLogin ? "Need a workspace? Create an account" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}