import React, { useState } from "react";
import { LayoutDashboard, Bell, Banknote, FolderOpen, ScrollText } from "lucide-react";
import { PortalLayout } from "./PortalLayout";
import { DashboardOverview } from "./DashboardOverview";
import { ObrasList } from "./ObrasList";
import { FinanceiroList } from "./FinanceiroList";
import { LicencasList } from "./LicencasList";
import { NotificacoesList } from "./NotificacoesList";
import { DocumentosList } from "./DocumentosList";
import { AuditoriaList } from "./AuditoriaList";


export function TesourariaView() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const navigation = [
    { id: "dashboard", name: "Início", icon: LayoutDashboard },
    { id: "notificacoes", name: "Notificações", icon: Bell },
    { id: "financeiro", name: "Financeiro", icon: Banknote },
    { id: "documentos", name: "Documentos", icon: FolderOpen },
    { id: "auditoria", name: "Auditoria", icon: ScrollText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview currentRole="Tesoureiro" />;
      case "financeiro": return <FinanceiroList currentRole="Tesoureiro" />;
      case "documentos": return <DocumentosList currentRole="Tesoureiro" />;
      case "auditoria": return <AuditoriaList currentRole="Tesoureiro" />;
      case "notificacoes": return <NotificacoesList currentRole="Tesoureiro" />;
      default: return null;
    }
  };

  return (
    <PortalLayout navigation={navigation} activeTab={activeTab} setActiveTab={setActiveTab} roleName="Tesoureiro" roleInitials="TS">
      {renderContent()}
    </PortalLayout>
  );
}