import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, Upload, Download, Eye, FileText, FolderOpen, Trash2, CheckCircle2, AlertCircle, X, ShieldCheck, XCircle } from "lucide-react";

export function DocumentosList({ currentRole }: { currentRole?: string }) {
  // 1. Adicionado o estado "rejeitar-doc" ao currentView
  const [currentView, setCurrentView] = useState<"list" | "upload-doc" | "remove" | "rejeitar-doc">("list");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // 2. Adicionado estado para armazenar a observação técnica
  const [observacao, setObservacao] = useState("");

  const [documentos, setDocumentos] = useState<any[]>([]);
  const [licencas, setLicencas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  
  const isRequerente = currentRole === "Requerente";
  const isAdmin = currentRole === "Administrador";
  const isTecnico = currentRole === "Técnico";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLicencas = async () => {
    try {
      const res = await fetch("https://udder-grudging-cola.ngrok-free.dev/api/licencas", {
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true" 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLicencas(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar licenças:", err);
    }
  };

  const fetchDocumentos = async (options?: { clear?: boolean }) => {
    setIsLoading(true);
    try {
      if (options?.clear) {
        setSearchTerm("");
        setTipoFilter("");
      }

      const params = new URLSearchParams();
      const termo = options?.clear ? "" : searchTerm.trim();
      const tipo = options?.clear ? "" : tipoFilter;

      if (termo) params.append("nome", termo);
      if (tipo) params.append("tipo", tipo);

      const url = `https://udder-grudging-cola.ngrok-free.dev/api/documentos/documentos/search?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (!response.ok) throw new Error("Falha ao buscar documentos");

      const data = await response.json();
      setDocumentos(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (error) {
      console.error("Erro na requisição:", error);
      setDocumentos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
    if (isRequerente) fetchLicencas();
  }, [isRequerente]);

  const handleUploadDocumento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!selectedFile) {
      alert("Por favor, selecione um ficheiro primeiro.");
      return;
    }

    setIsSubmitting(true);
    const licencaId = (form.elements.namedItem('licencaId') as HTMLSelectElement).value;
    const tipo = (form.elements.namedItem('tipo') as HTMLSelectElement).value;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("tipo", tipo);

    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/documentos/${licencaId}/documentos`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: formData,
      });
      if (!response.ok) {
        const errTxt = await response.text();
        throw new Error(`Erro ao enviar: ${errTxt}`);
      }

      alert("Documento enviado com sucesso!");
      setSelectedFile(null);
      setCurrentView("list");
      fetchDocumentos();
    } catch (err: any) {
      alert(err.message || "Erro no upload do ficheiro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocumento = async () => {
    if (!selectedDoc) return;
    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/documentos/${selectedDoc.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (!response.ok) throw new Error("Erro ao apagar o documento no servidor.");
      
      alert("Documento removido com sucesso!");
      setCurrentView("list");
      setSelectedDoc(null);
      fetchDocumentos();
    } catch (err: any) {
      alert(err.message || "Não foi possível remover o documento.");
    }
  };

  // 3. Modificada para aceitar a observação e enviar na Query String
  const handleAvaliarDocumento = async (id: number, acao: 'aprovar' | 'rejeitar', observacaoTexto: string = "") => {
    try {
      let url = `https://udder-grudging-cola.ngrok-free.dev/api/documentos/${id}/${acao}`;
      
      // Se for rejeitar, anexamos o parâmetro exigido pelo backend
      if (acao === 'rejeitar') {
        url += `?observacaoTecnica=${encodeURIComponent(observacaoTexto)}`;
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      
      if (!response.ok) throw new Error(`Não foi possível ${acao} o documento.`);
      
      alert(`Documento ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      
      // Reset de estados após rejeição/aprovação
      if (acao === 'rejeitar') {
        setCurrentView("list");
        setSelectedDoc(null);
        setObservacao("");
      }
      
      fetchDocumentos();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewPdf = async (id: string | number, nomeFicheiro: string) => {
    try {
      const response = await fetch(`https://udder-grudging-cola.ngrok-free.dev/api/documentos/documentos/${id}/visualizar`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (!response.ok) throw new Error("Documento não encontrado ou corrompido.");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert("Não foi possível carregar a visualização do documento.");
    }
  };

  const renderUploadForm = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Anexar Documento</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Envie plantas, identificação ou comprovativos</p>
        </div>
        <button 
          onClick={() => {
            setCurrentView("list");
            setSelectedFile(null);
          }} 
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleUploadDocumento} className="space-y-6">
        <div 
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-blue-500 mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Clique para selecionar o ficheiro</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Apenas PDF (Max. 10MB)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.length) {
                setSelectedFile(e.target.files[0]);
              } else {
                setSelectedFile(null);
              }
            }}
          />
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/30 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 truncate pr-4">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate">{selectedFile.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = window.URL.createObjectURL(selectedFile);
                  window.open(url, '_blank');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" /> Pré-visualizar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Licença Associada</label>
            <select name="licencaId" required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all">
              <option value="">Selecione uma licença...</option>
              {licencas.map(lic => (
                <option key={lic.id} value={lic.id}>
                  {lic.numero || `ID: ${lic.id}`} - {lic.tipo}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Documento</label>
            <select name="tipo" required className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all">
              <option value="">Selecione o tipo...</option>
              <option value="BI">Bilhete de Identidade (BI)</option>
              <option value="NUIT">NUIT</option>
              <option value="PLANTA_LOCALIZACAO">Planta de Localização</option>
              <option value="PROJETO_ARQUITETONICO">Projeto Arquitetónico</option>
              <option value="DIREITO_USO_TERRENO">Direito de Uso e Aproveitamento (DUAT)</option>
              <option value="COMPROVATIVO_PAGAMENTO">Comprovativo de Pagamento</option>
              <option value="RELATORIO_FINAL">Relatório Final</option>
              <option value="RELATORIO_FISCAL">Relatório Fiscal</option>
              <option value="FOTOS_FISCAIS">Fotos Fiscais</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => { setCurrentView("list"); setSelectedFile(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" disabled={isSubmitting || !selectedFile} className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50">
            {isSubmitting ? "A Enviar..." : "Fazer Upload"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderRemove = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm mx-auto">
      <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-4">Remover Documento</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Tem certeza que deseja apagar o documento <strong>{selectedDoc?.nome}</strong>? Esta ação não poderá ser desfeita e pode afetar o processo da licença.</p>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button type="button" onClick={() => setCurrentView("list")} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
        <button type="button" onClick={handleDeleteDocumento} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Remover
        </button>
      </div>
    </div>
  );

  // 4. Nova vista para recolher a observação técnica ao rejeitar
  const renderRejeitar = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-md mx-auto">
      <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-4">Rejeitar Documento</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Por favor, forneça a observação técnica indicando o motivo da rejeição do documento <strong>{selectedDoc?.nome}</strong>:
      </p>
      <textarea
        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white transition-all mb-6 min-h-[120px] resize-none"
        placeholder="Escreva a observação técnica aqui (obrigatório)..."
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
      />
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button 
          type="button" 
          onClick={() => { setCurrentView("list"); setObservacao(""); setSelectedDoc(null); }} 
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="button" 
          onClick={() => handleAvaliarDocumento(selectedDoc.id, 'rejeitar', observacao)} 
          disabled={!observacao.trim()} 
          className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" /> Confirmar Rejeição
        </button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 w-full max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar documento por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDocumentos()}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
            />
          </div>
          <select 
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value); setTimeout(() => fetchDocumentos({ clear: false }), 0); }}
            className="w-40 px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">Qualquer Tipo</option>
            <option value="BI">Identificação (BI)</option>
            <option value="NUIT">NUIT</option>
            <option value="PLANTA_LOCALIZACAO">Planta Local.</option>
            <option value="COMPROVATIVO">Comprovativo</option>
          </select>
          <button onClick={() => fetchDocumentos()} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
            Filtrar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-3 font-medium">Documento</th>
              <th className="px-6 py-3 font-medium">Vinculado a (Licença)</th>
              <th className="px-6 py-3 font-medium">Tipo</th>
              <th className="px-6 py-3 font-medium">Status Técnico</th>
              <th className="px-6 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
            {isLoading ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">A buscar documentos...</td></tr>
            ) : documentos.length === 0 ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum documento registado.</td></tr>
            ) : (
              documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-200">{doc.nome}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">{doc.tipo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 dark:text-slate-200 font-medium">
                      {doc.licenca?.numero || "Sem vínculo"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                     {doc.tipo?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border gap-1
                        ${doc.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : ''}
                        ${doc.status === 'PENDENTE' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' : ''}
                        ${doc.status === 'REJEITADO' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30' : ''}
                      `}>
                        {doc.status === 'APROVADO' && <CheckCircle2 className="w-3 h-3" />}
                        {doc.status === 'PENDENTE' && <AlertCircle className="w-3 h-3" />}
                        {doc.status === 'REJEITADO' && <XCircle className="w-3 h-3" />}
                        {doc.status || 'DESCONHECIDO'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    
                    {/* BOTÕES DE APROVAÇÃO (TÉCNICO) */}
                    {isTecnico && doc.status === 'PENDENTE' && (
                      <>
                        <button 
                          onClick={() => handleAvaliarDocumento(doc.id, 'aprovar')} 
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30" 
                          title="Aprovar Documento"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        
                        {/* 5. Em vez de chamar a API, abrir modal de rejeição */}
                        <button 
                          onClick={() => {
                            setSelectedDoc(doc);
                            setObservacao("");
                            setCurrentView("rejeitar-doc");
                          }} 
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30" 
                          title="Rejeitar Documento"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                      </>
                    )}

                    <button 
                      onClick={() => handleViewPdf(doc.id, doc.nome)} 
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" 
                      title="Visualizar / Descarregar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(isAdmin || isRequerente) && (
                      <button onClick={() => { setSelectedDoc(doc); setCurrentView("remove"); }} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Remover Documento">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Repositório de Documentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestão centralizada de arquivos, plantas e comprovantes das licenças</p>
        </div>
        {currentView === "list" && isRequerente && (
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentView("upload-doc")}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Anexar Documento
            </button>
          </div>
        )}
      </div>

      {/* Renderização condicional das views */}
      {currentView === "list" && renderList()}
      {currentView === "upload-doc" && renderUploadForm()}
      {currentView === "remove" && renderRemove()}
      {currentView === "rejeitar-doc" && renderRejeitar()}
    </div>
  );
}