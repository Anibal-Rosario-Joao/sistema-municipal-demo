import React, { useState, useEffect } from "react";
import { Camera, FileText, AlertTriangle, Search, Filter, MoreVertical, MapPin, X, Upload, ShieldAlert, CheckCircle2, ListChecks } from "lucide-react";

// Roteamento planejado para o futuro (React Router v7 Data Mode):
// <Route path="fiscalizacao" element={<FiscalizacaoLayout />}>
//   <Route index element={<FiscalizacaoList />} />
//   <Route path="upload-fotos" element={<UploadFotosFiscais />} />
//   <Route path="upload-relatorio" element={<UploadRelatorioFiscal />} />
//   <Route path="aplicar-multa" element={<AplicarMulta />} />
// </Route>

const fiscalizacoesMock = [
  { id: "FISC-2023-11", obra: "Residencial Bosque Dourado", date: "15/05/2023", inspector: "Carlos Mendes", status: "REGULAR", hasPhotos: true, hasReport: true },
  { id: "FISC-2023-10", obra: "Galeria Comercial Centro", date: "12/05/2023", inspector: "Ana Costa", status: "IRREGULARIDADE_ENCONTRADA", hasPhotos: true, hasReport: true },
  { id: "FISC-2023-09", obra: "Reforma Escola Municipal", date: "05/05/2023", inspector: "Carlos Mendes", status: "EM_AUTUACAO", hasPhotos: true, hasReport: false },
];

export function FiscalizacaoList({ currentRole }: { currentRole?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<'pendentes' | 'historico'>('pendentes');
  const [currentView, setCurrentView] = useState<"list" | "upload-fotos" | "upload-relatorio" | "aplicar-multa" | "realizar-vistoria">("list");
  
  const [selectedObra, setSelectedObra] = useState<any>(null);
  const [selectedLicenca, setSelectedLicenca] = useState<any>(null);
  
  const [licencasPendentes, setLicencasPendentes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // NOVOS ESTADOS PARA VISTORIA
  const [resultadoVistoria, setResultadoVistoria] = useState("REGULAR");
  const [observacoes, setObservacoes] = useState("");
  const [localizacao, setLocalizacao] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const isFiscal = currentRole === "Fiscal" || currentRole === "FISCAL";

  // ==========================================
  // CARREGAR LICENÇAS PENDENTES DE FISCALIZAÇÃO
  // ==========================================
  const fetchLicencasPendentes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/licencas/estado/PENDENTE_FISCALIZACAO", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLicencasPendentes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar licenças pendentes de fiscalização:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "list" && activeSubTab === "pendentes") {
      fetchLicencasPendentes();
    }
  }, [currentView, activeSubTab]);

  // ==========================================
  // CAPTURAR LOCALIZAÇÃO (GPS)
  // ==========================================
  const capturarLocalizacao = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocalizacao({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          alert("Não foi possível obter a localização. Verifique as permissões do navegador.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocalização não suportada no seu navegador.");
      setIsLocating(false);
    }
  };

  // ==========================================
  // SUBMETER VISTORIA
  // ==========================================
  const handleVistoriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicenca?.obraId) {
      alert("Erro crítico: Nenhuma obra associada a esta licença.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Usar URLSearchParams para montar a query de forma segura
      const params = new URLSearchParams();
      params.append("resultado", resultadoVistoria);
      
      if (observacoes.trim()) {
        params.append("observacoes", observacoes.trim());
      }
      
      if (localizacao) {
        params.append("latitude", localizacao.lat.toString());
        params.append("longitude", localizacao.lng.toString());
      }

      const url = `https://udder-grudging-cola.ngrok-free.dev/api/fiscalizacoes/${selectedLicenca.obraId}?${params.toString()}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      
      if (!response.ok) throw new Error("Erro ao registar a vistoria. O servidor recusou a operação.");
      
      alert("Vistoria registada com sucesso!");
      
      // Limpar formulário e voltar à lista
      setCurrentView("list");
      setResultadoVistoria("REGULAR");
      setObservacoes("");
      setLocalizacao(null);
      fetchLicencasPendentes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUploadFotos = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload de Fotos Fiscais (Fiscal)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Anexe imagens da vistoria no local</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <form className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecionar Obra</label>
          <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all">
            <option>OBR-2023-001 - Residencial Bosque Dourado</option>
            <option>OBR-2023-042 - Galeria Comercial Centro</option>
          </select>
        </div>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
          <Camera className="w-8 h-8 text-blue-500 mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Clique para selecionar fotos ou arraste</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, JPEG (Múltiplos arquivos permitidos)</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição / Notas da Vistoria</label>
          <textarea rows={3} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Descreva os detalhes observados..."></textarea>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" /> Enviar Fotos
          </button>
        </div>
      </form>
    </div>
  );

  const renderUploadRelatorio = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload de Relatório Fiscal (Fiscal)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Anexe o relatório formal da vistoria</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <form className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecionar Obra</label>
          <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all">
            <option>OBR-2023-001 - Residencial Bosque Dourado</option>
          </select>
        </div>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
          <FileText className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Selecione o arquivo do relatório</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF ou DOCX (Max. 5MB)</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Resumo / Conclusões Principais</label>
          <textarea rows={3} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Resumo do relatório..."></textarea>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" /> Enviar Relatório
          </button>
        </div>
      </form>
    </div>
  );

  const renderAplicarMulta = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">Aplicação de Multa (Fiscal)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registrar infração identificada</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <form className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecionar Obra Infratora</label>
          <select className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white transition-all">
            <option>OBR-2023-112 - Condomínio Vista Mar</option>
            <option>OBR-2023-087 - Reforma Escola Municipal</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor da Multa Sugerido (MT)</label>
          <input type="number" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Ex: 5000" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição da Infração</label>
          <textarea rows={4} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Descreva os motivos da multa..."></textarea>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Aplicar Multa
          </button>
        </div>
      </form>
    </div>
  );

  const renderRealizarVistoria = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-600" /> Registar Vistoria
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Avaliação da obra para a Licença {selectedLicenca?.numero || selectedLicenca?.id}</p>
        </div>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleVistoriaSubmit} className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6 space-y-2 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Obra: <strong className="text-slate-900 dark:text-white">{selectedLicenca?.obraNome}</strong></p>
          <p className="text-sm text-slate-600 dark:text-slate-400">ID Obra: <strong className="text-slate-900 dark:text-white">{selectedLicenca?.obraId}</strong></p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Licença: <strong className="text-slate-900 dark:text-white">{selectedLicenca?.numero || selectedLicenca?.id}</strong></p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Resultado da Fiscalização no Terreno</label>
          <select 
            value={resultadoVistoria}
            onChange={(e) => setResultadoVistoria(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all font-medium"
          >
            <option value="REGULAR"> Condições Regulares (Avançar para Pagamento)</option>
            <option value="IRREGULAR"> Condições Irregulares (Aplicar Multa)</option>
            <option value="EMBARGADA"> Irregularidade Grave (Embargar Obra)</option>
          </select>
        </div>

        {/* CAMPO DE OBSERVAÇÕES ADICIONADO */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações (Opcional)</label>
          <textarea 
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3} 
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all resize-none" 
            placeholder="Detalhes adicionais da vistoria..."
          />
        </div>

        {/* CONTROLE DE GEOLOCALIZAÇÃO ADICIONADO */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Localização (GPS)</label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={capturarLocalizacao}
              disabled={isLocating}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <MapPin className="w-4 h-4 text-blue-500" />
              {isLocating ? "A obter coordenadas..." : "Capturar Coordenadas Atuais"}
            </button>
            {localizacao && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800/30 inline-block">
                Lat: {localizacao.lat.toFixed(6)} | Lng: {localizacao.lng.toFixed(6)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => {
            setCurrentView("list");
            setObservacoes("");
            setLocalizacao(null);
            setResultadoVistoria("REGULAR");
          }} className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? "A registar..." : "Submeter Vistoria"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderList = () => {
    const filteredPendentes = licencasPendentes.filter(lic => 
      lic.numero?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lic.obraNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.id?.toString().includes(searchTerm)
    );

    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* ABAS DA FISCALIZAÇÃO */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button onClick={() => setActiveSubTab('pendentes')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeSubTab === 'pendentes' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
            Pendentes de Vistoria
          </button>
          <button onClick={() => setActiveSubTab('historico')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeSubTab === 'historico' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
            Histórico / Ações
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, Obra ou Número da Licença..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === 'pendentes' ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Nº Licença</th>
                  <th className="px-6 py-3 font-medium">Obra</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando licenças pendentes...</td></tr>
                ) : filteredPendentes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma licença pendente de fiscalização no momento.</td></tr>
                ) : (
                  filteredPendentes.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{lic.numero || `ID: ${lic.id}`}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[250px]">{lic.obraNome}</div>
                        <div className="text-xs text-slate-500">Obra ID: {lic.obraId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 capitalize">{lic.tipo?.toLowerCase()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400">
                          {lic.estado?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setSelectedLicenca(lic); setCurrentView("realizar-vistoria"); }} 
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-md transition-colors text-xs font-medium flex items-center gap-1 ml-auto"
                        >
                          <ShieldAlert className="w-4 h-4" /> Vistoriar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            // HISTÓRICO (DADOS MOCK PARA DEMONSTRAR COMPATIBILIDADE DA UI)
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium">ID Inspeção</th>
                  <th className="px-6 py-3 font-medium">Obra</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Fiscal</th>
                  <th className="px-6 py-3 font-medium">Anexos</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {fiscalizacoesMock.filter(item => item.obra.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{item.id}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200 font-medium">{item.obra}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.date}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.inspector}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {item.hasPhotos && <Camera className="w-4 h-4 text-blue-500" title="Contém Fotos" />}
                        {item.hasReport && <FileText className="w-4 h-4 text-emerald-500" title="Contém Relatório" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${item.status === 'REGULAR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : ''}
                        ${item.status === 'IRREGULARIDADE_ENCONTRADA' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' : ''}
                        ${item.status === 'EM_AUTUACAO' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' : ''}
                      `}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {isFiscal && (
                        <button onClick={() => setCurrentView("aplicar-multa")} className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 rounded transition-colors text-xs font-medium flex items-center gap-1" title="Aplicar Multa">
                          <AlertTriangle className="w-3.5 h-3.5" /> Autuar
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fiscalização</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhamento, relatórios e autuações</p>
        </div>
        {currentView === "list" && isFiscal && (
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentView("upload-fotos")}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Camera className="w-4 h-4" />
              Upload de Fotos
            </button>
            <button 
              onClick={() => setCurrentView("upload-relatorio")}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Novo Relatório
            </button>
          </div>
        )}
      </div>

      {currentView === "list" && renderList()}
      {currentView === "upload-fotos" && renderUploadFotos()}
      {currentView === "upload-relatorio" && renderUploadRelatorio()}
      {currentView === "aplicar-multa" && renderAplicarMulta()}
      {currentView === "realizar-vistoria" && renderRealizarVistoria()}
    </div>
  );
}