// 좌표계: map2.jpg (2758×1728px) → 3D 140×88 units
// 3D_x = pixel_x × 140/2758 = pixel_x / 19.7
// 3D_z = pixel_y × 88/1728  = pixel_y / 19.6
// 각 방: x/z = 좌상단 꼭짓점, w = 가로, d = 깊이

export const ROOM_TYPES = {
  gc:      { label: 'GC 공용 회의실',  color: '#3b82f6', hex: 0x3b82f6 },
  ubicare: { label: '유비케어 회의실', color: '#a78bfa', hex: 0xa78bfa },
  lounge:  { label: '라운지 / 휴게',   color: '#10b981', hex: 0x10b981 },
  project: { label: '프로젝트룸',      color: '#f59e0b', hex: 0xf59e0b },
  studio:  { label: '서버실 / 창고',   color: '#64748b', hex: 0x64748b },
  edit:    { label: '임원실 / 본부장', color: '#f97316', hex: 0xf97316 },
};

export const ROOMS = [

  // ══ GC 공용 회의실 (우측) ═══════════════════════════════════════════
  { id: 'M-12', name: '뉴욕',        type: 'gc',      x: 109.5, z:  4.1, w:  8.0, d:  5.9 },
  { id: 'M-9',  name: '밴쿠버',      type: 'gc',      x: 126.8, z:  4.1, w: 11.8, d:  9.9 },
  { id: 'P-1',  name: '보스턴',      type: 'project', x: 117.6, z:  4.1, w:  9.2, d: 16.9 },
  { id: 'M-11', name: '마이애미',    type: 'gc',      x: 109.5, z: 10.1, w:  8.0, d:  5.7 },
  { id: 'M-8',  name: '토론토',      type: 'gc',      x: 126.8, z: 14.1, w: 11.8, d:  6.2 },
  { id: 'S-1',  name: '통합서버실',  type: 'studio',  x: 106.3, z: 12.3, w:  6.9, d: 14.1 },
  { id: 'M-10', name: '덴버',        type: 'gc',      x: 109.5, z: 15.8, w:  8.0, d:  5.7 },
  { id: 'M-7',  name: '오타와',      type: 'gc',      x: 126.8, z: 20.2, w: 11.8, d:  6.2 },
  { id: 'LOUNGE-C', name: '공용 Lounge', type: 'lounge', x: 106.3, z: 26.4, w: 11.3, d: 14.1 },
  { id: 'M-6',  name: '괌',          type: 'gc',      x: 117.6, z: 26.4, w: 11.2, d:  6.2 },
  { id: 'M-5',  name: '시애틀',      type: 'gc',      x: 106.3, z: 40.5, w:  8.5, d:  7.0 },
  { id: 'M-4',  name: '사이판',      type: 'gc',      x: 114.1, z: 44.9, w:  8.4, d:  6.2 },
  { id: 'M-3',  name: '상파울루',    type: 'gc',      x: 106.3, z: 51.0, w: 11.9, d:  7.0 },
  { id: 'M-2',  name: '산티아고',    type: 'gc',      x: 114.8, z: 58.1, w:  9.1, d:  6.2 },
  { id: 'M-1',  name: '칸쿤',        type: 'gc',      x: 123.9, z: 58.1, w:  9.1, d:  6.2 },

  // ══ 유비케어 회의실 (좌측) ══════════════════════════════════════════
  // 상단 가로 열
  { id: 'M-21', name: '다낭',        type: 'ubicare', x:  7.4, z:  4.4, w:  4.9, d:  8.4 },
  { id: 'M-20', name: '푸켓',        type: 'ubicare', x: 12.3, z:  4.4, w:  5.0, d:  8.4 },
  { id: 'M-19', name: '발리',        type: 'ubicare', x: 17.3, z:  4.4, w:  5.0, d:  8.4 },
  { id: 'M-18', name: '방콕',        type: 'ubicare', x: 22.3, z:  4.4, w:  5.3, d:  8.4 },
  { id: 'P-4',  name: '프로젝트룸#3',type: 'project', x: 27.6, z:  4.4, w:  8.7, d:  8.4 },

  // 임원/본부장 (좌측 세로)
  { id: 'E-6',  name: '임원실',      type: 'edit',    x:  8.4, z: 18.5, w:  5.9, d:  5.7 },
  { id: 'E-5',  name: '본부장실',    type: 'edit',    x:  8.4, z: 24.2, w:  5.9, d:  5.7 },

  // M-17 ~ M-15
  { id: 'M-17', name: '타이페이',    type: 'ubicare', x: 14.7, z: 18.5, w:  7.0, d:  5.7 },
  { id: 'M-16', name: '상하이',      type: 'ubicare', x: 14.7, z: 24.2, w:  7.0, d:  5.7 },
  { id: 'M-15', name: '서울',        type: 'ubicare', x: 21.7, z: 19.4, w:  6.7, d: 10.6 },

  // M-22 ~ M-24 (좌측 하단)
  { id: 'M-24', name: '오키나와',    type: 'ubicare', x:  9.5, z: 32.6, w:  6.2, d:  6.2 },
  { id: 'M-23', name: '후쿠오카',    type: 'ubicare', x: 15.7, z: 32.6, w:  6.4, d:  6.2 },
  { id: 'M-22', name: '도쿄',        type: 'ubicare', x:  7.7, z: 38.7, w:  7.7, d:  4.4 },

  // 라운지 #2
  { id: 'LOUNGE-2', name: 'Lounge #2', type: 'lounge', x: 21.7, z: 32.6, w: 16.1, d:  8.8 },

  // 중앙 구역
  { id: 'P-2',  name: '프로젝트룸#1',type: 'project', x: 84.0, z:  4.4, w:  9.8, d:  9.7 },
  { id: 'P-3',  name: '프로젝트룸#2',type: 'project', x: 68.6, z: 20.2, w: 12.6, d:  7.0 },
  { id: 'E-1',  name: '임원실',      type: 'edit',    x: 81.2, z: 20.2, w:  7.0, d:  7.0 },

  // 라운지 #1
  { id: 'LOUNGE-1', name: 'Lounge #1', type: 'lounge', x: 71.4, z: 35.2, w: 15.4, d:  9.7 },

  // M-14, M-13
  { id: 'M-14', name: '보라카이',    type: 'ubicare', x: 64.4, z: 35.2, w:  7.0, d:  7.9 },
  { id: 'M-13', name: '두바이',      type: 'ubicare', x: 53.9, z: 44.0, w:  7.7, d:  5.7 },

  // E-2 ~ E-4
  { id: 'E-4',  name: '본부장실',    type: 'edit',    x: 50.4, z: 48.4, w:  5.6, d:  4.8 },
  { id: 'E-3',  name: '본부장실',    type: 'edit',    x: 56.0, z: 48.4, w:  6.3, d:  4.8 },
  { id: 'E-2',  name: '본부장실',    type: 'edit',    x: 62.3, z: 48.4, w:  5.6, d:  4.8 },

  // ══ 서버실 / 창고 (하단 좌측) ══════════════════════════════════════
  { id: 'S-2',  name: '문서고',      type: 'studio',  x:  5.6, z: 49.3, w:  7.7, d:  5.3 },
  { id: 'S-3',  name: '힐링룸',      type: 'studio',  x:  5.6, z: 55.4, w:  7.7, d:  5.3 },
  { id: 'S-4',  name: '창고#5',      type: 'studio',  x:  5.6, z: 60.7, w:  7.7, d:  5.3 },
  { id: 'S-9',  name: '데모룸',      type: 'studio',  x: 13.3, z: 59.8, w:  8.4, d:  6.2 },
  { id: 'S-8',  name: '창고#1',      type: 'studio',  x: 21.7, z: 59.8, w:  8.4, d:  6.2 },
  { id: 'S-5',  name: '창고#4',      type: 'studio',  x: 12.6, z: 67.8, w: 10.5, d:  5.3 },
  { id: 'S-6',  name: '창고#3',      type: 'studio',  x: 23.1, z: 67.8, w:  8.4, d:  5.3 },
  { id: 'S-7',  name: '창고#2',      type: 'studio',  x: 31.5, z: 67.8, w:  7.7, d:  5.3 },
];
