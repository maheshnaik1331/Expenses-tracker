"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Wallet, Landmark, Scale, TrendingUp, TrendingDown,
  Banknote, CreditCard, ArrowUpRight, ArrowDownLeft,
  Repeat, PieChart as PieChartIcon, Info, HelpCircle,
  Sparkles, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// --- HIGH-CONTRAST DISTINCT COLOR PALETTES ---
// Using distinctly different colors (Red, Blue, Green, Yellow, Orange, Maroon, Purple, Teal, Pink)
// Shuffled slightly for each chart so the primary categories have distinct identities.
const ASSET_COLORS = ['#3b82f6', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#eab308', '#06b6d4', '#831843', '#ec4899'];
const EXPENSE_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#831843'];
const INCOME_COLORS = ['#10b981', '#8b5cf6', '#f97316', '#3b82f6', '#ec4899', '#eab308', '#ef4444', '#06b6d4', '#831843'];

// --- UTILITIES ---
const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const formatCompactINR = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${value}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// --- CUSTOM COMPONENTS ---
const CustomDonutLegend = ({ payload }: any) => (
  <div className="flex flex-col gap-3.5 pr-2 max-h-[220px] overflow-y-auto scrollbar-hide">
    {payload.map((entry: any, index: number) => (
      <div key={`item-${index}`} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
        <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: entry.color }} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider truncate">{entry.value}</p>
        </div>
        <p className="text-sm font-bold text-slate-900 font-mono tracking-tight shrink-0">
          {formatINR(entry.payload.value)}
        </p>
      </div>
    ))}
  </div>
);

const CustomCashflowTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === 'Income')?.value || 0;
    const expense = payload.find((p: any) => p.dataKey === 'Expense')?.value || 0;
    const net = income - expense;

    return (
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl shadow-slate-200/50 min-w-[200px]">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 font-bold text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500" />Inflow</span>
            <span className="font-mono font-black text-emerald-600">{formatINR(income)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 font-bold text-slate-600"><span className="w-2 h-2 rounded-full bg-rose-500" />Outflow</span>
            <span className="font-mono font-black text-rose-600">{formatINR(expense)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="font-black text-slate-900 text-xs uppercase tracking-wider">Net Velocity</span>
            <span className={`font-mono font-black text-sm ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {net >= 0 ? '+' : ''}{formatINR(net)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- SKELETON LOADER ---
const DashboardSkeleton = () => (
  <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
    <div className="h-10 w-64 bg-slate-200 rounded-xl mb-4"></div>
    <div className="h-4 w-96 bg-slate-200 rounded-lg mb-10"></div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-200 rounded-[2rem]"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 h-96 bg-slate-200 rounded-[2rem]"></div>
      <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
      <div className="h-96 bg-slate-200 rounded-[2rem]"></div>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [fetching, setFetching] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [metrics, setMetrics] = useState({ liquidCash: 0, totalBankAssets: 0, totalDebt: 0, netWorth: 0 });
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [assetData, setAssetData] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
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

        let liquid = 0, bankAssets = 0;
        const chartAssets: any[] = [];

        rawAccounts.forEach((acc: any) => {
          if (acc.type === 'CASH') liquid += acc.currentBalance;
          else bankAssets += acc.currentBalance;

          if (acc.currentBalance > 0) {
            const [, parsedAlias] = acc.name.includes("::") ? acc.name.split("::") : [null, acc.name];
            chartAssets.push({ name: parsedAlias || "Asset", value: acc.currentBalance });
          }
        });

        const debt = rawLoans
          .filter((loan: any) => loan.direction === 'BORROWED' && loan.status === 'ACTIVE')
          .reduce((sum: number, loan: any) => sum + loan.principal, 0);

        const dateMap: Record<string, { date: string; Income: number; Expense: number; fullDate: number }> = {};
        const expCatMap: Record<string, number> = {};
        const incCatMap: Record<string, number> = {};

        rawTxs.forEach((tx: any) => {
          if (tx.type === 'INCOME') incCatMap[tx.category] = (incCatMap[tx.category] || 0) + tx.amount;
          if (tx.type === 'EXPENSE') expCatMap[tx.category] = (expCatMap[tx.category] || 0) + tx.amount;

          if (tx.type !== 'TRANSFER') {
            const dateObj = new Date(tx.date);
            const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;
            if (!dateMap[dateStr]) dateMap[dateStr] = { date: dateStr, Income: 0, Expense: 0, fullDate: dateObj.getTime() };
            if (tx.type === 'INCOME') dateMap[dateStr].Income += tx.amount;
            if (tx.type === 'EXPENSE') dateMap[dateStr].Expense += tx.amount;
          }
        });

        setAccounts(rawAccounts.sort((a: any, b: any) => b.currentBalance - a.currentBalance));
        setTransactions(rawTxs.slice(0, 10));

        setMetrics({
          liquidCash: liquid,
          totalBankAssets: bankAssets,
          totalDebt: debt,
          netWorth: (liquid + bankAssets) - debt,
        });

        setAssetData(chartAssets.sort((a, b) => b.value - a.value));

        // Sort chronologically for the Area chart
        setCashflowData(Object.values(dateMap).sort((a, b) => a.fullDate - b.fullDate));

        setExpenseCategoryData(Object.keys(expCatMap).map(k => ({ name: k, value: expCatMap[k] })).sort((a, b) => b.value - a.value));
        setIncomeCategoryData(Object.keys(incCatMap).map(k => ({ name: k, value: incCatMap[k] })).sort((a, b) => b.value - a.value));

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

  if (loading || (!user && !loading)) {
    return <div className="min-h-screen bg-[#F0F4F8]"><Navbar /><DashboardSkeleton /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100">
      <Navbar />

      <AnimatePresence mode="wait">
        {fetching ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <DashboardSkeleton />
          </motion.div>
        ) : (
          <motion.main key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-x-hidden">

            {/* Premium Contextual Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-blue-600 font-bold tracking-wider uppercase text-xs mb-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> {getGreeting()}, {user?.displayName?.split(" ")[0] || "Executive"}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Capital Command</h1>
                <p className="text-slate-500 text-sm mt-2 font-bold tracking-wide">Real-time enterprise overview and liquidity tracking.</p>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-black text-slate-700 flex items-center gap-2.5 self-start sm:self-auto uppercase tracking-wider">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Live Matrix Active
              </div>
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 sm:gap-8">

              {/* ROW 1: THE PREMIUM KPI STRIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                {/* The Black Card Metric */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-[#312e81] p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-indigo-900/20 relative overflow-hidden text-white border border-slate-700 flex flex-col justify-between hover:shadow-2xl transition-shadow">
                  <div className="absolute -bottom-6 -right-6 p-4 opacity-10 transform -rotate-12"><Scale className="w-40 h-40 text-white" /></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <p className="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> Total Net Worth
                      </p>
                      <div className="relative group cursor-help" title="Combined liquid and bank assets minus active liabilities.">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-300 hover:text-white transition-colors" />
                        <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-30 w-48 p-2 text-[11px] font-semibold text-slate-100 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-700 pointer-events-none transition-all">
                          Combined liquid and bank assets minus active liabilities.
                        </div>
                      </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight truncate font-mono mt-2">{formatINR(metrics.netWorth)}</h2>
                  </div>
                  <div className="relative z-10 mt-6 flex gap-2">
                    <span className="text-[10px] sm:text-xs text-indigo-300 font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">Assets - Liabilities</span>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-emerald-600 transition-colors">Physical Reserves</p>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 transition-transform group-hover:scale-110"><Banknote className="w-5 h-5 font-bold" strokeWidth={2.5} /></div>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 truncate font-mono">{formatINR(metrics.liquidCash)}</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Untraceable Cash Wallets</p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-blue-600 transition-colors">Bank Assets</p>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 transition-transform group-hover:scale-110"><Landmark className="w-5 h-5 font-bold" strokeWidth={2.5} /></div>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 truncate font-mono">{formatINR(metrics.totalBankAssets)}</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Linked Institutions</p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight group-hover:text-rose-600 transition-colors">Active Liabilities</p>
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0 transition-transform group-hover:scale-110"><CreditCard className="w-5 h-5 font-bold" strokeWidth={2.5} /></div>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 truncate font-mono">{formatINR(metrics.totalDebt)}</h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Outstanding Debt Principals</p>
                  </div>
                </motion.div>
              </div>

              {/* ROW 2: CASHFLOW CHARTS & ASSETS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* Cashflow Area Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-200/50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                      <Activity className="w-5 h-5 text-blue-600 font-bold" /> Cash Velocity
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Inflow</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Outflow</span>
                    </div>
                  </div>

                  {cashflowData.length === 0 ? (
                    <div className="h-72 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <TrendingUp className="w-8 h-8 text-slate-300 mb-3" />
                      <p className="text-slate-500 text-sm font-bold">Awaiting transaction data...</p>
                    </div>
                  ) : (
                    <div className="h-72 w-full -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 800 }} dy={12} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 800 }} tickFormatter={formatCompactINR} />
                          <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} content={<CustomCashflowTooltip />} />
                          <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                          <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>

                {/* Asset Distribution Rounded Donut */}
                <motion.div variants={itemVariants} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-200/50 flex flex-col">
                  <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2 tracking-tight">
                    <Wallet className="w-5 h-5 text-indigo-600 font-bold" /> Capital Allocation
                  </h3>
                  {assetData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <PieChartIcon className="w-8 h-8 text-slate-300 mb-3" />
                      <p className="text-slate-500 text-sm font-bold">No asset data.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-between gap-6">
                      <div className="h-44 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={assetData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} cornerRadius={6} dataKey="value" stroke="none">
                              {assetData.map((entry, index) => <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatINR(value)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <CustomDonutLegend payload={assetData.map((d, i) => ({ value: d.name, color: ASSET_COLORS[i % ASSET_COLORS.length], payload: d }))} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ROW 3: CATEGORY ANALYSIS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                {/* Expenses By Category Rounded Donut */}
                <motion.div variants={itemVariants} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-200/50 flex flex-col sm:flex-row items-center gap-8">
                  <div className="w-full sm:w-1/2">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                      <PieChartIcon className="w-5 h-5 text-rose-500 font-bold" /> Outflows
                    </h3>
                    {expenseCategoryData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-slate-500 text-sm font-bold bg-slate-50 rounded-2xl border border-slate-100 border-dashed">No data.</div>
                    ) : (
                      <div className="h-56 w-full relative -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} cornerRadius={6} dataKey="value" stroke="none">
                              {expenseCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatINR(value)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <div className="w-full sm:w-1/2 bg-slate-50 p-4 rounded-2xl border border-slate-100 h-full flex items-center">
                    {expenseCategoryData.length > 0 && <CustomDonutLegend payload={expenseCategoryData.map((d, i) => ({ value: d.name, color: EXPENSE_COLORS[i % EXPENSE_COLORS.length], payload: d }))} />}
                  </div>
                </motion.div>

                {/* Income By Category Rounded Donut */}
                <motion.div variants={itemVariants} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-200/50 flex flex-col sm:flex-row items-center gap-8">
                  <div className="w-full sm:w-1/2">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
                      <PieChartIcon className="w-5 h-5 text-emerald-500 font-bold" /> Inflows
                    </h3>
                    {incomeCategoryData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-slate-500 text-sm font-bold bg-slate-50 rounded-2xl border border-slate-100 border-dashed">No data.</div>
                    ) : (
                      <div className="h-56 w-full relative -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={incomeCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} cornerRadius={6} dataKey="value" stroke="none">
                              {incomeCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatINR(value)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <div className="w-full sm:w-1/2 bg-slate-50 p-4 rounded-2xl border border-slate-100 h-full flex items-center">
                    {incomeCategoryData.length > 0 && <CustomDonutLegend payload={incomeCategoryData.map((d, i) => ({ value: d.name, color: INCOME_COLORS[i % INCOME_COLORS.length], payload: d }))} />}
                  </div>
                </motion.div>
              </div>

              {/* ROW 4: LIVE LEDGER & ACCOUNTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                {/* Live Ledger Feed */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden flex flex-col h-[500px]">
                  <div className="p-6 sm:px-8 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Live Ledger</h3>
                      <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Chronological Flow</p>
                    </div>
                    <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full uppercase tracking-wider shadow-sm">Recent 10</span>
                  </div>
                  <div className="overflow-y-auto flex-1 p-3 sm:p-5 scrollbar-thin scrollbar-thumb-slate-200 space-y-2">
                    {transactions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Repeat className="w-8 h-8 mb-3 text-slate-300" />
                        <p className="text-sm font-bold">No recent transactions.</p>
                      </div>
                    ) : (
                      transactions.map(tx => {
                        const [, parsedAccAlias] = tx.account?.name?.includes("::") ? tx.account.name.split("::") : [null, tx.account?.name];
                        return (
                          <div key={tx.id} className="p-4 bg-slate-50/50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all flex justify-between items-center gap-4 group cursor-pointer">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                tx.type === 'EXPENSE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                {tx.type === 'INCOME' && <ArrowDownLeft className="w-5 h-5 font-bold" />}
                                {tx.type === 'EXPENSE' && <ArrowUpRight className="w-5 h-5 font-bold" />}
                                {tx.type === 'TRANSFER' && <Repeat className="w-5 h-5 font-bold" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{tx.category}</p>
                                <p className="text-[11px] font-bold text-slate-500 truncate mt-1 uppercase tracking-wider flex items-center gap-1.5">
                                  {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} <span className="w-1 h-1 rounded-full bg-slate-300" /> {parsedAccAlias || 'Unknown System'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-base font-black font-mono ${tx.type === 'INCOME' ? 'text-emerald-600' : tx.type === 'EXPENSE' ? 'text-slate-900' : 'text-indigo-600'}`}>
                                {tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}{formatINR(tx.amount)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </motion.div>

                {/* Individual Bank Balances */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md shadow-slate-200/50 overflow-hidden flex flex-col h-[500px]">
                  <div className="p-6 sm:px-8 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Systems</h3>
                      <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Connected Ledgers</p>
                    </div>
                    <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full uppercase tracking-wider shadow-sm">{accounts.length} Assets</span>
                  </div>
                  <div className="overflow-y-auto flex-1 p-3 sm:p-5 scrollbar-thin scrollbar-thumb-slate-200 space-y-2">
                    {accounts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Landmark className="w-8 h-8 mb-3 text-slate-300" />
                        <p className="text-sm font-bold">No active ledgers.</p>
                      </div>
                    ) : (
                      accounts.map(acc => {
                        const [parsedBankId, parsedAlias] = acc.name.includes("::") ? acc.name.split("::") : [null, acc.name];
                        const bankConfig = parsedBankId ? INDIAN_BANK_DIRECTORY.find(b => b.id === parsedBankId) : null;
                        const isCash = acc.type === 'CASH';

                        return (
                          <div key={acc.id} className="p-4 bg-slate-50/50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all flex justify-between items-center gap-4 group cursor-pointer">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-2.5 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                {isCash ? (
                                  <div className="w-full h-full bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                    <Banknote className="w-5 h-5 font-bold" strokeWidth={2.5} />
                                  </div>
                                ) : bankConfig ? (
                                  <img src={`https://img.logo.dev/${bankConfig.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} alt="logo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                  <Landmark className="w-5 h-5 text-slate-400 font-bold" strokeWidth={2.5} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{parsedAlias || "Institution"}</p>
                                <p className="text-[10px] font-bold text-slate-500 truncate mt-1 font-mono uppercase tracking-wider flex items-center gap-1.5">
                                  {isCash ? <Wallet className="w-3 h-3 text-emerald-500" /> : <Landmark className="w-3 h-3 text-blue-500" />}
                                  {isCash ? "PHYSICAL WALLET" : bankConfig?.name || "INSTITUTION"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-base font-black text-slate-900 font-mono">{formatINR(acc.currentBalance)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}