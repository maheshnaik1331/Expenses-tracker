"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
    <div ref={containerRef} className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-indigo-500/30 relative overflow-x-hidden font-sans antialiased">

      {/* --- Dynamic Breathing Mesh Background --- */}
      <motion.div
        style={{ y: bgY, opacity }}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-600/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
      </motion.div>

      {/* --- Premium Navbar --- */}
      <header className="relative w-full flex justify-between items-center px-6 md:px-10 py-8 max-w-[1400px] mx-auto z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 font-black tracking-tight text-xl md:text-2xl text-white"
        >
          <div className="bg-white text-black p-2 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </div>
          FPMS
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          {!loading && !user && (
            <Link href="/auth" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
          )}
        </motion.div>
      </header>

      {/* --- Hero Section: Fully Responsive Architecture --- */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 md:px-10 pt-10 md:pt-16 pb-24 max-w-[1400px] mx-auto w-full gap-16 lg:gap-8">

        {/* Left: commanding Typography */}
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)", y: 30 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start w-full z-20 mt-8 lg:mt-0"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-zinc-300">
              Enterprise Engine Online
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[6.5rem] font-black tracking-tighter mb-6 leading-[1.05] text-white drop-shadow-sm">
            Capital <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600">
              Command.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-400 max-w-xl mb-10 leading-relaxed font-semibold">
            Professional grade financial infrastructure. Deploy assets, monitor cash velocity, and reconcile your global ledger in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto">
            {loading ? (
              <div className="bg-white/10 p-4 rounded-full flex items-center justify-center w-full sm:w-[250px]">
                <Loader2 className="h-6 w-6 animate-spin text-white" strokeWidth={3} />
              </div>
            ) : user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 px-10 py-5 rounded-full text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2">
                  Launch Workspace <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </button>
              </Link>
            ) : (
              <Link href="/auth" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 px-10 py-5 rounded-full text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2">
                  Start Building <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Right: 3D Floating Cards & Cash Animations (Mobile Optimized) */}
        <div className="flex-1 relative w-full h-[350px] sm:h-[450px] lg:h-[500px] flex items-center justify-center perspective-[1200px]">

          {/* Card 1: Platinum Background Card */}
          <motion.div
            animate={{
              rotateX: [15, 5, 15],
              rotateY: [-25, -15, -25],
              y: [-15, 5, -15],
              z: [0, 50, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute z-10 w-[260px] sm:w-[320px] h-[160px] sm:h-[200px] rounded-[1.5rem] p-6 flex flex-col justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/20 bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-500 text-black transform origin-center -ml-16 sm:-ml-24 -mt-12 sm:-mt-16 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-50 transform -translate-x-full animate-[shimmer_3s_infinite]"></div>
            <div className="flex justify-between items-start w-full relative z-10">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-black/80" strokeWidth={2.5} />
              <span className="font-black tracking-widest text-[10px] sm:text-xs">CORP.</span>
            </div>
            <div className="relative z-10">
              <div className="flex gap-4 mb-2 font-mono font-bold tracking-widest text-sm sm:text-base text-black/80">
                <span>****</span><span>****</span><span>****</span><span>8892</span>
              </div>
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-black/70 tracking-widest">
                <span>VIRTUAL</span>
                <span>$45K LIMIT</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Obsidian Foreground Card */}
          <motion.div
            animate={{
              rotateX: [5, 15, 5],
              rotateY: [15, 25, 15],
              y: [5, -15, 5],
              z: [50, 100, 50]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute z-30 w-[260px] sm:w-[320px] h-[160px] sm:h-[200px] rounded-[1.5rem] p-6 flex flex-col justify-between shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] border border-white/10 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black backdrop-blur-xl transform origin-center ml-12 sm:ml-16 mt-8 sm:mt-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 rounded-[1.5rem] pointer-events-none"></div>
            <div className="flex justify-between items-start w-full relative z-10">
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white/90" strokeWidth={2.5} />
              <div className="text-right">
                <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Liquid Assets</p>
                <p className="text-lg sm:text-xl font-black tracking-wider text-white font-mono">$1,284,592</p>
              </div>
            </div>
            <div className="relative z-10">
              <div className="flex gap-4 mb-2 font-mono font-bold tracking-widest text-sm sm:text-base text-zinc-300 drop-shadow-sm">
                <span>****</span><span>****</span><span>****</span><span>4920</span>
              </div>
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-zinc-500 tracking-widest uppercase">
                <span>Operating</span>
                <span>12/28</span>
              </div>
            </div>
          </motion.div>

          {/* Floating Real-Time Transaction (Debit) */}
          <motion.div
            animate={{ y: [20, -120], opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 1 }}
            className="absolute z-40 right-4 sm:-right-8 top-1/4 bg-[#121214]/90 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl flex items-center gap-3 shadow-2xl"
          >
            <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl text-rose-500">
              <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">AWS Infrastructure</p>
              <p className="text-xs sm:text-sm font-black text-rose-400 font-mono mt-0.5">-$1,420.50</p>
            </div>
          </motion.div>

          {/* Floating Real-Time Transaction (Credit) */}
          <motion.div
            animate={{ y: [100, -40], opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: 2.5 }}
            className="absolute z-40 left-0 sm:-left-12 bottom-1/4 bg-[#121214]/90 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl flex items-center gap-3 shadow-2xl"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-emerald-500">
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">Stripe Payout</p>
              <p className="text-xs sm:text-sm font-black text-emerald-400 font-mono mt-0.5">+$24,500.00</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- Infinite 3D Marquee Section --- */}
      <div className="relative z-10 w-full py-8 sm:py-12 border-y border-white/5 bg-[#0A0A0B] overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#0A0A0B] to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#0A0A0B] to-transparent z-10"></div>

        <div className="flex w-[300%] md:w-[200%] lg:w-[150%]">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="flex w-full justify-around items-center opacity-30 grayscale"
          >
            {[1, 2].map((group) => (
              <div key={group} className="flex w-1/2 justify-around items-center gap-8 sm:gap-16 px-4 sm:px-8">
                <div className="flex items-center gap-2 text-lg sm:text-2xl font-black font-sans tracking-tight"><Landmark strokeWidth={2.5} /> CHASE</div>
                <div className="flex items-center gap-2 text-lg sm:text-2xl font-black font-sans tracking-tight"><DollarSign strokeWidth={2.5} /> STRIPE</div>
                <div className="flex items-center gap-2 text-lg sm:text-2xl font-black font-sans tracking-tight"><Wallet strokeWidth={2.5} /> PLAID</div>
                <div className="flex items-center gap-2 text-lg sm:text-2xl font-black font-sans tracking-tight">MERCURY</div>
                <div className="flex items-center gap-2 text-lg sm:text-2xl font-black font-sans tracking-tight">BREX</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- Container Scroll Animations: Features --- */}
      <div className="relative z-10 w-full py-20 sm:py-32 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left mb-16 lg:mb-24"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6">
              Core Infrastructure.
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto md:mx-0 text-base sm:text-lg font-semibold leading-relaxed">
              Engineered for absolute precision. A complete suite for treasury management, autonomous reconciliation, and infinite scale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-[#0A0A0B] p-8 sm:p-10 rounded-[2rem] border border-white/5 hover:bg-[#121214] hover:border-white/10 transition-all duration-300 hover:-translate-y-2 group shadow-lg"
              >
                <div className="bg-white/5 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-blue-600/10 group-hover:border-blue-500/30 transition-colors">
                  <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white group-hover:text-blue-400 transition-colors" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-400 text-sm sm:text-base font-semibold leading-relaxed">
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
    description: "Double-entry accounting engine that mathematically balances instantly upon transaction sync.",
    icon: BarChart3,
  },
  {
    title: "Bank-Grade",
    description: "AES-256 encryption, role-based infrastructure access, and immutable audit logs.",
    icon: Shield,
  },
  {
    title: "High Velocity",
    description: "Process thousands of concurrent transactions with sub-millisecond network latency.",
    icon: Zap,
  },
  {
    title: "Global Scope",
    description: "Native multi-currency support and automated FX routing across borderless accounts.",
    icon: Globe,
  },
];

