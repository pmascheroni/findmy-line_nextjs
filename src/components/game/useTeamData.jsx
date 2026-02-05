import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

// Cache teams in memory to avoid repeated loading
let teamsCache = null;
let cachePromise = null;
const TEAM_COLLECTIONS = ["Team", "Teams", "teams"];

export function useTeamData() {
  const [teams, setTeams] = useState(teamsCache || []);
  const [loading, setLoading] = useState(!teamsCache);

  useEffect(() => {
    if (teamsCache) {
      setTeams(teamsCache);
      setLoading(false);
      return;
    }

    if (!db) {
      teamsCache = [];
      setTeams([]);
      setLoading(false);
      return;
    }

    if (cachePromise) {
      cachePromise
        .then((data) => {
          setTeams(data);
          setLoading(false);
        })
        .catch(() => {
          setTeams([]);
          setLoading(false);
        });
      return;
    }

    cachePromise = (async () => {
      for (const name of TEAM_COLLECTIONS) {
        try {
          const snapshot = await getDocs(collection(db, name));
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          if (data.length > 0) {
            console.log(`[teams] loaded ${data.length} from ${name}`);
            teamsCache = data;
            setTeams(data);
            setLoading(false);
            return data;
          }
        } catch (error) {
          console.error(`[teams] failed to load ${name}:`, error);
        }
      }

      teamsCache = [];
      setTeams([]);
      setLoading(false);
      return [];
    })();
  }, []);

  const getTeam = (teamName, sportKey = null) => {
    if (!teamName || !teams.length) return null;
    
    // Filter by sport if provided
    const filteredTeams = sportKey 
      ? teams.filter(t => t.sport_key === sportKey)
      : teams;
    
    // Try exact match first
    let team = filteredTeams.find(t => t.name === teamName);
    if (team) return team;
    
    // Try partial match (team name contains or is contained by)
    const normalizedName = teamName.toLowerCase();
    team = filteredTeams.find(t => 
      t.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(t.name.toLowerCase()) ||
      t.short_name?.toLowerCase() === normalizedName ||
      normalizedName.includes(t.short_name?.toLowerCase())
    );
    
    return team || null;
  };

  return { teams, loading, getTeam };
}
