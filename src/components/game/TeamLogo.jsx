import { useState } from "react";

const SPORT_ICONS = {
  americanfootball_nfl: "🏈",
  americanfootball_ncaaf: "🏈",
  basketball_nba: "🏀",
  basketball_ncaab: "🏀",
  baseball_mlb: "⚾",
  icehockey_nhl: "🏒",
};

export default function TeamLogo({ team, sportKey, size = "md", className = "" }) {
  const [imageError, setImageError] = useState(false);
  const logoUrl =
    team?.logo_url ||
    team?.logoUrl ||
    team?.logo ||
    team?.logoURL ||
    team?.logo_path ||
    null;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const fallbackIcon = SPORT_ICONS[sportKey] || "🏆";

  if (!logoUrl || imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-slate-800 rounded-xl flex items-center justify-center ${className}`}
        style={team?.primary_color ? { backgroundColor: `${team.primary_color}20` } : {}}
      >
        <span className={size === "sm" ? "text-lg" : size === "lg" || size === "xl" ? "text-3xl" : "text-2xl"}>
          {fallbackIcon}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center overflow-hidden bg-slate-800 ${className}`}
      style={team?.primary_color ? { backgroundColor: `${team.primary_color}15` } : {}}
    >
      <img
        src={logoUrl}
        alt={team.name}
        className="w-full h-full object-contain p-1"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
