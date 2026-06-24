import React from "react";
import { AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "motion/react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AlertProps {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const variants = {
    success: {
      container: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900",
      icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />,
      title: "text-green-800 dark:text-green-300",
      body: "text-green-700 dark:text-green-400",
    },
    error: {
      container: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
      icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />,
      title: "text-red-800 dark:text-red-300",
      body: "text-red-700 dark:text-red-400",
    },
    warning: {
      container: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
      icon: <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />,
      title: "text-amber-800 dark:text-amber-300",
      body: "text-amber-700 dark:text-amber-400",
    },
    info: {
      container: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
      title: "text-blue-800 dark:text-blue-300",
      body: "text-blue-700 dark:text-blue-400",
    },
  };

  const style = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-4 rounded-lg border flex gap-3", style.container, className)}
      role="alert"
    >
      <div className="shrink-0">{style.icon}</div>
      <div className="flex-1">
        {title && <h5 className={cn("text-sm font-semibold mb-1", style.title)}>{title}</h5>}
        <div className={cn("text-sm", style.body)}>{children}</div>
      </div>
    </motion.div>
  );
}
