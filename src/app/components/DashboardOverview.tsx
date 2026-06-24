import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { 
  HardHat, FileText, CheckCircle2, Clock, AlertTriangle, XCircle, TrendingUp, 
  Wallet, Receipt, ShieldCheck, Search, Activity, Building, Briefcase, Loader2 
} from "lucide-react";

const obrasData = [
  { name: 'Norte', obras: 12 },
  { name: 'Sul', obras: 19 },
  { name: 'Leste', obras: 8 },
  { name: 'Oeste', obras: 14 },
  { name: 'Centro', obras: 25 },
];

const licencasData = [
  { name: 'Aprovadas', value: 45, color: '#10B981' },
  { name: 'Pendentes', value: 20, color: '#F59E0B' },
  { name: 'Expiradas', value: 10, color: '#EF4444' },
  { name: 'Canceladas', value: 5, color: '#6B7280' },
];

const revenueData = [
  { month: 'Jan', value: 4000 },
  { month: 'Fev', value: 3000 },
  { month: 'Mar', value: 5000 },
  { month: 'Abr', value: 4500 },
  { month: 'Mai', value: 6000 },
  { month: 'Jun', value: 5500 },
];

const tecnicoData = [
  { name: 'Em Curso', value: 12, color: '#3B82F6' },
  { name: 'Concluídas', value: 34, color: '#10B981' },
  { name: 'Atribuídas', value: 8, color: '#F59E0B' },
];

export function DashboardOverview({ currentRole }: { currentRole?: string }) {

  // ESTADO DA API PARA O REQUERENTE
  const [requerenteData, setRequerenteData] = useState<any>(null);
  const [isLoadingReq, setIsLoadingReq] = useState(false);

  useEffect(() => {
    if (currentRole === 'Requerente') {
      const fetchRequerenteDashboard = async () => {
        setIsLoadingReq(true);
        try {
          const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/dashboard/requerente", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
              "ngrok-skip-browser-warning": "true"
            }
          });
          if (response.ok) {
            const data = await response.json();
            setRequerenteData(data);
          }
        } catch (error) {
          console.error("Erro ao buscar estatísticas do requerente:", error);
        } finally {
          setIsLoadingReq(false);
        }
      };
      fetchRequerenteDashboard();
    }
  }, [currentRole]);

  // Função utilitária para formatar data da API (ISO para legível)
  const formatarData = (dataIso: string) => {
    if (!dataIso) return "";
    const date = new Date(dataIso);
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit", month: "2-digit", year: "numeric", 
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  };

  // Função utilitária para definir cor/icone baseado na mensagem da notificação
  const getNotificationStyle = (mensagem: string) => {
    const msg = mensagem.toLowerCase();
    if (msg.includes("aprovada") || msg.includes("sucesso") || msg.includes("concluída")) {
      return { icon: CheckCircle2, color: "text-emerald-500" };
    }
    if (msg.includes("multa") || msg.includes("rejeitada") || msg.includes("expirada")) {
      return { icon: AlertTriangle, color: "text-rose-500" };
    }
    if (msg.includes("guia") || msg.includes("pagamento") || msg.includes("taxa")) {
      return { icon: Receipt, color: "text-blue-500" };
    }
    return { icon: FileText, color: "text-amber-500" }; // Para análises e documentos gerais
  };

  const renderAdmin = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visão Geral (Administrador)</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe os principais indicadores do município</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Obras em Curso", value: "78", icon: HardHat, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Licenças Ativas", value: "342", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Análises Pendentes", value: "24", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Multas Aplicadas", value: "12", icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Obras por Zona</h3>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer">Ver Relatório</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={obrasData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#334155', opacity: 0.1}} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="obras" fill="#1E4ED8" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Status de Licenças</h3>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer">Ver Todas</span>
          </div>
          <div className="h-72 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={licencasData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                  {licencasData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">80</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total no mês</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {licencasData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequerente = () => {
    // Definimos os valores padrão caso os dados ainda estejam sendo carregados (ou erro)
    const stats = requerenteData || {
      totalObras: 0,
      licencasAtivas: 0,
      processosEmAnalise: 0,
      taxasAPagar: 0,
      ultimasNotificacoes: []
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meu Painel (Requerente)</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe seus processos e requisições</p>
          </div>
          {isLoadingReq && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Minhas Obras", value: stats.totalObras, icon: Building, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Licenças Ativas", value: stats.licencasAtivas, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Processos em Análise", value: stats.processosEmAnalise, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Taxas a Pagar", value: stats.taxasAPagar, icon: Receipt, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all duration-300">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoadingReq ? "-" : stat.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Últimas Atualizações</h3>
          <div className="space-y-4">
            {isLoadingReq ? (
              <div className="py-8 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Carregando as atualizações recentes...
              </div>
            ) : (!stats.ultimasNotificacoes || stats.ultimasNotificacoes.length === 0) ? (
              <div className="py-8 text-center text-slate-500">
                Sem histórico de atualizações até o momento.
              </div>
            ) : (
              stats.ultimasNotificacoes.map((item: any, idx: number) => {
                const style = getNotificationStyle(item.mensagem);
                const Icon = style.icon;
                return (
                  <div key={item.id || idx} className="flex gap-4 items-start pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="mt-1"><Icon className={`w-5 h-5 ${style.color}`} /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.mensagem}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatarData(item.data)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTecnico = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Área Técnica (Técnico)</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resumo dos seus projetos em acompanhamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Obras Atribuídas", value: "12", icon: Briefcase, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Análises Pendentes", value: "5", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Pareceres Emitidos", value: "34", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Status das Minhas Obras</h3>
          </div>
          <div className="h-72 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tecnicoData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                  {tecnicoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">54</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Obras</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {tecnicoData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFiscal = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inspeções (Fiscal)</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Controle de vistorias e autuações no campo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Vistorias Agendadas", value: "8", icon: Activity, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Obras Irregulares", value: "3", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Multas Aplicadas", value: "15", icon: ShieldCheck, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTesoureiro = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tesouraria (Tesoureiro)</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Controle de receitas, taxas e guias de pagamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Receita Hoje", value: "45.000 MT", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Guias Pendentes", value: "23", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Guias Pagas", value: "142", icon: Wallet, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Evolução de Arrecadação</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  switch(currentRole) {
    case 'Requerente': return renderRequerente();
    case 'Técnico': return renderTecnico();
    case 'Fiscal': return renderFiscal();
    case 'Tesoureiro': return renderTesoureiro();
    default: return renderAdmin();
  }
}