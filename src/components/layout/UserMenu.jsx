import Link from "next/link";
import { createPageUrl } from "@/utils";
import { User, ChevronDown, Settings, LogOut, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useSubscription } from "../subscription/SubscriptionContext";
import { useAuth } from "@/lib/AuthContext";

export default function UserMenu() {
  const [mounted, setMounted] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { isPaid } = useSubscription();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
        aria-hidden="true"
      >
        <div className="w-8 h-8 rounded-full bg-slate-800/70" />
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  const handleLogout = () => {
    signOut();
  };

  if (loading) {
    return (
      <button
        type="button"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
        aria-busy="true"
      >
        <div className="w-8 h-8 rounded-full bg-slate-800/70 animate-pulse" />
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  const displayName = user.displayName || user.email || "User";
  const initials = displayName
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="hidden sm:inline max-w-[120px] truncate">
            {displayName}
          </span>
          {isPaid && <Crown className="w-4 h-4 text-yellow-500" />}
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white truncate">{displayName}</p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          {isPaid ? (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-yellow-500">
              <Crown className="w-3 h-3" /> Premium
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-slate-500">
              Free Plan
            </span>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem asChild>
          <Link
            href={createPageUrl("Account")}
            className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white focus:text-white focus:bg-slate-800"
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-slate-800"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
