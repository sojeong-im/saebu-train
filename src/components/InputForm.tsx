import React, { useState, useEffect } from "react";
import { 
  ChevronDown, ChevronUp, Plus, Minus, 
  Send, AlertTriangle, ArrowLeft, RefreshCw, Smartphone
} from "lucide-react";
import { submitScore, isFirebaseActive } from "../firebase";
import { MISSION_CATEGORIES, TEAMS, DEADLINE_TIMESTAMP } from "../types";

export const InputForm: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [expandedCategory, setExpandedCategory] = useState<string>("basic_missions");
  
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

    const team = TEAMS.find(t => t.teamId === selectedTeamId);
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
              selectedTeamId,
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

  const getTeamColor = (teamId: number) => {
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
            1단계: 완수 팀을 고르세요!
          </span>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
            {TEAMS.map((t) => {
              const isSelected = selectedTeamId === t.teamId;
              const activeColor = getTeamColor(t.teamId);
              
              return (
                <button
                  key={t.teamId}
                  type="button"
                  onClick={() => setSelectedTeamId(t.teamId)}
                  disabled={isEnded}
                  style={{
                    padding: "12px 4px 8px 4px",
                    background: isSelected ? activeColor : "#ffffff",
                    border: "3px solid #1e293b",
                    color: isSelected ? "#ffffff" : "#1e293b",
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
                    // Tactile 3D button click translation
                    transform: isSelected ? "translateY(3px)" : "translateY(0)",
                    boxShadow: isSelected ? "0 1px 0 #1e293b" : "0 4px 0 #1e293b",
                    opacity: isEnded ? 0.5 : 1
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>🚂</span>
                  <span>{t.teamId}팀</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ACCORDION CATEGORIES */}
        <section style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <span style={{ color: "#1e293b", fontFamily: "var(--font-game)", fontWeight: "900", fontSize: "0.9rem", alignSelf: "flex-start" }}>
            2단계: 미션 횟수를 설정해 주세요!
          </span>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {MISSION_CATEGORIES.map((category) => {
              const isOpen = expandedCategory === category.key;
              const activeColor = getTeamColor(selectedTeamId);
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
          borderColor: getTeamColor(selectedTeamId),
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "auto",
          boxShadow: `0 6px 0 ${getTeamColor(selectedTeamId)}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "bold" }}>대상 팀:</span>
              <strong style={{ display: "block", fontSize: "0.95rem", color: getTeamColor(selectedTeamId), fontFamily: "var(--font-game)", fontWeight: "900" }}>
                {TEAMS.find(t => t.teamId === selectedTeamId)?.teamName}
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
            disabled={isEnded || isSubmitting || calculateTotalPoints() === 0}
            style={{
              width: "100%",
              padding: "14px",
              background: isEnded ? "#e2e8f0" : getTeamColor(selectedTeamId),
              color: isEnded ? "#94a3b8" : "#ffffff",
              border: "3px solid #1e293b",
              borderRadius: "12px",
              fontWeight: "900",
              fontSize: "1rem",
              fontFamily: "var(--font-game)",
              cursor: isEnded || isSubmitting || calculateTotalPoints() === 0 ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              // Large 3D button effect
              boxShadow: !isEnded && calculateTotalPoints() > 0 ? "0 4px 0 #1e293b" : "none",
              transform: !isEnded && calculateTotalPoints() > 0 ? "none" : "translateY(4px)",
              transition: "all 0.1s",
              opacity: isEnded || calculateTotalPoints() === 0 ? 0.6 : 1
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
