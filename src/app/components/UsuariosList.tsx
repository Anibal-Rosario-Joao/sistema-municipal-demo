import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2, Shield, Mail, ShieldAlert } from "lucide-react";

export function UsuariosList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null); // Guarda o usuário que está sendo editado
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [users, setUsers] = useState<any[]>([]);

  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    role: "Requerente",
    status: "Ativo",
  });

  const API_BASE_URL = "https://udder-grudging-cola.ngrok-free.dev/api/auth";

  // 1. CARREGAR UTILIZADORES DA API (GET)
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]); // O useEffect agora reage quando o filtro de perfil muda

  const fetchUsers = async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const token = localStorage.getItem("authToken");

      // Escolhe o endpoint baseado no filtro de Perfil ou Pesquisa
      let endpoint = `${API_BASE_URL}/usuarios/search`; // Usar /search como padrão listagem geral, conforme seu endpoint
      
      if (roleFilter !== "Todos") {
        const perfilParaApi = roleFilter.toUpperCase() === "TESOUREIRO" ? "TESOUREIRA" : roleFilter.toUpperCase();
        endpoint = `${API_BASE_URL}/usuarios/perfil/${perfilParaApi}`;
      } else if (searchTerm.trim() !== "") {
        // Se a API aceitar parâmetro de busca no search:
        endpoint = `${API_BASE_URL}/usuarios/search?query=${encodeURIComponent(searchTerm)}`; 
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
          "ngrok-skip-browser-warning": "true" 
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sessão expirada ou não autorizada. Por favor, faça login novamente.");
        }
        throw new Error(`Erro do servidor (${response.status}). Não foi possível listar os utilizadores.`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const formattedUsers = data.map((user: any) => ({
          id: user.id,
          name: user.nome || "Sem Nome",
          email: user.email || "Sem Email",
          role: user.perfil || "Desconhecido",
          status: user.ativo !== false ? "Ativo" : "Inativo",
          date: user.createdAt 
            ? new Date(user.createdAt).toLocaleDateString('pt-BR') 
            : "N/D"
        }));
        setUsers(formattedUsers);
      } else {
        setUsers([]);
        console.warn("A API não retornou um formato de lista válido:", data);
      }

    } catch (error: any) {
      console.error("Erro ao carregar utilizadores:", error);
      setApiError(error.message || "Erro desconhecido ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm === "") {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Função auxiliar para mapear o cargo visual para o cargo do Backend
  const mapRoleToApi = (role: string) => {
    const upper = role.toUpperCase();
    if (upper === "TESOUREIRO") return "TESOUREIRA";
    if(upper === "TÉCNICO") return "TECNICO" ;
    return upper;
  };

  // 2. CRIAR (POST) OU EDITAR (PUT) UTILIZADOR
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nome || !newUser.email) return;

    try {
      const token = localStorage.getItem("authToken");
      const isEditing = editingUser !== null;
      
      // Define URL e Método dependendo se estamos criando ou editando
      const url = isEditing 
        ? `${API_BASE_URL}/usuarios/${editingUser.id}` 
        : `${API_BASE_URL}/register`;
      
      const method = isEditing ? "PUT" : "POST";

      const bodyData: any = {
        nome: newUser.nome,
        email: newUser.email,
        perfil: mapRoleToApi(newUser.role),
        ativo: newUser.status === "Ativo"
      };

      // Só envia senha se for um novo registro
      if (!isEditing) {
        bodyData.senha = "SenhaForte123!";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Erro ao ${isEditing ? 'atualizar' : 'registrar'} usuário.`);
      }

      await fetchUsers();
      
      setIsModalOpen(false);
      setEditingUser(null);
      setNewUser({ nome: "", email: "", role: "Requerente", status: "Ativo" });
      alert(isEditing ? "Utilizador atualizado com sucesso!" : "Utilizador criado com sucesso!");
      
    } catch (err: any) {
      alert(`Erro na operação: ${err.message}`);
    }
  };

  // 3. APAGAR UTILIZADOR (DELETE)
  const handleDeleteUser = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover permanentemente este utilizador?")) return;

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_BASE_URL}/usuarios/${id}/delete`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });

      if (!response.ok) {
        throw new Error("Não foi possível excluir o utilizador no servidor.");
      }

      setUsers(users.filter(user => user.id !== id));
      alert("Utilizador removido com sucesso.");

    } catch (error: any) {
      alert("Erro: " + error.message);
    }
  };

  // 4. ABRIR MODAL DE EDIÇÃO
  const openEditModal = (user: any) => {
    setEditingUser(user);
    // Transforma "TESOUREIRA" do backend em "Tesoureiro" pro frontend
    const visualRole = user.role.toUpperCase() === "TESOUREIRA" ? "Tesoureiro" : 
                       user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
                       
    setNewUser({
      nome: user.name,
      email: user.email,
      role: visualRole,
      status: user.status
    });
    setIsModalOpen(true);
  };

  // 5. ABRIR MODAL DE CRIAÇÃO
  const openCreateModal = () => {
    setEditingUser(null);
    setNewUser({ nome: "", email: "", role: "Requerente", status: "Ativo" });
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getRoleColor = (role: string) => {
    const r = role.toUpperCase();
    switch(r) {
      case 'ADMINISTRADOR': case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'TECNICO': case 'TÉCNICO': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'FISCAL': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'TESOUREIRO': case 'TESOUREIRA': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Utilizadores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Crie e gira os acessos ao Portal do Município</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Utilizador
        </button>
      </div>

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erro na comunicação com o Servidor:</p>
            <p>{apiError}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar utilizador (Aperte Enter)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="Todos">Todos os Perfis</option>
              <option value="Admin">Administrador</option>
              <option value="Tecnico">Técnico</option>
              <option value="Fiscal">Fiscal</option>
              <option value="Tesoureiro">Tesoureiro</option>
              <option value="Requerente">Requerente</option>
            </select>
            <button 
              onClick={fetchUsers} 
              title="Sincronizar com Banco de Dados"
              className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Utilizador</th>
                <th className="px-6 py-4">Perfil de Acesso</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data de Registo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></span>
                      <span>Buscando dados no servidor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        <Shield className="w-3.5 h-3.5" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Ativo'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Ativo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {user.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
          
          {!isLoading && filteredUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
              <p>Nenhum utilizador encontrado para a listagem.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar / Editar Utilizador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingUser ? "Editar Utilizador" : "Novo Utilizador"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {editingUser ? "Modifique as informações do acesso." : "Crie um novo acesso para a plataforma."}
              </p>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.nome}
                  onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="Ex: João da Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Profissional</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="joao.silva@municipio.gov"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Perfil de Acesso</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Fiscal">Fiscal</option>
                  <option value="Tesoureiro">Tesoureiro</option>
                  <option value="Requerente">Requerente</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status da Conta</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingUser ? "Atualizar" : "Criar Utilizador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}