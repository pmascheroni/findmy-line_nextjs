"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function OrderConfirmation() {
  return (
    <>
      <title>Order Confirmed – FindMyLine</title>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-slate-800/50 p-8 sm:p-12 max-w-lg w-full"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Thank you for your order!
          </h1>
          <p className="text-slate-400 text-base sm:text-lg mb-2">
            Your purchase is confirmed.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Your subscription is now active. You have full access to all premium features including real-time odds, line history, and player props.
          </p>

          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base">
              Start Finding Lines
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </>
  );
}
