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
  { id: 'M-24',     name: '오키나와',      type: 'ubicare', x:  10.96, z: 29.66, w:  3.62, d:  6.15 },
  { id: 'M-23',     name: '후쿠오카',      type: 'ubicare', x:  15.74, z: 29.66, w:  3.62, d:  6.15 },
  { id: 'M-22',     name: '도쿄',          type: 'ubicare', x:  10.96, z: 37.12, w:  5.79, d:  4.46 },

  // ── 라운지 ──
  { id: 'LOUNGE-2', name: 'Lounge #2',    type: 'lounge',  x:  27.33, z: 28.50, w: 20.05, d: 30.78 },

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
  { id: 'P-2',      name: '프로젝트룸#1',  type: 'project', x:  94.64, z:  1.27, w:  4.69, d: 25.91 },
  { id: 'S-1',      name: '통합서버실',    type: 'studio',  x: 100.40, z:  1.27, w: 10.90, d: 32.40 },
  { id: 'P-1',      name: '보스턴',        type: 'project', x: 121.49, z:  1.27, w:  8.35, d: 18.60 },

  // ── 중앙 구역 ──
  { id: 'P-3',      name: '프로젝트룸#2',  type: 'project', x:  74.32, z: 19.46, w: 11.67, d:  7.72 },
  { id: 'E-1',      name: '임원실',        type: 'edit',    x:  89.53, z: 19.46, w:  4.40, d:  7.72 },
  { id: 'LOUNGE-1', name: 'Lounge #1',    type: 'lounge',  x:  74.32, z: 32.02, w: 10.16, d: 30.82 },
  { id: 'M-14',     name: '보라카이',      type: 'ubicare', x:  68.14, z: 46.08, w:  5.50, d:  5.36 },

  // ── 임원 + 유비케어 중앙 하단 ──
  { id: 'E-4',      name: '본부장실',      type: 'edit',    x:  50.91, z: 55.23, w:  4.19, d:  7.61 },
  { id: 'E-3',      name: '본부장실',      type: 'edit',    x:  56.14, z: 55.23, w:  4.19, d:  7.61 },
  { id: 'E-2',      name: '본부장실',      type: 'edit',    x:  61.37, z: 55.23, w:  4.19, d:  7.61 },
  { id: 'M-13',     name: '두바이',        type: 'ubicare', x:  66.60, z: 55.23, w:  7.04, d:  7.61 },

  // ── 서버실 / 창고 좌측 하단 ──
  { id: 'S-2',      name: '문서고',        type: 'studio',  x:   0.53, z: 47.99, w:  5.05, d: 10.05 },
  { id: 'S-3',      name: '힐링룸',        type: 'studio',  x:   0.53, z: 59.39, w:  5.05, d:  8.21 },
  { id: 'S-4',      name: '창고#5',        type: 'studio',  x:   0.53, z: 68.95, w:  5.05, d:  9.94 },
  { id: 'S-9',      name: '데모룸',        type: 'studio',  x:   9.09, z: 67.68, w:  4.25, d:  8.66 },
  { id: 'S-8',      name: '창고#1',        type: 'studio',  x:  14.23, z: 71.46, w:  5.17, d:  4.87 },
  { id: 'S-5',      name: '창고#4',        type: 'studio',  x:   2.94, z: 80.20, w: 10.93, d:  7.12 },
  { id: 'S-6',      name: '창고#3',        type: 'studio',  x:  14.94, z: 80.20, w:  3.74, d:  7.12 },
  { id: 'S-7',      name: '창고#2',        type: 'studio',  x:  19.75, z: 82.45, w:  5.17, d:  4.87 },

];

export const ENTRANCES = [
  { id: 'ENT-1', name: '입구 1',     callout: '헥톤입구', type: 'entrance', x: 120.96, z: 35.81, direction: 'z-' },
  { id: 'ENT-2', name: '입구 2',     callout: 'GC입구',  type: 'entrance', x: 100.40, z: 37.00, direction: 'x-' },
  { id: 'ELV-1', name: '엘리베이터',                  type: 'elevator', x:  13.85, z: 44.50, direction: null },
];
