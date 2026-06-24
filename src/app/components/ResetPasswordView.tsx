import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Input } from "./Input";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { clsx } from "clsx";

export function ResetPasswordView() {
  const [isLoading, setIsLoading] = useState(false);
  const [senha, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const rules = [
    { label: "Mínimo de 8 caracteres", test: (p: string) => p.length >= 8 },
    { label: "Pelo menos 1 número", test: (p: string) => /[0-9]/.test(p) },
    { label: "Pelo menos 1 símbolo", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const doPasswordsMatch = senha && confirmPassword && senha === confirmPassword;
  const isFormValid = rules.every(r => r.test(senha)) && doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError("");
    setIsLoading(true);

    const email = localStorage.getItem("recoveryEmail");
    const code = localStorage.getItem("recoveryCode");

    if (!email || !code) {
      setError("Sessão inválida. Reinicie o processo de recuperação.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/auth/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&newPassword=${encodeURIComponent(senha)}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Erro ao redefinir a senha. O link ou código pode ter expirado.");
      }

      setSuccess(true);
      // Limpar localStorage
      localStorage.removeItem("recoveryEmail");
      localStorage.removeItem("recoveryCode");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao redefinir a senha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/otp"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Criar nova senha</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Digite e confirme sua nova senha de acesso.
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          Senha alterada com sucesso! Redirecionando para o login...
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Nova senha"
            name="senha"
            type="password"
            placeholder="Sua nova senha"
            value={senha}
            onChange={(e) => setPassword(e.target.value)}
            disabled={success}
            required
          />

          <div className="space-y-2 py-2">
            {rules.map((rule, idx) => {
              const passed = rule.test(senha);
              return (
                <div key={idx} className="flex items-center gap-2">
                  {passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  )}
                  <span className={clsx("text-sm", passed ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-500")}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Input
            label="Confirmar nova senha"
            name="confirmPassword"
            type="password"
            placeholder="Repita sua nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={success}
            error={
              confirmPassword && !doPasswordsMatch
                ? "As senhas não coincidem"
                : undefined
            }
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          isLoading={isLoading} 
          disabled={!isFormValid || success}
        >
          Salvar nova senha
        </Button>
      </form>
    </div>
  );
}
