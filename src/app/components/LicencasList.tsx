import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, FileText, CheckCircle, AlertTriangle, ShieldCheck, X, QrCode, RefreshCw, XCircle, ThumbsUp, Download, ChevronDown, Eye, ShieldAlert } from "lucide-react";

export function LicencasList({ currentRole }: { currentRole?: string }) {
  const [currentView, setCurrentView] = useState<"list" | "request" | "approve" | "validate" | "renew" | "cancel" | "details" | "pdf" | "vistoria">("list");
  const [selectedLicenca, setSelectedLicenca] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [licencas, setLicencas] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const isAdmin = currentRole === "Administrador";
  const isRequerente = currentRole === "Requerente";
  const isTecnico = currentRole === "Técnico";
  const isFiscal = currentRole === "Fiscal";
  const isPúblico = currentRole === "Público";

  // Estado para Vistoria do Fiscal
  const [resultadoVistoria, setResultadoVistoria] = useState("REGULAR");

  // NOVOS ESTADOS: Formulário de aprovação (Técnico / Administrador)
  const [statusAprovacao, setStatusAprovacao] = useState("APROVADA");
  const [validadeAprovacao, setValidadeAprovacao] = useState("2026-12-31");

  const fetchObras = async () => {
    try {
      const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/obras", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (response.ok) {
        const data = await response.json();
        setObras(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar obras:", error);
    }
  };

  const fetchLicencas = async (options?: { search?: string; tipo?: string; aprovadas?: boolean; clear?: boolean; estado?: string }) => {
    setIsLoading(true);
    try {
      // Por padrão, lista todas as licenças disponíveis antes de aplicar qualquer filtro específico
      let url = "https://udder-grudging-cola.ngrok-free.dev/api/licencas";
      if (options?.clear) {
        setSearchTerm("");
        setTipoFilter("");
        setStatusFilter("");
      }

      const term = options?.clear ? "" : (options?.search !== undefined ? options.search : searchTerm).trim();
      const tipo = options?.clear ? "" : (options?.tipo !== undefined ? options.tipo : tipoFilter);
      const estadoTarget = options?.estado !== undefined ? options.estado : statusFilter;

      if (options?.aprovadas) {
        url = `${url}/aprovadas`;
      } else if (estadoTarget && estadoTarget === "PENDENTE_FISCALIZACAO") {
        url = `${url}/estado/PENDENTE_FISCALIZACAO`;
      } else if (estadoTarget && estadoTarget === "PENDENTE_APROVACAO") {
        // Nova rota integrada para o estado de Pendente Aprovação
        url = `${url}/pendentes-aprovacao`;
      } else if (tipo) {
        url = `${url}/tipo/${tipo}`;
      } else if (term) {
        url = `${url}?search=${encodeURIComponent(term)}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (!response.ok) throw new Error("Erro ao buscar licenças da API");

      const data = await response.json();
      setLicencas(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (error) {
      console.error("Erro na requisição:", error);
      setLicencas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicencas();
    if (isRequerente) fetchObras();
  }, [isRequerente]);

  const handleRequestLicenca = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const rawObraId = formData.get("obraId");
    const parsedObraId = rawObraId ? parseInt(rawObraId as string, 10) : null;

    const data = {
      descricao: formData.get("description"),
      tipo: formData.get("type"), 
      obra: { id: parsedObraId }
    };

    try {
      const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/licencas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao solicitar: ${errorText || response.statusText}`);
      }
      alert("Licença solicitada com sucesso!");
      setCurrentView("list");
      fetchLicencas();
    } catch (err: any) {
      alert(err.message || "Erro ao solicitar licença");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVistoriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicenca?.obraId) {
      alert("Erro crítico: Nenhuma obra associada a esta licença.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/fiscalizacoes/${selectedLicenca.obraId}?resultado=${resultadoVistoria}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (!response.ok) throw new Error("Erro ao registar a vistoria. O servidor recusou a operação.");
      
      alert("Vistoria registada com sucesso!");
      setCurrentView("list");
      setResultadoVistoria("REGULAR");
      fetchLicencas();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOVA FUNÇÃO: SUBMETER APROVAÇÃO (PUT) PARA TÉCNICO E ADMINISTRADOR
  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicenca?.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/licencas/${selectedLicenca.id}/aprovar?status=${statusAprovacao}&validade=${validadeAprovacao}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!response.ok) throw new Error("Erro ao processar a aprovação da licença.");

      alert(`Licença atualizada para ${statusAprovacao} com sucesso!`);
      setCurrentView("list");
      fetchLicencas();
    } catch (err: any) {
      alert(err.message || "Erro ao submeter parecer técnico.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id: number | string) => {
    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/licencas/${id}/pdf`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (!response.ok) throw new Error("Erro ao transferir PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Alvara_Licenca_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Não foi possível gerar/transferir o PDF do Alvará.");
    }
  };

  const renderVistoriaForm = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" /> Registar Vistoria (Fiscal)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Avaliação do terrain para a Licença {selectedLicenca?.numero || selectedLicenca?.id}</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleVistoriaSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Resultado da Fiscalização no Terreno</label>
          <select 
            value={resultadoVistoria}
            onChange={(e) => setResultadoVistoria(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all font-medium"
          >
            <option value="REGULAR">🟢 Condições Regulares (Avançar para Pagamento)</option>
            <option value="IRREGULAR">🟠 Condições Irregulares (Aplicar Multa)</option>
            <option value="EMBARGADA">🔴 Irregularidade Grave (Embargar Obra)</option>
          </select>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? "A registar..." : "Submeter Vistoria"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderRequestForm = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Solicitar Licença (Requerente)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados do requerimento</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleRequestLicenca} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Licença</label>
            <select name="type" required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all">
              <option value="CONSTRUCAO">Construção Nova</option>
              <option value="REABILITACAO">Reabilitação / Reforma</option>
              <option value="DEMOLICAO">Demolição</option>
              <option value="AMPLIACAO">Ampliação</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Obra Vinculada</label>
            <select name="obraId" required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all">
              <option value="">Selecione uma obra...</option>
              {obras.map(obra => (
                <option key={obra.id} value={obra.id}>{obra.id} - {obra.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Emissão Prevista</label>
            <input type="text" value="Automático após aprovação" disabled className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Validade</label>
            <input type="text" value="Calculado pela Entidade" disabled className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição / Justificativa</label>
            <textarea name="description" rows={3} required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Descreva o propósito da licença..."></textarea>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50">Enviar Solicitação</button>
        </div>
      </form>
    </div>
  );

  // FORMULÁRIO DE PARECER TÉCNICO E ADMINISTRADOR INTEGRADO COM PUT
  const renderApproveForm = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Avaliar Processo de Licença</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Decisão para o processo {selectedLicenca?.numero || selectedLicenca?.id}</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleApproveSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status da Decisão</label>
          <select 
            value={statusAprovacao}
            onChange={(e) => setStatusAprovacao(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"
          >
            <option value="APROVADA">APROVADA</option>
            <option value="REJEITADA">REJEITADA</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Definir Data de Validade</label>
          <input 
            type="date" 
            value={validadeAprovacao}
            onChange={(e) => setValidadeAprovacao(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" 
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50">
            {isSubmitting ? "A guardar..." : "Confirmar Parecer"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderDetails = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detalhes da Licença</h2>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Número da Licença</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedLicenca?.numero || `ID: ${selectedLicenca?.id}`}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tipo</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{selectedLicenca?.tipo?.toLowerCase()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Estado</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedLicenca?.estado}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Obra Vinculada</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedLicenca?.obraNome || `ID: ${selectedLicenca?.obraId}`}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Data de Emissão</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedLicenca?.dataEmissao || "Não emitida"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Data de Validade</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedLicenca?.dataValidade || "N/A"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Descrição</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 p-3 rounded mt-1">
              {selectedLicenca?.descricao || "Sem descrição."}
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
        <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Voltar</button>
      </div>
    </div>
  );

  const renderPdfView = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-3xl mx-auto flex flex-col items-center text-center">
      <div className="w-full flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white text-left">Licença Digital Assinada</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-left">Documento oficial gerado pelo Município da Beira</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      
      <div className="w-full aspect-[1/1.4] max-w-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md p-8 flex flex-col justify-between relative mb-6">
        <div className="text-center border-b-2 border-slate-800 dark:border-slate-400 pb-4 mb-4">
          <ShieldCheck className="w-12 h-12 text-slate-800 dark:text-slate-400 mx-auto mb-2" />
          <h1 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Alvará de Licença</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Município da Beira</p>
        </div>
        <div className="flex-1 text-left space-y-4 font-serif text-slate-800 dark:text-slate-300">
          <p><strong>Número:</strong> {selectedLicenca?.numero}</p>
          <p><strong>Tipo:</strong> {selectedLicenca?.tipo}</p>
          <p><strong>Obra Referência:</strong> {selectedLicenca?.obraNome}</p>
          <p><strong>Emitido em:</strong> {selectedLicenca?.dataEmissao}</p>
          <p><strong>Válido até:</strong> {selectedLicenca?.dataValidade}</p>
          <p className="mt-8 text-sm italic">{selectedLicenca?.descricao}</p>
          <p className="mt-8 text-xs font-sans">Concede-se o presente alvará para a execução dos trabalhos descritos, sujeito às normas e regulamentos do Conselho Municipal.</p>
        </div>
        <div className="mt-8 border-t border-slate-300 dark:border-slate-700 pt-4 flex justify-between items-end">
          <div className="text-left">
            <p className="text-xs text-slate-500">Assinado Digitalmente por:</p>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-300">{selectedLicenca?.tecnicoNome || "Departamento Técnico"}</p>
          </div>
          <QrCode className="w-16 h-16 text-slate-800 dark:text-slate-400" />
        </div>
      </div>

      <div className="w-full flex justify-end gap-3">
        <button onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors">Voltar</button>
        <button onClick={() => handleDownloadPdf(selectedLicenca.id)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> Baixar PDF Original
        </button>
      </div>
    </div>
  );

  const renderList = () => {
    const licencasFiltradas = licencas.filter(l => statusFilter ? l.estado === statusFilter : true);
    
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:flex-1 lg:max-w-2xl">
            <div className="relative w-full sm:w-40 shrink-0">
              <select
                value={tipoFilter}
                onChange={(e) => { setTipoFilter(e.target.value); fetchLicencas({ tipo: e.target.value }); }}
                className="w-full pl-3 pr-8 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">Todos os Tipos</option>
                <option value="CONSTRUCAO">Construção</option>
                <option value="DEMOLICAO">Demolição</option>
                <option value="REABILITACAO">Reabilitação</option>
                <option value="AMPLIACAO">Ampliação</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar nº, obra ou descrição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLicencas()}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
            <button 
              onClick={() => fetchLicencas({ aprovadas: true })}
              className="px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors shrink-0"
            >
              Ver Aprovadas
            </button>

            <div className="relative flex items-center shrink-0 w-full sm:w-auto">
              <Filter className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <select 
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 appearance-none border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  fetchLicencas({ estado: val });
                }}
              >
                <option value="">Filtrar Estado</option>
                {/* ADICIONADO: Nova opção de filtro para o estado Pendente Aprovação */}
                <option value="PENDENTE_APROVACAO">⏳ Pend. Aprovação</option>
                <option value="PENDENTE_PAGAMENTO">Pend. Pagamento</option>
                <option value="PENDENTE_ANALISE">Pend. Análise</option>
                <option value="PENDENTE_DOCUMENTOS">Pend. Documentos</option>
                <option value="PENDENTE_FISCALIZACAO">Pend. Fiscalização</option>
                <option value="APROVADA">Aprovada</option>
                <option value="REJEITADA">Rejeitada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="EXPIRADA">Expirada</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {(searchTerm || tipoFilter || statusFilter) && (
              <button 
                onClick={() => fetchLicencas({ clear: true })}
                className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors shrink-0"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Nº Licença</th>
                <th className="px-6 py-3 font-medium">Tipo / Obra</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Datas</th>
                <th className="px-6 py-3 font-medium text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">A carregar licenças da base de dados...</td>
                </tr>
              ) : licencasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma licença encontrada.</td>
                </tr>
              ) : (
                licencasFiltradas.map((licenca) => (
                  <tr key={licenca.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {licenca.numero || `ID: ${licenca.id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-slate-200 font-medium capitalize">
                        {licenca.tipo?.toLowerCase()}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[200px]" title={licenca.obraNome}>
                        {licenca.obraNome || `Obra ID: ${licenca.obraId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${licenca.estado === 'APROVADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : ''}
                        ${licenca.estado === 'PENDENTE_ANALISE' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' : ''}
                        ${licenca.estado === 'PENDENTE_APROVACAO' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30' : ''}
                        ${licenca.estado === 'PENDENTE_FISCALIZACAO' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30' : ''}
                        ${licenca.estado === 'PENDENTE_PAGAMENTO' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' : ''}
                        ${licenca.estado === 'PENDENTE_DOCUMENTOS' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30' : ''}
                        ${licenca.estado === 'EXPIRADA' || licenca.estado === 'REJEITADA' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' : ''}
                        ${licenca.estado === 'CANCELADA' ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' : ''}
                      `}>
                        {licenca.estado?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="text-xs">E: {licenca.dataEmissao || "--"}</div>
                      <div className="text-xs">V: {licenca.dataValidade || "--"}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedLicenca(licenca); setCurrentView("details"); }} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Detalhes">
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* MODIFICADO: Habilita o botão Avaliar para Técnico e Administrador nos estados PENDENTE_ANALISE e PENDENTE_APROVACAO */}
                        {(isTecnico || isAdmin) && (licenca.estado === 'PENDENTE_ANALISE' || licenca.estado === 'PENDENTE_APROVACAO') && (
                          <button onClick={() => { setSelectedLicenca(licenca); setCurrentView("approve"); }} className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded transition-colors text-xs font-medium flex items-center gap-1">
                            <ThumbsUp className="w-3.5 h-3.5" /> Avaliar
                          </button>
                        )}

                        {/* AÇÃO DO FISCAL: VISTORIAR */}
                        {isFiscal && licenca.estado === 'PENDENTE_FISCALIZACAO' && (
                          <button onClick={() => { setSelectedLicenca(licenca); setCurrentView("vistoria"); }} className="px-2 py-1 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 rounded transition-colors text-xs font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Vistoriar
                          </button>
                        )}
                        
                        {licenca.estado === 'APROVADA' && (
                          <button onClick={() => { setSelectedLicenca(licenca); setCurrentView("pdf"); }} className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded transition-colors text-xs font-medium flex items-center gap-1" title="Visualizar Certificado">
                            <ShieldCheck className="w-3.5 h-3.5" /> PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Licenças</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Solicitação e aprovação de alvarás do município</p>
        </div>
        {currentView === "list" && isRequerente && (
          <button 
            onClick={() => setCurrentView("request")}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Solicitar Licença
          </button>
        )}
      </div>

      {currentView === "list" && renderList()}
      {currentView === "request" && renderRequestForm()}
      {currentView === "details" && renderDetails()}
      {currentView === "pdf" && renderPdfView()}
      {currentView === "approve" && renderApproveForm()}
      {currentView === "vistoria" && renderVistoriaForm()}
    </div>
  );
}