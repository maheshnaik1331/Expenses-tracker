"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sparkles } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If Firebase has finished loading and there is NO user, kick them to login
        if (!loading && !user) {
            router.replace("/auth");
        }
    }, [user, loading, router]);

    // While Firebase is verifying the token, show a premium loading screen
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="flex flex-col items-center gap-6">
                    <div className="bg-zinc-900 text-white p-4 rounded-2xl animate-pulse">
                        <Sparkles className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-zinc-900 font-bold tracking-tight text-lg">Verifying Secure Session</p>
                        <p className="text-zinc-500 text-sm font-medium">FPMS Studio Enterprise Security</p>
                    </div>
                </div>
            </div>
        );
    }

    // If the user is authenticated, render the page normally
    if (user) {
        return <>{children}</>;
    }

    // Fallback (renders nothing while the useEffect triggers the redirect)
    return null;
}