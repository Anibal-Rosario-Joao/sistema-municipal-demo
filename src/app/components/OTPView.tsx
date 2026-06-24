import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./Button";
import { ArrowLeft } from "lucide-react";
import { OTPInput, type SlotProps } from "input-otp";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "relative w-12 h-14 text-xl flex items-center justify-center rounded-lg border bg-white dark:bg-slate-900 transition-all",
        props.isActive
          ? "border-blue-700 ring-2 ring-blue-700/50 z-10"
          : "border-slate-300 dark:border-slate-700",
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
      {props.hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-caret-blink">
          <div className="w-px h-6 bg-slate-900 dark:bg-slate-100" />
        </div>
      )}
    </div>
  );
}

export function OTPView() {
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (value.length !== 6) return;
    
    setError("");
    setIsLoading(true);
    
    const email = localStorage.getItem("recoveryEmail");
    
    if (!email) {
      setError("Sessão expirada. Por favor, volte e informe seu email novamente.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/auth/verify-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(value)}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Código inválido ou expirado.");
      }

      // Guardar o código para usar no passo de reset password
      localStorage.setItem("recoveryCode", value);
      
      navigate("/reset-password");
    } catch (err: any) {
      setError(err.message || "Erro ao verificar código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (val: string) => {
    setValue(val);
    handleSubmit();
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/forgot-password"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Verificação</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Digite o código de 6 dígitos enviado para seu email.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-center">
          <OTPInput
            maxLength={6}
            value={value}
            onChange={setValue}
            onComplete={handleComplete}
            render={({ slots }) => (
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  {slots.slice(0, 3).map((slot, idx) => (
                    <Slot key={idx} {...slot} />
                  ))}
                </div>
                
                <div className="w-4" /> {/* Visual spacing */}
                
                <div className="flex gap-2">
                  {slots.slice(3, 6).map((slot, idx) => (
                    <Slot key={idx + 3} {...slot} />
                  ))}
                </div>
              </div>
            )}
          />
        </div>

        <div className="text-center">
          {timeLeft > 0 ? (
            <span className="text-sm text-slate-500">
              Reenviar código ({timeLeft.toString().padStart(2, "0")}:00)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setTimeLeft(30)}
              className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-500 font-medium"
            >
              Reenviar código agora
            </button>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          isLoading={isLoading} 
          disabled={value.length !== 6}
        >
          Confirmar
        </Button>
      </form>
    </div>
  );
}
