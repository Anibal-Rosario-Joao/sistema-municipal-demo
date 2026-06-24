import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, HardHat, MapPin, Calendar, Check, X, UserPlus, PlayCircle, CheckCircle, ChevronDown, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";

// Estrutura de dados com as zonas oficiais da Cidade da Beira
const zonasBeira = [
  {
    posto: "Posto Administrativo Central",
    bairros: ["Macuti", "Ponta-Gêa", "Matacuane", "Chaimite", "Chipangara", "Esturro", "Macurungo", "Pioneiros"]
  },
  {
    posto: "Posto Administrativo da Munhava",
    bairros: ["Munhava-Central", "Maraza", "Chota", "Mananga", "Vaz"]
  },
  {
    posto: "Posto Administrativo de Inhamízua",
    bairros: ["Inhamízua", "Chingussura", "Matadouro", "Nhaconjo", "Alto da Manga", "Vila Massane"]
  },
  {
    posto: "Posto Administrativo da Manga-Loforte",
    bairros: ["Manga Mascarenhas", "Mungassa", "Muave", "Ndunda"]
  },
  {
    posto: "Posto Administrativo de Nhangau",
    bairros: ["Nhangau", "Nhangoma", "Tchonja"]
  }
];

export function ObrasList({ currentRole }: { currentRole?: string }) {
  const [currentView, setCurrentView] = useState<"list" | "create" | "update" | "designate" | "prosseguir" | "conclude" | "details" | "delete">("list");
  const [selectedObra, setSelectedObra] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Estados para o seletor avançado de zonas/bairros no formulário
  const [selectedZone, setSelectedZone] = useState("");
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [zoneSearchTerm, setZoneSearchTerm] = useState("");

  // ESTADOS DO FILTRO: ESTRITAMENTE 1 CAMPO DE TEXTO, 1 TIPO E 1 ESTADO
  const [obras, setObras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchType, setSearchType] = useState<"nome" | "descricao" | "zona">("nome");
  const [statusFilter, setStatusFilter] = useState("");

  // NOVOS ESTADOS: DESIGNAÇÃO DE TÉCNICOS E FISCAIS (ADMIN)
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [fiscais, setFiscais] = useState<any[]>([]);
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string>("");
  const [selectedFiscalId, setSelectedFiscalId] = useState<string>("");
  const [isLoadingResponsiveis, setIsLoadingResponsiveis] = useState(false);
  const [isSubmittingDesignacao, setIsSubmittingDesignacao] = useState(false);
  const [designacaoError, setDesignacaoError] = useState("");

  const isAdmin = currentRole === "Administrador";
  const isRequerente = currentRole === "Requerente";
  const isTecnico = currentRole === "Técnico";

  // FUNÇÃO DE BUSCA UNIFICADA PARA A API DO BACKEND
  const fetchObras = async (options?: { clear?: boolean; estado?: string }) => {
    setIsLoading(true);
    try {
      let url = "https://udder-grudging-cola.ngrok-free.dev/api/obras";
      if (options?.clear) {
        setSearchTerm("");
        setStatusFilter("");
      }

      const term = options?.clear ? "" : searchTerm.trim();
      const targetEstado = options?.estado !== undefined ? options.estado : (options?.clear ? "" : statusFilter);
      
      // Constrói a URL dinamicamente dependendo do campo selecionado no Dropdown
      if (term) {
        const params = new URLSearchParams();
        params.append(searchType, term); // Vai gerar: ?nome=X ou ?descricao=X ou ?zona=X
        url = `${url}/buscar?${params.toString()}`;
      } else if (targetEstado) {
        // Se apenas o estado for selecionado
        url = `${url}/estado/${targetEstado}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true" 
        }
      });
      if (!response.ok) throw new Error("Erro ao buscar dados da API");

      const data = await response.json();
      setObras(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (error) {
      console.error("Erro na requisição:", error);
      setObras([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObras();
  }, []);

  // CARREGAR TÉCNICOS E FISCAIS DA API AO ABRIR O FORMULÁRIO DE ATRIBUIÇÃO
  useEffect(() => {
    if (currentView === "designate" && selectedObra) {
      setSelectedTecnicoId(selectedObra.tecnicoResponsavel?.id || selectedObra.tecnicoId || "");
      setSelectedFiscalId(selectedObra.fiscalResponsavel?.id || selectedObra.fiscalId || "");
      
      const fetchResponsiveis = async () => {
        setIsLoadingResponsiveis(true);
        setDesignacaoError("");
        try {
          const headers = {
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
            "ngrok-skip-browser-warning": "true"
          };

          const [resTecnicos, resFiscais] = await Promise.all([
            fetch("https://udder-grudging-cola.ngrok-free.dev/api/auth/usuarios/perfil/TECNICO", { headers }),
            fetch("https://udder-grudging-cola.ngrok-free.dev/api/auth/usuarios/perfil/FISCAL", { headers })
          ]);

          if (!resTecnicos.ok || !resFiscais.ok) {
            throw new Error("Não foi possível carregar a lista de técnicos ou fiscais disponíveis.");
          }

          const dataTecnicos = await resTecnicos.json();
          const dataFiscais = await resFiscais.json();

          setTecnicos(Array.isArray(dataTecnicos) ? dataTecnicos : []);
          setFiscais(Array.isArray(dataFiscais) ? dataFiscais : []);
        } catch (err: any) {
          setDesignacaoError(err.message || "Erro ao ligar ao servidor.");
        } finally {
          setIsLoadingResponsiveis(false);
        }
      };

      fetchResponsiveis();
    }
  }, [currentView, selectedObra]);

  const isObraAtribuida = (obra: any) => {
    return !!(obra?.fiscal || obra?.fiscalId || obra?.tecnico || obra?.tecnicoId);
  };

  const handleCreateObra = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const coordString = formData.get("coordinates") as string;
    
    let latitude = 0;
    let longitude = 0;
    if (coordString && coordString.includes(",")) {
      const parts = coordString.split(",");
      latitude = parseFloat(parts[0].trim()) || 0;
      longitude = parseFloat(parts[1].trim()) || 0;
    }

    const storedUserId = localStorage.getItem("userId");
    const requerenteId = storedUserId ? parseInt(storedUserId, 10) : 9;

    const zoneValue = formData.get("zone") as string;
    const cleanZone = zoneValue ? zoneValue.split(" (")[0].toLowerCase() : "";

    const data = {
      nome: formData.get("name"),
      descricao: formData.get("description"),
      endereco: formData.get("address"),
      latitude: latitude,
      longitude: longitude,
      requerenteId: requerenteId, 
      dataInicio: formData.get("startDate"),
      dataFim: formData.get("endDate") || null,
      zona: cleanZone
    };

    try {
      const response = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/obras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro do Servidor: ${errorText || response.statusText}`);
      }

      alert("Obra criada com sucesso!");
      setCurrentView("list");
      fetchObras();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar obra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateObra = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
      endereco: formData.get("endereco"),
      zona: formData.get("zona"),
      dataInicio: formData.get("dataInicio"),
      dataFim: formData.get("dataFim")
    };
    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/obras/${selectedObra.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar obra");
      
      alert("Obra atualizada com sucesso!");
      setCurrentView("list");
      fetchObras();
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar a obra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteObra = async () => {
    if (isObraAtribuida(selectedObra)) {
      alert("Operação negada: Esta obra já possui um Fiscal ou Técnico atribuído e não pode ser eliminada.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/obras/${selectedObra.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!response.ok) throw new Error("Erro ao eliminar obra");
      
      alert("Obra eliminada com sucesso!");
      setCurrentView("list");
      fetchObras();
    } catch (err: any) {
      alert(err.message || "Erro ao eliminar a obra");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUBMETER DESIGNAÇÕES PARA A API (PUT)
  const handleGravarDesignacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObra) return;

    setIsSubmittingDesignacao(true);
    setDesignacaoError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        "ngrok-skip-browser-warning": "true"
      };

      if (selectedTecnicoId) {
        const resTec = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/obras/${selectedObra.id}/atribuir-tecnico/${selectedTecnicoId}`, {
          method: "PUT",
          headers
        });
        if (!resTec.ok) throw new Error("Falha ao atribuir o técnico selecionado à obra.");
      }

      if (selectedFiscalId) {
        const resFis = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/obras/${selectedObra.id}/atribuir-fiscal/${selectedFiscalId}`, {
          method: "PUT",
          headers
        });
        if (!resFis.ok) throw new Error("Falha ao atribuir o fiscal selecionado à obra.");
      }

      alert("Equipa técnica designada com sucesso!");
      setCurrentView("list");
      fetchObras(); 
    } catch (err: any) {
      setDesignacaoError(err.message || "Ocorreu um erro ao gravar as designações.");
    } finally {
      setIsSubmittingDesignacao(false);
    }
  };

  const renderCreateForm = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Criar Nova Obra (Requerente)</h2>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleCreateObra} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Obra</label>
            <input name="name" required type="text" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Ex: Edifício Central" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição Detalhada</label>
            <textarea name="description" required rows={3} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Ex: Construção de prédio de 10 andares..."></textarea>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço Completo</label>
            <input name="address" required type="text" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Ex: Av. Eduardo Mondlane, Beira" />
          </div>
          
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Zona / Bairro (Cidade da Beira)</label>
            <input type="hidden" name="zone" value={selectedZone} required />
            
            <button
              type="button"
              onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all flex items-center justify-between text-left shadow-sm"
            >
              <span className="truncate">{selectedZone || "Selecione uma zona..."}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isZoneDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isZoneDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-72 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Filtrar por bairro ou posto..."
                    value={zoneSearchTerm}
                    onChange={(e) => setZoneSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-xs border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0"
                  />
                  {zoneSearchTerm && (
                    <button type="button" onClick={() => setZoneSearchTerm("")} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1">Limpar</button>
                  )}
                </div>

                <div className="overflow-y-auto flex-1 max-h-56 divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                  {zonasBeira.map((grupo) => {
                    const bairrosFiltrados = grupo.bairros.filter(bairro => 
                      bairro.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
                      grupo.posto.toLowerCase().includes(zoneSearchTerm.toLowerCase())
                    );
                    if (bairrosFiltrados.length === 0) return null;

                    return (
                      <div key={grupo.posto} className="p-2">
                        <div className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 px-2 py-1 sticky top-0 bg-white dark:bg-[#1E293B] z-10">
                          {grupo.posto}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                          {bairrosFiltrados.map((bairro) => {
                            const labelCompleto = `${bairro} (${grupo.posto.replace("Posto Administrativo ", "").replace("da ", "").replace("de ", "")})`;
                            const isSelected = selectedZone === labelCompleto;
                            return (
                              <button
                                key={bairro}
                                type="button"
                                onClick={() => {
                                  setSelectedZone(labelCompleto);
                                  setIsZoneDropdownOpen(false);
                                  setZoneSearchTerm("");
                                }}
                                className={`text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center justify-between gap-1 group ${
                                  isSelected ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                              >
                                <span className="truncate">{bairro}</span>
                                {isSelected && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Latitude / Longitude</label>
            <input name="coordinates" required type="text" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="Ex: -19.823, 34.838" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Início Prevista</label>
            <input name="startDate" required type="date" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Fim Prevista</label>
            <input name="endDate" required type="date" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50">Salvar Obra</button>
        </div>
      </form>
    </div>
  );

  const renderUpdateForm = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alterar Obra</h2>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleUpdateObra} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Obra</label>
            <input name="nome" defaultValue={selectedObra?.nome} required type="text" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Zona</label>
            <input name="zona" defaultValue={selectedObra?.zona} required type="text" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição Detalhada</label>
            <textarea name="descricao" defaultValue={selectedObra?.descricao} required rows={3} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"></textarea>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço Completo</label>
            <input name="endereco" defaultValue={selectedObra?.endereco} required type="text" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Início</label>
            <input name="dataInicio" defaultValue={selectedObra?.dataInicio} required type="date" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Fim</label>
            <input name="dataFim" defaultValue={selectedObra?.dataFim} required type="date" className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all" />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50">
            {isSubmitting ? "A Guardar..." : "Atualizar Obra"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderDesignateForm = () => {
    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-2xl mx-auto space-y-6">
        <div className="flex items-start gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Designar Responsáveis da Obra</h2>
              <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Selecione a equipa técnica oficial para acompanhar os trabalhos da obra:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedObra?.nome}</span>
            </p>
          </div>
        </div>

        {designacaoError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-sm flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{designacaoError}</span>
          </div>
        )}

        {isLoadingResponsiveis ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">A carregar técnicos e fiscais cadastrados...</p>
          </div>
        ) : (
          <form onSubmit={handleGravarDesignacao} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Menu de Seleção: Técnico */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Técnico Responsável (Análise de Processo)
                </label>
                <select
                  value={selectedTecnicoId}
                  onChange={(e) => setSelectedTecnicoId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                >
                  <option value="" className="dark:bg-slate-900">Selecione um técnico disponível...</option>
                  {tecnicos.map((tec) => (
                    <option key={tec.id} value={tec.id} className="dark:bg-slate-900">
                      {tec.nome} (ID: {tec.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Menu de Seleção: Fiscal */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Fiscal Responsável (Vistoria de Campo)
                </label>
                <select
                  value={selectedFiscalId}
                  onChange={(e) => setSelectedFiscalId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                >
                  <option value="" className="dark:bg-slate-900">Selecione um fiscal disponível...</option>
                  {fiscais.map((fis) => (
                    <option key={fis.id} value={fis.id} className="dark:bg-slate-900">
                      {fis.nome} (ID: {fis.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentView("list")}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                disabled={isSubmittingDesignacao}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isSubmittingDesignacao}
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmittingDesignacao ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    A gravar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmar Equipa
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  };

  const renderDetails = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detalhes da Obra</h2>
        <button onClick={() => setCurrentView("list")} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">Informações Gerais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nome</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedObra?.nome}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Estado</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedObra?.estado}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fiscal Atribuído</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {selectedObra?.fiscal?.nome || selectedObra?.fiscal || selectedObra?.fiscalResponsavel?.nome || "Nenhum fiscal atribuído"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Técnico Atribuído</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {selectedObra?.tecnico?.nome || selectedObra?.tecnico || selectedObra?.tecnicoResponsavel?.nome || "Nenhum técnico atribuído"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Zona</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{selectedObra?.zona}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Descrição</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedObra?.descricao}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Endereço</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedObra?.endereco}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Data Início</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedObra?.dataInicio || selectedObra?.dataInicioPrevista || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Data Fim</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedObra?.dataFim || selectedObra?.dataFimPrevista || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
        <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Voltar</button>
      </div>
    </div>
  );

  const renderDelete = () => {
    const assigned = isObraAtribuida(selectedObra);

    return (
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm mx-auto">
        <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-4">Eliminar Obra</h2>
        
        {assigned ? (
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-medium">
                Esta obra não pode ser removida porque já se encontra vinculada a um fiscal ou técnico do município.
              </p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Deverá desvincular os técnicos antes de efetuar a eliminação do registo da obra "{selectedObra?.nome}".
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Deseja remover a obra "{selectedObra?.nome}"? Esta ação não pode ser desfeita.</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            {assigned ? "Voltar à lista" : "Cancelar"}
          </button>
          {!assigned && (
            <button 
              type="button" 
              onClick={handleDeleteObra} 
              disabled={isSubmitting} 
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "A Remover..." : "Remover"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      {/* CABEÇALHO COM TUDO NUMA ÚNICA LINHA EM MODO DESKTOP (lg:flex-row) */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* LADO ESQUERDO: SELETOR E PESQUISA */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:flex-1 lg:max-w-2xl">
          
          <div className="relative w-full sm:w-36 lg:w-40 shrink-0">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="w-full pl-3 pr-8 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="nome">Por Nome</option>
              <option value="descricao">Por Descrição</option>
              <option value="zona">Por Zona</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Digite e pressione Enter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchObras()}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
            />
          </div>
        </div>

        {/* LADO DIREITO: ESTADO E ACÇÕES */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
          
          <div className="relative flex items-center shrink-0 w-full sm:w-auto">
            <Filter className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <select 
              className="w-full sm:w-auto pl-9 pr-8 py-2.5 appearance-none border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                fetchObras({ estado: val });
              }}
            >
              <option value="">Todos os Estados</option>
              <option value="PLANEADA">PLANEADA</option>
              <option value="EM CURSO">EM CURSO</option>
              <option value="SUSPENSA">SUSPENSA</option>
              <option value="CONCLUIDA">CONCLUIDA</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {(searchTerm || statusFilter) && (
            <button 
              onClick={() => fetchObras({ clear: true })}
              className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors shrink-0"
            >
              Limpar Filtros
            </button>
          )}

          {isRequerente && (
            <button onClick={() => setCurrentView("create")} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shrink-0">
              <Plus className="w-4 h-4" />
              Nova Obra
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nº da obra</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Zona</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">A carregar obras...</td>
              </tr>
            ) : obras.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Nenhuma obra encontrada.</td>
              </tr>
            ) : (
              obras.map((obra, index) => (
                <tr key={obra.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {obra.id}
                  </td>
                  
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {obra.nome}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md whitespace-normal mt-0.5 line-clamp-2">
                      {obra.descricao || "Sem descrição fornecida."}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 capitalize">
                    {obra.zona}
                  </td>
            
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${obra.estado === 'EM CURSO' || obra.estado === 'EM_CURSO' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' : ''}
                      ${obra.estado === 'PLANEADA' ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' : ''}
                      ${obra.estado === 'SUSPENSA' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' : ''}
                      ${obra.estado === 'CONCLUIDA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : ''}
                    `}>
                      {obra.estado || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center justify-end gap-3">
                    
                    <button 
                      onClick={() => { setSelectedObra(obra); setCurrentView("details"); }} 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === obra.id ? null : obra.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeDropdown === obra.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
                          
                          {/* BOTÃO PARA ADMINISTRADOR ATRIBUIR TÉCNICO E FISCAL */}
                          {isAdmin && obra.estado === "PLANEADA" && (
                            <button 
                              onClick={() => { setSelectedObra(obra); setCurrentView("designate"); setActiveDropdown(null); }} 
                              className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-t-lg flex items-center gap-2 border-b border-slate-100 dark:border-slate-800"
                            >
                              <UserPlus className="w-4 h-4" /> Atribuir Equipa
                            </button>
                          )}

                          <button 
                            onClick={() => { setSelectedObra(obra); setCurrentView("update"); setActiveDropdown(null); }} 
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" /> Alterar
                          </button>
                          
                          <button 
                            onClick={() => { setSelectedObra(obra); setCurrentView("delete"); setActiveDropdown(null); }} 
                            className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-b-lg flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
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

  return (
    <div className="w-full">
      {currentView === "list" && renderList()}
      {currentView === "create" && renderCreateForm()}
      {currentView === "update" && renderUpdateForm()}
      {currentView === "details" && renderDetails()}
      {currentView === "delete" && renderDelete()}
      {currentView === "designate" && renderDesignateForm()}
    </div>
  );
}