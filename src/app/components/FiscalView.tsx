import React, { useState } from "react";
import { LayoutDashboard, Bell, HardHat, ShieldAlert, FolderOpen } from "lucide-react";
import { PortalLayout } from "./PortalLayout";
import { DashboardOverview } from "./DashboardOverview";
import { ObrasList } from "./ObrasList";
import { LicencasList } from "./LicencasList";
import { FinanceiroList } from "./FinanceiroList";
import { FiscalizacaoList } from "./FiscalizacaoList";
import { DocumentosList } from "./DocumentosList";
import { AuditoriaList } from "./AuditoriaList";
import { NotificacoesList } from "./NotificacoesList";
import { UsuariosList } from "./UsuariosList";

export function FiscalView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const navigation = [
    { id: "dashboard", name: "Início", icon: LayoutDashboard },
    { id: "notificacoes", name: "Notificações", icon: Bell },
    { id: "obras", name: "Obras", icon: HardHat },
    { id: "fiscalizacao", name: "Fiscalização", icon: ShieldAlert },
    { id: "documentos", name: "Documentos", icon: FolderOpen },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview currentRole="Fiscal" />;
      case "obras": return <ObrasList currentRole="Fiscal" />;
      case "fiscalizacao": return <FiscalizacaoList currentRole="Fiscal" />;
      case "documentos": return <DocumentosList currentRole="Fiscal" />;
      case "notificacoes": return <NotificacoesList currentRole="Fiscal" />;
      default: return null;
    }
  };

  return (
    <PortalLayout navigation={navigation} activeTab={activeTab} setActiveTab={setActiveTab} roleName="Fiscal" roleInitials="FS">
      {renderContent()}
    </PortalLayout>
  );
}