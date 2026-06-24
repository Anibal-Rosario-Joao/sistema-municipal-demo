import React, { useState } from "react";
import { Link, useNavigate } from "react-router"; // Import corrigido react-router-dom
import { Input } from "./Input";
import { Button } from "./Button";
import { Alert } from "./Alert";

export function LoginView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const senha = formData.get("senha"); // Certifique-se que o input tem name="senha"

    try {
    const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      throw new Error("Credenciais inválidas. Verifique seu email e senha.");
    }

    const data = await response.json();
    
    // DEPURAR: Útil para veres no Inspecionar Elemento (F12) o formato exato da resposta
    //console.log("Resposta da API de Login:", data);
    
    // 1. Guardar o token
    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }
    
    // 2. Extrair o perfil (role) de forma segura
    const perfil = data.user?.role || data.perfil || "";
    localStorage.setItem("userRole", perfil);

    // 3. Normalizar o texto para evitar erros de maiúsculas/minúsculas
    // O String() garante que não dá erro caso o perfil venha nulo ou indefinido
    const perfilNormalizado = String(perfil).toUpperCase();

    // 4. Redirecionamento Dinâmico rigoroso
    if (perfilNormalizado === "REQUERENTE") {
      navigate("/requerente");
    } else if (perfilNormalizado === "ROLE_FISCAL" || perfilNormalizado === "FISCAL") {
      navigate("/fiscal");
    } else if (perfilNormalizado === "TESOUREIRA") {
      navigate("/tesouraria");
    } else if (perfilNormalizado === "TECNICO" || perfilNormalizado === "TÉCNICO") {
      navigate("/tecnico");
    } else if (perfilNormalizado === "ADMIN" || perfilNormalizado === "ADMINISTRADOR") {
      navigate("/admin");
    } else {
      // Fallback seguro: Em vez de mandar para /home às cegas, exibe o erro na própria tela de login
      console.warn("Perfil não reconhecido pela aplicação:", perfil);
      setError("O seu perfil de utilizador não possui uma área designada no sistema."); 
    }

  } catch (err: any) {
    setError(err.message || "Ocorreu um erro ao tentar iniciar sessão.");
  } finally {
    setIsLoading(false);
  }
  };

  // ... (o resto do seu return com o HTML/JSX continua exatamente igual)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Entrar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Acesse os serviços do Município</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="exemplo@dominio.gov"
          required
        />
        
        <div className="space-y-1.5">
          <Input
            label="Senha"
            name="senha"
            type="password"
            placeholder="••••••••"
            required
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 font-medium"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Entrar
        </Button>
      </form>

      <div className="mt-8 relative flex items-center justify-center">
        <div className="absolute inset-x-0 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="relative bg-white dark:bg-[#0F172A] px-4 text-sm text-slate-500">
          ou
        </span>
      </div>

      <div className="mt-8 text-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">Não tem conta? </span>
        <Link
          to="/register"
          className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 font-medium"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
