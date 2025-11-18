import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { supabase } from "../../../lib/supabaseClient";
// si en supabaseClient exportaste default, usá:
// import supabase from "../../../lib/supabaseClient";

const ResetPasswordForm = () => {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificamos que haya una sesión válida de recuperación
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        setError("There was an error validating the recovery link.");
      } else if (!data.session) {
        setError(
          "The recovery link is invalid or has expired. Please request a new password reset email."
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
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setError(error.message || "Could not update password.");
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  if (!ready) {
    return (
      <div className="text-sm text-muted-foreground">
        Validating recovery link…
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="space-y-4">
        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => navigate("/login")}
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 rounded-md border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          Password updated successfully. Redirecting to sign in…
        </div>
      )}

      {!success && (
        <>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              New password
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Confirm new password
            </label>
            <Input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="default"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? "Updating…" : "Update password"}
          </Button>
        </>
      )}
    </form>
  );
};

export default ResetPasswordForm;
