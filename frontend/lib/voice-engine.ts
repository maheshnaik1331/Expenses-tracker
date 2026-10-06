export type VoiceIntent =
    | { module: "LEDGER_EXPENSE"; amount: number; note: string; accountName?: string }
    | { module: "LEDGER_INCOME"; amount: number; note: string; accountName?: string }
    | { module: "LEDGER_TRANSFER"; amount: number; fromAccount?: string; toAccount?: string }
    | { module: "BILL_PAY"; billName: string }
    | { module: "TASK_CREATE"; title: string; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }
    | { module: "TASK_COMPLETE"; title: string }
    | { module: "TRACKER_LOG"; flow?: "LIGHT" | "MEDIUM" | "HEAVY" | "SPOTTING"; symptoms: string[] }
    | { module: "NAVIGATE"; path: string }
    | { module: "UNKNOWN"; raw: string };

export function parseVoiceCommand(rawTranscript: string): VoiceIntent {
    const text = rawTranscript.toLowerCase().trim();

    // 1. Navigation Commands
    if (text.includes("go to") || text.includes("open") || text.includes("show")) {
        if (text.includes("ledger") || text.includes("transactions")) return { module: "NAVIGATE", path: "/transactions" };
        if (text.includes("planner") || text.includes("tasks")) return { module: "NAVIGATE", path: "/planner" };
        if (text.includes("bills") || text.includes("contracts")) return { module: "NAVIGATE", path: "/bills" };
        if (text.includes("tracker") || text.includes("cycle")) return { module: "NAVIGATE", path: "/tracker" };
        if (text.includes("dashboard")) return { module: "NAVIGATE", path: "/dashboard" };
    }

    // 2. Transfer: "Transfer 500 from SBI to Federal"
    const transferMatch = text.match(/(?:transfer|send|move)\s+(\d+)(?:\s+(?:from)\s+([a-z\s]+?))?(?:\s+(?:to)\s+([a-z\s]+))?$/i);
    if (transferMatch && text.includes("transfer")) {
        return {
            module: "LEDGER_TRANSFER",
            amount: parseFloat(transferMatch[1]),
            fromAccount: transferMatch[2]?.trim(),
            toAccount: transferMatch[3]?.trim(),
        };
    }

    // 3. Expense: "Spent 250 on Biryani from Federal" or "Paid 80 for Petrol"
    const expenseMatch = text.match(/(?:spent|paid|bought|expense of)\s+(\d+)(?:\s+(?:for|on)\s+([a-z\s]+?))?(?:\s+(?:from|via|using)\s+([a-z\s]+))?$/i);
    if (expenseMatch) {
        return {
            module: "LEDGER_EXPENSE",
            amount: parseFloat(expenseMatch[1]),
            note: expenseMatch[2]?.trim() || "Voice entry expense",
            accountName: expenseMatch[3]?.trim(),
        };
    }

    // 4. Income: "Received 5000 from Freelance in SBI" or "Salary 40000"
    const incomeMatch = text.match(/(?:received|earned|got|salary)\s+(\d+)(?:\s+(?:from|for)\s+([a-z\s]+?))?(?:\s+(?:in|into|to)\s+([a-z\s]+))?$/i);
    if (incomeMatch) {
        return {
            module: "LEDGER_INCOME",
            amount: parseFloat(incomeMatch[1]),
            note: incomeMatch[2]?.trim() || "Voice entry income",
            accountName: incomeMatch[3]?.trim(),
        };
    }

    // 5. Bills Execution: "Pay Netflix" or "Execute electricity bill"
    const billMatch = text.match(/(?:pay|settle|execute)\s+(?:bill\s+)?([a-z0-9\s]+)/i);
    if (billMatch && !text.includes("from") && !text.includes("spent")) {
        return {
            module: "BILL_PAY",
            billName: billMatch[1].trim(),
        };
    }

    // 6. Planner / Tasks: "Add task Audit quarterly report urgent"
    if (text.includes("task") || text.includes("todo") || text.includes("remind me to")) {
        if (text.startsWith("complete task") || text.startsWith("done with")) {
            return {
                module: "TASK_COMPLETE",
                title: text.replace(/^(complete task|done with)\s+/i, "").trim(),
            };
        }

        let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
        if (text.includes("urgent")) priority = "URGENT";
        else if (text.includes("high priority")) priority = "HIGH";
        else if (text.includes("low priority")) priority = "LOW";

        const cleanTitle = text
            .replace(/^(add task|todo|remind me to|create task)\s+/i, "")
            .replace(/\s*(urgent|high priority|low priority)$/i, "")
            .trim();

        return {
            module: "TASK_CREATE",
            title: cleanTitle,
            priority,
        };
    }

    return { module: "UNKNOWN", raw: text };
}