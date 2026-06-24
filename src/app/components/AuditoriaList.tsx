import React, { useState } from "react";
import { Search, Filter, Shield, Clock, User, Activity, ArrowDownUp, RefreshCw, FileText, Download, Eye, Trash2, X, AlertTriangle } from "lucide-react";

// Roteamento planejado para o futuro (React Router v7 Data Mode):
// <Route path="auditoria" element={<AuditoriaLayout />}>
//   <Route index element={<AuditoriaList />} />
//   <Route path=":id" element={<LogDetalhes />} />
//   <Route path=":id/remover" element={<RemoverLog />} />
// </Route>

const auditoriaMock = [
  { id: "LOG-9921", date: "16/05/2023 14:32:10", user: "João Silva", role: "Administrador", action: "APROVAÇÃO_LICENÇA", module: "Licenças", target: "LIC-2023-A01", ip: "192.168.1.45" },
  { id: "LOG-9920", date: "16/05/2023 10:15:00", user: "Carlos Mendes", role: "Fiscal", action: "UPLOAD_DOCUMENTO", module: "Documentos", target: "DOC-2023-101", ip: "10.0.0.12" },
  { id: "LOG-9919", date: "15/05/2023 16:45:22", user: "Ana Costa", role: "Tesouraria", action: "EMISSÃO_GUIA", module: "Financeiro", target: "GUI-2023-091", ip: "192.168.1.102" },
  { id: "LOG-9918", date: "15/05/2023 09:00:15", user: "João Silva", role: "Administrador", action: "LOGIN_SUCESSO", module: "Autenticação", target: "-", ip: "192.168.1.45" },
  { id: "LOG-9917", date: "14/05/2023 11:20:05", user: "Sistema", role: "Sistema", action: "EXPIRAÇÃO_AUTOMATICA", module: "Licenças", target: "LIC-2023-A04", ip: "localhost" },
];

export function AuditoriaList({ currentRole }: { currentRole?: string }) {
  const [currentView, setCurrentView] = useState<"list" | "view" | "remove">("list");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // VERIFICAÇÃO DE ACESSO: Se não for Administrador, exibe ecrã de bloqueio
  if (currentRole !== "Administrador") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Apenas utilizadores com o perfil de <strong>Administrador</strong> têm permissão para visualizar e gerir os registos de auditoria do sistema.
        </p>
      </div>
    );
  }

  const renderViewLog = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detalhes do Registro</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Log de Auditoria: {selectedLog?.id}</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data/Hora</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{selectedLog?.date}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">IP Origem</p>
          <p className="text-sm font-mono font-medium text-slate-900 dark:text-slate-200">{selectedLog?.ip}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Usuário</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{selectedLog?.user} ({selectedLog?.role})</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Módulo / Alvo</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{selectedLog?.module} / {selectedLog?.target}</p>
        </div>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Ação Executada</p>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30 mb-2">
          {selectedLog?.action.replace('_', ' ')}
        </span>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
          O usuário <strong>{selectedLog?.user}</strong> realizou a ação de <strong>{selectedLog?.action.replace('_', ' ').toLowerCase()}</strong> no recurso <strong>{selectedLog?.target}</strong> pertencente ao módulo <strong>{selectedLog?.module}</strong>.
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 pt-6">
        <button onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors">Voltar</button>
      </div>
    </div>
  );

  const renderRemoveLog = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm mx-auto text-center">
      <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Remoção de Log Requerida</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Tem certeza que deseja apagar permanentemente o log <strong>{selectedLog?.id}</strong>?</p>
      <div className="flex flex-col gap-2">
        <button onClick={() => setCurrentView("list")} className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm">
          <Trash2 className="w-4 h-4" /> Confirmar Remoção
        </button>
        <button onClick={() => setCurrentView("list")} className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ações Hoje</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">1,245</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Usuários Ativos</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">42</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Falhas de Login</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">7</h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por usuário, ação ou módulo..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Clock className="w-4 h-4" /> Período
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Filter className="w-4 h-4" /> Módulo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Data/Hora</th>
                <th className="px-6 py-3 font-medium">Usuário</th>
                <th className="px-6 py-3 font-medium">Ação</th>
                <th className="px-6 py-3 font-medium">Módulo</th>
                <th className="px-6 py-3 font-medium">Alvo / Registro</th>
                <th className="px-6 py-3 font-medium">IP</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {auditoriaMock.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {log.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-200">{log.user}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{log.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${log.action.includes('LOGIN') ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' : ''}
                      ${log.action.includes('APROVAÇÃO') ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : ''}
                      ${log.action.includes('UPLOAD') || log.action.includes('EMISSÃO') ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30' : ''}
                      ${log.action.includes('EXPIRAÇÃO') ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' : ''}
                    `}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{log.module}</td>
                  <td className="px-6 py-4">
                    {log.target !== '-' ? (
                      <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium font-mono text-xs">
                        {log.target}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{log.ip}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setSelectedLog(log); setCurrentView("view"); }} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" title="Ver Detalhes">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setSelectedLog(log); setCurrentView("remove"); }} className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors" title="Remover Log">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoria de Sistema</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rastreabilidade de ações, acessos e alterações de estado</p>
        </div>
        {currentView === "list" && (
          <button className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        )}
      </div>

      {currentView === "list" && renderList()}
      {currentView === "view" && renderViewLog()}
      {currentView === "remove" && renderRemoveLog()}
    </div>
  );
}