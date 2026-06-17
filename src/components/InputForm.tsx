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
  
  // Track count of each mission: { [missionId]: count }
  const [missionCounts, setMissionCounts] = useState<{ [key: string]: number }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [timeLeftText, setTimeLeftText] = useState("");
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Check deadline and firebase state
  useEffect(() => {
    const checkStatus = () => {
      const now = Date.now();
      const diff = DEADLINE_TIMESTAMP - now;
      setIsFirebaseConnected(isFirebaseActive());

      if (diff <= 0) {
        setIsEnded(true);
        setTimeLeftText("경기 종료 (데이터 입력이 차단되었습니다)");
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

  // Increment mission count
  const incrementCount = (missionId: string) => {
    if (isEnded) return;
    setMissionCounts(prev => ({
      ...prev,
      [missionId]: (prev[missionId] || 0) + 1
    }));
  };

  // Decrement mission count (bounded at 0)
  const decrementCount = (missionId: string) => {
    if (isEnded) return;
    setMissionCounts(prev => ({
      ...prev,
      [missionId]: Math.max(0, (prev[missionId] || 0) - 1)
    }));
  };

  // Calculate sum of selected points
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

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEnded) {
      alert("경기가 종료되어 데이터를 제출할 수 없습니다.");
      return;
    }

    const totalPoints = calculateTotalPoints();
    if (totalPoints === 0) {
      alert("최소 1개 이상의 미션 횟수를 입력해 주세요.");
      return;
    }

    // Double check local system time
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
      // Loop through all selected missions and submit them
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
              throw new Error(res.error || "제출 중 알 수 없는 에러 발생");
            }
            submitCount++;
          }
        }
      }

      if (submitCount > 0) {
        alert("점수가 성공적으로 대시보드에 연동되었습니다!");
        // Reset counts
        setMissionCounts({});
      }
    } catch (err: any) {
      alert(`제출에 실패했습니다: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamColorBorder = (teamId: number) => {
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
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "1rem", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* HEADER NAVIGATION */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "1rem",
        borderBottom: "1px solid #1e293b",
        paddingBottom: "10px"
      }}>
        <a href="?mode=dashboard" style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          color: "#94a3b8",
          fontSize: "0.85rem",
          textDecoration: "none",
          fontWeight: "600"
        }}>
          <ArrowLeft size={16} /> 대시보드 보기
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Smartphone size={16} className="text-blue-400" />
          <span className="display-font" style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: "700" }}>
            SUBMISSION PANEL
          </span>
        </div>
      </header>

      {/* CLOCK & SYSTEM DEADLINE ALERT BANNER */}
      <div className="cyber-card" style={{ 
        padding: "10px 14px", 
        marginBottom: "1.2rem",
        borderLeft: `4px solid ${isEnded ? "#ef4444" : "#eab308"}`,
        background: isEnded ? "rgba(239, 68, 68, 0.05)" : "rgba(234, 179, 8, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.8rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} style={{ color: isEnded ? "#ef4444" : "#eab308" }} />
          <span style={{ fontWeight: "600", color: isEnded ? "#ef4444" : "#eab308" }}>
            {timeLeftText}
          </span>
        </div>
        <span style={{ 
          fontSize: "0.7rem", 
          background: isFirebaseConnected ? "rgba(16, 185, 129, 0.15)" : "rgba(234, 179, 8, 0.15)",
          color: isFirebaseConnected ? "#10b981" : "#eab308",
          padding: "2px 6px",
          borderRadius: "4px"
        }}>
          {isFirebaseConnected ? "Firebase 실시간" : "로컬 브로드캐스트"}
        </span>
      </div>

      {/* SUBMISSION FORM */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem", flex: 1 }}>
        
        {/* TEAM CHIPS SELECTOR */}
        <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span className="cyber-badge" style={{ color: "#94a3b8", background: "rgba(30, 41, 59, 0.5)", alignSelf: "flex-start" }}>
            1단계: 제출 팀 선택
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
            {TEAMS.map((t) => {
              const isSelected = selectedTeamId === t.teamId;
              const activeColor = getTeamColorBorder(t.teamId);
              
              return (
                <button
                  key={t.teamId}
                  type="button"
                  onClick={() => setSelectedTeamId(t.teamId)}
                  disabled={isEnded}
                  style={{
                    padding: "10px 4px",
                    background: isSelected ? activeColor : "#0b1329",
                    border: `1px solid ${isSelected ? activeColor : "#1e293b"}`,
                    color: isSelected ? "#020617" : "#94a3b8",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    boxShadow: isSelected ? `0 0 10px ${activeColor}` : "none",
                    opacity: isEnded ? 0.5 : 1
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>🚂</span>
                  <span>{t.teamId}팀</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* MISSION CATEGORIES ACCORDION */}
        <section style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <span className="cyber-badge" style={{ color: "#94a3b8", background: "rgba(30, 41, 59, 0.5)", alignSelf: "flex-start" }}>
            2단계: 완수한 미션 횟수 조절
          </span>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {MISSION_CATEGORIES.map((category) => {
              const isOpen = expandedCategory === category.key;
              
              // Sum counts in this category
              const categoryCountSum = category.items.reduce((sum, item) => sum + (missionCounts[item.id] || 0), 0);

              return (
                <div 
                  key={category.key} 
                  className="cyber-card" 
                  style={{ 
                    border: `1px solid ${isOpen ? getTeamColorBorder(selectedTeamId) : "#1e293b"}`,
                    borderRadius: "8px" 
                  }}
                >
                  {/* Category Toggle Bar */}
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(isOpen ? "" : category.key)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(11, 19, 41, 0.8)",
                      border: "none",
                      color: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>{category.title}</span>
                      {categoryCountSum > 0 && (
                        <span style={{ 
                          background: getTeamColorBorder(selectedTeamId), 
                          color: "#020617", 
                          fontSize: "0.7rem", 
                          padding: "1px 6px", 
                          borderRadius: "10px",
                          fontWeight: "bold"
                        }}>
                          {categoryCountSum}건 선택됨
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {/* Category Items List */}
                  {isOpen && (
                    <div style={{ 
                      padding: "8px 12px", 
                      borderTop: "1px solid #1e293b",
                      background: "#020617",
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
                              padding: "6px 8px",
                              borderBottom: "1px solid rgba(30, 41, 59, 0.3)",
                              fontSize: "0.85rem"
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ color: "#e2e8f0", fontWeight: "600" }}>{item.name}</span>
                              <span style={{ color: "#64748b", fontSize: "0.75rem" }}>개당 +{item.points}점</span>
                            </div>

                            {/* Plus / Minus Counter Group */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <button
                                type="button"
                                onClick={() => decrementCount(item.id)}
                                disabled={count === 0 || isEnded}
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: count > 0 ? "rgba(239, 68, 68, 0.15)" : "#0b1329",
                                  border: `1px solid ${count > 0 ? "rgba(239, 68, 68, 0.4)" : "#1e293b"}`,
                                  color: count > 0 ? "#ef4444" : "#475569",
                                  cursor: count > 0 && !isEnded ? "pointer" : "default",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <Minus size={14} />
                              </button>

                              <span className="digital-font" style={{ 
                                width: "20px", 
                                textAlign: "center", 
                                fontSize: "1.05rem",
                                fontWeight: "bold",
                                color: count > 0 ? getTeamColorBorder(selectedTeamId) : "#475569"
                              }}>
                                {count}
                              </span>

                              <button
                                type="button"
                                onClick={() => incrementCount(item.id)}
                                disabled={isEnded}
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: "rgba(59, 130, 246, 0.15)",
                                  border: "1px solid rgba(59, 130, 246, 0.4)",
                                  color: "#60a5fa",
                                  cursor: isEnded ? "default" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <Plus size={14} />
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

        {/* BOTTOM FLOATING SCORE ACTION BAR */}
        <div className="cyber-card" style={{
          padding: "14px",
          background: "linear-gradient(135deg, #0b1329 0%, #060a16 100%)",
          borderTop: `2px solid ${getTeamColorBorder(selectedTeamId)}`,
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>선택한 팀:</span>
              <strong style={{ display: "block", fontSize: "0.9rem", color: getTeamColorBorder(selectedTeamId) }}>
                {TEAMS.find(t => t.teamId === selectedTeamId)?.teamName}
              </strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>합산 예정 점수:</span>
              <span className="digital-font" style={{ 
                display: "block", 
                fontSize: "1.4rem", 
                fontWeight: "bold",
                color: calculateTotalPoints() > 0 ? "#10b981" : "#475569" 
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
              padding: "12px",
              background: isEnded ? "#1e293b" : getTeamColorBorder(selectedTeamId),
              color: isEnded ? "#475569" : "#020617",
              border: "none",
              borderRadius: "6px",
              fontWeight: "800",
              fontSize: "0.95rem",
              cursor: isEnded || isSubmitting || calculateTotalPoints() === 0 ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: !isEnded && calculateTotalPoints() > 0 ? `0 0 15px ${getTeamColorBorder(selectedTeamId)}` : "none",
              transition: "all 0.2s",
              opacity: isEnded || calculateTotalPoints() === 0 ? 0.6 : 1
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="animate-spin" size={18} /> 제출 중...
              </>
            ) : isEnded ? (
              <>
                <AlertTriangle size={18} /> 입력 마감 (경기 종료)
              </>
            ) : (
              <>
                <Send size={18} /> 점수 제출하기
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
