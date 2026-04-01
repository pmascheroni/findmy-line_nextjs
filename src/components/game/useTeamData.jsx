import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

// Cache teams in memory to avoid repeated loading
let teamsCache = null;
let cachePromise = null;
const TEAM_COLLECTIONS = ["Team", "Teams", "teams"];

// Track enrichment requests in flight to avoid duplicate calls
const enrichmentInFlight = new Set();
// Track teams we already tried to enrich (even if they failed) to avoid retries
const enrichmentAttempted = new Set();

export function useTeamData() {
  const [teams, setTeams] = useState(teamsCache || []);
  const [loading, setLoading] = useState(!teamsCache);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
          if (mountedRef.current) {
            setTeams(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setTeams([]);
            setLoading(false);
          }
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
            if (mountedRef.current) {
              setTeams(data);
              setLoading(false);
            }
            return data;
          }
        } catch (error) {
          console.error(`[teams] failed to load ${name}:`, error);
        }
      }

      teamsCache = [];
      if (mountedRef.current) {
        setTeams([]);
        setLoading(false);
      }
      return [];
    })();
  }, []);

  const findTeamInList = useCallback((teamName, sportKey, teamList) => {
    if (!teamName || !teamList?.length) return null;

    // Filter by sport if provided
    const filteredTeams = sportKey
      ? teamList.filter((t) => t.sport_key === sportKey)
      : teamList;

    // Try exact match first
    let team = filteredTeams.find((t) => t.name === teamName);
    if (team) return team;

    // Try partial match (team name contains or is contained by)
    const normalizedName = teamName.toLowerCase();
    team = filteredTeams.find(
      (t) =>
        t.name?.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(t.name?.toLowerCase()) ||
        t.short_name?.toLowerCase() === normalizedName ||
        (t.short_name && normalizedName.includes(t.short_name.toLowerCase()))
    );

    return team || null;
  }, []);

  // Enrich a team by calling the API and writing to Firebase
  const enrichTeam = useCallback(
    async (teamName, sportKey) => {
      const enrichKey = `${sportKey}__${teamName}`;
      if (enrichmentInFlight.has(enrichKey) || enrichmentAttempted.has(enrichKey)) return null;

      enrichmentInFlight.add(enrichKey);
      enrichmentAttempted.add(enrichKey);

      try {
        const res = await fetch("/api/teams/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamName, sportKey }),
        });
        const data = await res.json();

        if (data?.found && data?.team) {
          const enrichedTeam = { ...data.team, name: teamName, sport_key: sportKey };

          // Add to local cache
          const updated = [...(teamsCache || [])];
          const existingIdx = updated.findIndex(
            (t) => t.name === teamName && t.sport_key === sportKey
          );
          if (existingIdx >= 0) {
            updated[existingIdx] = { ...updated[existingIdx], ...enrichedTeam };
          } else {
            updated.push(enrichedTeam);
          }
          teamsCache = updated;

          if (mountedRef.current) {
            setTeams(updated);
          }
          return enrichedTeam;
        }
      } catch (err) {
        console.error(`[teams] enrichment failed for ${teamName}:`, err);
      } finally {
        enrichmentInFlight.delete(enrichKey);
      }
      return null;
    },
    []
  );

  const getTeam = useCallback(
    (teamName, sportKey = null) => {
      const team = findTeamInList(teamName, sportKey, teams);

      // If team found with a logo, return it
      if (team?.logo_url || team?.logoUrl || team?.logo) return team;

      // If team not found or missing logo, trigger background enrichment
      if (teamName && sportKey) {
        // Fire and forget — enrichment updates the cache which triggers re-render
        enrichTeam(teamName, sportKey);
      }

      // Return whatever we have (may be null or team without logo)
      return team;
    },
    [teams, findTeamInList, enrichTeam]
  );

  return { teams, loading, getTeam, enrichTeam };
}
