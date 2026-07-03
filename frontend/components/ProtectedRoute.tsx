"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If the auth check is finished and there is no user, kick them out
        if (!loading && !user) {
            console.warn("Unauthorized access attempt blocked. Redirecting...");
            router.push("/");
        }
    }, [user, loading, router]);

    // Show a premium loading state while Firebase checks the token
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="h-10 w-10 animate-spin text-zinc-900 mb-4" />
                <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">
                    Authenticating Session...
                </p>
            </div>
        );
    }

    // If there is no user, return null so the page content doesn't flash before the redirect happens
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
                <ShieldAlert className="h-10 w-10 text-rose-500 mb-4" />
                <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">
                    Access Denied
                </p>
            </div>
        );
    }

    // If they are logged in, render the page normally
    return <>{children}</>;
}