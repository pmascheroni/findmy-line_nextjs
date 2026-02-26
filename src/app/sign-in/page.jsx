"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

const GoogleIcon = (props) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.54 1.22 8.97 3.22l6.67-6.67C35.96 2.3 30.42 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.77 6.03C12.3 13.09 17.71 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.7c-.55 3-2.23 5.54-4.74 7.26l7.66 5.93C43.94 37.76 46.5 31.63 46.5 24.5z"
    />
    <path
      fill="#FBBC05"
      d="M10.33 28.25a14.9 14.9 0 0 1-.78-4.75c0-1.64.28-3.23.78-4.75l-7.77-6.03A23.95 23.95 0 0 0 0 23.5c0 3.88.93 7.55 2.56 10.78l7.77-6.03z"
    />
    <path
      fill="#34A853"
      d="M24 47c6.42 0 11.79-2.12 15.72-5.73l-7.66-5.93c-2.1 1.41-4.78 2.24-8.06 2.24-6.29 0-11.7-3.59-13.67-8.78l-7.77 6.03C6.51 42.62 14.62 47 24 47z"
    />
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const [redirect, setRedirect] = useState("/");
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRedirect(params.get("redirect") || "/");
  }, []);

  useEffect(() => {
    setError(null);
    setResetSent(false);
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);
    setLoading(true);
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setResetSent(true);
      } else if (mode === "sign-up") {
        await signUp({ email, password, fullName });
        router.push(redirect);
      } else {
        await signIn({ email, password });
        router.push(redirect);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push(redirect);
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          {mode === "sign-up" ? "Create an account" : mode === "reset" ? "Reset your password" : "Sign in"}
        </h1>
        <p className="text-slate-400 mt-2">
          {mode === "reset"
            ? "We will email you a reset link."
            : "Access your picks and manage subscriptions."}
          </p>
      </div>

      {mode !== "reset" && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full border-slate-200 bg-white text-slate-900 hover:bg-slate-100"
          >
            <GoogleIcon className="w-5 h-5" />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex-1 h-px bg-slate-800" />
            or
            <span className="flex-1 h-px bg-slate-800" />
          </div>
        </div>
      )}

      {mode !== "reset" ? (
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant={mode === "sign-in" ? "default" : "outline"}
            className={mode === "sign-in" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
            onClick={() => setMode("sign-in")}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={mode === "sign-up" ? "default" : "outline"}
            className={mode === "sign-up" ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-300"}
            onClick={() => setMode("sign-up")}
          >
            Sign Up
          </Button>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="border-slate-700 text-slate-300"
            onClick={() => setMode("sign-in")}
          >
            Back to Sign In
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {resetSent && (
          <p className="text-sm text-emerald-400">
            Reset link sent. Check your inbox.
          </p>
        )}

        {mode === "sign-up" && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-2">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-slate-800 border-slate-700 text-white"
            required
          />
        </div>

        {mode !== "reset" && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
            {mode === "sign-in" && (
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading
            ? "Please wait..."
            : mode === "sign-up"
            ? "Create Account"
            : mode === "reset"
            ? "Send reset link"
            : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
