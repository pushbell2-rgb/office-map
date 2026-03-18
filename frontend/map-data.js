// 좌표계: map_onlyroom.png 기반 재측정 → 3D 140×88 units
// 각 방: x/z = 좌상단 꼭짓점, w = 가로(X축), d = 깊이(Z축)

export const ROOM_TYPES = {
  gc:      { label: 'GC 공용 회의실',  color: '#3b82f6', hex: 0x3b82f6 },
  ubicare: { label: '유비케어 회의실', color: '#a78bfa', hex: 0xa78bfa },
  lounge:  { label: '라운지 / 휴게',   color: '#10b981', hex: 0x10b981 },
  project: { label: '프로젝트룸',      color: '#f59e0b', hex: 0xf59e0b },
  studio:  { label: '서버실 / 창고',   color: '#64748b', hex: 0x64748b },
  edit:    { label: '임원실 / 본부장', color: '#f97316', hex: 0xf97316 },
};

export const ROOMS = [

  // ── 유비케어 회의실 상단 열 ──
  { id: 'M-21',     name: '다낭',          type: 'ubicare', x:   0.53, z:  0.67, w:  3.74, d:  7.57 },
  { id: 'M-20',     name: '푸켓',          type: 'ubicare', x:   5.35, z:  0.67, w:  3.74, d:  7.57 },
  { id: 'M-19',     name: '발리',          type: 'ubicare', x:  10.13, z:  0.67, w:  3.74, d:  7.57 },
  { id: 'M-18',     name: '방콕',          type: 'ubicare', x:  14.94, z:  0.67, w:  3.74, d:  7.57 },
  { id: 'P-4',      name: '프로젝트룸#3',  type: 'project', x:  19.75, z:  0.67, w:  6.54, d: 13.09 },

  // ── 임원/본부장 + 유비케어 좌측 ──
  { id: 'E-6',      name: '임원실',        type: 'edit',    x:  10.13, z: 13.87, w:  5.29, d:  5.17 },
  { id: 'E-5',      name: '본부장실',      type: 'edit',    x:  10.13, z: 20.36, w:  5.29, d:  5.17 },
  { id: 'M-17',     name: '본부장실',      type: 'ubicare', x:  19.69, z: 14.92, w:  6.59, d:  4.12 },
  { id: 'M-16',     name: '대표실',        type: 'ubicare', x:  19.69, z: 21.22, w:  6.59, d:  4.12 },
  { id: 'M-15',     name: '서울',          type: 'ubicare', x:  29.82, z: 21.22, w:  6.59, d:  4.12 },

  // ── 유비케어 중단 ──
  { id: 'M-24',     name: '오키나와',      type: 'ubicare', x:  10.96, z: 44.50, w:  3.62, d:  6.15 },
  { id: 'M-23',     name: '후쿠오카',      type: 'ubicare', x:  15.74, z: 44.50, w:  3.62, d:  6.15 },
  { id: 'M-22',     name: '도쿄',          type: 'ubicare', x:  10.96, z: 51.96, w:  5.79, d:  4.46 },

  // ── 라운지 ──
  { id: 'LOUNGE-2', name: 'Lounge #2',    type: 'lounge',  x:  27.33, z: 30.00, w: 15.00, d: 21.44 },

  // ── GC 공용 회의실 우측 ──
  { id: 'M-12',     name: '뉴욕',          type: 'gc',      x: 112.37, z:  1.57, w:  8.56, d:  6.67 },
  { id: 'M-9',      name: '밴쿠버',        type: 'gc',      x: 130.91, z:  1.57, w:  8.56, d:  6.67 },
  { id: 'M-11',     name: '마이애미',      type: 'gc',      x: 112.37, z:  9.22, w:  5.82, d:  4.31 },
  { id: 'M-8',      name: '토론토',        type: 'gc',      x: 130.91, z:  9.22, w:  5.82, d:  4.31 },
  { id: 'M-10',     name: '덴버',          type: 'gc',      x: 112.37, z: 14.81, w:  5.82, d:  4.35 },
  { id: 'M-7',      name: '오타와',        type: 'gc',      x: 130.91, z: 14.81, w:  5.82, d:  4.35 },
  { id: 'LOUNGE-C', name: '공용 Lounge',  type: 'lounge',  x: 112.08, z: 21.07, w: 17.76, d: 14.74 },
  { id: 'M-6',      name: '괌',            type: 'gc',      x: 130.91, z: 23.96, w:  5.41, d:  8.59 },
  { id: 'M-5',      name: '시애틀',        type: 'gc',      x: 127.26, z: 36.63, w:  4.13, d:  6.64 },
  { id: 'M-4',      name: '사이판',        type: 'gc',      x: 132.45, z: 36.63, w:  4.13, d:  6.64 },
  { id: 'M-3',      name: '상파울루',      type: 'gc',      x: 131.74, z: 44.77, w:  4.13, d:  6.67 },
  { id: 'M-2',      name: '산티아고',      type: 'gc',      x: 126.60, z: 55.98, w:  4.16, d:  6.67 },
  { id: 'M-1',      name: '칸쿤',          type: 'gc',      x: 132.45, z: 56.24, w:  4.13, d:  6.67 },

  // ── 프로젝트룸 + 서버실 우측 ──
  { id: 'P-2',      name: '프로젝트룸#1',  type: 'project', x:  94.64, z:  1.27, w:  4.69, d: 21.91 },
  { id: 'S-1',      name: '통합서버실',    type: 'studio',  x: 100.40, z:  1.27, w: 10.90, d: 32.40 },
  { id: 'P-1',      name: '보스턴',        type: 'project', x: 121.49, z:  1.27, w:  8.35, d: 18.60 },

  // ── 중앙 구역 ──
  { id: 'P-3',      name: '프로젝트룸#2',  type: 'project', x:  74.32, z: 17.46, w: 11.67, d:  5.72 },
  { id: 'E-1',      name: '임원실',        type: 'edit',    x:  89.53, z: 17.46, w:  4.40, d:  5.72 },
  { id: 'LOUNGE-1', name: 'Lounge #1',    type: 'lounge',  x:  74.32, z: 30.00, w: 17.00, d: 32.84 },
  { id: 'M-14',     name: '보라카이',      type: 'ubicare', x:  68.14, z: 46.08, w:  5.50, d:  5.36 },

  // ── 임원 + 유비케어 중앙 하단 ──
  { id: 'E-4',      name: '본부장실',      type: 'edit',    x:  50.91, z: 55.23, w:  4.19, d:  7.61 },
  { id: 'E-3',      name: '본부장실',      type: 'edit',    x:  56.14, z: 55.23, w:  4.19, d:  7.61 },
  { id: 'E-2',      name: '본부장실',      type: 'edit',    x:  61.37, z: 55.23, w:  4.19, d:  7.61 },
  { id: 'M-13',     name: '두바이',        type: 'ubicare', x:  66.60, z: 55.23, w:  7.04, d:  7.61 },

  // ── 서버실 / 창고 좌측 하단 ── (COR-M22R가 S-4/S-9 사이를 통과하도록 x+10.92 이동)
  { id: 'S-2',      name: '문서고',        type: 'studio',  x:  11.45, z: 59.28, w:  5.05, d: 10.05 },
  { id: 'S-3',      name: '힐링룸',        type: 'studio',  x:  11.45, z: 70.68, w:  5.05, d:  8.21 },
  { id: 'S-4',      name: '창고#5',        type: 'studio',  x:  11.45, z: 80.24, w:  5.05, d:  9.94 },
  { id: 'S-9',      name: '데모룸',        type: 'studio',  x:  20.01, z: 78.97, w:  4.25, d:  8.66 },
  { id: 'S-8',      name: '창고#1',        type: 'studio',  x:  25.15, z: 82.75, w:  5.17, d:  4.87 },
  { id: 'S-5',      name: '창고#4',        type: 'studio',  x:  13.86, z: 91.49, w: 10.93, d:  7.12 },
  { id: 'S-6',      name: '창고#3',        type: 'studio',  x:  25.86, z: 91.49, w:  3.74, d:  7.12 },
  { id: 'S-7',      name: '창고#2',        type: 'studio',  x:  30.67, z: 93.74, w:  5.17, d:  4.87 },

];

export const ENTRANCES = [
  { id: 'ENT-1', name: '입구 1',     callout: '헥톤입구', type: 'entrance', x: 120.96, z: 39.50, direction: 'z-' },
  { id: 'ENT-2', name: '입구 2',     callout: 'GC입구',  type: 'entrance', x:  96.00, z: 37.00, direction: 'x-' },
  { id: 'ELV-1', name: '엘리베이터',                  type: 'elevator', x:  13.85, z: 35.62, direction: null },
  { id: 'EXIT-1', name: '비상구',                    type: 'exit',     x:  37.66, z:  0.0,  direction: null },
];

// 복도 (이동 가능 경로) — x/z = 좌상단, w/d = 가로/깊이
// 보정 기준: M21(x=0.53,z=0.67) → scale_x≈8.42px/unit, scale_z≈6.7px/unit
export const CORRIDORS = [
  // 상단 수직 복도: M-16 right(x=26.28) ~ M-15 left(x=29.82) 사이, 폭=3.54
  { id: 'COR-V1', x: 26.28, z:  0.0, w:  3.54, d: 25.5 },
  // M-15 오른쪽 얇은 세로 복도: COR-V1 top(z=0)과 위쪽 끝선 일치, 비상구까지
  { id: 'COR-M15R', x: 36.41, z: 0.0, w: 2.5, d: 25.5 },
  // 메인 수평 복도: z=25.5~30 (COR-V1 하단과 이음, COR-V2/V3 상단과 이음)
  { id: 'COR-H1', x:  0.0, z: 25.5, w: 94.5, d:  4.5 },
  // 좌측 하단 수직 복도: COR-H1 하단(z=30)부터 M-14 하단(z=51.44)까지
  { id: 'COR-V2', x:  0.0, z: 30.0, w:  9.0, d: 21.44 },
  // 라운지2 우측 수직 복도: COR-H1 하단(z=30)부터 M-14 하단(z=51.44)까지 (right edge=E-4 left=50.91)
  { id: 'COR-V3', x: 43.91, z: 30.0, w:  7.0, d: 21.44 },
  // M-14 하단(z=51.44) ↔ M-13 상단(z=55.23) 사이 수평 복도 (right edge=LOUNGE-1 left x=74.32)
  { id: 'COR-B1', x: 19.36, z: 51.44, w: 54.96, d:  3.79 },
  // 우측 수직 복도: M6(x=130.9) 우측 ~ M5/M4
  { id: 'COR-R1', x:136.0, z: 19.0, w:  4.0, d: 16.0 },
  // M-21~M-18 하단 수평 복도: P-4에서 M-21까지 연결 (COR-V1에 이음)
  { id: 'COR-T1', x:  0.0, z:  8.24, w: 26.3, d:  2.0 },
  // E-6/M-17 사이 수직 복도: COR-T1 하단(z=10.24) → 메인 복도(z=25.5), 중첩 제거
  { id: 'COR-V4', x: 15.42, z: 10.24, w:  4.27, d: 15.26 },
  // E-1 → 헥톤입구(x≈121): GC입구·헥톤입구까지만 연결
  { id: 'COR-E1a', x:  94.5, z: 25.5,  w:  5.5,  d: 10.31 }, // S-1 좌측, bottom=z35.81(COR-E1b top)
  { id: 'COR-E1b', x:  94.5, z: 35.81, w: 22.5,  d:  4.19 }, // LOUNGE-C 하단~COR-ENT(x=117.0) 연결
  { id: 'COR-ENT', x: 117.0, z: 35.81, w:  9.0,  d:  5.0  }, // LOUNGE-C 하단, ENT-1 포함
  // LOUNGE-C → M-5/M-4/M-3/M-2/M-1 우측 하단 복도
  { id: 'COR-R2', x: 126.0, z: 35.5, w: 12.0, d: 28.0 },
  // P-3 왼쪽 수직 복도: P-3 top(z=17.46)부터 COR-B1(z=51.44)까지, DESK-3 right~P-3 left
  { id: 'COR-P3L', x: 68.14, z: 17.46, w: 6.18, d: 33.98 },
  // P-3/E-1 위 얇은 연결 복도: COR-P3L left(x=68.14) ~ P-2 left(x=94.64), E-1 top(z=17.46)에 맞닿음
  { id: 'COR-P3E1', x: 68.14, z: 15.96, w: 26.50, d: 1.5 },
  // 라운지2 ↔ M-23 사이 세로 복도: COR-H1 하단(z=30.0)부터 시작, 중첩 제거
  { id: 'COR-LG2', x: 19.36, z: 30.00, w: 7.97, d: 21.44 },
  // M-22/M-23 오른쪽 세로 복도: M-23 상단(z=44.50)부터 S-5 상단(z=91.49)까지
  { id: 'COR-M22R', x: 16.75, z: 44.50, w: 3.0, d: 46.99 },
  // M-24 위쪽 얇은 복도: M-24 top(z=44.50)과 COR-LG2(x=19.36) 연결
  { id: 'COR-A1', x: 10.96, z: 43.0, w: 8.40, d: 1.5 },
];

// 벽 (통과 불가) — 3D 박스로 렌더링
export const WALLS = [
];

// 사무 공간 데스크 영역 — 반투명 핑크 평면으로 표시
export const DESKS = [
  { id: 'DESK-1', x: 41.0, z:  0.0, w: 46.5, d:  9.5 }, // 상단 대형 데스크
  { id: 'DESK-2', x: 41.0, z:  9.5, w: 27.0, d:  5.5 }, // 중단 소형 데스크
  { id: 'DESK-3', x: 50.91, z: 30.0, w: 17.23, d: 21.44 }, // M14 왼쪽 데스크 (위=COR-H1, 아래=COR-B1, 왼쪽=COR-V3)
  { id: 'DESK-4', x:139.47, z:  0.0, w: 17.00, d: 66.0 }, // M-9 right edge(x=139.47)에 left 맞닿음, 라운지1과 동일 폭
];

// 편의시설 — T: 화장실, P: 폰부스 (map3.png 기준 위치)
export const FACILITIES = [
  { id: 'T-1',  name: '화장실', type: 'toilet',     x: 29.0, z:  2.5 },
  { id: 'T-2',  name: '화장실', type: 'toilet',     x: 32.0, z:  8.5 },
  { id: 'PB-1', name: '폰부스', type: 'phonebooth', x: 41.5, z:  9.5 },
  { id: 'PB-2', name: '폰부스', type: 'phonebooth', x: 41.5, z: 13.5 },
  { id: 'PB-3', name: '폰부스', type: 'phonebooth', x: 41.5, z: 17.0 },
  { id: 'PB-4', name: '폰부스', type: 'phonebooth', x: 44.5, z: 13.5 },
];
