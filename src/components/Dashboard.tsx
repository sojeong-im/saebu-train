import React, { useState, useEffect, useRef } from "react";
import { useTrainState } from "../hooks/useTrainState";
import { 
  Settings, Clock, Trophy, Trash2, Database, 
  AlertTriangle, X, Shield, Volume2, VolumeX
} from "lucide-react";
import { getSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from "../firebase";
import { DEADLINE_TIMESTAMP } from "../types";
import type { FirebaseConfigData } from "../types";
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
    targetScore,
    isFirebaseConnected,
    updateTargetScore,
    deleteSubmission,
    checkFirebase
  } = useTrainState();

  // Admin Panel states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [targetScoreInput, setTargetScoreInput] = useState(String(targetScore));
  
  // Firebase configs inputs
  const [fbApiKey, setFbApiKey] = useState("");
  const [fbDbUrl, setFbDbUrl] = useState("");
  const [fbProjectId, setFbProjectId] = useState("");

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

  // Parse configurations
  useEffect(() => {
    const saved = getSavedFirebaseConfig();
    if (saved) {
      setFbApiKey(saved.apiKey || "");
      setFbDbUrl(saved.databaseURL || "");
      setFbProjectId(saved.projectId || "");
    }
    setTargetScoreInput(String(targetScore));
  }, [targetScore]);

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

  // Handle Admin Pass auth
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "saebu2026") {
      setIsAdminAuthenticated(true);
      setAdminPassword("");
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  };

  // Save config
  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey || !fbDbUrl) {
      alert("API Key와 Database URL은 필수입니다.");
      return;
    }
    const config: FirebaseConfigData = {
      apiKey: fbApiKey,
      databaseURL: fbDbUrl,
      projectId: fbProjectId,
      authDomain: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };
    saveFirebaseConfig(config);
    checkFirebase();
    alert("Firebase 설정이 저장되었습니다. 실시간 연동을 시도합니다.");
  };

  const handleClearFirebaseConfig = () => {
    if (window.confirm("Firebase 설정을 삭제하고 로컬 모드로 전환하겠습니까?")) {
      clearFirebaseConfig();
      setFbApiKey("");
      setFbDbUrl("");
      setFbProjectId("");
      checkFirebase();
    }
  };

  const handleSaveTargetScore = (e: React.FormEvent) => {
    e.preventDefault();
    const score = Number(targetScoreInput);
    if (isNaN(score) || score <= 0) {
      alert("올바른 숫자를 기입해 주세요.");
      return;
    }
    updateTargetScore(score);
    alert(`목표 점수가 ${score}점으로 변경되었습니다.`);
  };

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
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "1.2rem 2rem", 
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
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
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 0 #1e293b"
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Clock Board */}
          <div className="game-card" style={{ 
            padding: "8px 20px", 
            display: "flex", 
            alignItems: "center", 
            gap: "16px",
            background: "#ffffff"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} className="text-slate-500" />
              <span className="digital-font" style={{ fontSize: "1rem", color: "#475569", fontWeight: "bold" }}>
                {currentTime.toLocaleTimeString("ko-KR", { hour12: false })}
              </span>
            </div>
            
            <div style={{ height: "18px", width: "3px", backgroundColor: "#1e293b", borderRadius: "2px" }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: "800", fontFamily: "var(--font-game)" }}>마감까지</span>
              <span className="digital-font" style={{ 
                fontSize: "1.4rem", 
                fontWeight: "bold",
                color: isEnded ? "#ef4444" : "#ea580c"
              }}>
                {timeRemaining}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            style={{
              background: "white",
              border: "3px solid #1e293b",
              borderRadius: "10px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 0 #1e293b"
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* LEADER BOARD NOTICE BAR */}
      <div style={{ padding: "0 2rem", marginBottom: "1rem", zIndex: 10 }}>
        <div className="game-card" style={{ 
          padding: "10px 20px",
          background: "linear-gradient(to right, #ffffff 0%, #f8fafc 100%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
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
            <span className="digital-font" style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "bold" }}>
              목표 완주선: <strong style={{ color: "#3b82f6" }}>{targetScore}점</strong>
            </span>
          </div>

          {/* Tracks Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, justifyContent: "space-around" }}>
            {teamScores.map((team) => {
              // Percentage calculation
              const percentage = targetScore > 0 ? (team.score / targetScore) * 100 : 0;
              // Bound train left position (calc 100% - train size 85px)
              const boundPercent = Math.min(100, Math.max(0, percentage));
              
              const isMoving = team.score > 0 && !isEnded;
              const isAccelerating = acceleratingTeams[team.teamId] || false;

              return (
                <div key={team.teamId} className="racing-track-row">
                  {/* Left Rail signs */}
                  <div style={{ 
                    position: "absolute", 
                    left: "10px", 
                    zIndex: 20, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px" 
                  }}>
                    {/* Rail label */}
                    <div 
                      className="rail-number-sign" 
                      style={{ 
                        width: "55px", 
                        height: "36px", 
                        background: getTeamBadgeColor(team.teamId),
                        fontSize: "0.85rem"
                      }}
                    >
                      {team.teamId}레일
                    </div>
                    {/* Team label */}
                    <div 
                      className="team-badge-sign"
                      style={{ 
                        padding: "4px 8px", 
                        background: getTeamBadgeColor(team.teamId),
                        fontSize: "0.8rem"
                      }}
                    >
                      {team.teamId}팀 ({team.score}점)
                    </div>
                  </div>

                  {/* 2D Wood/Steel Railroad tracks */}
                  <div className="railroad-ties-2d"></div>
                  <div className="railroad-steel-2d"></div>

                  {/* Moving train element */}
                  <div 
                    className="game-train-wrapper"
                    style={{ 
                      // 145px represents offset from left (signs 130px) + right boundary buffer
                      left: `calc(135px + (${boundPercent}% * 0.77))` 
                    }}
                  >
                    {/* Speed lines when accelerating */}
                    <div className={`speed-booster-lines ${isAccelerating ? "active" : ""}`}>
                      <div className="speed-line-element" style={{ background: getTeamBadgeColor(team.teamId), animationDelay: "0s" }} />
                      <div className="speed-line-element" style={{ background: getTeamBadgeColor(team.teamId), animationDelay: "0.15s" }} />
                      <div className="speed-line-element" style={{ background: getTeamBadgeColor(team.teamId), animationDelay: "0.3s" }} />
                    </div>

                    {/* Smoke Emitter Chimney cloud puffs */}
                    {isMoving && (
                      <div style={{ position: "absolute", right: "12px", top: "-15px" }}>
                        <div className="smoke-cloud-2d" style={{ animationDelay: "0s" }} />
                        <div className="smoke-cloud-2d" style={{ animationDelay: "0.35s", left: "-6px" }} />
                        <div className="smoke-cloud-2d" style={{ animationDelay: "0.7s", left: "4px" }} />
                      </div>
                    )}

                    {/* SVG Customized Train */}
                    <RenderTeamTrain teamId={team.teamId} isMoving={isMoving} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Finish Line Checker & Sign */}
          <div style={{ 
            position: "absolute", 
            right: "80px", 
            top: "70px", 
            bottom: "60px",
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            {/* Finish Line Top sign (결승선) */}
            <div style={{
              background: "#ef4444",
              border: "3px solid #1e293b",
              borderRadius: "8px",
              padding: "4px 14px",
              color: "white",
              fontWeight: "900",
              fontFamily: "var(--font-game)",
              boxShadow: "0 4px 0 #1e293b",
              fontSize: "0.9rem",
              zIndex: 30,
              transform: "translateY(-6px)",
              letterSpacing: "1px"
            }}>
              결승선
            </div>

            {/* Checkered bar */}
            <div className="finish-line-checker" style={{ flex: 1 }}></div>
          </div>

          {/* Scale tags */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            borderTop: "3px solid #1e293b", 
            paddingTop: "12px",
            fontSize: "0.85rem",
            color: "#475569",
            fontWeight: "800",
            fontFamily: "var(--font-game)",
            paddingLeft: "135px",
            paddingRight: "80px"
          }}>
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

      {/* ADMIN SETTINGS DRAWERS */}
      {isSettingsOpen && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: "rgba(30, 41, 59, 0.6)", 
          backdropFilter: "blur(2px)", 
          zIndex: 1000,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <div style={{ 
            width: "100%", 
            maxWidth: "480px", 
            height: "100%", 
            background: "white", 
            borderLeft: "4px solid #1e293b",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
            overflowY: "auto"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "3px solid #1e293b", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={22} className="text-slate-700" />
                <h3 className="display-font" style={{ margin: 0, fontSize: "1.2rem", fontWeight: "900", color: "#1e293b", fontFamily: "var(--font-game)" }}>ADMIN SETTINGS</h3>
              </div>
              <button 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsAdminAuthenticated(false);
                }}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={24} />
              </button>
            </div>

            {/* IF NOT AUTHENTICATED */}
            {!isAdminAuthenticated ? (
              <form onSubmit={handleAdminAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.9rem", marginBottom: "1rem" }}>
                  <Shield size={48} style={{ margin: "0 auto 12px", display: "block", color: "#64748b" }} />
                  <p>관리자 비밀번호를 통해 데이터를 제어할 수 있습니다.</p>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#475569", marginBottom: "6px", fontWeight: "bold" }}>관리자 비밀번호</label>
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#f8fafc",
                      border: "2px solid #1e293b",
                      borderRadius: "8px",
                      color: "#1e293b",
                      fontSize: "0.95rem"
                    }}
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#4ade80",
                    border: "2px solid #1e293b",
                    color: "#1e293b",
                    borderRadius: "8px",
                    fontWeight: "900",
                    boxShadow: "0 3px 0 #1e293b",
                    cursor: "pointer"
                  }}
                >
                  비밀번호 인증
                </button>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
                  기본 암호는 <code>saebu2026</code> 입니다.
                </p>
              </form>
            ) : (
              // IF AUTHENTICATED
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* 1. Target Score Setting */}
                <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#1e293b", fontWeight: "bold", borderBottom: "2px solid #1e293b", paddingBottom: "4px" }}>
                    트랙 완주 목표 점수
                  </h4>
                  <form onSubmit={handleSaveTargetScore} style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="number" 
                      value={targetScoreInput}
                      onChange={(e) => setTargetScoreInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: "#f8fafc",
                        border: "2px solid #1e293b",
                        borderRadius: "8px",
                        color: "#1e293b"
                      }}
                    />
                    <button 
                      type="submit"
                      style={{
                        padding: "8px 16px",
                        background: "#f59e0b",
                        color: "#1e293b",
                        border: "2px solid #1e293b",
                        borderRadius: "8px",
                        fontWeight: "900",
                        boxShadow: "0 3px 0 #1e293b",
                        cursor: "pointer"
                      }}
                    >
                      변경
                    </button>
                  </form>
                </section>

                {/* 2. Firebase settings */}
                <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#1e293b", fontWeight: "bold", borderBottom: "2px solid #1e293b", paddingBottom: "4px" }}>
                    Firebase 연결 설정
                  </h4>
                  {isFirebaseConnected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontSize: "0.85rem", background: "rgba(34, 197, 94, 0.15)", padding: "8px 12px", borderRadius: "8px", border: "2px solid #16a34a" }}>
                      <Database size={16} />
                      <span>Firebase 연결 완료! (실시간 연동 적용 중)</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ca8a04", fontSize: "0.85rem", background: "rgba(234, 179, 8, 0.15)", padding: "8px 12px", borderRadius: "8px", border: "2px solid #ca8a04" }}>
                      <AlertTriangle size={16} />
                      <span>로컬 브로드캐스트 모드 실행 중</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveFirebaseConfig} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "4px" }}>API Key</label>
                      <input 
                        type="text" 
                        value={fbApiKey}
                        onChange={(e) => setFbApiKey(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", background: "#f8fafc", border: "2px solid #1e293b", borderRadius: "8px", color: "#1e293b", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "4px" }}>Database URL</label>
                      <input 
                        type="text" 
                        value={fbDbUrl}
                        onChange={(e) => setFbDbUrl(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", background: "#f8fafc", border: "2px solid #1e293b", borderRadius: "8px", color: "#1e293b", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#475569", marginBottom: "4px" }}>Project ID</label>
                      <input 
                        type="text" 
                        value={fbProjectId}
                        onChange={(e) => setFbProjectId(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", background: "#f8fafc", border: "2px solid #1e293b", borderRadius: "8px", color: "#1e293b", fontSize: "0.85rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button 
                        type="submit"
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "#3b82f6",
                          color: "white",
                          border: "2px solid #1e293b",
                          borderRadius: "8px",
                          fontWeight: "900",
                          boxShadow: "0 3px 0 #1e293b",
                          cursor: "pointer"
                        }}
                      >
                        저장 & 연결
                      </button>
                      
                      {getSavedFirebaseConfig() && (
                        <button 
                          type="button"
                          onClick={handleClearFirebaseConfig}
                          style={{
                            padding: "10px 14px",
                            background: "#ef4444",
                            color: "white",
                            border: "2px solid #1e293b",
                            borderRadius: "8px",
                            fontWeight: "900",
                            boxShadow: "0 3px 0 #1e293b",
                            cursor: "pointer"
                          }}
                        >
                          해제
                        </button>
                      )}
                    </div>
                  </form>
                </section>

                {/* 3. Submissions deletion */}
                <section style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#1e293b", fontWeight: "bold", borderBottom: "2px solid #1e293b", paddingBottom: "4px" }}>
                    제출 기록 관리
                  </h4>
                  
                  <div style={{ 
                    flex: 1,
                    overflowY: "auto",
                    border: "2px solid #1e293b",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    maxHeight: "220px"
                  }}>
                    {submissions.length === 0 ? (
                      <p style={{ padding: "1rem", fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>제출 내역이 없습니다.</p>
                    ) : (
                      <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", color: "#475569" }}>
                        <thead>
                          <tr style={{ background: "#e2e8f0", borderBottom: "2px solid #1e293b", textAlign: "left" }}>
                            <th style={{ padding: "8px" }}>팀</th>
                            <th style={{ padding: "8px" }}>미션</th>
                            <th style={{ padding: "8px" }}>점수</th>
                            <th style={{ padding: "8px", width: "40px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((sub, i) => (
                            <tr key={sub.id || i} style={{ borderBottom: "1px solid #cbd5e1" }}>
                              <td style={{ padding: "8px", fontWeight: "bold" }}>{sub.teamId}팀</td>
                              <td style={{ padding: "8px" }}>{sub.missionName} ({sub.count}회)</td>
                              <td style={{ padding: "8px", color: "#1e293b" }}>{sub.totalPoints}점</td>
                              <td style={{ padding: "8px" }}>
                                <button 
                                  onClick={() => {
                                    if(window.confirm(`[${sub.teamId}팀] ${sub.missionName} (+${sub.totalPoints}점) 건을 삭제하겠습니까?`)) {
                                      deleteSubmission(sub.id);
                                    }
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center"
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Victory Celebration Popup */}
      <VictoryPopup isOpen={isVictoryOpen} sortedTeams={sortedTeams} onClose={() => setIsVictoryOpen(false)} />
    </div>
  );
};
