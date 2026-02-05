import { Lock } from "lucide-react";

export default function BlurredOddsCell({ isBest = false }) {
  return (
    <div 
      className={`
        relative px-3 py-2 rounded-lg text-center
        ${isBest 
          ? "bg-green-500/20 border border-green-500/30" 
          : "bg-slate-800/50"
        }
      `}
    >
      {/* Blurred fake odds */}
      <div className="blur-sm select-none text-sm font-medium text-slate-400">
        -110
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="w-3 h-3 text-slate-500" />
      </div>
    </div>
  );
}