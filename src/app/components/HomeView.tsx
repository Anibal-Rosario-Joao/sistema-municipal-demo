import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { 
  Landmark, LogOut, User, Bell, Search, Menu, Sun, Moon, 
  LayoutDashboard, HardHat, FileText, Banknote, ShieldAlert, 
  FolderOpen, ScrollText, Plus, Filter, MoreVertical, X,
  CheckCircle2, AlertCircle, Clock, Users
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { DashboardOverview } from "./DashboardOverview";
import { ObrasList } from "./ObrasList";
import { LicencasList } from "./LicencasList";
import { FinanceiroList } from "./FinanceiroList";
import { FiscalizacaoList } from "./FiscalizacaoList";
import { DocumentosList } from "./DocumentosList";
import { AuditoriaList } from "./AuditoriaList";
import { NotificacoesList } from "./NotificacoesList";
import { UsuariosList } from "./UsuariosList";

// Roteamento planejado para o futuro (React Router v7 Data Mode):
// const router = createBrowserRouter([
//   { path: "/", element: <LoginView /> },
//   { path: "/register", element: <RegisterView /> },
//   { path: "/forgot-password", element: <ForgotPasswordView /> },
//   { path: "/home", element: <HomeView />, children: [
//       { index: true, element: <DashboardOverview /> },
//       { path: "obras/*", element: <ObrasList /> },
//       { path: "licencas/*", element: <LicencasList /> },
//       { path: "financeiro/*", element: <FinanceiroList /> },
//       { path: "fiscalizacao/*", element: <FiscalizacaoList /> },
//       { path: "documentos/*", element: <DocumentosList /> },
//       { path: "auditoria/*", element: <AuditoriaList /> },
//       { path: "notificacoes", element: <NotificacoesList /> },
//   ]}
// ]);

export function HomeView() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentRole, setCurrentRole] = useState("Administrador");

  const roles = ["Administrador", "Requerente", "Técnico", "Fiscal", "Tesoureiro"];

  const allNavigation = [
    { id: "dashboard", name: "Início", icon: LayoutDashboard, roles: ["Administrador", "Requerente", "Técnico", "Fiscal", "Tesoureiro"] },
    { id: "notificacoes", name: "Notificações", icon: Bell, roles: ["Administrador", "Requerente", "Técnico", "Fiscal", "Tesoureiro"] },
    { id: "obras", name: "Obras", icon: HardHat, roles: ["Administrador", "Requerente", "Técnico", "Fiscal"] },
    { id: "licencas", name: "Licenças", icon: FileText, roles: ["Administrador", "Requerente", "Técnico"] },
    { id: "financeiro", name: "Financeiro", icon: Banknote, roles: ["Administrador", "Requerente", "Tesoureiro"] },
    { id: "fiscalizacao", name: "Fiscalização", icon: ShieldAlert, roles: ["Administrador", "Fiscal"] },
    { id: "documentos", name: "Documentos", icon: FolderOpen, roles: ["Administrador", "Requerente", "Técnico", "Fiscal", "Tesoureiro"] },
    { id: "auditoria", name: "Auditoria", icon: ScrollText, roles: ["Administrador", "Tesoureiro"] },
    { id: "usuarios", name: "Utilizadores", icon: Users, roles: ["Administrador"] },
  ];

  const navigation = allNavigation.filter(nav => nav.roles.includes(currentRole));

  useEffect(() => {
    const isValid = allNavigation.some(nav => nav.id === activeTab && nav.roles.includes(currentRole));
    if (!isValid) {
      setActiveTab("dashboard");
    }
  }, [currentRole, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview currentRole={currentRole} />;
      case "obras":
        return <ObrasList currentRole={currentRole} />;
      case "licencas":
        return <LicencasList currentRole={currentRole} />;
      case "financeiro":
        return <FinanceiroList currentRole={currentRole} />;
      case "fiscalizacao":
        return <FiscalizacaoList currentRole={currentRole} />;
      case "documentos":
        return <DocumentosList currentRole={currentRole} />;
      case "auditoria":
        return <AuditoriaList currentRole={currentRole} />;
      case "usuarios":
        return <UsuariosList />;
      case "notificacoes":
        return <NotificacoesList currentRole={currentRole} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-500 dark:text-slate-400">
            <HardHat className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Módulo em desenvolvimento</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-[#1F2937] shadow-sm">
        <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
                } else {
                  setSidebarOpen(!isSidebarOpen);
                }
              }}
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
              title="Alternar tema"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>

            <div className="flex items-center gap-3 p-1 pr-2 rounded-full transition-colors relative group">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {currentRole === 'Administrador' ? 'AD' : currentRole === 'Requerente' ? 'RQ' : currentRole === 'Técnico' ? 'TC' : currentRole === 'Fiscal' ? 'FS' : 'TS'}
              </div>
              <div className="hidden sm:block text-sm cursor-pointer">
                <p className="font-medium text-slate-900 dark:text-slate-100 leading-tight">João Silva</p>
                <select 
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="text-slate-500 dark:text-slate-400 text-xs bg-transparent border-none p-0 cursor-pointer outline-none focus:ring-0"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
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
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
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
              onClick={() => navigate("/")}
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
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
