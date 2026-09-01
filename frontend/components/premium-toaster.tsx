"use client";

import { Toaster } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";

export function PremiumToaster() {
    return (
        <Toaster
            position="top-center"
            expand={false}
            toastOptions={{
                classNames: {
                    // The main glassmorphism pill container
                    toast: "group flex items-center gap-3 bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full px-5 py-3.5 w-auto max-w-[90vw] mx-auto sm:mt-4 mt-2",
                    // Typography
                    title: "text-sm font-bold text-slate-900 tracking-tight",
                    description: "text-xs font-semibold text-slate-500",
                    // Action Buttons (if you use them)
                    actionButton: "bg-blue-600 text-white font-bold rounded-full px-4 py-1.5 text-xs transition-transform active:scale-95",
                    cancelButton: "bg-slate-100 text-slate-700 font-bold rounded-full px-4 py-1.5 text-xs transition-transform active:scale-95",
                },
            }}
            icons={{
                success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                error: <AlertCircle className="w-5 h-5 text-rose-500" />,
                loading: <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
                info: <Info className="w-5 h-5 text-blue-500" />,
            }}
        />
    );
}