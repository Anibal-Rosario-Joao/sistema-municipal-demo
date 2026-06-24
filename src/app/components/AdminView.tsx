import React, { useState } from "react";
import { LayoutDashboard, Bell, HardHat, FileText, Banknote, ShieldAlert, FolderOpen, ScrollText, Users } from "lucide-react";
import { PortalLayout } from "./PortalLayout";
/*
import { DashboardOverview, 
    ObrasList, 
    LicencasList, 
    FinanceiroList, 
    FiscalizacaoList, 
    DocumentosList, 
    AuditoriaList, 
    NotificacoesList, 
    UsuariosList } from "./"; // Ajuste o path dos imports

    */

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

export function AdminView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const navigation = [
    { id: "dashboard", name: "Início", icon: LayoutDashboard },
    { id: "notificacoes", name: "Notificações", icon: Bell },
    { id: "obras", name: "Obras", icon: HardHat },
    { id: "licencas", name: "Licenças", icon: FileText },
    { id: "financeiro", name: "Financeiro", icon: Banknote },
    { id: "fiscalizacao", name: "Fiscalização", icon: ShieldAlert },
    { id: "documentos", name: "Documentos", icon: FolderOpen },
    { id: "auditoria", name: "Auditoria", icon: ScrollText },
    { id: "usuarios", name: "Utilizadores", icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview currentRole="Administrador" />;
      case "obras": return <ObrasList currentRole="Administrador" />;
      case "licencas": return <LicencasList currentRole="Administrador" />;
      case "financeiro": return <FinanceiroList currentRole="Administrador" />;
      case "fiscalizacao": return <FiscalizacaoList currentRole="Administrador" />;
      case "documentos": return <DocumentosList currentRole="Administrador" />;
      case "auditoria": return <AuditoriaList currentRole="Administrador" />;
      case "usuarios": return <UsuariosList />;
      case "notificacoes": return <NotificacoesList currentRole="Administrador" />;
      default: return null;
    }
  };

  return (
    <PortalLayout navigation={navigation} activeTab={activeTab} setActiveTab={setActiveTab} roleName="Administrador" roleInitials="AD">
      {renderContent()}
    </PortalLayout>
  );
}