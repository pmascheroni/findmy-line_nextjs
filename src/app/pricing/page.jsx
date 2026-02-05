"use client";

import PricingPlans from "@/components/subscription/PricingPlans";

export default function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Pricing</h1>
        <p className="text-slate-400 mt-1">Choose the plan that fits your betting style.</p>
      </div>
      <PricingPlans />
    </div>
  );
}
