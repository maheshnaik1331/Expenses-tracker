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

    // Smart fuzzy matcher to link spoken words to exact Database IDs
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
            // 1. Navigation
            if (intent.module === "NAVIGATE") {
                router.push(intent.path);
                toast.success(`Navigated to ${intent.path}`);
                return;
            }

            // 2. Ledger (Income / Expense)
            if (intent.module === "LEDGER_EXPENSE" || intent.module === "LEDGER_INCOME") {
                const { data: accounts } = await api.get("/accounts");
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
            }

            // 3. Ledger (Transfers)
            if (intent.module === "LEDGER_TRANSFER") {
                const { data: accounts } = await api.get("/accounts");
                const fromId = resolveAccountId(intent.fromAccount, accounts);
                const toId = accounts.find((a: any) => a.id !== fromId && (intent.toAccount ? a.name.toLowerCase().includes(intent.toAccount.toLowerCase()) : true))?.id;

                if (!toId) throw new Error("Could not determine destination account.");

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
            }

            // 4. Accounts Creation
            if (intent.module === "ACCOUNT_CREATE") {
                await api.post("/accounts", {
                    name: intent.accountName,
                    type: intent.accountType,
                    currentBalance: intent.initialBalance,
                });
                toast.success(`Created ${intent.accountType.toLowerCase()} account: ${intent.accountName}`);
            }

            // 5. Bills Execution
            if (intent.module === "BILL_PAY") {
                const { data: bills } = await api.get("/recurring-bills");
                const targetBill = bills.find((b: any) => b.name.toLowerCase().includes(intent.billName.toLowerCase()));
                if (!targetBill) throw new Error(`Could not find bill: ${intent.billName}`);

                await api.patch(`/recurring-bills/${targetBill.id}/pay`, {
                    amount: targetBill.amount,
                    accountId: targetBill.accountId,
                    date: getStrictISTTimestamp(),
                });
                toast.success(`Settled contract: ${targetBill.name}`);
            }

            // 6. Bills Creation
            if (intent.module === "BILL_CREATE") {
                const { data: accounts } = await api.get("/accounts");
                await api.post("/recurring-bills", {
                    name: intent.billName,
                    amount: intent.amount,
                    interval: intent.interval,
                    category: "Other",
                    accountId: accounts[0]?.id,
                    nextDueDate: new Date().toISOString()
                });
                toast.success(`Created recurring contract: ${intent.billName}`);
            }

            // 7. Planner Tasks
            if (intent.module === "TASK_CREATE") {
                await api.post("/tasks", {
                    title: intent.title,
                    priority: intent.priority,
                    status: "PENDING",
                    dueDate: new Date().toISOString(),
                });
                toast.success(`Task created: "${intent.title}"`);
            }

            if (intent.module === "TASK_COMPLETE") {
                const { data: tasks } = await api.get("/tasks");
                const matchedTask = tasks.find((t: any) => t.title.toLowerCase().includes(intent.title.toLowerCase()));
                if (!matchedTask) throw new Error(`Task not found: ${intent.title}`);

                await api.patch(`/tasks/${matchedTask.id}`, { status: "COMPLETED" });
                toast.success(`Completed task: "${matchedTask.title}"`);
            }

            // 8. Health Tracker
            if (intent.module === "TRACKER_LOG") {
                await api.post("/cycles", {
                    startDate: new Date().toISOString(),
                    flow: intent.flow,
                    symptoms: intent.symptoms,
                    notes: "Logged via Voice Command",
                });
                toast.success("Health cycle logged successfully.");
            }

            if (intent.module === "UNKNOWN") {
                toast.error(`Could not interpret: "${intent.raw}"`);
                return;
            }

            // Globally trigger all pages to silently refresh their data
            window.dispatchEvent(new Event('refresh-ledger'));

        } catch (err: any) {
            toast.error(err?.response?.data?.message || err.message || "Failed to execute voice command.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartListening = () => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice recognition not supported on this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => { setIsListening(true); setLastSpoken(null); };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => { setIsListening(false); toast.error("Audio blocked or not detected."); };

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
                        className="fixed bottom-24 right-6 z-[999] bg-slate-900/95 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 max-w-sm"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                        ) : isListening ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                        ) : (
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <p className="text-xs font-bold truncate">
                            {isListening ? "Listening..." : isProcessing ? "Executing action..." : `"${lastSpoken}"`}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleStartListening}
                disabled={isProcessing}
                className={`fixed bottom-6 right-6 z-[999] p-4 rounded-full shadow-[0_10px_35px_rgb(0,0,0,0.25)] transition-all flex items-center justify-center ${isListening ? "bg-rose-500 text-white ring-8 ring-rose-500/20 animate-pulse" : "bg-slate-900 text-white hover:bg-blue-600"
                    }`}
            >
                <Mic className="w-6 h-6 font-bold" strokeWidth={2.5} />
            </motion.button>
        </>
    );
}