import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router"; // Se for v6, use "react-router-dom"
import { Landmark, LogOut, Bell, Search, Menu, Sun, Moon, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  navigation: NavItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  roleName: string;      // Fallback estático vindo da View
  roleInitials: string;  // Fallback estático vindo da View
  userName?: string;     // Opcional para manter compatibilidade com suas Views
}

export function PortalLayout({ 
  children, 
  navigation, 
  activeTab, 
  setActiveTab, 
  roleName, 
  roleInitials, 
  userName = "" 
}: PortalLayoutProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Estado inicializado usando os dados genéricos da View enquanto a API carrega
  const [userData, setUserData] = useState({
    nome: userName || "Carregando...",
    perfil: roleName,
    iniciais: roleInitials
  });

  // Função auxiliar para formatar a string de perfil do banco ("ADMIN", "TESOUREIRA") para exibição amigável
  const formatPerfil = (perfilBruto: string): string => {
    if (!perfilBruto) return roleName;
    const p = perfilBruto.toUpperCase();
    if (p === "ADMIN" || p === "ADMINISTRADOR") return "Administrador";
    if (p === "TECNICO" || p === "TÉCNICO") return "Técnico";
    if (p === "FISCAL") return "Fiscal";
    if (p === "TESOUREIRO" || p === "TESOUREIRA") return "Tesoureiro";
    if (p === "REQUERENTE") return "Requerente";
    return perfilBruto; 
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log("🔍 Passo 1 - Token lido do LocalStorage:", token ? "Token existe" : "Nenhum token encontrado");
        
        if (!token) {
          console.warn("⚠️ Sessão ausente. Redirecionando...");
          navigate("/");
          return;
        }

        console.log("⏳ Passo 2 - Enviando pedido para /api/auth/me...");
        const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true"
          }
        });

        console.log("📡 Passo 3 - Status da resposta do Servidor:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Passo 4 - Erro retornado pelo servidor:", errorText);
          throw new Error(`Servidor respondeu com status ${response.status}`);
        }

        // Ler o JSON primeiro para o console.log funcionar, depois desestruturar
        const data = await response.json();
        console.log("✅ Passo 5 - JSON recebido com sucesso:", data);
        
        // Extraímos APENAS o 'nome' e o 'perfil' usando desestruturação
        const { nome, perfil } = data;

        const nomeReal = nome || "Utilizador Conectado";
        const perfilFormatado = formatPerfil(perfil);

        // Gera as iniciais do avatar com base no "nome" real vindo da API
        const partesDoNome = nomeReal.trim().split(" ");
        let iniciaisGeradas = roleInitials;
        
        if (partesDoNome.length > 0 && partesDoNome[0] !== "") {
          const primeiraLetra = partesDoNome[0].charAt(0);
          const segundaLetra = partesDoNome.length > 1 ? partesDoNome[partesDoNome.length - 1].charAt(0) : "";
          iniciaisGeradas = (primeiraLetra + segundaLetra).toUpperCase();
        }

        // Atualiza o estado
        setUserData({
          nome: nomeReal,
          perfil: perfilFormatado,
          iniciais: iniciaisGeradas
        });

      } catch (error) {
        console.error("🛑 OCORREU UM ERRO FATAL NO FETCH:", error);
        // Em caso de erro, mantém o fallback estático da View
        setUserData({
          nome: userName || "Utilizador Online",
          perfil: roleName,
          iniciais: roleInitials
        });
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, roleName, roleInitials, userName]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1F2937] shadow-sm">
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.innerWidth >= 1024 ? setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed) : setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-500">
              <Landmark className="w-6 h-6" />
              <span className="font-bold text-lg text-slate-900 dark:text-slate-100 hidden sm:block">
                Portal do Município
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex relative text-slate-500">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar serviços..." 
                className="h-10 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-64 text-sm dark:text-slate-200 transition-all outline-none"
              />
            </div>

            <button 
              onClick={() => setActiveTab("notificacoes")}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#0F172A]"></span>
            </button>

            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>

            {/* SEÇÃO DO PERFIL MAPEADO DA API */}
            <div className="flex items-center gap-3 p-1 pr-2 rounded-full transition-colors relative group">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm select-none">
                {userData.iniciais}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-slate-900 dark:text-slate-100 leading-tight">
                  {userData.nome}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {userData.perfil}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className={`hidden lg:flex flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-[#1F2937] overflow-y-auto transition-all duration-300 ${isDesktopSidebarCollapsed ? "w-20" : "w-64"}`}>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isDesktopSidebarCollapsed ? item.name : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  } ${isDesktopSidebarCollapsed ? "justify-center" : "justify-start"}`}
                >
                  <Icon className={`shrink-0 w-5 h-5 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-slate-400"}`} />
                  {!isDesktopSidebarCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-200 dark:border-[#1F2937]">
            <button 
              onClick={handleLogout}
              title={isDesktopSidebarCollapsed ? "Sair" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ${isDesktopSidebarCollapsed ? "justify-center" : "justify-start"}`}
            >
              <LogOut className="shrink-0 w-5 h-5" />
              {!isDesktopSidebarCollapsed && <span>Sair do Sistema</span>}
            </button>
          </div>
        </aside>

        {/* Sidebar Mobile Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-[#0F172A] shadow-xl">
              <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-[#1F2937]">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-500">
                  <Landmark className="w-6 h-6" />
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Portal</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                        isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}