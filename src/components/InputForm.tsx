import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, ChevronUp, Plus, Minus, 
  Send, AlertTriangle, ArrowLeft, RefreshCw, Smartphone, Lock, X
} from "lucide-react";
import { submitScore, isFirebaseActive } from "../firebase";
import { MISSION_CATEGORIES, TEAMS, DEADLINE_TIMESTAMP } from "../types";

// 팀별 비밀번호
const TEAM_PASSWORDS: Record<number, string> = {
  1: "0314",
  2: "0315",
  3: "0316",
  4: "0317",
  5: "0318",
};

export const InputForm: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [unlockedTeamId, setUnlockedTeamId] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("basic_missions");
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Track counts of each mission
  const [missionCounts, setMissionCounts] = useState<{ [key: string]: number }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [timeLeftText, setTimeLeftText] = useState("");
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Sync deadline and firebase state
  useEffect(() => {
    const checkStatus = () => {
      const now = Date.now();
      const diff = DEADLINE_TIMESTAMP - now;
      setIsFirebaseConnected(isFirebaseActive());

      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeftText("경기 종료! (점수 입력 차단됨)");
      } else {
        setIsEnded(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (num: number) => String(num).padStart(2, "0");
        setTimeLeftText(`마감까지 남은 시간: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    checkStatus();
    const timer = setInterval(checkStatus, 1000);
    return () => clearInterval(timer);
  }, []);

  // Password gate helpers
  const openPasswordModal = (teamId: number) => {
    setSelectedTeamId(teamId);
    setPasswordInput("");
    setPasswordError(false);
    setShakeError(false);
    setShowPasswordModal(true);
    // Focus after render
    setTimeout(() => passwordInputRef.current?.focus(), 80);
  };

  const confirmPassword = () => {
    if (passwordInput === TEAM_PASSWORDS[selectedTeamId!]) {
      setUnlockedTeamId(selectedTeamId);
      setMissionCounts({});
      setPasswordError(false);
      setShowPasswordModal(false);
    } else {
      setPasswordError(true);
      setShakeError(true);
      setPasswordInput("");
      setTimeout(() => setShakeError(false), 500);
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmPassword();
    if (e.key === "Escape") setShowPasswordModal(false);
  };

  const incrementCount = (missionId: string) => {
    if (isEnded) return;
    setMissionCounts(prev => ({
      ...prev,
      [missionId]: (prev[missionId] || 0) + 1
    }));
  };

  const decrementCount = (missionId: string) => {
    if (isEnded) return;
    setMissionCounts(prev => ({
      ...prev,
      [missionId]: Math.max(0, (prev[missionId] || 0) - 1)
    }));
  };

  // activeTeamId: 실제로 미션이 활성화된 팀
  const activeTeamId = unlockedTeamId ?? 1;

  const calculateTotalPoints = () => {
    let sum = 0;
    MISSION_CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        const count = missionCounts[item.id] || 0;
        sum += item.points * count;
      });
    });
    return sum;
  };

  // Submit to Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEnded) {
      alert("경기가 종료되어 데이터를 제출할 수 없습니다.");
      return;
    }

    const totalPoints = calculateTotalPoints();
    if (totalPoints === 0) {
      alert("최소 1개 이상의 미션 횟수를 선택해 주세요.");
      return;
    }

    if (Date.now() > DEADLINE_TIMESTAMP) {
      setIsEnded(true);
      alert("경기가 종료되어 점수 제출이 차단되었습니다.");
      return;
    }

    const team = TEAMS.find(t => t.teamId === activeTeamId);
    if (!team) return;

    if (!window.confirm(`[${team.teamName}]에 총 +${totalPoints}점을 제출하겠습니까?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      let submitCount = 0;
      for (const cat of MISSION_CATEGORIES) {
        for (const item of cat.items) {
          const count = missionCounts[item.id] || 0;
          if (count > 0) {
            const res = await submitScore(
              activeTeamId,
              team.teamName,
              item.id,
              item.name,
              item.points,
              count,
              "leader"
            );
            if (!res.success) {
              throw new Error(res.error || "제출 중 에러가 발생했습니다.");
            }
            submitCount++;
          }
        }
      }

      if (submitCount > 0) {
        alert("점수가 성공적으로 대시보드에 연동되었습니다!");
        setMissionCounts({});
      }
    } catch (err: any) {
      alert(`제출 실패: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamColor = (teamId: number | null) => {
    switch (teamId) {
      case 1: return "var(--team1-color)";
      case 2: return "var(--team2-color)";
      case 3: return "var(--team3-color)";
      case 4: return "var(--team4-color)";
      case 5: return "var(--team5-color)";
      default: return "#1e293b";
    }
  };

  return (
    <div style={{ 
      maxWidth: "520px", 
      margin: "0 auto", 
      padding: "1.5rem 1rem", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      background: "#f0f9ff" /* Light sky blue background */
    }}>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.72)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)"
        }}>
          <div
            style={{
              background: "#ffffff",
              border: "4px solid #1e293b",
              borderRadius: "20px",
              boxShadow: "0 8px 0 #1e293b",
              padding: "32px 28px 24px",
              width: "min(340px, 90vw)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              animation: shakeError ? "shake 0.4s ease" : undefined,
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "40px", height: "40px",
                  background: getTeamColor(selectedTeamId),
                  borderRadius: "10px",
                  border: "3px solid #1e293b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem"
                }}>🔒</div>
                <div>
                  <div style={{ fontFamily: "var(--font-game)", fontWeight: "900", fontSize: "1rem", color: "#1e293b" }}>
                    {selectedTeamId}팀 비밀번호
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>4자리 숫자를 입력하세요</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "2px solid #1e293b",
                  borderRadius: "8px",
                  width: "32px", height: "32px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* PIN input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                ref={passwordInputRef}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={passwordInput}
                onChange={e => {
                  setPasswordError(false);
                  setPasswordInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                }}
                onKeyDown={handlePasswordKeyDown}
                placeholder="••••"
                style={{
                  textAlign: "center",
                  fontSize: "2rem",
                  letterSpacing: "0.5em",
                  padding: "14px",
                  border: passwordError ? "3px solid #ef4444" : "3px solid #1e293b",
                  borderRadius: "12px",
                  outline: "none",
                  fontFamily: "var(--font-game)",
                  color: passwordError ? "#ef4444" : "#1e293b",
                  background: passwordError ? "#fef2f2" : "#f8fafc",
                  boxShadow: passwordError ? "0 3px 0 #ef4444" : "0 3px 0 #1e293b",
                  transition: "all 0.15s"
                }}
              />
              {passwordError && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  color: "#ef4444", fontSize: "0.82rem", fontWeight: "800",
                  fontFamily: "var(--font-game)"
                }}>
                  <AlertTriangle size={14} /> 비밀번호가 틀렸어요!
                </div>
              )}
            </div>

            {/* Confirm button */}
            <button
              type="button"
              onClick={confirmPassword}
              disabled={passwordInput.length < 4}
              style={{
                width: "100%",
                padding: "14px",
                background: passwordInput.length === 4 ? getTeamColor(selectedTeamId) : "#e2e8f0",
                color: passwordInput.length === 4 ? "#ffffff" : "#94a3b8",
                border: "3px solid #1e293b",
                borderRadius: "12px",
                fontWeight: "900",
                fontSize: "1rem",
                fontFamily: "var(--font-game)",
                cursor: passwordInput.length === 4 ? "pointer" : "default",
                boxShadow: passwordInput.length === 4 ? "0 4px 0 #1e293b" : "none",
                transform: passwordInput.length === 4 ? "none" : "translateY(4px)",
                transition: "all 0.1s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              <Lock size={16} /> 잠금 해제
            </button>
          </div>
        </div>
      )}
      
      {/* HEADER NAVIGATION */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1rem",
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
          <Smartphone size={16} className="text-slate-800" />
          <span style={{ fontSize: "0.85rem", color: "#1e293b", fontWeight: "900", fontFamily: "var(--font-game)", letterSpacing: "0.5px" }}>
            SCORE INPUT
          </span>
        </div>
      </header>

      {/* SYSTEM TIMING ALERT BANNER */}
      <div className="game-card" style={{ 
        padding: "10px 14px", 
        marginBottom: "1.2rem",
        background: isEnded ? "#fee2e2" : "#fef9c3",
        borderWidth: "3px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.85rem",
        boxShadow: "0 4px 0 #1e293b"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} style={{ color: isEnded ? "#ef4444" : "#d97706" }} />
          <span style={{ fontWeight: "900", color: isEnded ? "#b91c1c" : "#a16207", fontFamily: "var(--font-game)" }}>
            {timeLeftText}
          </span>
        </div>
        <span style={{ 
          fontSize: "0.75rem", 
          background: "#1e293b",
          color: "#fff",
          padding: "2px 8px", 
          borderRadius: "6px",
          fontWeight: "bold"
        }}>
          {isFirebaseConnected ? "실시간 연동" : "로컬 모드"}
        </span>
      </div>

      {/* INPUT FORM CONTENT */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem", flex: 1 }}>
        
        {/* TEAM SELECTION 3D CHIPS */}
        <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ color: "#1e293b", fontFamily: "var(--font-game)", fontWeight: "900", fontSize: "0.9rem", alignSelf: "flex-start" }}>
            1단계: 우리 팀을 선택하고 비밀번호를 입력하세요!
          </span>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
            {TEAMS.map((t) => {
              const isUnlocked = unlockedTeamId === t.teamId;
              const activeColor = getTeamColor(t.teamId);
              
              return (
                <button
                  key={t.teamId}
                  type="button"
                  onClick={() => openPasswordModal(t.teamId)}
                  disabled={isEnded}
                  style={{
                    padding: "12px 4px 8px 4px",
                    background: isUnlocked ? activeColor : "#ffffff",
                    border: `3px solid ${isUnlocked ? activeColor : "#1e293b"}`,
                    color: isUnlocked ? "#ffffff" : "#1e293b",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    fontWeight: "900",
                    fontFamily: "var(--font-game)",
                    cursor: "pointer",
                    transition: "all 0.08s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    transform: isUnlocked ? "translateY(3px)" : "translateY(0)",
                    boxShadow: isUnlocked ? `0 1px 0 ${activeColor}` : "0 4px 0 #1e293b",
                    opacity: isEnded ? 0.5 : 1,
                    position: "relative"
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>{isUnlocked ? "🚂" : "🔒"}</span>
                  <span>{t.teamId}팀</span>
                  {isUnlocked && (
                    <span style={{
                      position: "absolute",
                      top: "-6px", right: "-6px",
                      background: "#22c55e",
                      border: "2px solid #1e293b",
                      borderRadius: "50%",
                      width: "16px", height: "16px",
                      fontSize: "0.55rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: "900"
                    }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Unlock status hint */}
          {unlockedTeamId === null ? (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 12px",
              background: "#fef9c3",
              border: "2px solid #fbbf24",
              borderRadius: "10px",
              fontSize: "0.8rem", fontWeight: "800", color: "#92400e",
              fontFamily: "var(--font-game)"
            }}>
              <Lock size={13} /> 팀을 선택하면 비밀번호 입력창이 열려요
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 12px",
              background: "#dcfce7",
              border: `2px solid ${getTeamColor(unlockedTeamId)}`,
              borderRadius: "10px",
              fontSize: "0.8rem", fontWeight: "800", color: "#166534",
              fontFamily: "var(--font-game)"
            }}>
              ✅ {unlockedTeamId}팀 인증 완료! 미션을 입력해 주세요.
            </div>
          )}
        </section>

        {/* ACCORDION CATEGORIES – only shown after unlock */}
        <section style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, opacity: unlockedTeamId === null ? 0.35 : 1, pointerEvents: unlockedTeamId === null ? "none" : "auto", transition: "opacity 0.3s" }}>
          <span style={{ color: "#1e293b", fontFamily: "var(--font-game)", fontWeight: "900", fontSize: "0.9rem", alignSelf: "flex-start" }}>
            2단계: 미션 횟수를 설정해 주세요!
          </span>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {MISSION_CATEGORIES.map((category) => {
              const isOpen = expandedCategory === category.key;
              const activeColor = getTeamColor(activeTeamId);
              const categoryCountSum = category.items.reduce((sum, item) => sum + (missionCounts[item.id] || 0), 0);

              return (
                <div 
                  key={category.key} 
                  className="game-card" 
                  style={{ 
                    borderWidth: "3px",
                    borderColor: isOpen ? activeColor : "#1e293b",
                    borderRadius: "12px",
                    background: "#ffffff",
                    overflow: "hidden",
                    // Apply slightly smaller shadow to fit well
                    boxShadow: isOpen ? `0 4px 0 ${activeColor}` : "0 4px 0 #1e293b"
                  }}
                >
                  {/* Toggle header bar */}
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isOpen ? "" : category.key)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: isOpen ? "rgba(241, 245, 249, 0.5)" : "#ffffff",
                      border: "none",
                      color: "#1e293b",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: "900", fontSize: "0.95rem", fontFamily: "var(--font-game)" }}>{category.title}</span>
                      {categoryCountSum > 0 && (
                        <span style={{ 
                          background: activeColor, 
                          color: "#ffffff", 
                          fontSize: "0.75rem", 
                          padding: "2px 8px", 
                          borderRadius: "12px",
                          fontWeight: "bold",
                          fontFamily: "var(--font-game)"
                        }}>
                          {categoryCountSum}건
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {/* List of items */}
                  {isOpen && (
                    <div style={{ 
                      padding: "8px 12px", 
                      borderTop: "3px solid #1e293b",
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                      {category.items.map((item) => {
                        const count = missionCounts[item.id] || 0;
                        
                        return (
                          <div 
                            key={item.id} 
                            style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center",
                              padding: "8px",
                              borderBottom: "2px dashed #e2e8f0",
                              fontSize: "0.85rem"
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ color: "#1e293b", fontWeight: "800", fontSize: "0.9rem" }}>{item.name}</span>
                              <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: "bold" }}>건당 +{item.points}점</span>
                            </div>

                            {/* Counter Controls */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <button
                                type="button"
                                onClick={() => decrementCount(item.id)}
                                disabled={count === 0 || isEnded}
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "50%",
                                  background: count > 0 ? "#fee2e2" : "#e2e8f0",
                                  border: "2px solid #1e293b",
                                  color: count > 0 ? "#ef4444" : "#94a3b8",
                                  cursor: count > 0 && !isEnded ? "pointer" : "default",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: count > 0 ? "0 2px 0 #1e293b" : "none",
                                  transform: count > 0 ? "none" : "translateY(2px)"
                                }}
                              >
                                <Minus size={14} strokeWidth={3} />
                              </button>

                              <span className="digital-font" style={{ 
                                width: "22px", 
                                textAlign: "center", 
                                fontSize: "1.1rem",
                                fontWeight: "bold",
                                color: count > 0 ? activeColor : "#94a3b8"
                              }}>
                                {count}
                              </span>

                              <button
                                type="button"
                                onClick={() => incrementCount(item.id)}
                                disabled={isEnded}
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "50%",
                                  background: "#dbeafe",
                                  border: "2px solid #1e293b",
                                  color: "#2563eb",
                                  cursor: isEnded ? "default" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 2px 0 #1e293b",
                                  transform: isEnded ? "translateY(2px)" : "none"
                                }}
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM ACTION BUTTON BAR */}
        <div className="game-card" style={{
          padding: "16px",
          background: "#ffffff",
          borderWidth: "4px",
          borderColor: getTeamColor(activeTeamId),
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "auto",
          boxShadow: `0 6px 0 ${getTeamColor(activeTeamId)}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "bold" }}>대상 팀:</span>
              <strong style={{ display: "block", fontSize: "0.95rem", color: getTeamColor(activeTeamId), fontFamily: "var(--font-game)", fontWeight: "900" }}>
                {unlockedTeamId !== null ? TEAMS.find(t => t.teamId === activeTeamId)?.teamName : "팀 미선택"}
              </strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "bold" }}>제출 득점:</span>
              <span className="digital-font" style={{ 
                display: "block", 
                fontSize: "1.5rem", 
                fontWeight: "bold",
                color: calculateTotalPoints() > 0 ? "#16a34a" : "#94a3b8" 
              }}>
                +{calculateTotalPoints()}점
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isEnded || isSubmitting || calculateTotalPoints() === 0 || unlockedTeamId === null}
            style={{
              width: "100%",
              padding: "14px",
              background: isEnded || unlockedTeamId === null ? "#e2e8f0" : getTeamColor(activeTeamId),
              color: isEnded || unlockedTeamId === null ? "#94a3b8" : "#ffffff",
              border: "3px solid #1e293b",
              borderRadius: "12px",
              fontWeight: "900",
              fontSize: "1rem",
              fontFamily: "var(--font-game)",
              cursor: isEnded || isSubmitting || calculateTotalPoints() === 0 || unlockedTeamId === null ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              // Large 3D button effect
              boxShadow: !isEnded && calculateTotalPoints() > 0 && unlockedTeamId !== null ? "0 4px 0 #1e293b" : "none",
              transform: !isEnded && calculateTotalPoints() > 0 && unlockedTeamId !== null ? "none" : "translateY(4px)",
              transition: "all 0.1s",
              opacity: isEnded || calculateTotalPoints() === 0 || unlockedTeamId === null ? 0.6 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="animate-spin" size={18} /> 점수 전송 중...
              </>
            ) : isEnded ? (
              <>
                <AlertTriangle size={18} /> 입력 마감 (경기 종료)
              </>
            ) : (
              <>
                <Send size={18} /> 트랙으로 쏘기! 🚂
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
