// src/pages/password-reset/components/ResetPasswordForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ResetPasswordForm = () => {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Chequeamos que haya una sesión de recuperación válida
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        setError("Ocurrió un error al validar el enlace.");
      } else if (!data.session) {
        setError(
          "El enlace de recuperación es inválido o ya expiró. Volvé a solicitar el correo desde la opción 'Olvidé mi contraseña'."
        );
      }

      setReady(true);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !passwordConfirm) {
      setError("Completá ambos campos de contraseña.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setError(error.message || "No se pudo actualizar la contraseña.");
      return;
    }

    setSuccess(true);

    // después de unos segundos lo mandamos al login
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  if (!ready) {
    return (
      <div className="text-slate-300 text-sm">Verificando enlace…</div>
    );
  }

  if (error && !success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/login")}
        >
          Volver al inicio de sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Contraseña actualizada correctamente. Te estamos redirigiendo al
          login…
        </div>
      )}

      {!success && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nueva contraseña
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900/80 border-slate-700 text-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Repetí la contraseña
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="bg-slate-900/80 border-slate-700 text-slate-50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
        </>
      )}
    </form>
  );
};

export default ResetPasswordForm;
