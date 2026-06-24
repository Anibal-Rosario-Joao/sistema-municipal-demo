import React, { useState } from "react";
import { LayoutDashboard, Bell, HardHat, FileText, FolderOpen } from "lucide-react";
import { PortalLayout } from "./PortalLayout";
import { DashboardOverview } from "./DashboardOverview";
import { ObrasList } from "./ObrasList";
import { FinanceiroList } from "./FinanceiroList";
import { LicencasList } from "./LicencasList";
import { NotificacoesList } from "./NotificacoesList";
import { DocumentosList } from "./DocumentosList";

export function TecnicoView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const navigation = [
    { id: "dashboard", name: "Início", icon: LayoutDashboard },
    { id: "notificacoes", name: "Notificações", icon: Bell },
    { id: "obras", name: "Obras", icon: HardHat },
    { id: "licencas", name: "Licenças", icon: FileText },
    { id: "documentos", name: "Documentos", icon: FolderOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview currentRole="Técnico" />;
      case "obras": return <ObrasList currentRole="Técnico" />;
      case "licencas": return <LicencasList currentRole="Técnico" />;
      case "documentos": return <DocumentosList currentRole="Técnico" />;
      case "notificacoes": return <NotificacoesList currentRole="Técnico" />;
      default: return null;
    }
  };

  return (
    <PortalLayout navigation={navigation} activeTab={activeTab} setActiveTab={setActiveTab} roleName="Técnico" roleInitials="TC">
      {renderContent()}
    </PortalLayout>
  );
}