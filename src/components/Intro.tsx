import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroProps {
  onStart: () => void;
}

export const Intro: React.FC<IntroProps> = ({ onStart }) => {
  const [isHornPlaying, setIsHornPlaying] = useState(false);
  const [triggerWhiteout, setTriggerWhiteout] = useState(false);

  // Synthesize realistic retro steam train whistle horn using Web Audio API
  const playTrainHorn = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // We mix 3 sawtooth oscillators to create a rich Minor-ish chord for the classic whistle
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const osc3 = audioCtx.createOscillator();
      
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(293.66, audioCtx.currentTime); // D4
      
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(349.23, audioCtx.currentTime); // F4
      
      osc3.type = "sawtooth";
      osc3.frequency.setValueAtTime(440.00, audioCtx.currentTime); // A4

      // Filter sweeps down a bit to emulate a physical pipe blowing
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 1.2);
      filter.Q.setValueAtTime(3, audioCtx.currentTime);

      // Volume envelope: rapid attack, sustained blast, long fading release
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.6);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc3.start();
      
      osc1.stop(audioCtx.currentTime + 1.7);
      osc2.stop(audioCtx.currentTime + 1.7);
      osc3.stop(audioCtx.currentTime + 1.7);
    } catch (e) {
      console.error("Whistle synthesis failed", e);
    }
  };

  const handleStart = () => {
    if (isHornPlaying) return;
    setIsHornPlaying(true);
    
    // Play the amazing synthetic train horn
    playTrainHorn();

    // Trigger whiteout overlay flash
    setTimeout(() => {
      setTriggerWhiteout(true);
    }, 700);

    // Callback to load main dashboard view
    setTimeout(() => {
      onStart();
    }, 1500);
  };

  // Sparkle magical stars array for rich background particle atmosphere
  const stars = Array.from({ length: 35 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    scale: Math.random() * 0.9 + 0.4,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 3
  }));

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 9999,
      overflow: "hidden",
      backgroundColor: "#000"
    }}>
      
      {/* KEN BURNS ANIMATED IMAGE BACKGROUND */}
      <motion.div 
        initial={{ scale: 1 }}
        animate={{ scale: 1.07 }}
        transition={{ 
          duration: 12, 
          ease: "linear",
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url("/saebutrain.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          filter: "brightness(0.9) contrast(1.05)"
        }}
      />

      {/* AMBIENT SUNSET ORANGE FILTER */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "linear-gradient(to bottom, rgba(234, 88, 12, 0.15), rgba(124, 58, 237, 0.25))",
        mixBlendMode: "overlay",
        pointerEvents: "none",
        zIndex: 2
      }} />

      {/* FLOATING SPARKLING STARS */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 3 }}>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.9, 0],
              scale: [star.scale * 0.4, star.scale, star.scale * 0.4],
              y: [0, -35, 0]
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: "12px",
              height: "12px",
              background: star.id % 2 === 0 ? "#fef08a" : "#fed7aa", /* Alternating Gold & Soft Orange */
              clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              boxShadow: "0 0 10px rgba(254, 240, 138, 0.8)"
            }}
          />
        ))}
      </div>

      {/* CORE LOGO & BANNER GROUP */}
      <div style={{
        position: "absolute",
        top: "38vh", /* Adjusted to center nicely without characters */
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "600px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 5
      }}>
        {/* Main Whistle Logo Scale-up Animation */}
        <motion.div
          initial={{ scale: 0.2, y: 100, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 70, damping: 12, delay: 0.3 }}
          style={{ position: "relative", zIndex: 10 }}
        >
          {/* Glow shining styled text */}
          <h1 className="game-title-text" style={{
            fontSize: "4.5rem",
            fontWeight: "900",
            textAlign: "center",
            margin: 0,
            lineHeight: "1.1",
            color: "#fef08a", /* Very bright glowing yellow text */
            textShadow: `
              -4px -4px 0 #1e293b,  
               4px -4px 0 #1e293b,
              -4px  4px 0 #1e293b,
               4px  4px 0 #1e293b,
               0px  10px 0 rgba(30, 41, 59, 0.4)
            `
          }}>
            찾기 익스프레스
          </h1>
        </motion.div>

        {/* '강의실 쟁탈전' Ribbon spreading out widthwise */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 1.4 }}
          style={{
            marginTop: "1.2rem",
            background: "#15803d", /* green ribbon */
            border: "4px solid #1e293b",
            borderRadius: "10px",
            padding: "8px 36px",
            boxShadow: "0 6px 0 #1e293b, 0 8px 15px rgba(0,0,0,0.4)",
            transformOrigin: "center"
          }}
        >
          <span style={{ 
            fontFamily: "var(--font-game)", 
            color: "#fbbf24", 
            fontSize: "1.4rem", 
            fontWeight: "900",
            letterSpacing: "3px",
            textShadow: "-1px -1px 0 #1e293b, 1px -1px 0 #1e293b, -1px 1px 0 #1e293b, 1px 1px 0 #1e293b"
          }}>
            ★ 강의실 쟁탈전 ★
          </span>
        </motion.div>
      </div>

      {/* START ENGINE BUTTON AREA */}
      <div style={{
        position: "absolute",
        bottom: "10vh",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 5
      }}>
        <motion.button
          onClick={handleStart}
          disabled={isHornPlaying}
          animate={{ 
            scale: [1, 1.05, 1],
            y: [0, -3, 0]
          }}
          transition={{ 
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: "16px 36px",
            background: "#ea580c", /* Vibrant orange steam blast */
            color: "white",
            border: "4px solid #1e293b",
            borderRadius: "20px",
            fontSize: "1.3rem",
            fontWeight: "900",
            fontFamily: "var(--font-game)",
            cursor: "pointer",
            boxShadow: "0 6px 0 #1e293b, 0 10px 20px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            letterSpacing: "1px"
          }}
        >
          START ENGINE 🚂
        </motion.button>
      </div>

      {/* WHITEOUT TRANSITION OVERLAY */}
      <AnimatePresence>
        {triggerWhiteout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "#ffffff",
              zIndex: 99999,
              pointerEvents: "auto"
            }}
          />
        )}
      </AnimatePresence>

      {/* CSS Keyframes for Metallic shine */}
      <style>{`
        @keyframes shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};
