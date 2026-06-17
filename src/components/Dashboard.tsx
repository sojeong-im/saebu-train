import React, { useState, useEffect, useRef } from "react";
import { useTrainState } from "../hooks/useTrainState";
import { 
  Settings, Clock, Trophy, Trash2, Database, 
  AlertTriangle, RefreshCw, X, Shield
} from "lucide-react";
import { getSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from "../firebase";
import { DEADLINE_TIMESTAMP } from "../types";
import type { FirebaseConfigData } from "../types";

export const Dashboard: React.FC = () => {
  const {
    submissions,
    teamScores,
    leaderTeam,
    targetScore,
    isFirebaseConnected,
    updateTargetScore,
    deleteSubmission,
    checkFirebase
  } = useTrainState();

  // Admin Settings Panel State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Custom target score input
  const [targetScoreInput, setTargetScoreInput] = useState(String(targetScore));
  
  // Firebase configuration input
  const [fbApiKey, setFbApiKey] = useState("");
  const [fbDbUrl, setFbDbUrl] = useState("");
  const [fbProjectId, setFbProjectId] = useState("");

  // System real-time clock and deadline countdown states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isEnded, setIsEnded] = useState(false);

  const feedEndRef = useRef<HTMLDivElement>(null);

  // Initialize input inputs from saved config
  useEffect(() => {
    const saved = getSavedFirebaseConfig();
    if (saved) {
      setFbApiKey(saved.apiKey || "");
      setFbDbUrl(saved.databaseURL || "");
      setFbProjectId(saved.projectId || "");
    }
    setTargetScoreInput(String(targetScore));
  }, [targetScore]);

  // Clock tick & Deadline countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const diff = DEADLINE_TIMESTAMP - now.getTime();
      if (diff <= 0) {
        setTimeRemaining("경기 종료 (CLOSED)");
        setIsEnded(true);
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

  // Scroll real-time event feed to bottom on new submission
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [submissions]);

  // Authenticate Admin Password
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "saebu2026") {
      setIsAdminAuthenticated(true);
      setAdminPassword("");
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  };

  // Save Config
  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey || !fbDbUrl) {
      alert("API Key와 Database URL은 필수 항목입니다.");
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
    alert("Firebase 설정이 저장되었습니다. 실시간 동기화를 시도합니다.");
  };

  const handleClearFirebaseConfig = () => {
    if (window.confirm("Firebase 설정을 삭제하고 로컬 데모 모드로 전환하겠습니까?")) {
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
      alert("올바른 점수를 입력해 주세요.");
      return;
    }
    updateTargetScore(score);
    alert(`목표 점수가 ${score}점으로 변경되었습니다.`);
  };

  // Share Input Link (URL with query mode=input)
  const getInputLink = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?mode=input`;
  };

  const copyInputLink = () => {
    navigator.clipboard.writeText(getInputLink());
    alert("입력 폼 링크가 복사되었습니다!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", padding: "1.5rem" }} className="crt-screen">
      <div className="crt-scanline"></div>

      {/* HEADER SECTION */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1.5rem",
        borderBottom: "2px solid #1e293b",
        paddingBottom: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: isFirebaseConnected ? "#10b981" : "#eab308",
            boxShadow: isFirebaseConnected ? "0 0 10px #10b981" : "0 0 10px #eab308"
          }} title={isFirebaseConnected ? "Firebase 실시간 연동 중" : "로컬 브로드캐스트 모드"} />
          <div>
            <h1 className="display-font" style={{ fontSize: "1.6rem", fontWeight: "900", letterSpacing: "1px", margin: 0, color: "#f8fafc" }}>
              찾기 익스프레스
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, fontWeight: "600" }}>
              - 강의실 쟁탈전 -
            </p>
          </div>
        </div>

        {/* LED Timer Display */}
        <div style={{ 
          background: "linear-gradient(180deg, #020617, #090d16)",
          border: "2px solid #1e293b",
          borderRadius: "8px",
          padding: "6px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={16} className="text-blue-400" />
            <span className="digital-font" style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
              {currentTime.toLocaleTimeString("ko-KR", { hour12: false })}
            </span>
          </div>
          <div style={{ height: "20px", width: "1px", backgroundColor: "#334155" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.75rem", color: "#cbd5e1", letterSpacing: "1px", fontWeight: "bold" }}>마감까지</span>
            <span className="digital-font" style={{ 
              fontSize: "1.6rem", 
              fontWeight: "bold",
              color: isEnded ? "#ef4444" : "#eab308",
              textShadow: isEnded ? "0 0 10px rgba(239, 68, 68, 0.5)" : "0 0 10px rgba(234, 179, 8, 0.5)"
            }}>
              {timeRemaining}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          className="hover:text-white"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* LEADERBOARD BANNER PANEL */}
      <div className="cyber-card" style={{ 
        padding: "1rem 1.5rem", 
        marginBottom: "1.5rem", 
        borderLeft: "4px solid #3b82f6",
        background: "linear-gradient(90deg, rgba(11, 19, 41, 0.9) 0%, rgba(9, 13, 22, 0.8) 100%)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Trophy size={28} style={{ color: leaderTeam ? "#eab308" : "#94a3b8", filter: leaderTeam ? "drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))" : "none" }} />
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "1px" }}>
              CURRENT LEADERBOARD POSITION
            </span>
            <h2 className="display-font" style={{ margin: 0, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "10px" }}>
              {leaderTeam ? (
                <>
                  <span className={leaderTeam.colorClass}>
                    {leaderTeam.leadName}
                  </span>
                  <span style={{ fontSize: "1.1rem", color: "#cbd5e1", fontWeight: "normal" }}>
                    {leaderTeam.isTie ? "공동 선두 질주 중!" : "단독 선두 질주 중!"}
                  </span>
                </>
              ) : (
                <span style={{ color: "#64748b", fontSize: "1.1rem" }}>출발 대기 중... 미션을 완수하여 점수를 올리세요!</span>
              )}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={copyInputLink} 
            style={{
              padding: "6px 14px",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "6px",
              color: "#60a5fa",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            모바일 입력 폼 링크 복사
          </button>
          <a 
            href="?mode=input" 
            style={{
              padding: "6px 14px",
              background: "#3b82f6",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: "600",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            입력 폼 이동
          </a>
        </div>
      </div>

      {/* MAIN LAYOUT: RACING SYSTEM & LIVE FEED */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 320px", 
        gap: "1.5rem", 
        flex: 1, 
        minHeight: 0 // Prevents grid overflow 
      }}>
        
        {/* RACING FIELD */}
        <section className="cyber-card" style={{ 
          padding: "1.5rem", 
          display: "flex", 
          flexDirection: "column", 
          gap: "12px",
          justifyContent: "space-between" 
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="cyber-badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                TRAIN RACING TRACK
              </span>
              <span className="digital-font" style={{ fontSize: "0.85rem", color: "#64748b" }}>
                100% Track Scale = <strong style={{ color: "#3b82f6" }}>{targetScore}점</strong> (대시보드 설정에서 변경 가능)
              </span>
            </div>

            {/* Tracks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {teamScores.map((team) => {
                // Calculate percentage placement
                const percentage = targetScore > 0 ? (team.score / targetScore) * 100 : 0;
                // Bound train within track limit (calc 100% - train size 70px)
                const boundPercent = Math.min(100, Math.max(0, percentage));
                
                // Active status if they have points
                const isActive = team.score > 0;

                return (
                  <div key={team.teamId} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {/* Team labels & current score */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px" }}>
                      <span className={`${team.colorClass} display-font`} style={{ fontWeight: "700", fontSize: "0.9rem" }}>
                        {team.teamName}
                      </span>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          목표 대비 {Math.round(percentage)}%
                        </span>
                        <span className="digital-font" style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#f1f5f9" }}>
                          {team.score}점
                        </span>
                      </div>
                    </div>

                    {/* Railroad track */}
                    <div className="railroad-track">
                      <div className="rail-ties"></div>
                      <div className="rail-steel"></div>

                      {/* Locomotive container */}
                      <div 
                        className="train-wrapper"
                        style={{ 
                          left: `calc(${boundPercent}% - ${boundPercent > 0 ? (70 * (boundPercent / 100)) : 0}px)`
                        }}
                      >
                        {/* Puff smoke emitter if moving/has points */}
                        {isActive && (
                          <div className="smoke-emitter">
                            <div className="smoke-particle"></div>
                            <div className="smoke-particle"></div>
                            <div className="smoke-particle"></div>
                          </div>
                        )}

                        {/* Train Body */}
                        <div className={`train-locomotive bg-neon-${team.teamId}`} style={{
                          animation: isActive ? "vibration 0.15s infinite linear" : "none"
                        }}>
                          {team.trainIcon}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal Terminal indicator at 100% */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            borderTop: "1px solid #1e293b", 
            paddingTop: "10px",
            fontSize: "0.8rem",
            color: "#475569" 
          }}>
            <span>STATION PLATFORM (0%)</span>
            <span>HALF-WAY (50%)</span>
            <span style={{ color: "#3b82f6", fontWeight: "bold" }}>DESTINATION TERMINAL (100% - {targetScore}pts) 🏁</span>
          </div>
        </section>

        {/* REAL-TIME EVENT FEED */}
        <section className="cyber-card" style={{ padding: "1.2rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #1e293b" }}>
            <span className="cyber-badge" style={{ background: "rgba(234, 179, 8, 0.15)", color: "#eab308" }}>
              LIVE FEED
            </span>
            <span className="digital-font" style={{ fontSize: "0.8rem", color: "#64748b" }}>
              실시간 상태창
            </span>
          </div>

          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            display: "flex", 
            flexDirection: "column", 
            gap: "10px",
            paddingRight: "4px"
          }}>
            {submissions.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569", gap: "10px", textAlign: "center", padding: "1.5rem" }}>
                <RefreshCw size={24} className="animate-spin" />
                <p style={{ fontSize: "0.85rem" }}>실시간 데이터를 대기하고 있습니다...</p>
              </div>
            ) : (
              submissions.map((sub, index) => {
                const team = teamScores.find(t => t.teamId === sub.teamId);
                const isAfterDeadline = sub.submittedAt > DEADLINE_TIMESTAMP;
                
                return (
                  <div 
                    key={sub.id || index} 
                    style={{ 
                      padding: "8px 12px", 
                      background: "rgba(15, 23, 42, 0.6)",
                      border: `1px solid ${isAfterDeadline ? "#ef4444" : "#1e293b"}`,
                      borderLeft: `3px solid ${isAfterDeadline ? "#ef4444" : (team?.colorClass.includes("red") ? "#ef4444" : team?.colorClass.includes("blue") ? "#3b82f6" : team?.colorClass.includes("yellow") ? "#eab308" : team?.colorClass.includes("emerald") ? "#10b981" : "#a855f7")}`,
                      borderRadius: "4px",
                      opacity: isAfterDeadline ? 0.5 : 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      position: "relative"
                    }}
                  >
                    {isAfterDeadline && (
                      <span style={{ 
                        position: "absolute", 
                        right: "6px", 
                        top: "6px", 
                        fontSize: "0.65rem", 
                        background: "#ef4444", 
                        color: "#fff",
                        padding: "1px 4px",
                        borderRadius: "3px",
                        fontWeight: "bold"
                      }}>
                        무효 (마감 초과)
                      </span>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.85rem", color: "#f8fafc" }}>
                        [{sub.teamId}팀] {sub.missionName}
                      </strong>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        color: isAfterDeadline ? "#ef4444" : "#10b981", 
                        fontWeight: "bold",
                        fontFamily: "var(--font-mono)" 
                      }}>
                        {isAfterDeadline ? "+0점" : `+${sub.totalPoints}점`}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                      <span>
                        {sub.points}점 × {sub.count}회
                      </span>
                      <span>
                        {new Date(sub.submittedAt).toLocaleTimeString("ko-KR", { hour12: false })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={feedEndRef} />
          </div>
        </section>
      </div>

      {/* DRAWER SETTINGS PANEL */}
      {isSettingsOpen && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: "rgba(2, 6, 23, 0.85)", 
          backdropFilter: "blur(4px)", 
          zIndex: 1000,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <div style={{ 
            width: "100%", 
            maxWidth: "480px", 
            height: "100%", 
            background: "#0b1329", 
            borderLeft: "1px solid #1e293b",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
            overflowY: "auto"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid #1e293b", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={22} className="text-blue-500" />
                <h3 className="display-font" style={{ margin: 0, fontSize: "1.2rem", color: "#f1f5f9" }}>ADMIN SETTINGS</h3>
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
                  <Shield size={48} style={{ margin: "0 auto 12px", display: "block", color: "#3b82f6" }} />
                  <p>이곳은 기차 대시보드 및 연동 데이터 관리자 패널입니다.</p>
                  <p style={{ marginTop: "4px" }}>비밀번호 인증 후 사용이 가능합니다.</p>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "6px" }}>관리자 비밀번호</label>
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "6px",
                      color: "#fff",
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
                    background: "#3b82f6",
                    color: "#fff",
                    borderRadius: "6px",
                    fontWeight: "600",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  비밀번호 인증
                </button>
                <p style={{ fontSize: "0.75rem", color: "#475569", textAlign: "center" }}>
                  기본 비밀번호는 <code>saebu2026</code> 입니다.
                </p>
              </form>
            ) : (
              // IF AUTHENTICATED
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* 1. Target Score Setting */}
                <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#3b82f6", borderBottom: "1px dashed #1e293b", paddingBottom: "4px" }}>
                    트랙 목표 점수 설정
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    기차 레일의 100% 한계 점수를 설정합니다. 득점 상황에 맞춰 조정할 수 있습니다.
                  </p>
                  <form onSubmit={handleSaveTargetScore} style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="number" 
                      value={targetScoreInput}
                      onChange={(e) => setTargetScoreInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "6px",
                        color: "#fff"
                      }}
                    />
                    <button 
                      type="submit"
                      style={{
                        padding: "8px 16px",
                        background: "#eab308",
                        color: "#0f172a",
                        borderRadius: "6px",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      변경
                    </button>
                  </form>
                </section>

                {/* 2. Firebase Connection settings */}
                <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#3b82f6", borderBottom: "1px dashed #1e293b", paddingBottom: "4px" }}>
                    Firebase Realtime Database 설정
                  </h4>
                  {isFirebaseConnected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "0.85rem", background: "rgba(16, 185, 129, 0.1)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      <Database size={16} />
                      <span>Firebase 연결 완료! (실시간 연동 적용 중)</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#eab308", fontSize: "0.85rem", background: "rgba(234, 179, 8, 0.1)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(234, 179, 8, 0.2)" }}>
                      <AlertTriangle size={16} />
                      <span>로컬 모드 실행 중 (같은 브라우저 탭 간에만 연동)</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveFirebaseConfig} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>API Key</label>
                      <input 
                        type="text" 
                        value={fbApiKey}
                        onChange={(e) => setFbApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        style={{ width: "100%", padding: "8px 12px", background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Database URL</label>
                      <input 
                        type="text" 
                        value={fbDbUrl}
                        onChange={(e) => setFbDbUrl(e.target.value)}
                        placeholder="https://your-project-id-default-rtdb.firebaseio.com"
                        style={{ width: "100%", padding: "8px 12px", background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px" }}>Project ID</label>
                      <input 
                        type="text" 
                        value={fbProjectId}
                        onChange={(e) => setFbProjectId(e.target.value)}
                        placeholder="your-project-id"
                        style={{ width: "100%", padding: "8px 12px", background: "#020617", border: "1px solid #1e293b", borderRadius: "6px", color: "#fff", fontSize: "0.85rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button 
                        type="submit"
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "#3b82f6",
                          color: "#fff",
                          borderRadius: "6px",
                          fontWeight: "600",
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        설정 저장 & 연결
                      </button>
                      
                      {getSavedFirebaseConfig() && (
                        <button 
                          type="button"
                          onClick={handleClearFirebaseConfig}
                          style={{
                            padding: "10px 14px",
                            background: "#ef4444",
                            color: "#fff",
                            borderRadius: "6px",
                            fontWeight: "600",
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          해제
                        </button>
                      )}
                    </div>
                  </form>
                </section>

                {/* 3. Raw Score Edit & Delete List */}
                <section style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>
                  <h4 style={{ fontSize: "0.95rem", color: "#ef4444", borderBottom: "1px dashed #1e293b", paddingBottom: "4px" }}>
                    제출 이력 관리 (삭제/차감)
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    잘못 제출한 점수를 즉각 차감할 수 있습니다. [휴지통]을 누르면 즉시 전체 점수에서 제외됩니다.
                  </p>
                  
                  <div style={{ 
                    flex: 1,
                    overflowY: "auto",
                    border: "1px solid #1e293b",
                    borderRadius: "6px",
                    background: "#020617",
                    maxHeight: "240px"
                  }}>
                    {submissions.length === 0 ? (
                      <p style={{ padding: "1rem", fontSize: "0.8rem", color: "#475569", textAlign: "center" }}>제출된 데이터가 없습니다.</p>
                    ) : (
                      <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", color: "#94a3b8" }}>
                        <thead>
                          <tr style={{ background: "#0b1329", borderBottom: "1px solid #1e293b", textAlign: "left" }}>
                            <th style={{ padding: "8px" }}>팀</th>
                            <th style={{ padding: "8px" }}>미션</th>
                            <th style={{ padding: "8px" }}>점수</th>
                            <th style={{ padding: "8px", width: "40px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((sub, i) => (
                            <tr key={sub.id || i} style={{ borderBottom: "1px solid #0b1329" }}>
                              <td style={{ padding: "8px", fontWeight: "bold" }}>{sub.teamId}팀</td>
                              <td style={{ padding: "8px" }}>{sub.missionName} ({sub.count}회)</td>
                              <td style={{ padding: "8px", color: "#f1f5f9" }}>{sub.totalPoints}점</td>
                              <td style={{ padding: "8px" }}>
                                <button 
                                  onClick={() => {
                                    if(window.confirm(`[${sub.teamId}팀] ${sub.missionName} (+${sub.totalPoints}점) 제출 건을 삭제하겠습니까?`)) {
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
    </div>
  );
};
