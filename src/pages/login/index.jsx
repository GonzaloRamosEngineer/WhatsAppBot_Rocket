// C:\Projects\WhatsAppBot_Rocket\src\pages\login\index.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Icon from "../../components/AppIcon";
import { useAuth } from "../../lib/AuthProvider";

const LoginPage = () => {
  const { login, session, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // Si ya hay sesión → mandamos directo al dashboard
  useEffect(() => {
    if (session) {
      navigate("/tenant-dashboard", { replace: true });
    }
  }, [session, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target || {};
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    const { ok, error } = await login(form.email, form.password);

    if (!ok) {
      console.error("[LoginPage] login error", error);
      setError(
        error?.message ||
          "Unable to sign in. Please check your credentials."
      );
      return;
    }
    // El redirect lo maneja el useEffect cuando cambia session
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      
      {/* Columna Izquierda: Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 bg-white relative z-10 shadow-xl lg:shadow-none">
        <div className="max-w-md w-full mx-auto">
           
           {/* Logo Header */}
           <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                 <Icon name="MessageCircle" size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">MatchBot</span>
           </div>

           <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome back</h1>
              <p className="text-slate-500 text-lg">
                 Sign in to manage your WhatsApp workspace and automation flows.
              </p>
           </div>

           {/* Error Alert */}
           {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                 <Icon name="AlertTriangle" size={20} className="text-red-500 mt-0.5 shrink-0" />
                 <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
           )}

           {/* Formulario */}
           <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                 label="Email Address"
                 type="email"
                 name="email"
                 placeholder="name@company.com"
                 value={form.email}
                 onChange={handleChange}
                 required
                 className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-12 text-base"
              />

              <div>
                 <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <Link
                       to="/auth/reset-password"
                       className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                       Forgot password?
                    </Link>
                 </div>
                 <Input
                    type="password"
                    name="password"
                    placeholder="••••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-12 text-base"
                 />
              </div>

              <Button
                 type="submit"
                 variant="default"
                 fullWidth
                 loading={loading}
                 disabled={loading}
                 className="h-12 text-base bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all mt-4"
              >
                 {loading ? "Signing in..." : "Sign in to Dashboard"}
                 {!loading && <Icon name="ArrowRight" size={18} className="ml-2" />}
              </Button>
           </form>

           {/* Footer Link */}
           <p className="mt-8 text-center text-sm text-slate-500">
              Don't have an account yet?{" "}
              <Link
                 to="/tenant-registration"
                 className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                 Create Workspace
              </Link>
           </p>
        </div>
        
        {/* Footer Legal & Security */}
        <div className="mt-12 pt-6 border-t border-slate-100">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <span>&copy; {new Date().getFullYear()} DigitalMatch.</span>
              <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <Icon name="Lock" size={12} className="text-emerald-500" /> SSL Secured
                 </span>
                 <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    <Icon name="Shield" size={12} className="text-blue-500" /> SOC2 Ready
                 </span>
              </div>
           </div>
        </div>
      </div>

      {/* Columna Derecha: Visual / Branding (Oculta en móvil) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
         
         {/* Fondo Abstracto Animado */}
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 opacity-90 z-10" />
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
         <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

         <div className="relative z-20 text-center px-12 max-w-lg">
            <div className="mb-8 inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
               <Icon name="Zap" size={48} className="text-indigo-300" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
               Automate your growth with <span className="text-indigo-400">MatchBot</span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
               Connect with customers on WhatsApp, build powerful flows, and scale your support without adding headcount.
            </p>
            
            {/* Social Proof (Falso para demo - Aprobado por Meta) */}
            <div className="mt-12 flex items-center justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               <span className="text-white font-bold text-lg tracking-widest flex items-center gap-2">
                  <Icon name="BadgeCheck" size={20} className="text-blue-400" /> META TECH PROVIDER
               </span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default LoginPage;