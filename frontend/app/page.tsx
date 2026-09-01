"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  BarChart3,
  Shield,
  Zap,
  Globe,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Landmark,
  Wallet
} from "lucide-react";
import { useRef } from "react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Scroll-linked background animations
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 selection:bg-zinc-800 relative overflow-hidden font-clash-display">

      {/* --- Dynamic Background Gradient Container --- */}
      <motion.div
        style={{ y: bgY, opacity }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-zinc-800/20 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-zinc-700/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </motion.div>

      {/* --- Header --- */}
      <header className="relative w-full flex justify-between items-center px-4 md:px-6 py-6 max-w-7xl mx-auto z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 font-bold tracking-wide text-lg md:text-xl text-white"
        >
          <div className="bg-white text-black p-2 rounded-xl shadow-lg">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          FPMS
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          {!loading && !user && (
            <Link href="/auth" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
          )}
        </motion.div>
      </header>

      {/* --- Hero Section: 3D Cards & Real-Time Cash flow --- */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-4 md:px-6 pt-12 md:pt-20 pb-20 max-w-7xl mx-auto w-full gap-12 lg:gap-8">

        {/* Left: Typography */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)", y: 30 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 text-left flex flex-col items-start w-full z-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-100"></span>
            </span>
            <span className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-zinc-300">
              Real-Time Ledger Active
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-semibold tracking-tighter mb-6 leading-[1.05]">
            Capital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-500 to-zinc-800">
              Command.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed font-light">
            Professional grade accounting infrastructure. Issue cards, track cash flow, and reconcile your global ledger in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            ) : user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className="w-full bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-full text-base font-semibold transition-transform active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2">
                  Launch Workspace <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            ) : (
              <Link href="/auth" className="w-full sm:w-auto">
                <button className="w-full bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-full text-base font-semibold transition-transform active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2">
                  Start Building <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Right: 3D Floating Cards & Cash Animations */}
        <div className="flex-1 relative w-full h-[400px] sm:h-[500px] flex items-center justify-center perspective-[1200px] mt-8 lg:mt-0">

          {/* Card 1: Silver Credit */}
          <motion.div
            animate={{
              rotateX: [15, 5, 15],
              rotateY: [-20, -10, -20],
              y: [-15, 5, -15],
              z: [0, 50, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute z-10 w-[280px] sm:w-[340px] h-[180px] sm:h-[220px] rounded-[1.5rem] p-6 flex flex-col justify-between shadow-2xl border border-white/20 bg-gradient-to-br from-zinc-200 to-zinc-400 text-black transform origin-center -ml-20 -mt-10"
          >
            <div className="flex justify-between items-start w-full">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-black/80" />
              <span className="font-bold tracking-wider">CORP</span>
            </div>
            <div>
              <div className="flex gap-4 mb-2 font-mono tracking-widest text-sm sm:text-base text-black/80">
                <span>****</span><span>****</span><span>****</span><span>8892</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-black/70">
                <span>VIRTUAL CREDIT</span>
                <span>$45,000 LIMIT</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Black Debit (Foreground) */}
          <motion.div
            animate={{
              rotateX: [5, 15, 5],
              rotateY: [10, 20, 10],
              y: [5, -15, 5],
              z: [50, 100, 50]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute z-30 w-[280px] sm:w-[340px] h-[180px] sm:h-[220px] rounded-[1.5rem] p-6 flex flex-col justify-between shadow-2xl border border-zinc-700 bg-[#0A0A0B] backdrop-blur-xl transform origin-center ml-10 mt-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20 rounded-[1.5rem] pointer-events-none"></div>
            <div className="flex justify-between items-start w-full relative z-10">
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white/80" />
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest mb-1">Available Cash</p>
                <p className="text-lg sm:text-xl font-bold tracking-wider text-white">$1,284,592.00</p>
              </div>
            </div>
            <div className="relative z-10">
              <div className="flex gap-4 mb-2 font-mono tracking-widest text-sm sm:text-base text-zinc-300">
                <span>****</span><span>****</span><span>****</span><span>4920</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm text-zinc-500">
                <span>OPERATING ACC</span>
                <span>12/28</span>
              </div>
            </div>
          </motion.div>

          {/* Floating Real-Time Transaction (Debit) */}
          <motion.div
            animate={{ y: [20, -100], opacity: [0, 1, 0], scale: [0.8, 1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1 }}
            className="absolute z-40 right-0 sm:-right-10 top-1/4 bg-[#121214] border border-white/10 p-3 rounded-xl flex items-center gap-3 shadow-2xl"
          >
            <div className="bg-red-500/10 p-1.5 rounded-full text-red-500">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">AWS Invoice</p>
              <p className="text-xs font-bold text-red-400 font-mono">-$1,420.50</p>
            </div>
          </motion.div>

          {/* Floating Real-Time Transaction (Credit) */}
          <motion.div
            animate={{ y: [100, -20], opacity: [0, 1, 0], scale: [0.8, 1, 0.9] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 2.5 }}
            className="absolute z-40 left-0 sm:-left-10 bottom-1/4 bg-[#121214] border border-white/10 p-3 rounded-xl flex items-center gap-3 shadow-2xl"
          >
            <div className="bg-green-500/10 p-1.5 rounded-full text-green-500">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Stripe Payout</p>
              <p className="text-xs font-bold text-green-400 font-mono">+$24,500.00</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- Infinite 3D Marquee Section --- */}
      <div className="relative z-10 w-full py-10 border-y border-white/5 bg-[#0A0A0B] overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0A0B] to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0A0B] to-transparent z-10"></div>

        <div className="flex w-[200%] md:w-[150%]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex w-full justify-around items-center opacity-40 grayscale"
          >
            {/* Repeated twice for seamless looping */}
            {[1, 2].map((group) => (
              <div key={group} className="flex w-1/2 justify-around items-center gap-8 px-8">
                <div className="flex items-center gap-2 text-xl font-bold font-sans tracking-tighter"><Landmark /> CHASE</div>
                <div className="flex items-center gap-2 text-xl font-bold font-sans tracking-tighter"><DollarSign /> STRIPE</div>
                <div className="flex items-center gap-2 text-xl font-bold font-sans tracking-tighter"><Wallet /> PLAID</div>
                <div className="flex items-center gap-2 text-xl font-bold font-sans tracking-tighter">MERCURY</div>
                <div className="flex items-center gap-2 text-xl font-bold font-sans tracking-tighter">BREX</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- Container Scroll Animations: Features --- */}
      <div className="relative z-10 w-full py-24 md:py-32 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
              Core Infrastructure.
            </h2>
            <p className="text-zinc-400 max-w-xl text-base md:text-lg">
              Engineered for precision. A complete suite for treasury management, autonomous reconciliation, and scale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#0A0A0B] p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:bg-[#121214] hover:border-white/10 transition-all duration-300"
              >
                <div className="bg-white/5 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-5 border border-white/5">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    title: "Live Ledgers",
    description: "Double-entry accounting engine that balances instantly upon transaction sync.",
    icon: BarChart3,
  },
  {
    title: "Bank-Grade",
    description: "AES-256 encryption, role-based access, and immutable audit logs.",
    icon: Shield,
  },
  {
    title: "High Velocity",
    description: "Process thousands of concurrent transactions with sub-millisecond latency.",
    icon: Zap,
  },
  {
    title: "Global Scope",
    description: "Multi-currency support and automated FX routing across borders.",
    icon: Globe,
  },
];