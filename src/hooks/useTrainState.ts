import { useState, useEffect, useMemo, useCallback } from "react";
import { ref, onValue, set, remove, Database } from "firebase/database";
import { getActiveDb, isFirebaseActive, resetSubmissions } from "../firebase";
import { TEAMS, DEADLINE_TIMESTAMP } from "../types";
import type { ScoreSubmission, TeamScore } from "../types";

export const useTrainState = () => {
  const [submissions, setSubmissions] = useState<ScoreSubmission[]>([]);
  const [targetScore, setTargetScore] = useState<number>(200); // Default target score for 100% track
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [dbInstance, setDbInstance] = useState<Database | null>(null);

  // Load target score initially from localStorage
  useEffect(() => {
    const savedTarget = localStorage.getItem("saebu_train_target_score");
    if (savedTarget) {
      setTargetScore(Number(savedTarget));
    }
  }, []);

  // Update connection status and db instance
  const checkFirebase = useCallback(() => {
    const active = isFirebaseActive();
    setIsFirebaseConnected(active);
    if (active) {
      setDbInstance(getActiveDb());
    } else {
      setDbInstance(null);
    }
  }, []);

  useEffect(() => {
    checkFirebase();
    // Periodically verify if Firebase credentials were added or removed
    const interval = setInterval(checkFirebase, 2000);
    return () => clearInterval(interval);
  }, [checkFirebase]);

  // Sync Submissions and Target Score
  useEffect(() => {
    if (isFirebaseConnected && dbInstance) {
      // 1. Listen for submissions
      const submissionsRef = ref(dbInstance, "submissions");
      const unsubscribeSubmissions = onValue(submissionsRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const list: ScoreSubmission[] = Object.keys(val).map((key) => ({
            ...val[key],
            id: key,
          }));
          // Sort by submittedAt ascending so order is chronological
          list.sort((a, b) => a.submittedAt - b.submittedAt);
          setSubmissions(list);
        } else {
          setSubmissions([]);
        }
      });

      // 2. Listen for target score settings
      const targetScoreRef = ref(dbInstance, "settings/targetScore");
      const unsubscribeTargetScore = onValue(targetScoreRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          setTargetScore(Number(val));
          localStorage.setItem("saebu_train_target_score", String(val));
        }
      });

      return () => {
        unsubscribeSubmissions();
        unsubscribeTargetScore();
      };
    } else {
      // Local Mock Mode using localStorage and BroadcastChannel
      const loadLocalData = () => {
        const saved = localStorage.getItem("saebu_train_local_submissions");
        if (saved) {
          try {
            const list = JSON.parse(saved) as ScoreSubmission[];
            list.sort((a, b) => a.submittedAt - b.submittedAt);
            setSubmissions(list);
          } catch (e) {
            console.error("Failed to parse local submissions", e);
          }
        } else {
          setSubmissions([]);
        }
      };

      loadLocalData();

      // Setup BroadcastChannel to sync tabs in real time
      try {
        const channel = new BroadcastChannel("saebu_train_channel");
        channel.onmessage = (event) => {
          if (event.data && event.data.type === "NEW_SUBMISSION") {
            loadLocalData();
          } else if (event.data && event.data.type === "DELETE_SUBMISSION") {
            loadLocalData();
          } else if (event.data && event.data.type === "RESET_SUBMISSIONS") {
            setSubmissions([]);
          } else if (event.data && event.data.type === "UPDATE_TARGET_SCORE") {
            setTargetScore(Number(event.data.data));
            localStorage.setItem("saebu_train_target_score", String(event.data.data));
          }
        };

        return () => {
          channel.close();
        };
      } catch (e) {
        console.error("BroadcastChannel unsupported", e);
      }
    }
  }, [isFirebaseConnected, dbInstance]);

  // Aggregate scores for each team
  const teamScores = useMemo<TeamScore[]>(() => {
    // Start with base teams
    const scoresMap: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Sum scores
    submissions.forEach((sub) => {
      // Check if submission is within deadline
      if (sub.submittedAt <= DEADLINE_TIMESTAMP) {
        if (scoresMap[sub.teamId] !== undefined) {
          scoresMap[sub.teamId] += sub.totalPoints;
        }
      }
    });

    return TEAMS.map((t) => ({
      ...t,
      score: scoresMap[t.teamId] || 0,
    }));
  }, [submissions]);

  // Sort teams to find the leader
  const sortedTeams = useMemo(() => {
    return [...teamScores].sort((a, b) => b.score - a.score);
  }, [teamScores]);

  // Get current leader team
  const leaderTeam = useMemo(() => {
    if (sortedTeams.length > 0 && sortedTeams[0].score > 0) {
      // Handle tie scores - find all teams sharing the highest score
      const maxScore = sortedTeams[0].score;
      const leaders = sortedTeams.filter((t) => t.score === maxScore);
      return {
        isTie: leaders.length > 1,
        teams: leaders,
        leadName: leaders.map((t) => t.teamName.split(" ")[0]).join(", "),
        colorClass: leaders.length === 1 ? leaders[0].colorClass : "text-amber-400",
      };
    }
    return null;
  }, [sortedTeams]);

  // Update Target Score (propagated to Firebase or Local Channel)
  const updateTargetScore = useCallback(
    async (score: number) => {
      setTargetScore(score);
      localStorage.setItem("saebu_train_target_score", String(score));

      if (isFirebaseConnected && dbInstance) {
        try {
          const targetScoreRef = ref(dbInstance, "settings/targetScore");
          await set(targetScoreRef, score);
        } catch (e) {
          console.error("Failed to update target score on Firebase", e);
        }
      } else {
        // Broadcast local target score update
        try {
          const channel = new BroadcastChannel("saebu_train_channel");
          channel.postMessage({ type: "UPDATE_TARGET_SCORE", data: score });
          channel.close();
        } catch (e) {
          console.error("Broadcast target score failed", e);
        }
      }
    },
    [isFirebaseConnected, dbInstance]
  );

  // Delete submission (Admin functionality)
  const deleteSubmission = useCallback(
    async (id: string) => {
      if (isFirebaseConnected && dbInstance) {
        try {
          const itemRef = ref(dbInstance, `submissions/${id}`);
          await remove(itemRef);
        } catch (e) {
          console.error("Failed to delete submission from Firebase", e);
        }
      } else {
        // Local deletion
        const saved = localStorage.getItem("saebu_train_local_submissions");
        if (saved) {
          try {
            let list = JSON.parse(saved) as ScoreSubmission[];
            list = list.filter((item) => item.id !== id);
            localStorage.setItem("saebu_train_local_submissions", JSON.stringify(list));
            setSubmissions(list);
            
            // Broadcast local deletion
            const channel = new BroadcastChannel("saebu_train_channel");
            channel.postMessage({ type: "DELETE_SUBMISSION", data: id });
            channel.close();
          } catch (e) {
            console.error("Failed to delete local submission", e);
          }
        }
      }
    },
    [isFirebaseConnected, dbInstance]
  );

  // Reset all submissions
  const resetAllSubmissions = useCallback(async () => {
    const res = await resetSubmissions();
    if (!res.success) {
      throw new Error(res.error || "초기화에 실패했습니다.");
    }
    if (!isFirebaseConnected) {
      setSubmissions([]);
    }
  }, [isFirebaseConnected]);

  return {
    submissions,
    teamScores,
    sortedTeams,
    leaderTeam,
    targetScore,
    isFirebaseConnected,
    updateTargetScore,
    deleteSubmission,
    resetAllSubmissions,
    checkFirebase,
  };
};
