import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Input } from "./Input";
import { Button } from "./Button";

export function RegisterView() {
  const [isLoading, setIsLoading] = useState(false);
  const [senha, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    if (senha.length === 0) return 0;
    let strength = 0;
    if (senha.length >= 8) strength++;
    if (/[A-Z]/.test(senha)) strength++;
    if (/[0-9]/.test(senha)) strength++;
    if (/[^A-Za-z0-9]/.test(senha)) strength++;
    return strength;
  };

  const strength = getPasswordStrength();
  const strengthLabels = ["Fraca", "Fraca", "Média", "Forte", "Muito Forte"];
  const strengthColors = [
    "bg-slate-200 dark:bg-slate-700",
    "bg-red-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-green-600",
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (senha !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      nif: formData.get("nif"),
      telefone: formData.get("telefone"),
      endereco: formData.get("endereco"),
      senha,
    };

    setIsLoading(true);
    try {
      const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/auth/register-requerente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar conta. Verifique os dados fornecidos.");
      }

      // Se registrou com sucesso, redirecionar para o login
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao tentar criar a conta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Endpoints da API:
  // Auto-registro Requerente: POST https://udder-grudging-cola.ngrok-free.dev/api/auth/register-requerente

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Criar conta</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Preencha os seus dados para efetuar o registo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg mb-4">
            {error}
          </div>
        )}

        <Input label="Nome completo" name="nome" placeholder="Ex: João da Silva" required />
        <Input label="Email" name="email" type="email" placeholder="exemplo@dominio.com" required />
        
        <Input label="NUIT / NIF" name="nif" placeholder="Ex: 1234567800" required />
        <Input label="Telefone" name="telefone" placeholder="Ex: 823456786" required />
        <Input label="Endereço Completo" name="endereco" placeholder="Ex: Av. Eduardo Mondlane, Beira" required />
        
        <div className="space-y-2">
          <Input
            label="Senha"
            name="senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={senha}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {senha.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 ${strength >= level ? strengthColors[strength] : "bg-slate-200 dark:bg-slate-700"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-medium min-w-[60px] text-right">{strengthLabels[strength]}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Input
            label="Confirmar Palavra-passe"
            name="confirmPassword"
            type="password"
            placeholder="Repita a sua palavra-passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <label className="flex items-start gap-3 mt-4 group cursor-pointer">
          <div className="flex items-center h-5">
            <input type="checkbox" required className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700 dark:border-slate-600 dark:bg-slate-800" />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Li e aceito os <a href="#" className="text-blue-700 dark:text-blue-500 hover:underline">termos de uso</a> e <a href="#" className="text-blue-700 dark:text-blue-500 hover:underline">política de privacidade</a>.
          </div>
        </label>

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Criar Conta
        </Button>
      </form>

      <div className="mt-8 text-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">Já tem conta? </span>
        <Link to="/" className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 font-medium">
          Entrar
        </Link>
      </div>
    </div>
  );
}