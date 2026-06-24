import React from "react";
import { Link, Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Landmark } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ThemeToggle } from "./ThemeToggle";

export function AuthLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex">
      {/* Left Banner - Desktop Only */}
      <div className="hidden lg:flex flex-1 relative bg-blue-800 flex-col justify-between overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20 dark:opacity-40 mix-blend-overlay">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1703107819041-5c1d6c35c085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBnb3Zlcm5tZW50JTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzgwMDQ5MTY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Modern government building"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent" />

        <div className="relative z-10 p-12 text-white mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
              <Landmark className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Portal do Município</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4 max-w-lg">
            Acesso unificado aos serviços e informações da cidade.
          </h2>
          <p className="text-blue-100 text-lg max-w-md">
            Modernidade, transparência e facilidade para o cidadão.
          </p>
        </div>
        
        <div className="relative z-10 p-12 text-blue-200/60 text-sm">
          &copy; {new Date().getFullYear()} Governo Municipal. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[480px]">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center text-blue-700 dark:text-blue-500">
            <Landmark className="w-6 h-6" />
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Portal do Município</span>
          </div>

          {/* Theme Toggle */}
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
            <ThemeToggle />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-slate-200 dark:border-[#1F2937] p-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
