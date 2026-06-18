import React, { useState, useEffect, useRef } from "react";
import { useTrainState } from "../hooks/useTrainState";
import { 
  Settings, Clock, Trophy, Volume2, VolumeX
} from "lucide-react";
import { DEADLINE_TIMESTAMP } from "../types";
import { RenderTeamTrain } from "./TrainSVGs";
import { VictoryPopup } from "./VictoryPopup";

interface ToastNotification {
  id: string;
  message: string;
  teamId: number;
  points: number;
}

export const Dashboard: React.FC = () => {
  const {
    submissions,
    teamScores,
    sortedTeams,
    leaderTeam,
    targetScore
  } = useTrainState();



  // Clock & countdown states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isEnded, setIsEnded] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const hasTriggeredVictory = useRef(false);

  // Audio settings (Mute/Unmute)
  const [isMuted, setIsMuted] = useState(false);

  // Active Toast notification state (Pop! notification)
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Train acceleration tracker
  const [acceleratingTeams, setAcceleratingTeams] = useState<{ [key: number]: boolean }>({});
  const lastSubmissionsCount = useRef(0);



  // System time and countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const diff = DEADLINE_TIMESTAMP - now.getTime();
      if (diff <= 0) {
        setTimeRemaining("경기 종료!");
        setIsEnded(true);
        if (!hasTriggeredVictory.current) {
          hasTriggeredVictory.current = true;
          setIsVictoryOpen(true);
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (num: number) => String(num).padStart(2, "0");
        setTimeRemaining(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        setIsEnded(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Web Audio API Synthesizer pop sound (뿅!)
  const playPopSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      // Frequency sweeps from 280Hz up to 780Hz rapidly
      osc.frequency.setValueAtTime(280, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, audioCtx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.error("Failed to synth pop sound", e);
    }
  };

  // Monitor new score submissions to trigger speed lines and popup feeds
  useEffect(() => {
    if (submissions.length > 0) {
      // If we got a new submission
      if (submissions.length > lastSubmissionsCount.current) {
        const latest = submissions[submissions.length - 1];
        
        // 1. Trigger Speed lines / Acceleration for that team
        setAcceleratingTeams(prev => ({ ...prev, [latest.teamId]: true }));
        setTimeout(() => {
          setAcceleratingTeams(prev => ({ ...prev, [latest.teamId]: false }));
        }, 2500);

        // 2. Play Pop! Sound
        playPopSound();

        // 3. Trigger Toast Notification
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        
        setToast({
          id: latest.id || Math.random().toString(),
          message: `🎉 ${latest.teamId}팀이 '${latest.missionName}'을(를) 완수하여 폭풍 질주합니다!`,
          teamId: latest.teamId,
          points: latest.totalPoints
        });
        setToastExiting(false);

        toastTimeoutRef.current = setTimeout(() => {
          setToastExiting(true);
          setTimeout(() => setToast(null), 300); // Wait for exit animation
        }, 4000);
      }
      lastSubmissionsCount.current = submissions.length;
    }
  }, [submissions, isMuted]);


  // Team colors mapper for badges
  const getTeamBadgeColor = (teamId: number) => {
    switch (teamId) {
      case 1: return "var(--team1-color)";
      case 2: return "var(--team2-color)";
      case 3: return "var(--team3-color)";
      case 4: return "var(--team4-color)";
      case 5: return "var(--team5-color)";
      default: return "#475569";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
      
      {/* 2D BACKGROUND CLOUDS DRIFTING */}
      <div className="cloud size-sm" style={{ top: "12%", left: "-10%" }}></div>
      <div className="cloud size-md" style={{ top: "6%", left: "30%", animationDelay: "-15s" }}></div>
      <div className="cloud size-lg" style={{ top: "15%", left: "60%", animationDelay: "-5s" }}></div>

      {/* PARTY BANNER (만국기) */}
      <div className="flags-banner">
        {["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"].map((color, i) => (
          <div 
            key={i} 
            className="flag-triangle" 
            style={{ 
              borderTopColor: color,
              animationDelay: `${i * 0.25}s` 
            }} 
          />
        ))}
      </div>

      {/* HEADER BAR */}
      <header className="dashboard-header" style={{ 
        zIndex: 10,
        position: "relative"
      }}>
        {/* Game Title */}
        <div>
          <h1 className="game-title-text" style={{ fontSize: "2.4rem", margin: 0, fontWeight: "900" }}>
            찾기 익스프레스
          </h1>
          <p style={{ fontSize: "1rem", color: "#1e293b", margin: 0, fontWeight: "800", letterSpacing: "1px", fontFamily: "var(--font-game)" }}>
            🏁 강의실 쟁탈전 🏁
          </p>
        </div>

        {/* Dashboard Status LED & Timer */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="dashboard-header-right">
          
          {/* Mute button */}
          <button 
            onClick={() => {
              setIsMuted(!isMuted);
              if (isMuted) {
                // Play test tone to assure sound is back
                setTimeout(() => playPopSound(), 100);
              }
            }}
            style={{
              background: "white",
              border: "3px solid #1e293b",
              borderRadius: "10px",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 0 #1e293b",
              flexShrink: 0
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Clock Board */}
          <div className="game-card dashboard-timer-board" style={{ 
            padding: "6px 16px", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            background: "#ffffff",
            flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={14} className="text-slate-500" />
              <span className="digital-font dashboard-clock-text" style={{ fontSize: "0.95rem", color: "#475569", fontWeight: "bold", whiteSpace: "nowrap" }}>
                {currentTime.toLocaleTimeString("ko-KR", { hour12: false })}
              </span>
            </div>
            
            <div className="dashboard-timer-divider" style={{ height: "16px", width: "2px", backgroundColor: "#1e293b", borderRadius: "2px" }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
              <span className="dashboard-timer-label" style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "800", fontFamily: "var(--font-game)" }}>마감까지</span>
              <span className="digital-font dashboard-timer-countdown" style={{ 
                fontSize: "1.3rem", 
                fontWeight: "bold",
                color: isEnded ? "#ef4444" : "#ea580c"
              }}>
                {timeRemaining}
              </span>
            </div>
          </div>

          <a 
            href="?mode=admin"
            style={{
              background: "white",
              border: "3px solid #1e293b",
              borderRadius: "10px",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 0 #1e293b",
              flexShrink: 0
            }}
          >
            <Settings size={18} style={{ color: "#1e293b" }} />
          </a>
        </div>
      </header>

      {/* LEADER BOARD NOTICE BAR */}
      <div className="dashboard-notice-wrapper" style={{ marginBottom: "1rem", zIndex: 10 }}>
        <div className="game-card dashboard-notice-card" style={{ 
          background: "linear-gradient(to right, #ffffff 0%, #f8fafc 100%)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Trophy size={24} style={{ color: leaderTeam ? "#f59e0b" : "#94a3b8" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontFamily: "var(--font-game)", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                {leaderTeam ? (
                  <>
                    현재 1위: 
                    <span className={leaderTeam.colorClass} style={{ textDecoration: "underline" }}>
                      {leaderTeam.leadName}
                    </span>
                    <span style={{ color: "#64748b", fontWeight: "normal", fontSize: "0.95rem" }}>
                      {leaderTeam.isTie ? "공동 질주 중! 🚂" : "단독 질주 중! 🚂"}
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#64748b" }}>기차가 출발 대기 상태입니다. 미션을 완료하고 달려보세요!</span>
                )}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <a 
              href="?mode=input" 
              style={{
                padding: "6px 12px",
                background: "#4ade80",
                border: "2px solid #1e293b",
                borderRadius: "8px",
                color: "#1e293b",
                fontSize: "0.8rem",
                fontWeight: "900",
                fontFamily: "var(--font-game)",
                textDecoration: "none",
                boxShadow: "0 2px 0 #1e293b",
                display: "inline-block"
              }}
            >
              점수 입력 폼 바로가기 🚂
            </a>
          </div>
        </div>
      </div>

      {/* MAIN RACING TRACK & PANEL */}
      <div className="dashboard-main-grid" style={{ padding: "0 2rem 2rem 2rem", flex: 1, display: "flex", flexDirection: "column", zIndex: 10 }}>
        <section className="game-card" style={{ 
          padding: "2rem 1.5rem 1.5rem 1.5rem", 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between",
          background: "#ffffff"
        }}>
          {/* Track Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span className="cyber-badge" style={{ background: "#f1f5f9", color: "#475569", border: "2px solid #1e293b", fontWeight: "bold" }}>
              2D RACING TRACKS
            </span>
          </div>

          {/* Tracks Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, justifyContent: "space-around" }}>
            {teamScores.map((team) => {
              const percentage = targetScore > 0 ? (team.score / targetScore) * 100 : 0;
              const boundPercent = Math.min(100, Math.max(0, percentage));
              
              const isMoving = team.score > 0 && !isEnded;
              const isAccelerating = acceleratingTeams[team.teamId] || false;

              return (
                <div key={team.teamId} className="racing-track-row" style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingLeft: "10px",
                  paddingRight: "10px"
                }}>
                  {/* 1. Left Section (Static badge width) */}
                  <div className="track-left-badge-area">
                    <div 
                      className="rail-number-sign" 
                      style={{ 
                        width: "52px", 
                        height: "34px", 
                        background: getTeamBadgeColor(team.teamId),
                        fontSize: "0.8rem",
                        flexShrink: 0
                      }}
                    >
                      {team.teamId}레일
                    </div>
                    <div 
                      className="team-badge-sign mobile-hide"
                      style={{ 
                        padding: "4px 8px", 
                        background: getTeamBadgeColor(team.teamId),
                        fontSize: "0.8rem",
                        flexShrink: 0,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {team.teamId}팀
                    </div>
                  </div>

                  {/* 2. Middle Section (Flexible running track space for train) */}
                  <div className="track-middle-rail-area">
                    {/* 2D Wood/Steel Railroad tracks */}
                    <div className="railroad-ties-2d"></div>
                    <div className="railroad-steel-2d"></div>

                    {/* Moving train element inside localized parent */}
                    <div 
                      className="game-train-wrapper"
                      style={{ 
                        left: `calc(${boundPercent}% - ${boundPercent > 0 ? `(var(--train-offset) * ${boundPercent / 100})` : '0px'})`
                      }}
                    >
                      {/* Speed lines */}
                      <div className={`speed-booster-lines ${isAccelerating ? "active" : ""}`}>
                        <div className="speed-line-element" style={{ background: getTeamBadgeColor(team.teamId) }} />
                        <div className="speed-line-element" style={{ background: getTeamBadgeColor(team.teamId) }} />
                        <div className="speed-line-element" style={{ background: getTeamBadgeColor(team.teamId) }} />
                      </div>

                      {/* Smoke puffs */}
                      {isMoving && (
                        <div style={{ position: "absolute", right: "12px", top: "-15px" }}>
                          <div className="smoke-cloud-2d" style={{ animationDelay: "0s" }} />
                          <div className="smoke-cloud-2d" style={{ animationDelay: "0.35s", left: "-6px" }} />
                          <div className="smoke-cloud-2d" style={{ animationDelay: "0.7s", left: "4px" }} />
                        </div>
                      )}

                      {/* SVG Train */}
                      <RenderTeamTrain teamId={team.teamId} isMoving={isMoving} />
                    </div>
                  </div>

                  {/* 3. Right Section (Checkered Finish Line) */}
                  <div className="track-right-finish-area">
                    <div className="finish-line-checker" style={{ height: "100%" }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined Header Label & Scale tags */}
          <div className="track-scale-labels">
            <span>출발역 (0%)</span>
            <span>중간 지점 (50%)</span>
            <span style={{ color: "#ef4444" }}>피니시 터미널 (100%) 🏁</span>
          </div>
        </section>
      </div>

      {/* POPUP FEED COMPONENT (뿅! 알림 창) */}
      {toast && (
        <div style={{ 
          position: "fixed", 
          bottom: "30px", 
          right: "30px", 
          zIndex: 500,
          width: "360px"
        }}>
          <div 
            className={`pop-toast-card ${toastExiting ? "exiting" : ""}`}
            style={{ 
              padding: "16px",
              borderLeftWidth: "10px",
              borderLeftColor: getTeamBadgeColor(toast.teamId)
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.8rem" }}>🚂</span>
              <div>
                <strong style={{ 
                  display: "block", 
                  fontSize: "0.95rem", 
                  fontFamily: "var(--font-game)", 
                  color: "#1e293b",
                  marginBottom: "4px" 
                }}>
                  {toast.message}
                </strong>
                <span style={{ 
                  fontSize: "0.8rem", 
                  background: "rgba(34, 197, 94, 0.15)", 
                  color: "#16a34a", 
                  padding: "2px 8px", 
                  borderRadius: "6px",
                  fontWeight: "bold"
                }}>
                  질주 지표: +{toast.points}점
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Popup */}
      <VictoryPopup isOpen={isVictoryOpen} sortedTeams={sortedTeams} onClose={() => setIsVictoryOpen(false)} />
    </div>
  );
};
