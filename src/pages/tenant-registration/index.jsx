// C:\Projects\WhatsAppBot_Rocket\src\pages\tenant-registration\index.jsx

import React from "react";
import { Helmet } from "react-helmet";
import TenantRegistrationForm from "./components/TenantRegistrationForm";
import FeatureHighlights from "./components/FeatureHighlights";
import Icon from "../../components/AppIcon";

const TenantRegistrationPage = () => {
  return (
    <>
      <Helmet>
        <title>Create Workspace - MatchBot</title>
        <meta
          name="description"
          content="Create your MatchBot account to connect WhatsApp Business and manage conversations."
        />
      </Helmet>

      <div className="min-h-screen w-full flex bg-white">
        
        {/* Columna Izquierda: Formulario (Funcional) */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative z-10">
           <div className="max-w-md w-full mx-auto">
              
              {/* Logo Header */}
              <div className="flex items-center gap-3 mb-10">
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Icon name="MessageCircle" size={24} className="text-white" />
                 </div>
                 <span className="text-xl font-bold text-slate-800 tracking-tight">MatchBot</span>
              </div>

              <div className="mb-8">
                 <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    Create your workspace
                 </h1>
                 <p className="text-slate-500 text-lg">
                    Get started with WhatsApp automation in seconds. No credit card required.
                 </p>
              </div>

              <TenantRegistrationForm />

              <div className="mt-8 text-center pt-6 border-t border-slate-100">
                 <p className="text-sm text-slate-500">
                    Already have an account?{" "}
                    <a
                       href="/login"
                       className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                       Sign in
                    </a>
                 </p>
              </div>
           </div>
        </div>

        {/* Columna Derecha: Highlights (Visual / Marketing) */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
           {/* Fondo Abstracto */}
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-90 z-10" />
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
           <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

           <div className="relative z-20 w-full max-w-lg">
              <FeatureHighlights />
           </div>
        </div>

      </div>
    </>
  );
};

export default TenantRegistrationPage;