import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Input } from "./Input";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { ArrowLeft } from "lucide-react";

export function ForgotPasswordView() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/auth/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível enviar o email de recuperação.");
      }

      setSuccess(true);
      
      // Auto redirect to OTP screen after showing success briefly
      // Guardar o email para usar na validação do OTP e Reset Password
      localStorage.setItem("recoveryEmail", email);
      
      setTimeout(() => {
        navigate("/otp");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Login
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Recuperar senha</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Enviaremos um código para seu email.
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          Código enviado! Redirecionando...
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="exemplo@dominio.gov"
          required
          disabled={success}
        />
        
        <Button type="submit" className="w-full" isLoading={isLoading} disabled={success}>
          Enviar código
        </Button>
      </form>
    </div>
  );
}
