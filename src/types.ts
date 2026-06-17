export interface MissionItem {
  id: string;
  name: string;
  points: number;
}

export interface MissionCategory {
  title: string;
  key: string;
  items: MissionItem[];
}

export interface TeamScore {
  teamId: number;
  teamName: string;
  colorClass: string;
  bgClass: string;
  glowClass: string;
  score: number;
  trainIcon: string;
}

export interface ScoreSubmission {
  id: string;
  teamId: number;
  teamName: string;
  missionId: string;
  missionName: string;
  points: number;
  count: number;
  totalPoints: number;
  submittedAt: number; // Server timestamp or Date.now()
  submitter: string; // "leader" or "admin"
}

export interface FirebaseConfigData {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 2026-06-20 20:00:00 KST (Asia/Seoul)
export const DEADLINE_TIMESTAMP = 1781982000000;

export const MISSION_DATA = {
  basic_missions: [
    { id: "b1", name: "섬김 모임 후 거점 밟기", points: 2 },
    { id: "b2", name: "말걸기 10회", points: 1 },
    { id: "b3", name: "스탑 1회", points: 3 },
    { id: "b4", name: "거점 인증샷", points: 1 },
    { id: "b5", name: "거점 밟기", points: 1 },
    { id: "b6", name: "지인 안부 연락 넣기", points: 1 },
    { id: "b7", name: "지인 피드백 1명", points: 3 }
  ],
  team_missions: [
    { id: "t1", name: "생티엠 1회 (전화 시도 포함)", points: 1 },
    { id: "t2", name: "티엠 (소모임, 노방 등) 1회", points: 1 },
    { id: "t3", name: "메리트티엠 1회", points: 1 }
  ],
  pioneer_missions: [
    { id: "p1", name: "개척지인 글 게시", points: 1 },
    { id: "p2", name: "개척지인 9양식지 완성", points: 5 }
  ],
  special_missions: [
    { id: "s1", name: "담당 팀장님 동명이인 타찾", points: 10 },
    { id: "s2", name: "지역장님 동명이인 타찾", points: 20 }
  ],
  find_missions: [
    { id: "f1", name: "신찾", points: 5 },
    { id: "f2", name: "합자 타찾", points: 20 },
    { id: "f3", name: "상예", points: 20 }
  ]
};

export const MISSION_CATEGORIES: MissionCategory[] = [
  { title: "기본 미션", key: "basic_missions", items: MISSION_DATA.basic_missions },
  { title: "팀 미션", key: "team_missions", items: MISSION_DATA.team_missions },
  { title: "개척 미션", key: "pioneer_missions", items: MISSION_DATA.pioneer_missions },
  { title: "특별 미션", key: "special_missions", items: MISSION_DATA.special_missions },
  { title: "찾기 미션", key: "find_missions", items: MISSION_DATA.find_missions }
];

export const TEAMS: Omit<TeamScore, 'score'>[] = [
  {
    teamId: 1,
    teamName: "1팀 (레드 익스프레스)",
    colorClass: "text-red-500",
    bgClass: "bg-red-600",
    glowClass: "shadow-red-500/50",
    trainIcon: "🚂"
  },
  {
    teamId: 2,
    teamName: "2팀 (블루 썬더)",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-600",
    glowClass: "shadow-blue-500/50",
    trainIcon: "🚂"
  },
  {
    teamId: 3,
    teamName: "3팀 (옐로우 볼릿)",
    colorClass: "text-yellow-500",
    bgClass: "bg-yellow-500",
    glowClass: "shadow-yellow-500/50",
    trainIcon: "🚂"
  },
  {
    teamId: 4,
    teamName: "4팀 (그린 스파이더)",
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-600",
    glowClass: "shadow-emerald-500/50",
    trainIcon: "🚂"
  },
  {
    teamId: 5,
    teamName: "5팀 (퍼플 코멧)",
    colorClass: "text-purple-500",
    bgClass: "bg-purple-600",
    glowClass: "shadow-purple-500/50",
    trainIcon: "🚂"
  }
];
