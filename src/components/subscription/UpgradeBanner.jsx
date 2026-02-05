import { Lock, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { useSubscription } from "./SubscriptionContext";
import { useRouter } from "next/navigation";

export default function UpgradeBanner({ compact = false }) {
  const router = useRouter();
  const { user } = useSubscription();
  
  const handleSignUp = () => {
    router.push("/sign-in");
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
        <Lock className="w-3 h-3" />
        <span>{user ? "Upgrade to see all odds" : "Sign up to see all odds"}</span>
      </div>
    );
  }

  // Not logged in - show sign up prompt
  if (!user) {
    return (
      <div className="p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <LogIn className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Create a Free Account</p>
              <p className="text-sm text-slate-400">Sign up to unlock all sportsbook odds</p>
            </div>
          </div>
          <Button 
            onClick={handleSignUp}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            Sign Up Free
          </Button>
        </div>
      </div>
    );
  }

  // Logged in but free - show upgrade prompt
  return (
    <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-white font-medium">Unlock All Sportsbook Odds</p>
            <p className="text-sm text-slate-400">Compare odds across all books to find the best value</p>
          </div>
        </div>
        <Link href={createPageUrl("Account")}>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            Upgrade Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
