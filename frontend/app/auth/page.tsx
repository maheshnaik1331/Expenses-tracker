"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    // 1. Standard Email & Password Auth
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                // LOGIN
                await signInWithEmailAndPassword(auth, email, password);
                toast.success("Welcome back to FPMS Studio.");
                router.push("/dashboard");
            } else {
                // SIGN UP
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Update Firebase Profile so the Navbar displays the user's name properly
                await updateProfile(userCredential.user, {
                    displayName: `${firstName} ${lastName}`.trim()
                });

                // Note: We DO NOT call api.post() here anymore. 
                // AuthContext detects the login and syncs with Postgres automatically!
                toast.success("Workspace provisioned successfully.");
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // 2. Google Authentication (Works for both Sign Up and Log In)
    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);

            // Note: We DO NOT call api.post() here anymore. 
            // AuthContext detects the Google login and syncs with Postgres automatically!
            toast.success("Authenticated with Google successfully.");
            router.push("/dashboard");
        } catch (error: any) {
            console.error(error);
            // Prevent toast if the user simply closed the popup manually
            if (error.code !== "auth/popup-closed-by-user") {
                toast.error(error.message || "Google Authentication failed.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-6 py-12">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-zinc-900/5 border border-slate-100 p-8 sm:p-10 my-auto">

                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-xl text-zinc-900">
                        <div className="bg-zinc-900 text-white p-2 rounded-lg">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        FPMS Studio
                    </Link>
                </div>

                <h2 className="text-2xl font-bold text-center text-zinc-900 mb-2">
                    {isLogin ? "Sign in to your workspace" : "Create your workspace"}
                </h2>
                <p className="text-center text-zinc-500 mb-8 text-sm">
                    {isLogin ? "Enter your credentials to access your ledgers." : "Set up your secure enterprise financial environment."}
                </p>

                {/* Google Authentication Button */}
                <Button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading || loading}
                    variant="outline"
                    className="w-full bg-white hover:bg-slate-50 border-slate-200 text-zinc-900 rounded-xl h-12 font-semibold transition-all mb-6"
                >
                    {googleLoading ? <Loader2 className="h-5 w-5 animate-spin text-zinc-400" /> : (
                        <>
                            {/* Simple Google SVG Icon */}
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
                        <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-zinc-400 font-semibold tracking-wider">Or continue with email</span>
                    </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleAuth} className="space-y-5">
                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1">First Name</label>
                                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required={!isLogin} className="bg-slate-50 border-slate-200 rounded-xl h-12" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1">Last Name</label>
                                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required={!isLogin} className="bg-slate-50 border-slate-200 rounded-xl h-12" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1">Work Email</label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-50 border-slate-200 rounded-xl h-12" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider ml-1">Password</label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-slate-50 border-slate-200 rounded-xl h-12" />
                    </div>

                    <Button type="submit" disabled={loading || googleLoading} className="w-full bg-zinc-900 hover:bg-black text-white rounded-xl h-12 font-bold mt-2 transition-all shadow-md">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <>
                                {isLogin ? "Secure Login" : "Initialize Workspace"} <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                        {isLogin ? "Need a workspace? Create an account" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}