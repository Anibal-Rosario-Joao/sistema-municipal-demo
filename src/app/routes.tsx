import React from "react";
import { createBrowserRouter } from "react-router";
import { AuthLayout } from "./components/AuthLayout";
import { LoginView } from "./components/LoginView";
import { RegisterView } from "./components/RegisterView";
import { ForgotPasswordView } from "./components/ForgotPasswordView";
import { OTPView } from "./components/OTPView";
import { ResetPasswordView } from "./components/ResetPasswordView";
import { HomeView } from "./components/HomeView";
import { RequerenteView } from "./components/RequerenteView";
import { AdminView } from "./components/AdminView";
import { TecnicoView } from "./components/TecnicoView";
import { TesourariaView } from "./components/TesourariaView";
import { FiscalView } from "./components/FiscalView";

export const router = createBrowserRouter([
  // 1. Rotas Públicas (Autenticação)
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginView /> },
      { path: "register", element: <RegisterView /> },
      { path: "forgot-password", element: <ForgotPasswordView /> },
      { path: "otp", element: <OTPView /> },
      { path: "reset-password", element: <ResetPasswordView /> },
    ],
  },
  
  // 2. Rotas Privadas (Pós-Login, separadas por perfil)
  {
    path: "/requerente",
    element: <RequerenteView />,
  },
  {
    path: "/fiscal",
    element: <FiscalView />,
  },
  {
    path: "/tesouraria",
    element: <TesourariaView />,
  },
  {
    path: "/tecnico",
    element: <TecnicoView />,
  },
  {
    path: "/admin",
    element: <AdminView />,
  },
  
  // 3. Rota de Fallback (Caso o cargo não seja reconhecido)
  {
    path: "/home",
    element: <HomeView />, // Pode criar uma tela genérica dizendo "Acesso Restrito" ou "Sem Perfil"
  },
]);
