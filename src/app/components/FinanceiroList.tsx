import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, MoreVertical, Receipt, CreditCard, Download, ExternalLink, ShieldAlert, X, AlertCircle, FileText, CheckCircle2, Upload, Eye } from "lucide-react";

export function FinanceiroList({ currentRole }: { currentRole?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'pendentes-pagamento' | 'pendentes-multas' | 'aguardando-multa' | 'guias-emitidas'>('pendentes-pagamento');
  const [currentView, setCurrentView] = useState<"list" | "emitir-multa" | "confirmar-pagamento" | "upload-comprovativo">("list");
  
  // Estado que guarda a licença, guia ou multa selecionada
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Estados para o upload de comprovativo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [descricaoComprovativo, setDescricaoComprovativo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para armazenar os dados da API
  const [licencasPendPagamento, setLicencasPendPagamento] = useState<any[]>([]);
  const [licencasPendMulta, setLicencasPendMulta] = useState<any[]>([]);
  const [multasPendentes, setMultasPendentes] = useState<any[]>([]);
  const [guias, setGuias] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isTesoureiro = currentRole === "Tesoureiro" || currentRole === "TESOURARIA" || currentRole === "TESOUREIRA";
  const isAdmin = currentRole === "Administrador" || currentRole === "ADMIN";
  const isRequerente = !isTesoureiro && !isAdmin;

  const API_BASE_URL = "https://udder-grudging-cola.ngrok-free.dev/api";

  // ==========================================
  // CARREGAMENTO DE DADOS
  // ==========================================
  useEffect(() => {
    if (currentView === "list") {
      fetchGuias();
      if (isTesoureiro) {
        fetchPendentes();
      } else {
        setActiveSubTab('guias-emitidas');
      }
    }
  }, [currentView, isTesoureiro]);

  const fetchGuias = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const endpoint = (isTesoureiro || isAdmin) 
        ? `${API_BASE_URL}/guia/emitidas` 
        : `${API_BASE_URL}/guia/minhas`;

      const response = await fetch(endpoint, {
        headers: { "Authorization": `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      if (response.ok) {
        setGuias(await response.json());
      }
    } catch (err) {
      console.error("Erro ao buscar guias:", err);
    }
  };

  const fetchPendentes = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = { "Authorization": `Bearer ${token}`, "ngrok-skip-browser-warning": "true" };

      const [resLicPag, resLicMul, resMulPend] = await Promise.all([
        fetch(`${API_BASE_URL}/licencas/pendentes-pagamento`, { headers }),
        fetch(`${API_BASE_URL}/licencas/pendentes-multa`, { headers }),
        fetch(`${API_BASE_URL}/multas/pendentes`, { headers })
      ]);

      if (resLicPag.ok) setLicencasPendPagamento(await resLicPag.json());
      if (resLicMul.ok) setLicencasPendMulta(await resLicMul.json());
      if (resMulPend.ok) setMultasPendentes(await resMulPend.json());
    } catch (error) {
      console.error("Erro ao buscar pendentes", error);
    }
  };

  // ==========================================
  // AÇÕES: COMPROVATIVOS (UPLOAD E VISUALIZAR) /pagamentos/comprovativo/visualizar e pagamentos/comprovativo/download
  // ==========================================

  const handleUploadComprovativo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Por favor, selecione um ficheiro.");
      return;
    }

    setIsSubmitting(true);
    // Identificar o ID da licença ou guia (depende da estrutura da API, geralmente usa-se o licencaId)
    const targetId = selectedItem.licenca?.id || selectedItem.licencaId || selectedItem.id;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("descricao", descricaoComprovativo || "Comprovativo de pagamento");

    try {
      const response = await fetch(`${API_BASE_URL}/documentos/${targetId}/comprovativo-pagamento`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("authToken")}` },
        body: formData
      });

      if (!response.ok) throw new Error("Erro ao enviar o comprovativo.");

      alert("Comprovativo enviado com sucesso!");
      setCurrentView("list");
      setSelectedFile(null);
      setDescricaoComprovativo("");
      fetchGuias();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerComprovativo = async (targetId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documentos/${targetId}/pagamentos/comprovativo/visualizar`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!response.ok) throw new Error("Nenhum comprovativo anexado ou erro ao carregar.");

      // Trata a resposta: pode ser JSON com uma URL, ou diretamente o ficheiro PDF/Imagem (Blob)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.url) {
          window.open(data.url, '_blank');
        } else {
          alert("Comprovativo carregado: " + JSON.stringify(data)); // Fallback se a API devolver dados brutos
        }
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };


  // ==========================================
  // OUTRAS AÇÕES: GERAR GUIA, MULTA, CONFIRMAR PAGAMENTO
  // ==========================================
  const handleGerarGuia = async (id: number, tipo: 'licenca' | 'multa') => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = tipo === 'licenca' 
        ? `${API_BASE_URL}/guia/${id}/guia-pagamento?meses=12`
        : `${API_BASE_URL}/guia/multa/${id}/guia-pagamento`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Erro ao gerar guia para a ${tipo}.`);

      alert("Guia gerada com sucesso!");
      fetchPendentes();
      fetchGuias();
      setActiveSubTab('guias-emitidas');
    } catch (err: any) {
      alert(err.message || "Erro ao gerar guia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmitirMulta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const obraId = formData.get("obraId") as string;
    const valor = formData.get("valor");
    const descricao = formData.get("descricao");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/multas/obra/${obraId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ valor: Number(valor), descricao })
      });

      if (!response.ok) throw new Error("Erro ao aplicar multa.");

      alert("Multa aplicada com sucesso!");
      setSelectedItem(null);
      setCurrentView("list");
      fetchPendentes();
    } catch (err: any) {
      alert(err.message || "Erro ao gerar multa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmarPagamento = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const isGuia = selectedItem.dataEmissao !== undefined;
      
      let url = "";
      let options: RequestInit = { headers: { "Authorization": `Bearer ${token}` } };

      if (isGuia) {
        url = `${API_BASE_URL}/guia/guia-pagamento/${selectedItem.id}/confirmar?descricao=Pagamento confirmado presencialmente`;
        options.method = "PUT";
      } else {
        url = `${API_BASE_URL}/multas/${selectedItem.id}/confirmar-pagamento`;
        options.method = "POST";
      }

      const response = await fetch(url, options);
      if (!response.ok) throw new Error("Falha ao confirmar pagamento.");

      alert("Pagamento confirmado com sucesso!");
      setCurrentView("list");
      fetchGuias();
      fetchPendentes();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = (id: number) => {
    const url = `${API_BASE_URL}/guia/guia-pagamento/${id}/download`; //ola
    window.open(url, '_blank'); 
  };

  // ==========================================
  // RENDERIZAÇÃO DA INTERFACE
  // ==========================================

  const renderUploadComprovativo = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Anexar Comprovativo de Pagamento</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Guia Ref: {selectedItem?.referencia || selectedItem?.id}</p>
        </div>
        <button onClick={() => { setCurrentView("list"); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      
      <form onSubmit={handleUploadComprovativo} className="space-y-6">
        <div 
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-blue-500 mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
            {selectedFile ? selectedFile.name : "Clique para selecionar o ficheiro PDF ou Imagem"}
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf,image/*"
            onChange={(e) => {
              if (e.target.files?.length) setSelectedFile(e.target.files[0]);
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição (Opcional)</label>
          <input 
            type="text" 
            value={descricaoComprovativo}
            onChange={(e) => setDescricaoComprovativo(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" 
            placeholder="Ex: Comprovativo M-Pesa" 
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => { setCurrentView("list"); setSelectedFile(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting || !selectedFile} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Enviar Comprovativo
          </button>
        </div>
      </form>
    </div>
  );

  const renderEmitirMulta = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">Aplicação de Multa</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registar o valor e a infração na obra</p>
        </div>
        <button onClick={() => { setCurrentView("list"); setSelectedItem(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleEmitirMulta} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ID da Obra</label>
            <input 
              name="obraId" 
              required 
              type="text" 
              defaultValue={selectedItem?.obraId || ''} 
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" 
              placeholder="Ex: 10" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor da Multa (MT)</label>
            <input name="valor" required type="number" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="0.00" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Motivo / Descrição</label>
            <textarea name="descricao" required rows={3} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Descreva a infração..."></textarea>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => { setCurrentView("list"); setSelectedItem(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors">Confirmar Multa</button>
        </div>
      </form>
    </div>
  );

  const renderConfirmarPagamento = () => {
    const targetId = selectedItem?.licenca?.id || selectedItem?.licencaId || selectedItem?.id;
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm mx-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Pagamento</h2>
          <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6 space-y-2 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Ref / ID: <strong className="text-slate-900 dark:text-white">{selectedItem?.referencia || selectedItem?.id}</strong></p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Valor: <strong className="text-slate-900 dark:text-white">{selectedItem?.valor} MT</strong></p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Estado atual: <strong className="text-slate-900 dark:text-white">{selectedItem?.estado}</strong></p>
          
          {/* Botão extra para tesouraria ver o comprovativo antes de dar baixa */}
          <button 
            type="button" 
            onClick={() => handleVerComprovativo(targetId)}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50"
          >
            <Eye className="w-4 h-4" /> Verificar Comprovativo Anexado
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 pt-6">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Voltar</button>
          <button type="button" disabled={isSubmitting} onClick={handleConfirmarPagamento} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Recebido
          </button>
        </div>
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar">
          {isTesoureiro && (
            <>
              <button 
                onClick={() => setActiveSubTab('pendentes-pagamento')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeSubTab === 'pendentes-pagamento' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Licenças (Aguardando Guia)
                <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">{licencasPendPagamento.length}</span>
              </button>
              <button 
                onClick={() => setActiveSubTab('pendentes-multas')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeSubTab === 'pendentes-multas' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Multas (Aguardando Guia)
                <span className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">{multasPendentes.length}</span>
              </button>
              <button 
                onClick={() => setActiveSubTab('aguardando-multa')}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeSubTab === 'aguardando-multa' ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Licenças (Aguardando Autuação)
                <span className="ml-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 py-0.5 px-2 rounded-full text-xs">{licencasPendMulta.length}</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveSubTab('guias-emitidas')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeSubTab === 'guias-emitidas' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {isRequerente ? "Minhas Guias e Pagamentos" : "Guias Emitidas / Histórico"}
          </button>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
            />
          </div>
        </div>

        {/* TABELAS DINÂMICAS */}
        <div className="overflow-x-auto">
          
          {/* TAB 1: LICENÇAS AGUARDANDO GUIA */}
          {activeSubTab === 'pendentes-pagamento' && (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Nº Licença</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {licencasPendPagamento.filter(l => l.numero?.includes(searchTerm) || l.id?.toString().includes(searchTerm)).length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhuma licença pendente de pagamento.</td></tr>
                )}
                {licencasPendPagamento.filter(l => l.numero?.includes(searchTerm) || l.id?.toString().includes(searchTerm)).map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{lic.numero || `ID: ${lic.id}`}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 capitalize">{lic.tipo?.toLowerCase()}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">{lic.estado}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleGerarGuia(lic.id, 'licenca')} disabled={isSubmitting} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs font-medium flex items-center gap-1 ml-auto disabled:opacity-50">
                        <Receipt className="w-3.5 h-3.5" /> Gerar Guia
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2: MULTAS AGUARDANDO GUIA */}
          {activeSubTab === 'pendentes-multas' && (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">ID Multa</th>
                  <th className="px-6 py-3 font-medium">Obra Vinculada</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Descrição</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {multasPendentes.filter(m => m.id?.toString().includes(searchTerm)).length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma multa pendente de guia.</td></tr>
                )}
                {multasPendentes.filter(m => m.id?.toString().includes(searchTerm)).map((multa) => (
                  <tr key={multa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">#{multa.id}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Obra ID: {multa.obraId}</td>
                    <td className="px-6 py-4 font-medium text-rose-600 dark:text-rose-400">{multa.valor} MT</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={multa.descricao}>{multa.descricao || "Sem detalhes"}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleGerarGuia(multa.id, 'multa')} disabled={isSubmitting} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs font-medium flex items-center gap-1 ml-auto disabled:opacity-50">
                        <Receipt className="w-3.5 h-3.5" /> Gerar Guia
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: LICENÇAS AGUARDANDO APLICAÇÃO DE MULTA */}
          {activeSubTab === 'aguardando-multa' && (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Nº Licença</th>
                  <th className="px-6 py-3 font-medium">Obra Vinculada</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {licencasPendMulta.filter(l => l.numero?.includes(searchTerm)).length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhuma infração aguardando autuação.</td></tr>
                )}
                {licencasPendMulta.filter(l => l.numero?.includes(searchTerm)).map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{lic.numero || `ID: ${lic.id}`}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Obra ID: {lic.obraId}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">AGUARDA MULTA</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setSelectedItem(lic); setCurrentView('emitir-multa'); }} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors text-xs font-medium flex items-center gap-1 ml-auto">
                        <AlertCircle className="w-3.5 h-3.5" /> Autuar Obra
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 4: GUIAS EMITIDAS (HISTÓRICO) */}
          {activeSubTab === 'guias-emitidas' && (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Nº Guia</th>
                  <th className="px-6 py-3 font-medium">Licença/Obra</th>
                  <th className="px-6 py-3 font-medium">Referência</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {guias.filter(g => g.referencia?.includes(searchTerm) || g.id?.toString().includes(searchTerm)).length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhuma guia encontrada.</td></tr>
                )}
                {guias.filter(g => g.referencia?.includes(searchTerm) || g.id?.toString().includes(searchTerm)).map((item) => {
                  const targetId = item.licenca?.id || item.licencaId || item.id;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{item.id}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {item.licenca?.numero || item.licencaId || item.obraId || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">{item.referencia || "Sem Referência"}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{item.valor} MT</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${(item.estado === 'CONFIRMADA' || item.estado === 'PAGA') ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400' : ''}
                          ${item.estado === 'EMITIDA' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                          ${(item.estado === 'CANCELADA' || item.estado === 'PENDENTE') ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400' : ''}
                        `}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        
                        {/* BOTÃO DO REQUERENTE: UPLOAD DE COMPROVATIVO */}
                        {isRequerente && (item.estado === 'EMITIDA' || item.estado === 'PENDENTE') && (
                          <button onClick={() => { setSelectedItem(item); setCurrentView("upload-comprovativo"); }} className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-md transition-colors text-xs font-medium flex items-center gap-1" title="Anexar Comprovativo">
                            <Upload className="w-3.5 h-3.5" /> Anexar Pagamento
                          </button>
                        )}

                        <button onClick={() => handleDownloadPDF(item.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Baixar Guia PDF">
                          <Download className="w-4 h-4" />
                        </button>
              
                        {/* BOTÃO DA TESOURARIA: CONFIRMAR PAGAMENTO */}
                        {isTesoureiro && (item.estado === 'EMITIDA' || item.estado === 'PENDENTE') && (
                          <>
                            <button onClick={() => handleVerComprovativo(targetId)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Ver Comprovativo">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedItem(item); setCurrentView("confirmar-pagamento"); }} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-md transition-colors text-xs font-medium flex items-center gap-1" title="Confirmar Pagamento">
                              <CreditCard className="w-3.5 h-3.5" /> Receber
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão Financeira e Tesouraria</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isRequerente ? "Acompanhe e pague as suas guias e multas" : "Controlo de emissão de guias, pagamentos e multas pendentes"}
          </p>
        </div>
      </div>

      {currentView === "list" && renderList()}
      {currentView === "emitir-multa" && renderEmitirMulta()}
      {currentView === "confirmar-pagamento" && renderConfirmarPagamento()}
      {currentView === "upload-comprovativo" && renderUploadComprovativo()}
    </div>
  );
}