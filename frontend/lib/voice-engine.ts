export type VoiceIntent =
    // Ledger
    | { module: "LEDGER_EXPENSE"; amount: number; note: string; accountName?: string }
    | { module: "LEDGER_INCOME"; amount: number; note: string; accountName?: string }
    | { module: "LEDGER_TRANSFER"; amount: number; fromAccount?: string; toAccount?: string }
    // Accounts
    | { module: "ACCOUNT_CREATE"; accountName: string; accountType: string; initialBalance: number }
    // Contracts / Bills
    | { module: "BILL_PAY"; billName: string }
    | { module: "BILL_CREATE"; billName: string; amount: number; interval: string }
    // Planner / Tasks
    | { module: "TASK_CREATE"; title: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }
    | { module: "TASK_COMPLETE"; title: string }
    // Tracker
    | { module: "TRACKER_LOG"; flow: "LIGHT" | "MEDIUM" | "HEAVY" | "SPOTTING"; symptoms: string[] }
    // System
    | { module: "NAVIGATE"; path: string }
    | { module: "UNKNOWN"; raw: string };

export function parseVoiceCommand(rawTranscript: string): VoiceIntent {
    // Normalize input: lowercase, remove punctuation, remove currency symbols
    let text = rawTranscript.toLowerCase().trim().replace(/[₹$,]/g, "");

    // ==========================================
    // 1. SYSTEM NAVIGATION
    // ==========================================
    if (/^(?:go to|open|show|navigate to|take me to)/.test(text)) {
        if (/ledger|transactions|history/.test(text)) return { module: "NAVIGATE", path: "/transactions" };
        if (/planner|tasks|todo/.test(text)) return { module: "NAVIGATE", path: "/planner" };
        if (/bills|contracts|subscriptions/.test(text)) return { module: "NAVIGATE", path: "/bills" };
        if (/tracker|cycle|health/.test(text)) return { module: "NAVIGATE", path: "/tracker" };
        if (/accounts|assets|dashboard|home/.test(text)) return { module: "NAVIGATE", path: "/dashboard" };
    }

    // ==========================================
    // 2. CAPITAL ASSETS (ACCOUNT CREATION)
    // E.g., "Add a new bank account called HDFC with 5000 rupees"
    // ==========================================
    const accountMatch = text.match(/(?:add|create|open|setup)\s+(?:a\s+)?(?:new\s+)?(.+?)\s+(?:bank\s+)?(?:account|wallet|card)(?:\s+(?:with|balance|amount|starting at)\s+(\d+))?/i)
        || text.match(/(?:add|create|open|setup)\s+(?:bank\s+)?(?:account|wallet|card)\s+(?:named|called|for)\s+(.+?)(?:\s+(?:with|balance|amount)\s+(\d+))?/i);
    if (accountMatch) {
        const isCash = /cash|wallet|pocket/.test(text);
        return {
            module: "ACCOUNT_CREATE",
            accountName: accountMatch[1].trim().toUpperCase(),
            accountType: isCash ? "CASH" : "BANK",
            initialBalance: accountMatch[2] ? parseFloat(accountMatch[2]) : 0
        };
    }

    // ==========================================
    // 3. CONTRACTUAL OBLIGATIONS (BILLS)
    // Create: "Create a monthly bill for Netflix of 500"
    // Pay: "Settle electricity bill"
    // ==========================================
    const billCreateMatch = text.match(/(?:add|create|setup)\s+(?:a\s+)?(weekly|monthly|yearly)?\s*(?:recurring\s+)?(?:bill|contract|subscription)\s+(?:for\s+)?(.+?)\s+(?:of|for)\s+(\d+)/i);
    if (billCreateMatch) {
        let intervalStr = billCreateMatch[1] ? billCreateMatch[1].toUpperCase() : "MONTHLY";
        return {
            module: "BILL_CREATE",
            interval: intervalStr,
            billName: billCreateMatch[2].trim(),
            amount: parseFloat(billCreateMatch[3])
        };
    }

    const billPayMatch = text.match(/(?:pay|settle|execute|clear)\s+(?:the\s+)?(?:bill|contract|subscription)?\s*for\s+(.+)/i)
        || text.match(/(?:pay|settle|execute|clear)\s+(.+?)\s+(?:bill|contract|subscription)/i);
    if (billPayMatch && !/from|spent|paid\s+\d+/.test(text)) {
        return { module: "BILL_PAY", billName: billPayMatch[1].trim() };
    }

    // ==========================================
    // 4. THE PLANNER (TASKS)
    // Complete: "Mark audit report as done"
    // Create: "Remind me to call client urgent"
    // ==========================================
    const taskCompleteMatch = text.match(/(?:complete|finish|done with|close|mark)\s+(?:task|todo)?\s*(.+?)(?:\s+as done)?$/i);
    if (taskCompleteMatch && !/add|create/.test(text)) {
        return { module: "TASK_COMPLETE", title: taskCompleteMatch[1].trim() };
    }

    const taskCreateMatch = text.match(/(?:add|create|new)\s+(?:task|todo)\s+(?:to\s+)?(.+)/i)
        || text.match(/(?:remind me to|need to)\s+(.+)/i);
    if (taskCreateMatch) {
        let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
        if (/urgent/.test(text)) priority = "URGENT";
        else if (/high priority|important/.test(text)) priority = "HIGH";
        else if (/low priority|whenever/.test(text)) priority = "LOW";

        let cleanTitle = taskCreateMatch[1].replace(/\b(urgent|high priority|low priority)\b/gi, "").trim();
        return { module: "TASK_CREATE", title: cleanTitle, priority };
    }

    // ==========================================
    // 5. WELLNESS TRACKER
    // E.g., "Log heavy flow with cramps and fatigue"
    // ==========================================
    if (/cycle|period|flow|symptoms/.test(text)) {
        let flow: "LIGHT" | "MEDIUM" | "HEAVY" | "SPOTTING" = "MEDIUM";
        if (/heavy/.test(text)) flow = "HEAVY";
        else if (/light/.test(text)) flow = "LIGHT";
        else if (/spotting/.test(text)) flow = "SPOTTING";

        const possibleSymptoms = ["cramps", "headache", "fatigue", "bloating", "cravings", "mood swings", "backache", "acne", "nausea"];
        const foundSymptoms = possibleSymptoms.filter(s => text.includes(s));

        return { module: "TRACKER_LOG", flow, symptoms: foundSymptoms.map(s => s.charAt(0).toUpperCase() + s.slice(1)) };
    }

    // ==========================================
    // 6. GLOBAL LEDGER (TRANSFERS, EXPENSES, INCOME)
    // ==========================================

    // A. Internal Transfers: "Transfer 5000 from SBI to Federal"
    const transferMatch = text.match(/(?:transfer|move|send|shift)\s+(\d+(?:\.\d+)?)(?:\s+(?:rupees|rs))?(?:\s+from\s+(.+?))?(?:\s+to\s+(.+))?$/i);
    if (transferMatch && /(?:transfer|move|send|shift)/.test(text)) {
        return {
            module: "LEDGER_TRANSFER",
            amount: parseFloat(transferMatch[1]),
            fromAccount: transferMatch[2]?.trim(),
            toAccount: transferMatch[3]?.replace(/account|bank/i, "").trim()
        };
    }

    // B. Income: "Received 50000 for freelance from client in Federal"
    const incomeMatch = text.match(/(?:received|earned|got|credited|salary of)\s+(\d+(?:\.\d+)?)(?:\s+(?:rupees|rs))?(?:\s+(?:from|for|on)\s+(.+?))?(?:\s+(?:in|into|to)\s+(.+))?$/i);
    if (incomeMatch && !/spent|paid|bought/.test(text)) {
        return {
            module: "LEDGER_INCOME",
            amount: parseFloat(incomeMatch[1]),
            note: incomeMatch[2]?.trim() || "Voice Income",
            accountName: incomeMatch[3]?.replace(/account|bank/i, "").trim()
        };
    }

    // C. Expenses: "Spent 450 on biryani from SBI"
    const expenseMatch = text.match(/(?:spent|paid|bought|expense of|cost me)\s+(\d+(?:\.\d+)?)(?:\s+(?:rupees|rs))?(?:\s+(?:on|for)\s+(.+?))?(?:\s+(?:from|via|using|with)\s+(.+))?$/i);
    if (expenseMatch) {
        return {
            module: "LEDGER_EXPENSE",
            amount: parseFloat(expenseMatch[1]),
            note: expenseMatch[2]?.trim() || "Voice Expense",
            accountName: expenseMatch[3]?.replace(/account|bank/i, "").trim()
        };
    }

    // If nothing matches, return unknown
    return { module: "UNKNOWN", raw: text };
}