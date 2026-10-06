"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { parseVoiceCommand, VoiceIntent } from "@/lib/voice-engine";

export default function UniversalVoiceTrigger() {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSpoken, setLastSpoken] = useState<string | null>(null);

    const resolveAccountId = (queryName: string | undefined, accounts: any[]) => {
        if (!queryName || accounts.length === 0) return accounts[0]?.id;
        const cleanQuery = queryName.toLowerCase();
        const matched = accounts.find((a: any) => a.name.toLowerCase().includes(cleanQuery));
        return matched ? matched.id : accounts[0]?.id;
    };

    const getStrictISTTimestamp = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:00.000+05:30`;
    };

    const handleDispatch = async (intent: VoiceIntent) => {
        setIsProcessing(true);
        try {
            if (intent.module === "NAVIGATE") {
                router.push(intent.path);
                toast.success(`Navigated to ${intent.path}`);
                return;
            }

            if (intent.module === "LEDGER_EXPENSE" || intent.module === "LEDGER_INCOME") {
                const accRes = await api.get("/accounts");
                const accounts = accRes.data || [];
                const targetAccountId = resolveAccountId(intent.accountName, accounts);

                await api.post("/transactions", {
                    type: intent.module === "LEDGER_EXPENSE" ? "EXPENSE" : "INCOME",
                    amount: intent.amount,
                    category: intent.module === "LEDGER_EXPENSE" ? "Other" : "Salary",
                    note: intent.note,
                    accountId: targetAccountId,
                    date: getStrictISTTimestamp(),
                });

                toast.success(`Recorded ₹${intent.amount} ${intent.module === "LEDGER_EXPENSE" ? "Expense" : "Income"}`);
                window.dispatchEvent(new Event('refresh-ledger'));
            }

            if (intent.module === "LEDGER_TRANSFER") {
                const accRes = await api.get("/accounts");
                const accounts = accRes.data || [];
                const fromId = resolveAccountId(intent.fromAccount, accounts);
                const toId = accounts.find((a: any) => a.id !== fromId && (intent.toAccount ? a.name.toLowerCase().includes(intent.toAccount.toLowerCase()) : true))?.id;

                if (!toId) throw new Error("Destination account not identified.");

                await api.post("/transactions", {
                    type: "TRANSFER",
                    amount: intent.amount,
                    category: "Self Transfer",
                    note: "Voice transfer",
                    accountId: fromId,
                    toAccountId: toId,
                    date: getStrictISTTimestamp(),
                });

                toast.success(`Transferred ₹${intent.amount}`);
                window.dispatchEvent(new Event('refresh-ledger'));
            }

            if (intent.module === "BILL_PAY") {
                const billsRes = await api.get("/recurring-bills");
                const bills = billsRes.data || [];
                const targetBill = bills.find((b: any) => b.name.toLowerCase().includes(intent.billName.toLowerCase()));

                if (!targetBill) {
                    toast.error(`Could not find bill named "${intent.billName}"`);
                    return;
                }

                await api.patch(`/recurring-bills/${targetBill.id}/pay`, {
                    amount: targetBill.amount,
                    accountId: targetBill.accountId,
                    date: getStrictISTTimestamp(),
                });

                toast.success(`Settled contract: ${targetBill.name}`);
                window.dispatchEvent(new Event('refresh-ledger'));
            }

            if (intent.module === "TASK_CREATE") {
                await api.post("/tasks", {
                    title: intent.title,
                    priority: intent.priority || "MEDIUM",
                    status: "PENDING",
                    dueDate: new Date().toISOString(),
                });

                toast.success(`Task created: "${intent.title}"`);
            }

            if (intent.module === "UNKNOWN") {
                toast.error(`Could not interpret: "${intent.raw}"`);
            }

        } catch (err: any) {
            toast.error(err?.response?.data?.message || err.message || "Failed to execute voice command.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartListening = () => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setLastSpoken(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
            toast.error("Speech recognition error or audio blocked.");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setLastSpoken(transcript);
            const intent = parseVoiceCommand(transcript);
            handleDispatch(intent);
        };

        recognition.start();
    };

    return (
        <>
            <AnimatePresence>
                {(isListening || isProcessing || lastSpoken) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 right-6 z-50 bg-slate-900/95 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 max-w-sm"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                        ) : isListening ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                        ) : (
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <p className="text-xs font-bold truncate">
                            {isListening ? "Listening (e.g. 'Spent 200 on Lunch from SBI')..." : isProcessing ? "Executing action..." : `"${lastSpoken}"`}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleStartListening}
                disabled={isProcessing}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-[0_10px_35px_rgb(0,0,0,0.25)] transition-all flex items-center justify-center ${isListening
                    ? "bg-rose-500 text-white ring-8 ring-rose-500/20 animate-pulse"
                    : "bg-slate-900 text-white hover:bg-blue-600"
                    }`}
            >
                <Mic className="w-6 h-6 font-bold" strokeWidth={2.5} />
            </motion.button>
        </>
    );
}