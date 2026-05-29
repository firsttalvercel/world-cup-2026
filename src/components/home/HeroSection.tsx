"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gray-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-gray-950 to-gray-950" />

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/20 blur-[100px] animate-pulse-slow" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-gold-500/15 blur-[80px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-800/10 blur-[120px]" />
      </div>

      {/* Football field lines overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            FIFA World Cup 2026 — USA · Canada · Mexico
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none mb-6"
          >
            Your{" "}
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-gold-400 bg-clip-text text-transparent">
              World Cup
            </span>
            <br />
            Companion
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Follow all 104 matches across 16 stunning venues. Schedule in Spain
            time, live group standings, knockout bracket, and 92 years of World
            Cup history.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/matches"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-2xl hover:shadow-brand-500/30 active:scale-95 text-base"
            >
              View Schedule <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/groups"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 backdrop-blur-sm active:scale-95 text-base"
            >
              <Play className="w-5 h-5" /> Group Standings
            </Link>
          </motion.div>

          {/* Flags row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex items-center justify-center gap-2 flex-wrap"
          >
            {[
              "🇺🇸","🇧🇷","🇫🇷","🇩🇪","🇦🇷","🇪🇸","🇵🇹","🇳🇱","🇧🇪","🇨🇷",
              "🇲🇽","🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇮🇹","🇯🇵","🇲🇦","🇸🇳","🇨🇦","🇺🇾","🇭🇷","🇨🇴",
            ].map((flag, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.04 }}
                className="text-2xl hover:scale-125 transition-transform duration-200 cursor-default"
              >
                {flag}
              </motion.span>
            ))}
            <span className="text-gray-600 text-sm ml-2">+28 more</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
