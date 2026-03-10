"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { Gift, Loader2, Check, AlertCircle, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebaseClient";

export default function Invite() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [status, setStatus] = useState("loading"); // loading, needsLogin, redeeming, success, error, alreadyRedeemed
  const [error, setError] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const tokenParam = params?.token;
    setToken(tokenParam);

    if (!tokenParam) {
      setStatus("error");
      setError("No invite token provided");
      return;
    }

    if (!authLoading) {
      checkAuthAndRedeem(tokenParam);
    }
  }, [params?.token, authLoading, authUser]);

  const checkAuthAndRedeem = async (tokenParam) => {
    try {
      if (!authUser) {
        setStatus("needsLogin");
        return;
      }

      // Authenticated user is available
      
      // Auto-redeem if authenticated
      await redeemToken(tokenParam);
    } catch (err) {
      console.error("Auth check error:", err);
      setStatus("needsLogin");
    }
  };

  const redeemToken = async (tokenParam) => {
    setStatus("redeeming");
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: tokenParam }),
      });
      const data = await response.json();

      if (response.ok && data.ok) {
        setExpiresAt(data.subscriptionExpiresAt || data.subscription_expires_at || null);
        if (data.already_redeemed) {
          setStatus("alreadyRedeemed");
        } else {
          setStatus("success");
        }
      } else {
        setStatus("error");
        setError(data.error || "Failed to redeem invite");
      }
    } catch (err) {
      console.error("Redeem error:", err);
      setStatus("error");
      setError(err.message || "Failed to redeem invite");
    }
  };

  const handleLogin = () => {
    // Redirect to login, then back to this page with token
    router.push(`/sign-in?redirect=${encodeURIComponent(`/invite/${token}`)}`);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        {/* Loading State */}
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Checking invite...</p>
          </motion.div>
        )}

        {/* Needs Login State */}
        {status === "needsLogin" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Invited!</h1>
            <p className="text-slate-400 mb-6">
              Sign in or create an account to claim your free Pro access
            </p>
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
            >
              Sign In to Claim
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Redeeming State */}
        {status === "redeeming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Activating your Pro access...</p>
          </motion.div>
        )}

        {/* Success State */}
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-green-500/30 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to Pro!</h1>
            <p className="text-slate-400 mb-4">
              Your invite has been redeemed successfully
            </p>
            {expiresAt && (
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-yellow-400 mb-1">
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">Pro Access</span>
                </div>
                <p className="text-sm text-slate-400">
                  Valid until {format(new Date(expiresAt), "MMMM d, yyyy")}
                </p>
              </div>
            )}
            <Link href={createPageUrl("Home")}>
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Already Redeemed State */}
        {status === "alreadyRedeemed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-blue-500/30 p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You Already Have Access!</h1>
            <p className="text-slate-400 mb-4">
              You&apos;ve already redeemed this invite
            </p>
            {expiresAt && (
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-yellow-400 mb-1">
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">Pro Access Active</span>
                </div>
                <p className="text-sm text-slate-400">
                  Valid until {format(new Date(expiresAt), "MMMM d, yyyy")}
                </p>
              </div>
            )}
            <Link href={createPageUrl("Home")}>
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                Continue to App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Error State */}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 rounded-2xl border border-red-500/30 p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
            <p className="text-red-400 mb-6">{error}</p>
            <Link href={createPageUrl("Home")}>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Go to Home
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
