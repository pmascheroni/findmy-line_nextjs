"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const [redirect, setRedirect] = useState("/");
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRedirect(params.get("redirect") || "/");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "sign-up") {
        await signUp({ email, password, fullName });
      } else {
        await signIn({ email, password });
      }
      router.push(redirect);
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">{mode === "sign-up" ? "Create an account" : "Sign in"}</h1>
        <p className="text-slate-400 mt-2">Access your picks and manage subscriptions.</p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        {error && <p className="text-sm text-red-400">{error}</p>}

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
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading ? "Please wait..." : mode === "sign-up" ? "Create Account" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
