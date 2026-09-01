"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import { motion, Variants } from "framer-motion";
import {
  Loader2, Wallet, Landmark, Scale, TrendingUp,
  Banknote, CreditCard, Activity, ArrowUpRight, ArrowDownLeft, Repeat
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Data State
  const [fetching, setFetching] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // BI Metrics State
  const [metrics, setMetrics] = useState({
    liquidCash: 0,
    totalBankAssets: 0,
    totalDebt: 0,
    netWorth: 0,
    totalIncome: 0,
    totalExpense: 0,
  });

  // Chart Data State
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [assetData, setAssetData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchBIMetrics = async () => {
      try {
        setFetching(true);
        const [accRes, txRes, loanRes] = await Promise.all([
          api.get('/accounts').catch(() => ({ data: [] })),
          api.get('/transactions').catch(() => ({ data: [] })),
          api.get('/loans').catch(() => ({ data: [] }))
        ]);

        const rawAccounts = accRes.data || [];
        const rawTxs = txRes.data || [];
        const rawLoans = loanRes.data || [];

        let liquid = 0;
        let bankAssets = 0;
        const chartAssets: any[] = [];

        rawAccounts.forEach((acc: any) => {
          if (acc.isLiquid || acc.type === 'CASH') {
            liquid += acc.currentBalance;
          } else {
            bankAssets += acc.currentBalance;
          }

          if (acc.currentBalance > 0) {
            chartAssets.push({ name: acc.name, value: acc.currentBalance });
          }
        });

        const debt = rawLoans
          .filter((loan: any) => loan.direction === 'BORROWED' && loan.status === 'ACTIVE')
          .reduce((sum: number, loan: any) => sum + loan.principal, 0);

        let inc = 0;
        let exp = 0;

        const dateMap: Record<string, { date: string; Income: number; Expense: number }> = {};

        rawTxs.forEach((tx: any) => {
          if (tx.type === 'INCOME') inc += tx.amount;
          if (tx.type === 'EXPENSE') exp += tx.amount;

          if (tx.type !== 'TRANSFER') {
            const dateObj = new Date(tx.date);
            const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;

            if (!dateMap[dateStr]) {
              dateMap[dateStr] = { date: dateStr, Income: 0, Expense: 0 };
            }
            if (tx.type === 'INCOME') dateMap[dateStr].Income += tx.amount;
            if (tx.type === 'EXPENSE') dateMap[dateStr].Expense += tx.amount;
          }
        });

        setAccounts(rawAccounts);
        setLoans(rawLoans);
        setTransactions(rawTxs.slice(0, 8));

        setMetrics({
          liquidCash: liquid,
          totalBankAssets: bankAssets,
          totalDebt: debt,
          netWorth: (liquid + bankAssets) - debt,
          totalIncome: inc,
          totalExpense: exp
        });

        setAssetData(chartAssets);
        setCashflowData(Object.values(dateMap).reverse());

      } catch (err) {
        console.error("Failed to aggregate BI metrics:", err);
      } finally {
        setFetching(false);
      }
    };

    if (!loading && user) fetchBIMetrics();
  }, [user, loading]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'];

  if (loading || (!user && !loading) || fetching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-4 font-sans text-zinc-900">
        <Activity className="h-10 w-10 animate-pulse text-blue-600 mb-4" />
        <p className="text-zinc-500 font-medium text-xs sm:text-sm tracking-widest uppercase text-center animate-pulse">
          Synchronizing Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col font-sans antialiased selection:bg-blue-100">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-x-hidden">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Capital Command</h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium tracking-wide">Real-time enterprise overview and liquidity tracking.</p>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-full border border-slate-200/60 shadow-sm text-xs font-bold text-zinc-600 flex items-center gap-2 self-start sm:self-auto w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Feed Active
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6 sm:gap-8"
        >
          {/* ROW 1: THE PREMIUM KPI STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] shadow-md relative overflow-hidden text-white">
              <div className="absolute -bottom-4 -right-4 p-4 opacity-10"><Scale className="w-32 h-32 text-white" /></div>
              <p className="text-[10px] sm:text-xs font-bold text-blue-100 uppercase tracking-widest mb-2">Total Net Worth</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight truncate">₹{metrics.netWorth.toLocaleString("en-IN")}</h2>
              <p className="text-[10px] sm:text-xs text-blue-200 mt-4 font-semibold">Assets - Liabilities</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start gap-2">
                <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest leading-tight">Liquid Cash</p>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Banknote className="w-5 h-5" /></div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-4 truncate">₹{metrics.liquidCash.toLocaleString("en-IN")}</h2>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start gap-2">
                <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest leading-tight">Bank Assets</p>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Landmark className="w-5 h-5" /></div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-4 truncate">₹{metrics.totalBankAssets.toLocaleString("en-IN")}</h2>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start gap-2">
                <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest leading-tight">Active Liabilities</p>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0"><CreditCard className="w-5 h-5" /></div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-4 truncate">₹{metrics.totalDebt.toLocaleString("en-IN")}</h2>
            </motion.div>
          </div>

          {/* ROW 2: CHARTS & LEDGER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Cashflow Area Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Cash Velocity
              </h3>
              {cashflowData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-zinc-500 text-sm font-medium">Awaiting transaction data...</div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* Asset Distribution Donut */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" /> Capital Allocation
              </h3>
              {assetData.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-zinc-500 text-sm font-medium">No asset data available.</div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={assetData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                        {assetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => typeof value === 'number' ? `₹${value.toLocaleString("en-IN")}` : `₹${value}`}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          </div>

          {/* ROW 3: LIVE LEDGER & ACCOUNTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Live Ledger Feed */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[420px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <h3 className="text-lg font-bold text-zinc-900">Live Ledger</h3>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full uppercase tracking-wider">Recent</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-zinc-500">No recent transactions.</div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors flex justify-between items-center gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' :
                          tx.type === 'EXPENSE' ? 'bg-rose-50 text-rose-600' :
                            'bg-indigo-50 text-indigo-600'
                          }`}>
                          {tx.type === 'INCOME' && <ArrowDownLeft className="w-5 h-5" />}
                          {tx.type === 'EXPENSE' && <ArrowUpRight className="w-5 h-5" />}
                          {tx.type === 'TRANSFER' && <Repeat className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate">{tx.category}</p>
                          <p className="text-xs font-semibold text-zinc-500 truncate mt-0.5">
                            {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {tx.account?.name}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold font-mono shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-600' :
                        tx.type === 'EXPENSE' ? 'text-zinc-900' : 'text-indigo-600'
                        }`}>
                        {tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}₹{tx.amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Individual Bank Balances */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[420px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <h3 className="text-lg font-bold text-zinc-900">Active Ledgers</h3>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full uppercase tracking-wider">{accounts.length} Systems</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 p-2">
                {accounts.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-zinc-500">No active ledgers.</div>
                ) : (
                  accounts.map(acc => {
                    const bankConfig = INDIAN_BANK_DIRECTORY.find(b => b.id === acc.type);
                    const isCash = acc.isLiquid || acc.type === 'CASH';

                    return (
                      <div key={acc.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors flex justify-between items-center gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                            {isCash ? (
                              <div className="w-full h-full bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                <Banknote className="w-5 h-5" />
                              </div>
                            ) : bankConfig ? (
                              <img src={`https://img.logo.dev/${bankConfig.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} alt="logo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                            ) : (
                              <Landmark className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-zinc-900 truncate">{acc.name}</p>
                            <p className="text-[10px] font-bold text-zinc-500 truncate mt-0.5 font-mono">{isCash ? "LIQUID ASSET" : bankConfig?.name || "INSTITUTION"}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-zinc-900 shrink-0 font-mono">₹{acc.currentBalance.toLocaleString("en-IN")}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}