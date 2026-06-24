import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertTriangle, FileText, Loader2 } from "lucide-react";

export function NotificacoesList() {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotificacoes = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/notificacoes/minhas", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar as notificações.");
      }

      const data = await response.json();
      // Garantir que é um array e ordenar da mais recente para a mais antiga
      const lista = Array.isArray(data) ? data : [];
      lista.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
      
      setNotificacoes(lista);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao buscar as notificações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  // Analisa o texto para definir o tipo de notificação visualmente
  const getNotifConfig = (mensagem: string) => {
    if (!mensagem) return { type: "info", title: "Informação", icon: <FileText className="w-5 h-5" /> };
    
    const lowerMsg = mensagem.toLowerCase();
    if (lowerMsg.includes("aprovad") || lowerMsg.includes("sucesso") || lowerMsg.includes("confirmad")) {
      return { type: "sucesso", title: "Sucesso", icon: <CheckCircle2 className="w-5 h-5" /> };
    }
    if (lowerMsg.includes("rejeitad") || lowerMsg.includes("pendente") || lowerMsg.includes("vence") || lowerMsg.includes("multa")) {
      return { type: "alerta", title: "Atenção", icon: <AlertTriangle className="w-5 h-5" /> };
    }
    return { type: "info", title: "Atualização", icon: <FileText className="w-5 h-5" /> };
  };

  // Formata a data ISO 8601 (ex: "2026-06-12T20:30:00") para um formato legível
  const formatarData = (dataIso: string) => {
    if (!dataIso) return "";
    const data = new Date(dataIso);
    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" /> Minhas Notificações
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acompanhe as atualizações dos seus processos</p>
        </div>
        <button 
          onClick={fetchNotificacoes}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors"
        >
          Atualizar Lista
        </button>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 min-h-[200px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p className="text-sm font-medium">A carregar notificações...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 text-rose-500 text-center">
            <AlertTriangle className="w-8 h-8 mb-4 opacity-80" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchNotificacoes} className="mt-4 text-xs bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors">Tentar Novamente</button>
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
            <Bell className="w-8 h-8 mb-4 opacity-40" />
            <p className="text-sm font-medium">Sem novas notificações</p>
            <p className="text-xs mt-1">Você está em dia com os seus processos.</p>
          </div>
        ) : (
          notificacoes.map((notif) => {
            const config = getNotifConfig(notif.mensagem);
            
            return (
              <div key={notif.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-4">
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  ${config.type === 'sucesso' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                  ${config.type === 'alerta' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                  ${config.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                `}>
                  {config.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {config.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                      {formatarData(notif.dataCriacao)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {notif.mensagem}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}