"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { INDIAN_BANK_DIRECTORY } from "@/lib/bank-directory";
import {
  Loader2, Wallet, Landmark, Scale, TrendingUp,
  Banknote, CreditCard, Activity, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
        // FIX: Re-routed the liabilities fetch to /loans based on your backend logs
        const [accRes, txRes, loanRes] = await Promise.all([
          api.get('/accounts').catch(() => ({ data: [] })),
          api.get('/transactions').catch(() => ({ data: [] })),
          api.get('/loans').catch(() => ({ data: [] }))
        ]);

        const rawAccounts = accRes.data || [];
        const rawTxs = txRes.data || [];
        const rawLoans = loanRes.data || [];

        // 1. Process Assets & Liquidity
        let liquid = 0;
        let bankAssets = 0;
        const chartAssets: any[] = [];

        rawAccounts.forEach((acc: any) => {
          // Identify physical cash accounts by name keywords
          const isCash = acc.name.toLowerCase().includes('cash') || acc.name.toLowerCase().includes('wallet');

          if (isCash) {
            liquid += acc.currentBalance;
          } else {
            bankAssets += acc.currentBalance;
          }

          // Push to Donut Chart Data if balance > 0
          if (acc.currentBalance > 0) {
            chartAssets.push({ name: acc.name, value: acc.currentBalance });
          }
        });

        // 2. Process Liabilities (Loans)
        const debt = rawLoans.reduce((sum: number, loan: any) => sum + loan.principal, 0);

        // 3. Process Cashflow (Income vs Expense)
        let inc = 0;
        let exp = 0;
        const categoryMap: Record<string, { name: string; Income: number; Expense: number }> = {};

        rawTxs.forEach((tx: any) => {
          if (tx.type === 'INCOME') inc += tx.amount;
          if (tx.type === 'EXPENSE') exp += tx.amount;

          if (!categoryMap[tx.category]) {
            categoryMap[tx.category] = { name: tx.category, Income: 0, Expense: 0 };
          }
          if (tx.type === 'INCOME') categoryMap[tx.category].Income += tx.amount;
          if (tx.type === 'EXPENSE') categoryMap[tx.category].Expense += tx.amount;
        });

        setAccounts(rawAccounts);
        setLoans(rawLoans);
        setTransactions(rawTxs);

        setMetrics({
          liquidCash: liquid,
          totalBankAssets: bankAssets,
          totalDebt: debt,
          netWorth: (liquid + bankAssets) - debt,
          totalIncome: inc,
          totalExpense: exp
        });

        setAssetData(chartAssets);
        setCashflowData(Object.values(categoryMap));

      } catch (err) {
        console.error("Failed to aggregate BI metrics:", err);
      } finally {
        setFetching(false);
      }
    };

    if (!loading && user) fetchBIMetrics();
  }, [user, loading]);

  // Premium UI Chart Colors
  const COLORS = ['#18181b', '#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'];

  if (loading || (!user && !loading) || fetching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-4">
        <Activity className="h-10 w-10 animate-pulse text-zinc-900 mb-4" />
        <p className="text-zinc-500 font-medium text-xs sm:text-sm tracking-widest uppercase text-center">
          Aggregating Financial Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans">
      <Navbar />

      {/* Main Container - Optimized for mobile padding */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 overflow-x-hidden">

        {/* Header - Stacks on mobile */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Financial Intelligence</h1>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">Real-time enterprise overview and liquidity tracking.</p>
          </div>
          <div className="bg-white px-3 py-2 sm:px-4 rounded-xl shadow-sm border border-slate-200 text-xs sm:text-sm font-semibold text-zinc-700 flex items-center gap-2 self-start sm:self-auto w-fit">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> Live Data Synced
          </div>
        </div>

        {/* ROW 1: THE PREMIUM KPI STRIP (Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">

          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-5 sm:p-6 rounded-3xl shadow-lg border border-zinc-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Scale className="w-16 h-16 sm:w-24 sm:h-24" /></div>
            <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Net Worth</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight truncate">₹{metrics.netWorth.toLocaleString("en-IN")}</h2>
            <p className="text-[10px] sm:text-xs text-zinc-400 mt-2 sm:mt-4 flex items-center gap-1">
              Assets minus Liabilities
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-2">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest leading-tight">Physical Cash In Hand</p>
              <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl shrink-0"><Banknote className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-4 truncate">₹{metrics.liquidCash.toLocaleString("en-IN")}</h2>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-2">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest leading-tight">Total Bank Assets</p>
              <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl shrink-0"><Landmark className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mt-4 truncate">₹{metrics.totalBankAssets.toLocaleString("en-IN")}</h2>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-2">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest leading-tight">Total Active Loans</p>
              <div className="p-1.5 sm:p-2 bg-rose-50 text-rose-600 rounded-lg sm:rounded-xl shrink-0"><CreditCard className="w-4 h-4 sm:w-5 sm:h-5" /></div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-rose-600 mt-4 truncate">₹{metrics.totalDebt.toLocaleString("en-IN")}</h2>
          </div>
        </div>

        {/* ROW 2: POWER BI STYLE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">

          {/* Cashflow Bar Chart */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-4 sm:mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" /> Cashflow by Category
            </h3>
            {cashflowData.length === 0 ? (
              <div className="h-60 sm:h-72 flex items-center justify-center text-zinc-400 text-xs sm:text-sm">No transaction data available.</div>
            ) : (
              <div className="h-60 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Asset Distribution Donut Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" /> Asset Distribution
            </h3>
            {assetData.length === 0 ? (
              <div className="h-60 sm:h-72 flex items-center justify-center text-zinc-400 text-xs sm:text-sm">No asset data available.</div>
            ) : (
              <div className="h-60 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assetData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                      {assetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => typeof value === 'number' ? `₹${value.toLocaleString("en-IN")}` : `₹${value}`} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: DETAILED BREAKDOWNS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Individual Bank Balances */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">Bank Accounts Portfolio</h3>
              <span className="text-[10px] sm:text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full">{accounts.length} Ledgers</span>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {accounts.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">No bank accounts linked.</div>
              ) : (
                accounts.map(acc => {
                  const bankConfig = INDIAN_BANK_DIRECTORY.find(b => b.id === acc.type);
                  const isCash = acc.name.toLowerCase().includes('cash') || acc.name.toLowerCase().includes('wallet');

                  return (
                    <div key={acc.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-sm shrink-0">
                          {isCash ? (
                            <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                          ) : bankConfig ? (
                            <img src={`https://img.logo.dev/${bankConfig.domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_KEY}`} alt="logo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                          ) : (
                            <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{acc.name}</p>
                          <p className="text-[10px] sm:text-xs font-medium text-zinc-500 truncate">{isCash ? "Physical Vault" : bankConfig?.name || "Institution"}</p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-900 shrink-0">₹{acc.currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Individual Loan Balances */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">Active Liabilities (Loans)</h3>
              <span className="text-[10px] sm:text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">{loans.length} Active</span>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {loans.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">No active loans detected.</div>
              ) : (
                loans.map(loan => (
                  <div key={loan.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex justify-between items-center gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                        <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{loan.lender}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-zinc-500 truncate">{loan.type} LOAN</p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-rose-600 shrink-0">₹{loan.principal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}