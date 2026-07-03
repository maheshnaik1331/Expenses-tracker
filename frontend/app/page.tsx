"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  BarChart3,
  Shield,
  Zap,
  Globe
} from "lucide-react";

export default function LandingPage() {
  // Pull the live user state from Firebase
  const { user, loading } = useAuth();

  // Animation variants for the features grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  } as const;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] selection:bg-zinc-200 relative overflow-hidden">

      {/* Background Decor (Subtle Grid & Glow) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-zinc-900 opacity-[0.03] blur-[100px]"></div>

      {/* Minimalist SaaS Header */}
      <header className="relative w-full flex justify-between items-center px-6 py-6 max-w-7xl mx-auto z-20">
        <div className="flex items-center gap-2 font-bold tracking-tight text-xl text-zinc-900">
          <div className="bg-zinc-900 text-white p-2 rounded-lg shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          FPMS Studio
        </div>

        <div className="flex items-center gap-4">
          {!loading && !user && (
            <Link href="/auth" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center flex flex-col items-center"
        >


          {/* Antigravity Style Headline */}
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-zinc-900 mb-6 leading-[1.1]">
            Enterprise Financial <br className="hidden md:block" /> Intelligence
          </h1>

          {/* Subtle, highly legible subtitle */}
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-10 leading-relaxed font-light tracking-wide">
            Your platform's Dashboard view offers real-time ledger autocompletion, natural language transaction commands, and a context-aware configurable financial engine.
          </p>

          {/* Dynamic Button Area */}
          <div className="h-16 flex items-center justify-center w-full">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : user ? (
              <Link href="/dashboard">
                <button className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-full text-lg font-medium transition-all shadow-xl shadow-zinc-900/20 transform hover:-translate-y-1">
                  Launch Workspace <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link href="/auth" className="w-full sm:w-auto">
                  <button className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-full text-lg font-medium transition-all shadow-xl shadow-zinc-900/20 transform hover:-translate-y-1 w-full">
                    Create Workspace <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="/auth" className="w-full sm:w-auto">
                  <button className="flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 px-8 py-4 rounded-full text-lg font-medium transition-all w-full shadow-sm">
                    Sign In
                  </button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>


      {/* Features Grid Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 mb-4">
            Everything you need to scale
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Stop wrestling with outdated spreadsheets. We've rebuilt financial operations from the ground up for the modern enterprise.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all group h-full">
                <div className="bg-zinc-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-zinc-900" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </div>
  );
}

// Feature Data Array (Extracted for cleaner code)
const features = [
  {
    title: "Real-time Ledgers",
    description: "Autocompletion algorithms that balance your books instantly as transactions occur.",
    icon: BarChart3,
  },
  {
    title: "Bank-grade Security",
    description: "Enterprise-ready encryption and role-based access controls to keep your data safe.",
    icon: Shield,
  },
  {
    title: "Lightning Fast",
    description: "Built on edge networks to ensure your financial queries resolve in milliseconds.",
    icon: Zap,
  },
  {
    title: "Global Compliance",
    description: "Context-aware engines that adapt to regional tax laws and reporting standards.",
    icon: Globe,
  },
];