import { useState } from "react";
import { Check, Zap, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";

const PLANS = [
  {
    id: "rookie",
    name: "FindMy-Line Rookie",
    price: "$5",
    period: "week",
    icon: Zap,
    color: "from-green-500 to-emerald-600",
    borderColor: "border-green-500/30",
    bgColor: "from-green-500/10 to-emerald-500/10",
    description: "Perfect for weekend betting",
    features: [
      "See best odds across supported books",
      "Core sport filters",
      "Standard refresh rate",
      "Basic line comparisons"
    ]
  },
  {
    id: "amateur",
    name: "FindMy-Line Amateur",
    price: "$15",
    period: "month",
    icon: TrendingUp,
    color: "from-blue-500 to-purple-600",
    borderColor: "border-blue-500/30",
    bgColor: "from-blue-500/10 to-purple-500/10",
    popular: true,
    description: "Built for regular bettors",
    features: [
      "Everything in Rookie",
      "Faster odds updates",
      "Line movement charts",
      "Price alerts",
      "Advanced filtering"
    ]
  },
  {
    id: "pro",
    name: "FindMy-Line Pro",
    price: "$120",
    period: "year",
    icon: Crown,
    color: "from-yellow-500 to-orange-600",
    borderColor: "border-yellow-500/30",
    bgColor: "from-yellow-500/10 to-orange-500/10",
    description: "Best value for serious bettors",
    features: [
      "Everything in Amateur",
      "Fastest refresh rate",
      "Unlimited alerts",
      "Deep line history",
      "No-vig views",
      "Data exporting"
    ]
  }
];

export default function PricingPlans({ onSuccess }) {
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  const handleSelectPlan = async (plan) => {
    // Check if in iframe
    if (window.self !== window.top) {
      alert("Please open the app in a new tab to complete checkout.");
      return;
    }

    if (!user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/pricing?plan=${plan.id}`)}`);
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Unable to verify your session. Please sign in again.");
      }

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Checkout URL not returned.");
      }
    } catch (err) {
      setError(err.message || "Failed to start checkout.");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid gap-4">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-xl border transition-all ${plan.borderColor} bg-gradient-to-r ${plan.bgColor}`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-4 px-3 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              {plan.savings && (
                <span className="absolute -top-2.5 right-4 px-3 py-0.5 bg-yellow-500 text-black text-xs font-medium rounded-full">
                  {plan.savings}
                </span>
              )}
              {plan.trial && (
                <span className="absolute -top-2.5 left-4 px-3 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                  {plan.trial}
                </span>
              )}
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                        <span className="text-sm text-slate-400">/{plan.period}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-400 mb-3">{plan.description}</p>
                  
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={`bg-gradient-to-r ${plan.color} hover:opacity-90 text-white min-w-[100px]`}
                >
                  Select
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
