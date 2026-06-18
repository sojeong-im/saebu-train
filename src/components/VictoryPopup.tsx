import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import type { TeamScore } from "../types";
import { RenderTeamTrain } from "./TrainSVGs";

/* ==========================================================================
   CANVAS CONFETTI PARTICLE SYSTEM
   ========================================================================== */
interface ConfettiProps {
  active: boolean;
}

export const ConfettiCanvas: React.FC<ConfettiProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Responsive canvas resizing
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Confetti colors
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#ec4899", "#06b6d4"];

    interface Particle {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 140;

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height, // Spawn above screen
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 4 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2
      });
    }

    // Animation frame loop
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Apply physics
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Reset if goes off screen bottom
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        // Half squares, half circles
        if (p.size > 10) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 999999
      }}
    />
  );
};

/* ==========================================================================
   VICTORY CHAMPIONSHIP POPUP
   ========================================================================== */
interface VictoryPopupProps {
  isOpen: boolean;
  sortedTeams: TeamScore[];
  onClose: () => void;
}

export const VictoryPopup: React.FC<VictoryPopupProps> = ({ isOpen, sortedTeams, onClose }) => {
  
  // Find highest score
  const maxScore = sortedTeams.length > 0 ? sortedTeams[0].score : 0;
  
  // Filter all teams that share the highest score (supports tie)
  const winners = sortedTeams.filter(t => t.score === maxScore && t.score > 0);
  
  const hasWinners = winners.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(4px)",
          zIndex: 999998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          {/* Confetti Animation */}
          <ConfettiCanvas active={isOpen} />

          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="game-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderWidth: "6px",
              borderColor: "#1e293b",
              borderRadius: "24px",
              padding: "2rem 1.5rem",
              boxShadow: "0 12px 0 #1e293b",
              position: "relative",
              textAlign: "center"
            }}
          >
            {/* Header Title Banner */}
            <div style={{
              position: "absolute",
              top: "-24px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#ef4444",
              border: "4px solid #1e293b",
              borderRadius: "12px",
              padding: "6px 28px",
              color: "white",
              fontWeight: "900",
              fontFamily: "var(--font-game)",
              boxShadow: "0 4px 0 #1e293b",
              fontSize: "1.2rem",
              whiteSpace: "nowrap"
            }}>
              FINISH - 최종 승리팀
            </div>

            {/* Giant Trophy Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.12, 1],
                rotate: [0, 8, -8, 0]
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ margin: "1.5rem 0 0.5rem 0", display: "inline-block" }}
            >
              <Trophy size={72} style={{ color: "#f59e0b", filter: "drop-shadow(0 4px 0 #1e293b)" }} />
            </motion.div>

            {/* Winner Presentation */}
            {hasWinners ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "1rem" }}>
                <h3 style={{ fontSize: "1.4rem", fontFamily: "var(--font-game)", color: "#1e293b", margin: 0 }}>
                  축하합니다! 🏆
                </h3>
                
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "12px",
                  background: "#f8fafc",
                  border: "3px solid #1e293b",
                  borderRadius: "16px",
                  padding: "1.5rem 1rem",
                  boxShadow: "inset 0 4px 8px rgba(0,0,0,0.05)"
                }}>
                  {winners.map((winner, idx) => {
                    const isLast = idx === winners.length - 1;
                    return (
                      <div 
                        key={winner.teamId} 
                        style={{ 
                          display: "flex", 
                          flexDirection: "column",
                          alignItems: "center", 
                          gap: "10px",
                          borderBottom: (!isLast && winners.length > 1) ? "2px dashed #cbd5e1" : "none",
                          paddingBottom: (!isLast && winners.length > 1) ? "12px" : "0"
                        }}
                      >
                      {/* Train SVG display */}
                      <div style={{ height: "42px", transform: "scale(0.85)", display: "flex", alignItems: "center" }}>
                        <RenderTeamTrain teamId={winner.teamId} isMoving={false} />
                      </div>
                      
                      {/* Team Name badge */}
                      <span className="glow-text" style={{ 
                        fontFamily: "var(--font-game)", 
                        fontSize: "1.35rem",
                        color: winner.teamId === 1 ? "var(--team1-color)" : winner.teamId === 2 ? "var(--team2-color)" : winner.teamId === 3 ? "var(--team3-color)" : winner.teamId === 4 ? "var(--team4-color)" : "var(--team5-color)",
                        fontWeight: "900" 
                      }}>
                        {winner.teamName}
                      </span>
                      </div>
                    );
                  })}
                  
                  {/* Winning score indicator */}
                  <div style={{ 
                    fontFamily: "var(--font-mono)", 
                    fontSize: "1.2rem", 
                    fontWeight: "bold",
                    color: "#475569",
                    marginTop: "6px" 
                  }}>
                    최종 스코어: <strong style={{ color: "#ef4444" }}>{maxScore}점</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "2rem 0", color: "#64748b", fontWeight: "bold" }}>
                아직 득점한 팀이 없어 승리팀을 결정할 수 없습니다. 🚂
              </div>
            )}

            {/* Bottom buttons */}
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 28px",
                  background: "#1e293b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "900",
                  fontFamily: "var(--font-game)",
                  cursor: "pointer",
                  boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
                  transition: "all 0.1s"
                }}
              >
                닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
