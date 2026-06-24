import React, { useState } from "react";
import { LayoutDashboard, Bell, HardHat, FileText, Banknote, FolderOpen } from "lucide-react";
import { PortalLayout } from "./PortalLayout";
// Importar os seus componentes...
import { DashboardOverview } from "./DashboardOverview";
import { ObrasList } from "./ObrasList";
import { FinanceiroList } from "./FinanceiroList";
import { LicencasList } from "./LicencasList";
import { NotificacoesList } from "./NotificacoesList";
import { DocumentosList } from "./DocumentosList";

export function RequerenteView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const navigation = [
    { id: "dashboard", name: "Início", icon: LayoutDashboard },
    { id: "notificacoes", name: "Notificações", icon: Bell },
    { id: "obras", name: "Obras", icon: HardHat },
    { id: "licencas", name: "Licenças", icon: FileText },
    { id: "financeiro", name: "Financeiro", icon: Banknote },
    { id: "documentos", name: "Documentos", icon: FolderOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview currentRole="Requerente" />;
      case "obras": return <ObrasList currentRole="Requerente" />;
      case "licencas": return <LicencasList currentRole="Requerente" />;
      case "financeiro": return <FinanceiroList currentRole="Requerente" />;
      case "documentos": return <DocumentosList currentRole="Requerente" />;
      case "notificacoes": return <NotificacoesList currentRole="Requerente" />;
      default: return null;
    }
  };

  return (
    <PortalLayout navigation={navigation} activeTab={activeTab} setActiveTab={setActiveTab} roleName="Requerente" roleInitials="RQ">
      {renderContent()}
    </PortalLayout>
  );
}