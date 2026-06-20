import React from "react";

interface TrainProps {
  isMoving: boolean;
}

// 1팀: 파란색 클래식 증기기관차 + 황금색 별 무늬 (Blue Steam Train)
export const BlueClassicTrain: React.FC<TrainProps> = ({ isMoving }) => {
  const wheelClass = isMoving ? "spinning-wheel-fast" : "";
  return (
    <svg width="85" height="52" viewBox="0 0 85 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      {/* Cowcatcher / Front Grill */}
      <path d="M72 45L83 45L80 37L72 37Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
      
      {/* Cabin Roof & Body */}
      <path d="M4 16H24V37H4V16Z" fill="#1d4ed8" stroke="#1e293b" strokeWidth="2" />
      <path d="M2 12H26V16H2V12Z" fill="#1e3a8a" stroke="#1e293b" strokeWidth="2" />
      
      {/* Boiler Room (Long Front cylindrical body) */}
      <path d="M24 22H72V41H24V22Z" fill="#2563eb" stroke="#1e293b" strokeWidth="2" />
      {/* Boiler Front Cap */}
      <path d="M72 22C74.5 22 76 26.5 76 31.5C76 36.5 74.5 41 72 41V22Z" fill="#f59e0b" stroke="#1e293b" strokeWidth="2" />
      
      {/* Cabin Window */}
      <path d="M8 20H20V28H8V20Z" fill="#93c5fd" stroke="#1e293b" strokeWidth="1.5" />

      {/* Chimney (연기 나오는 굴뚝) */}
      <path d="M62 8H68L66 22H64L62 8Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
      <path d="M60 5H70V8H60V5Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />

      {/* Headlight */}
      <path d="M76 27L81 27L80 33L76 33Z" fill="#fbbf24" />
      <circle cx="81" cy="30" r="2.5" fill="#fff" />
      {/* Light ray if moving */}
      {isMoving && (
        <path d="M82 28L98 22V38L82 32Z" fill="url(#yellow-glow)" opacity="0.35" />
      )}

      {/* Golden Star Emblem (황금색 별 무늬) */}
      <path d="M48 27L49.5 30.5L53 31L50.5 33.5L51 37L48 35.2L45 37L45.5 33.5L43 31L46.5 30.5L48 27Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />

      {/* Pistons / Rod connecting wheels */}
      <line x1="18" y1="44" x2="60" y2="44" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="44" x2="60" y2="38" stroke="#cbd5e1" strokeWidth="2" />

      {/* Wheels (바퀴들) */}
      <g className={wheelClass} style={{ transformOrigin: "18px 44px" }}>
        <circle cx="18" cy="44" r="7" fill="#1e293b" stroke="#fff" strokeWidth="2" />
        <circle cx="18" cy="44" r="3" fill="#cbd5e1" />
        <line x1="18" y1="37" x2="18" y2="51" stroke="#fff" strokeWidth="1.2" />
        <line x1="11" y1="44" x2="25" y2="44" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "38px 44px" }}>
        <circle cx="38" cy="44" r="7" fill="#1e293b" stroke="#fff" strokeWidth="2" />
        <circle cx="38" cy="44" r="3" fill="#cbd5e1" />
        <line x1="38" y1="37" x2="38" y2="51" stroke="#fff" strokeWidth="1.2" />
        <line x1="31" y1="44" x2="45" y2="44" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "58px 44px" }}>
        <circle cx="58" cy="44" r="7" fill="#1e293b" stroke="#fff" strokeWidth="2" />
        <circle cx="58" cy="44" r="3" fill="#cbd5e1" />
        <line x1="58" y1="37" x2="58" y2="51" stroke="#fff" strokeWidth="1.2" />
        <line x1="51" y1="44" x2="65" y2="44" stroke="#fff" strokeWidth="1.2" />
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="yellow-glow" x1="82" y1="30" x2="98" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="1" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// 2팀: 빨간색 날렵한 초고속 열차 + 황금색 날개 무늬 (Red Bullet Train)
export const RedBulletTrain: React.FC<TrainProps> = ({ isMoving }) => {
  const wheelClass = isMoving ? "spinning-wheel-fast" : "";
  return (
    <svg width="85" height="52" viewBox="0 0 85 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      {/* Sleek Aerodynamic Body */}
      <path d="M2 18C2 18 10 14 36 14C62 14 74 20 82 28C84 30 84.5 34 83 37C80 43 74 43 70 43H2V18Z" fill="#dc2626" stroke="#1e293b" strokeWidth="2" />
      <path d="M2 32H70V43H2V32Z" fill="#991b1b" opacity="0.3" />

      {/* Front Windshield (날렵한 앞유리) */}
      <path d="M66 18C70 20 75 23 78 27C75 27 71 25 66 23V18Z" fill="#1e293b" />
      <path d="M67 19C70 21 73 23.5 75 26.5C72 26.5 69 25 67 23.5V19Z" fill="#93c5fd" />

      {/* Sleek Windows */}
      <path d="M12 20H22V24H12V20Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M28 20H38V24H28V20Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M44 20H54V24H44V20Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.5" />

      {/* Golden Wing Emblem (황금 날개 무늬) */}
      <g transform="translate(26, 26)">
        {/* Wing Backing */}
        <path d="M2 4C5 0 12 0 16 3C13 4 8 3 4 6L2 4Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        <path d="M0 6C3 2 9 2 12 5C9 6 6 5 2 8L0 6Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        {/* Core Jewel */}
        <circle cx="2" cy="5" r="2.5" fill="#f59e0b" />
      </g>

      {/* Lower Shroud hiding wheels partially */}
      <path d="M4 40H72V44H4V40Z" fill="#1e293b" />

      {/* Wheels (바퀴들 - 날렵하게 가려짐) */}
      <g className={wheelClass} style={{ transformOrigin: "16px 44px" }}>
        <circle cx="16" cy="44" r="5" fill="#475569" stroke="#fff" strokeWidth="1.5" />
        <line x1="16" y1="39" x2="16" y2="49" stroke="#fff" strokeWidth="1" />
        <line x1="11" y1="44" x2="21" y2="44" stroke="#fff" strokeWidth="1" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "30px 44px" }}>
        <circle cx="30" cy="44" r="5" fill="#475569" stroke="#fff" strokeWidth="1.5" />
        <line x1="30" y1="39" x2="30" y2="49" stroke="#fff" strokeWidth="1" />
        <line x1="25" y1="44" x2="35" y2="44" stroke="#fff" strokeWidth="1" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "44px 44px" }}>
        <circle cx="44" cy="44" r="5" fill="#475569" stroke="#fff" strokeWidth="1.5" />
        <line x1="44" y1="39" x2="44" y2="49" stroke="#fff" strokeWidth="1" />
        <line x1="39" y1="44" x2="49" y2="44" stroke="#fff" strokeWidth="1" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "58px 44px" }}>
        <circle cx="58" cy="44" r="5" fill="#475569" stroke="#fff" strokeWidth="1.5" />
        <line x1="58" y1="39" x2="58" y2="49" stroke="#fff" strokeWidth="1" />
        <line x1="53" y1="44" x2="63" y2="44" stroke="#fff" strokeWidth="1" />
      </g>
    </svg>
  );
};

// 3팀: 초록색 디젤기관차 + 노란색 번개 무늬 (Green Diesel Train)
export const GreenDieselTrain: React.FC<TrainProps> = ({ isMoving }) => {
  const wheelClass = isMoving ? "spinning-wheel-fast" : "";
  return (
    <svg width="85" height="52" viewBox="0 0 85 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      {/* Main Blocky Box Body */}
      <path d="M4 14H78V40H4V14Z" fill="#16a34a" stroke="#1e293b" strokeWidth="2.5" />
      
      {/* Front Nose (디젤기관차 앞 보닛) */}
      <path d="M78 22H83V40H78V22Z" fill="#15803d" stroke="#1e293b" strokeWidth="2" />
      <path d="M4 10H46V14H4V10Z" fill="#15803d" stroke="#1e293b" strokeWidth="1.5" />

      {/* Windows */}
      <path d="M54 18H62V25H54V18Z" fill="#93c5fd" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M66 18H74V25H66V18Z" fill="#93c5fd" stroke="#1e293b" strokeWidth="1.5" />

      {/* Vent grills (디젤 열 배출 그릴) */}
      <rect x="12" y="18" width="6" height="12" rx="1" fill="#1e293b" />
      <rect x="22" y="18" width="6" height="12" rx="1" fill="#1e293b" />
      <rect x="32" y="18" width="6" height="12" rx="1" fill="#1e293b" />

      {/* Yellow Lightning Emblem (노란색 번개 무늬) */}
      <path d="M45 18L40 26H44L41 33L49 23H44L45 18Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" />

      {/* Chimney (디젤 연기용 짧은 소음기) */}
      <rect x="16" y="6" width="6" height="5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />

      {/* Wheels */}
      <g className={wheelClass} style={{ transformOrigin: "18px 43px" }}>
        <circle cx="18" cy="43" r="6" fill="#1e293b" stroke="#fff" strokeWidth="2" />
        <circle cx="18" cy="43" r="2.5" fill="#94a3b8" />
        <line x1="18" y1="37" x2="18" y2="49" stroke="#fff" strokeWidth="1.2" />
        <line x1="12" y1="43" x2="24" y2="43" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "34px 43px" }}>
        <circle cx="34" cy="43" r="6" fill="#1e293b" stroke="#fff" strokeWidth="2" />
        <circle cx="34" cy="43" r="2.5" fill="#94a3b8" />
        <line x1="34" y1="37" x2="34" y2="49" stroke="#fff" strokeWidth="1.2" />
        <line x1="28" y1="43" x2="40" y2="43" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "50px 43px" }}>
        <circle cx="50" cy="43" r="6" fill="#1e293b" stroke="#fff" strokeWidth="2" />
        <circle cx="50" cy="43" r="2.5" fill="#94a3b8" />
        <line x1="50" y1="37" x2="50" y2="49" stroke="#fff" strokeWidth="1.2" />
        <line x1="44" y1="43" x2="56" y2="43" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "66px 43px" }}>
        <circle cx="66" cy="43" r="6" fill="#1e293b" stroke="#fff" strokeWidth="2" />
        <circle cx="66" cy="43" r="2.5" fill="#94a3b8" />
        <line x1="66" y1="37" x2="66" y2="49" stroke="#fff" strokeWidth="1.2" />
        <line x1="60" y1="43" x2="72" y2="43" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  );
};

// 4팀: 보라색 미래형 고속열차 + 노란색 배트 무늬 (Purple Bat Train)
export const PurpleFuturisticTrain: React.FC<TrainProps> = ({ isMoving }) => {
  const wheelClass = isMoving ? "spinning-wheel-fast" : "";
  return (
    <svg width="85" height="52" viewBox="0 0 85 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      {/* Cyber/Futuristic aerodynamic shell */}
      <path d="M2 24C2 24 16 10 42 10C68 10 76 16 83 24C86 27.5 86 33 83 36C78 41 72 41 68 41H2V24Z" fill="#7c3aed" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M2 32H70V41H2V32Z" fill="#5b21b6" opacity="0.35" />

      {/* Cyber Neon Lights (보라 미래느낌 테두리광) */}
      <path d="M10 16C30 14 50 14 62 18" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />

      {/* Cabin Shield Cockpit */}
      <path d="M68 17C73 19 79 23 81 26.5C76 26.5 73 25 68 23.5V17Z" fill="#1e293b" />
      <circle cx="75" cy="22" r="1.5" fill="#c084fc" />

      {/* Yellow Bat Emblem (노란 배트 무늬) */}
      <g transform="translate(30, 20)">
        {/* Bat Shape Outline */}
        <path d="M2 6C3 4 5 4 6 5C7 4 9 4 10 6C9 8 7 8 6 9C5 8 3 8 2 6Z" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1" />
        {/* Bat Wings */}
        <path d="M6 7L1 5C3 8 5 8 6 7Z" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1" />
        <path d="M6 7L11 5C9 8 7 8 6 7Z" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1" />
      </g>

      {/* Bottom skirts hiding wheels */}
      <path d="M4 38H72V43H4V38Z" fill="#1e293b" />

      {/* Wheels */}
      <g className={wheelClass} style={{ transformOrigin: "20px 43px" }}>
        <circle cx="20" cy="43" r="4.5" fill="#334155" stroke="#a78bfa" strokeWidth="1.5" />
        <line x1="20" y1="38.5" x2="20" y2="47.5" stroke="#a78bfa" strokeWidth="1" />
        <line x1="15.5" y1="43" x2="24.5" y2="43" stroke="#a78bfa" strokeWidth="1" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "36px 43px" }}>
        <circle cx="36" cy="43" r="4.5" fill="#334155" stroke="#a78bfa" strokeWidth="1.5" />
        <line x1="36" y1="38.5" x2="36" y2="47.5" stroke="#a78bfa" strokeWidth="1" />
        <line x1="31.5" y1="43" x2="40.5" y2="43" stroke="#a78bfa" strokeWidth="1" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "52px 43px" }}>
        <circle cx="52" cy="43" r="4.5" fill="#334155" stroke="#a78bfa" strokeWidth="1.5" />
        <line x1="52" y1="38.5" x2="52" y2="47.5" stroke="#a78bfa" strokeWidth="1" />
        <line x1="47.5" y1="43" x2="56.5" y2="43" stroke="#a78bfa" strokeWidth="1" />
      </g>
    </svg>
  );
};

// 5팀: 노란색/주황색 미니 증기기관차 + 하얀색 별 무늬 (Yellow/Orange Mini Train)
export const YellowMiniTrain: React.FC<TrainProps> = ({ isMoving }) => {
  const wheelClass = isMoving ? "spinning-wheel-fast" : "";
  return (
    <svg width="85" height="52" viewBox="0 0 85 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      {/* Toy-like compact classic train */}
      {/* Cab Body */}
      <path d="M6 14H28V38H6V14Z" fill="#f59e0b" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M4 10H30V14H4V10Z" fill="#d97706" stroke="#1e293b" strokeWidth="2" />

      {/* Boiler body */}
      <path d="M28 22H66V38H28V22Z" fill="#fbbf24" stroke="#1e293b" strokeWidth="2" />
      {/* Front Nose (둥근 오렌지 모자) */}
      <path d="M66 22C69 22 71 25.5 71 30C71 34.5 69 38 66 38V22Z" fill="#ea580c" stroke="#1e293b" strokeWidth="2" />

      {/* Cab Window */}
      <circle cx="17" cy="22" r="5" fill="#93c5fd" stroke="#1e293b" strokeWidth="1.5" />

      {/* Toy Chimney (귀여운 짧은 굴뚝) */}
      <path d="M52 10H58L57 22H53L52 10Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
      <circle cx="55" cy="8" r="3" fill="#ea580c" stroke="#0f172a" strokeWidth="1.5" />

      {/* White Star Emblem (하얀 별 무늬) */}
      <path d="M44 26L45 28.5L47.5 29L45.5 31L46 33.5L44 32.2L42 33.5L42.5 31L40.5 29L43 28.5L44 26Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />

      {/* Small Wheels */}
      <g className={wheelClass} style={{ transformOrigin: "16px 42px" }}>
        <circle cx="16" cy="42" r="6" fill="#475569" stroke="#fff" strokeWidth="2" />
        <circle cx="16" cy="42" r="2.5" fill="#f59e0b" />
        <line x1="16" y1="36" x2="16" y2="48" stroke="#fff" strokeWidth="1.2" />
        <line x1="10" y1="42" x2="22" y2="42" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "32px 42px" }}>
        <circle cx="32" cy="42" r="6" fill="#475569" stroke="#fff" strokeWidth="2" />
        <circle cx="32" cy="42" r="2.5" fill="#f59e0b" />
        <line x1="32" y1="36" x2="32" y2="48" stroke="#fff" strokeWidth="1.2" />
        <line x1="26" y1="42" x2="38" y2="42" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "48px 42px" }}>
        <circle cx="48" cy="42" r="6" fill="#475569" stroke="#fff" strokeWidth="2" />
        <circle cx="48" cy="42" r="2.5" fill="#f59e0b" />
        <line x1="48" y1="36" x2="48" y2="48" stroke="#fff" strokeWidth="1.2" />
        <line x1="42" y1="42" x2="54" y2="42" stroke="#fff" strokeWidth="1.2" />
      </g>
      <g className={wheelClass} style={{ transformOrigin: "60px 42px" }}>
        <circle cx="60" cy="42" r="6" fill="#475569" stroke="#fff" strokeWidth="2" />
        <circle cx="60" cy="42" r="2.5" fill="#f59e0b" />
        <line x1="60" y1="36" x2="60" y2="48" stroke="#fff" strokeWidth="1.2" />
        <line x1="54" y1="42" x2="66" y2="42" stroke="#fff" strokeWidth="1.2" />
      </g>
    </svg>
  );
};

interface RenderTrainProps {
  teamId: number;
  isMoving: boolean;
}

export const RenderTeamTrain: React.FC<RenderTrainProps> = ({ teamId, isMoving }) => {
  switch (teamId) {
    case 1:
      return <BlueClassicTrain isMoving={isMoving} />;
    case 2:
      return <RedBulletTrain isMoving={isMoving} />;
    case 3:
      return <GreenDieselTrain isMoving={isMoving} />;
    case 4:
      return <PurpleFuturisticTrain isMoving={isMoving} />;
    case 5:
      return <YellowMiniTrain isMoving={isMoving} />;
    default:
      return <BlueClassicTrain isMoving={isMoving} />;
  }
};
