"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebaseClient";

export default function AdminInvites() {
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const { user: authUser, loading: authLoading } = useAuth();

  useEffect(() => {
    setUser(authUser || null);
    setCheckingAuth(authLoading);
  }, [authUser, authLoading]);

  const createInvite = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/invites/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setError(data?.error || "Failed to create invite");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.invite_url) {
      navigator.clipboard.writeText(result.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
        <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Admin Access Required</h2>
        <p className="text-slate-400 mb-4">Please log in to access invite management.</p>
        <Button onClick={() => (window.location.href = "/sign-in?redirect=/admin/invites")}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin: Create Invites</h1>
          <p className="text-slate-400 text-sm">Generate invite links for beta users</p>
        </div>
      </div>

      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Note (optional)
          </label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Friend's name or purpose"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <Button 
          onClick={createInvite} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Invite Link
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Invite Created!</span>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Invite URL</label>
            <div className="flex gap-2">
              <Input
                value={result.invite_url}
                readOnly
                className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="border-slate-700 hover:bg-slate-800"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Expires:</span>
              <p className="text-white">{new Date(result.expires_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-slate-400">Remaining Slots:</span>
              <p className="text-white">{result.remaining_global_slots}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
