import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Shield, Database, 
  AlertTriangle, Trash2, Sliders
} from "lucide-react";
import { useTrainState } from "../hooks/useTrainState";
import { 
  submitScore, 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig 
} from "../firebase";
import { TEAMS } from "../types";
import type { FirebaseConfigData } from "../types";

export const AdminPanel: React.FC = () => {
  const {
    submissions,
    targetScore,
    isFirebaseConnected,
    updateTargetScore,
    deleteSubmission,
    resetAllSubmissions,
    checkFirebase
  } = useTrainState();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // Target Score state
  const [targetScoreInput, setTargetScoreInput] = useState(String(targetScore));

  // Firebase configurations
  const [fbApiKey, setFbApiKey] = useState("");
  const [fbDbUrl, setFbDbUrl] = useState("");
  const [fbProjectId, setFbProjectId] = useState("");

  // Score Manual Adjustment state
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [adjPoints, setAdjPoints] = useState<string>("10");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Submissions Filter
  const [filterTeamId, setFilterTeamId] = useState<number | "all">("all");

  useEffect(() => {
    const saved = getSavedFirebaseConfig();
    if (saved) {
      setFbApiKey(saved.apiKey || "");
      setFbDbUrl(saved.databaseURL || "");
      setFbProjectId(saved.projectId || "");
    }
    setTargetScoreInput(String(targetScore));
  }, [targetScore]);

  // Auth Handler
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "saebu2026") {
      setIsAuthenticated(true);
      setPassword("");
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  };

  // Target Score Handler
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const score = Number(targetScoreInput);
    if (isNaN(score) || score <= 0) {
      alert("올바른 숫자를 입력해 주세요.");
      return;
    }
    updateTargetScore(score);
    alert(`목표 완주선이 ${score}점으로 변경되었습니다.`);
  };

  // Score Adjustment Handler
  const handleAdjustScore = async (e: React.FormEvent) => {
    e.preventDefault();
    const points = Number(adjPoints);
    if (isNaN(points) || points === 0) {
      alert("0을 제외한 유효한 숫자를 입력해 주세요.");
      return;
    }

    const team = TEAMS.find(t => t.teamId === selectedTeamId);
    if (!team) return;

    const signText = points > 0 ? `+${points}` : `${points}`;
    if (!window.confirm(`[${team.teamName}]에 직접 ${signText}점을 조정(반영)하겠습니까?`)) {
      return;
    }

    setIsAdjusting(true);
    try {
      const res = await submitScore(
        selectedTeamId,
        team.teamName,
        "admin_adjustment",
        "관리자 점수 조정",
        points,
        1,
        "admin"
      );
      if (res.success) {
        alert(`성공적으로 ${team.teamName}에 ${signText}점이 조정되었습니다!`);
        setAdjPoints("10");
      } else {
        alert(`실패: ${res.error}`);
      }
    } catch (err: any) {
      alert(`에러: ${err.message || err}`);
    } finally {
      setIsAdjusting(false);
    }
  };

  // Firebase Config Save Handler
  const handleSaveFirebase = (e: React.FormEvent) => {
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
    alert("Firebase 연결 설정이 저장되었습니다. 실시간 동기화를 적용합니다.");
  };

  // Firebase Config Clear Handler
  const handleClearFirebase = () => {
    if (window.confirm("Firebase 설정을 삭제하고 로컬 모드로 전환하겠습니까?")) {
      clearFirebaseConfig();
      setFbApiKey("");
      setFbDbUrl("");
      setFbProjectId("");
      checkFirebase();
      alert("로컬 모드로 전환되었습니다.");
    }
  };

  // Reset Submissions Handler
  const handleResetAll = async () => {
    if (window.confirm("⚠️ 경고: 정말로 대시보드의 모든 기차 주행 점수 데이터를 영구 삭제하시겠습니까?")) {
      if (window.confirm("🔥 정말 최종 초기화하시겠습니까? 이 작업은 절대 되돌릴 수 없습니다.")) {
        try {
          await resetAllSubmissions();
          alert("대시보드 기차가 모두 출발역으로 초기화되었습니다!");
        } catch (e: any) {
          alert(`초기화 에러: ${e.message || e}`);
        }
      }
    }
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

  // Filtered submissions chronological
  const filteredSubmissions = submissions.filter(sub => {
    if (filterTeamId === "all") return true;
    return sub.teamId === filterTeamId;
  });

  // Render Authentication overlay if not logged in
  if (!isAuthenticated) {
    return (
      <div style={{
        maxWidth: "460px",
        margin: "6rem auto 2rem auto",
        padding: "0 1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        flex: 1
      }}>
        <div className="game-card" style={{
          background: "#ffffff",
          borderWidth: "4px",
          borderRadius: "16px",
          padding: "2.5rem 1.5rem",
          boxShadow: "0 8px 0 #1e293b",
          textAlign: "center"
        }}>
          <Shield size={56} style={{ color: "#475569", margin: "0 auto 1.5rem" }} />
          <h2 className="game-title-text" style={{ 
            fontSize: "1.8rem", 
            marginBottom: "0.5rem",
            color: "#ffffff"
          }}>
            ADMIN LOGIN
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "2rem", fontFamily: "var(--font-game)" }}>
            기차 주행 데이터를 관리하기 위한 패스워드를 입력하세요.
          </p>

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="패스워드를 입력하세요..."
              autoFocus
              style={{
                width: "100%",
                padding: "12px",
                background: "#f8fafc",
                border: "3px solid #1e293b",
                borderRadius: "10px",
                fontSize: "1rem",
                color: "#1e293b",
                textAlign: "center",
                fontWeight: "bold"
              }}
            />
            <button
              type="submit"
              style={{
                padding: "14px",
                background: "#4ade80",
                color: "#1e293b",
                border: "3px solid #1e293b",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: "900",
                fontFamily: "var(--font-game)",
                cursor: "pointer",
                boxShadow: "0 4px 0 #1e293b",
                transform: "translateY(0)"
              }}
            >
              로그인 🔑
            </button>
          </form>

          <a href="?mode=dashboard" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "1.5rem",
            color: "#64748b",
            fontSize: "0.85rem",
            textDecoration: "none",
            fontWeight: "bold"
          }}>
            <ArrowLeft size={14} /> 대시보드 화면으로 가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "768px",
      margin: "0 auto",
      padding: "1.5rem 1rem",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#f0fdf4" // Pale green background for admin context
    }}>
      
      {/* HEADER BAR */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1.2rem",
        borderBottom: "3px solid #1e293b",
        paddingBottom: "10px"
      }}>
        <a href="?mode=dashboard" style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: "#1e293b",
          fontSize: "0.9rem",
          textDecoration: "none",
          fontWeight: "900",
          fontFamily: "var(--font-game)"
        }}>
          <ArrowLeft size={16} /> 대시보드 화면
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Sliders size={16} className="text-emerald-800" />
          <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: "900", fontFamily: "var(--font-game)", letterSpacing: "0.5px" }}>
            ADMIN CONTROL
          </span>
        </div>
      </header>

      {/* STATE INDICATOR */}
      <div className="game-card" style={{
        padding: "10px 14px", 
        marginBottom: "1.5rem",
        background: isFirebaseConnected ? "#dcfce7" : "#fef9c3",
        borderWidth: "3px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.85rem",
        boxShadow: "0 4px 0 #1e293b"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isFirebaseConnected ? (
            <Database size={16} style={{ color: "#16a34a" }} />
          ) : (
            <AlertTriangle size={16} style={{ color: "#d97706" }} />
          )}
          <span style={{ fontWeight: "900", color: isFirebaseConnected ? "#15803d" : "#b45309", fontFamily: "var(--font-game)" }}>
            {isFirebaseConnected ? "Firebase 실시간 연동 진행 중" : "로컬 브로드캐스트 모드"}
          </span>
        </div>
        <button
          onClick={handleResetAll}
          style={{
            padding: "4px 10px",
            background: "#ef4444",
            color: "white",
            border: "2px solid #1e293b",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 0 #1e293b"
          }}
        >
          경주 전체 초기화 💣
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* ROW 1: Target Score & Manual Adjustment */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="admin-grid-cols">
          
          {/* Card: Target Score */}
          <section className="game-card" style={{ padding: "16px", background: "white", borderWidth: "3px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontFamily: "var(--font-game)", borderBottom: "2px dashed #e2e8f0", paddingBottom: "6px" }}>
              🏁 경주 목표치 변경
            </h3>
            <form onSubmit={handleSaveTarget} style={{ display: "flex", gap: "8px" }}>
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
                  fontWeight: "bold",
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
                  fontFamily: "var(--font-game)",
                  boxShadow: "0 2px 0 #1e293b",
                  cursor: "pointer"
                }}
              >
                목표 변경
              </button>
            </form>
          </section>

          {/* Card: Manual Score Adjustment */}
          <section className="game-card" style={{ padding: "16px", background: "white", borderWidth: "3px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontFamily: "var(--font-game)", borderBottom: "2px dashed #e2e8f0", paddingBottom: "6px" }}>
              ⚙️ 팀 점수 직접 가감 (수동 조정)
            </h3>
            
            <form onSubmit={handleAdjustScore} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Team Selector Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                {TEAMS.map(t => {
                  const isSel = selectedTeamId === t.teamId;
                  return (
                    <button
                      key={t.teamId}
                      type="button"
                      onClick={() => setSelectedTeamId(t.teamId)}
                      style={{
                        padding: "8px 2px",
                        background: isSel ? getTeamBadgeColor(t.teamId) : "#f1f5f9",
                        color: isSel ? "white" : "#1e293b",
                        border: "2px solid #1e293b",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-game)",
                        cursor: "pointer",
                        transform: isSel ? "translateY(2px)" : "none",
                        boxShadow: isSel ? "none" : "0 2px 0 #1e293b"
                      }}
                    >
                      {t.teamId}팀
                    </button>
                  );
                })}
              </div>

              {/* Adjustment Points input */}
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="number"
                  value={adjPoints}
                  onChange={(e) => setAdjPoints(e.target.value)}
                  placeholder="예: 10 또는 -15"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "#f8fafc",
                    border: "2px solid #1e293b",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    color: "#1e293b"
                  }}
                />
                <button
                  type="submit"
                  disabled={isAdjusting}
                  style={{
                    padding: "8px 16px",
                    background: "#3b82f6",
                    color: "white",
                    border: "2px solid #1e293b",
                    borderRadius: "8px",
                    fontWeight: "900",
                    fontFamily: "var(--font-game)",
                    boxShadow: "0 2px 0 #1e293b",
                    cursor: "pointer"
                  }}
                >
                  {isAdjusting ? "조정 중..." : "점수 반영"}
                </button>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                * 점수를 차감하고 싶다면 마이너스 기호(-)를 붙여 입력해 주세요. (예: -15)
              </span>
            </form>
          </section>
        </div>

        {/* Firebase Config Container */}
        <section className="game-card" style={{ padding: "16px", background: "white", borderWidth: "3px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontFamily: "var(--font-game)", borderBottom: "2px dashed #e2e8f0", paddingBottom: "6px" }}>
            🔌 Firebase 실시간 동기화 설정
          </h3>
          <form onSubmit={handleSaveFirebase} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="admin-grid-cols">
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#475569", marginBottom: "4px" }}>API Key</label>
                <input 
                  type="text"
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "#f8fafc", border: "2px solid #1e293b", borderRadius: "8px", fontSize: "0.8rem", color: "#1e293b" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#475569", marginBottom: "4px" }}>Database URL</label>
                <input 
                  type="text"
                  value={fbDbUrl}
                  onChange={(e) => setFbDbUrl(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "#f8fafc", border: "2px solid #1e293b", borderRadius: "8px", fontSize: "0.8rem", color: "#1e293b" }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#475569", marginBottom: "4px" }}>Project ID (Option)</label>
              <input 
                type="text"
                value={fbProjectId}
                onChange={(e) => setFbProjectId(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "#f8fafc", border: "2px solid #1e293b", borderRadius: "8px", fontSize: "0.8rem", color: "#1e293b" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#10b981",
                  color: "white",
                  border: "2px solid #1e293b",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  boxShadow: "0 2px 0 #1e293b",
                  cursor: "pointer"
                }}
              >
                저장 및 실시간 연동
              </button>
              {getSavedFirebaseConfig() && (
                <button
                  type="button"
                  onClick={handleClearFirebase}
                  style={{
                    padding: "10px 14px",
                    background: "#ef4444",
                    color: "white",
                    border: "2px solid #1e293b",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 0 #1e293b",
                    cursor: "pointer"
                  }}
                >
                  로컬 전환
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Submissions Detail Control */}
        <section className="game-card" style={{ padding: "16px", background: "white", borderWidth: "3px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px dashed #e2e8f0", paddingBottom: "6px" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontFamily: "var(--font-game)" }}>
              📋 점수 제출 이력 관리
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "bold" }}>
              총 {filteredSubmissions.length}건
            </span>
          </div>

          {/* Filter Chips */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px" }}>
            <button
              onClick={() => setFilterTeamId("all")}
              style={{
                padding: "6px 12px",
                background: filterTeamId === "all" ? "#1e293b" : "#f1f5f9",
                color: filterTeamId === "all" ? "white" : "#1e293b",
                border: "2px solid #1e293b",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              전체
            </button>
            {[1, 2, 3, 4, 5].map(id => (
              <button
                key={id}
                onClick={() => setFilterTeamId(id)}
                style={{
                  padding: "6px 12px",
                  background: filterTeamId === id ? getTeamBadgeColor(id) : "#f1f5f9",
                  color: filterTeamId === id ? "white" : "#1e293b",
                  border: "2px solid #1e293b",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                {id}팀
              </button>
            ))}
          </div>

          {/* Submissions list */}
          {filteredSubmissions.length === 0 ? (
            <p style={{ padding: "2rem 1rem", fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>
              조회할 제출 기록이 없습니다.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              
              {/* Responsive Table for PC / Card format for Mobile */}
              <div className="mobile-hide">
                <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse", color: "#475569" }}>
                  <thead>
                    <tr style={{ background: "#e2e8f0", borderBottom: "2px solid #1e293b", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>팀</th>
                      <th style={{ padding: "8px" }}>미션 내역</th>
                      <th style={{ padding: "8px" }}>점수</th>
                      <th style={{ padding: "8px" }}>시점</th>
                      <th style={{ padding: "8px", width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.slice().reverse().map((sub, i) => (
                      <tr key={sub.id || i} style={{ borderBottom: "1px solid #cbd5e1" }}>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>
                          <span style={{ 
                            background: getTeamBadgeColor(sub.teamId), 
                            color: "white", 
                            padding: "2px 6px", 
                            borderRadius: "4px" 
                          }}>
                            {sub.teamId}팀
                          </span>
                        </td>
                        <td style={{ padding: "8px" }}>{sub.missionName} {sub.count > 1 ? `(${sub.count}회)` : ""}</td>
                        <td style={{ padding: "8px", color: sub.totalPoints > 0 ? "#16a34a" : "#ef4444", fontWeight: "bold" }}>
                          {sub.totalPoints > 0 ? `+${sub.totalPoints}` : sub.totalPoints}점
                        </td>
                        <td style={{ padding: "8px", fontSize: "0.75rem", color: "#94a3b8" }}>
                          {new Date(sub.submittedAt).toLocaleTimeString("ko-KR", { hour12: false })}
                        </td>
                        <td style={{ padding: "8px" }}>
                          <button 
                            onClick={() => {
                              if(window.confirm(`[${sub.teamId}팀] ${sub.missionName} 건을 삭제하겠습니까?`)) {
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
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card style view */}
              <div className="pc-hide" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredSubmissions.slice().reverse().map((sub, i) => (
                  <div key={sub.id || i} className="game-card" style={{
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderWidth: "2px",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ 
                          background: getTeamBadgeColor(sub.teamId), 
                          color: "white", 
                          padding: "1px 5px", 
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "bold"
                        }}>
                          {sub.teamId}팀
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          {new Date(sub.submittedAt).toLocaleTimeString("ko-KR", { hour12: false })}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#1e293b", fontWeight: "bold" }}>
                        {sub.missionName}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="digital-font" style={{ 
                        fontSize: "0.95rem", 
                        fontWeight: "bold", 
                        color: sub.totalPoints > 0 ? "#16a34a" : "#ef4444" 
                      }}>
                        {sub.totalPoints > 0 ? `+${sub.totalPoints}` : sub.totalPoints}점
                      </span>
                      <button 
                        onClick={() => {
                          if(window.confirm(`[${sub.teamId}팀] ${sub.missionName} 건을 삭제하겠습니까?`)) {
                            deleteSubmission(sub.id);
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px"
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </section>

      </div>
    </div>
  );
};
