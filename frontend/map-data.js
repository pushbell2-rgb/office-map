// 서울숲 사옥 LF층 방 데이터
// 좌표계: 3D 바닥 100×54 units (map.jpg 비율 기준)
// x: 왼쪽 엣지, z: 앞쪽 엣지, w: 가로, d: 깊이

export const ROOM_TYPES = {
  gc:      { label: 'GC 공용 회의실',   color: '#3b82f6', hex: 0x3b82f6 },
  ubicare: { label: '유비케어 회의실',   color: '#8b5cf6', hex: 0x8b5cf6 },
  lounge:  { label: '휴게 공간',         color: '#10b981', hex: 0x10b981 },
  project: { label: '프로젝트룸',        color: '#f59e0b', hex: 0xf59e0b },
  studio:  { label: '스튜디오',          color: '#ef4444', hex: 0xef4444 },
  edit:    { label: '편집실',            color: '#94a3b8', hex: 0x94a3b8 },
};

export const ROOMS = [
  // ── GC 공용 회의실 (우측, 빨간 점선 영역) ──
  { id: 'M-1',  name: '연',           type: 'gc',      x: 54,  z: 4,   w: 5.5, d: 4 },
  { id: 'M-2',  name: '선파크교',     type: 'gc',      x: 60,  z: 4,   w: 5.5, d: 4 },
  { id: 'M-3',  name: '성상품실',     type: 'gc',      x: 66,  z: 4,   w: 5.5, d: 4 },
  { id: 'M-4',  name: '사면',         type: 'gc',      x: 72,  z: 4,   w: 5.5, d: 4 },
  { id: 'M-5',  name: '사업팀',       type: 'gc',      x: 78,  z: 4,   w: 5.5, d: 4 },
  { id: 'M-6',  name: '대외',         type: 'gc',      x: 84,  z: 4,   w: 5.5, d: 4 },
  { id: 'M-7',  name: '요리다',       type: 'gc',      x: 90,  z: 4,   w: 6,   d: 4 },
  { id: 'M-8',  name: '도서교',       type: 'gc',      x: 54,  z: 9,   w: 5.5, d: 4 },
  { id: 'M-9',  name: '변대',         type: 'gc',      x: 60,  z: 9,   w: 5.5, d: 4 },
  { id: 'M-10', name: '편',           type: 'gc',      x: 66,  z: 9,   w: 5.5, d: 4 },
  { id: 'M-11', name: '회의실',       type: 'gc',      x: 72,  z: 9,   w: 5.5, d: 4 },
  { id: 'M-12', name: '노래',         type: 'gc',      x: 78,  z: 9,   w: 5.5, d: 4 },
  { id: 'LOUNGE-C', name: '공용 Lounge', type: 'lounge', x: 66, z: 17,  w: 14,  d: 9 },
  { id: 'MR-1', name: 'Meeting Room #1', type: 'gc',   x: 83,  z: 17,  w: 9,   d: 7 },
  { id: 'MR-2', name: 'Meeting Room #2', type: 'gc',   x: 83,  z: 25,  w: 9,   d: 7 },
  { id: 'P-1',  name: '프로젝트룸 #1', type: 'project', x: 54, z: 18,  w: 7,   d: 5.5 },
  { id: 'P-2',  name: '프로젝트룸 #2', type: 'project', x: 54, z: 24,  w: 7,   d: 5.5 },

  // ── 유비케어 회의실 (좌측, 노란 점선 영역) ──
  // E 편집팀 (좌상단)
  { id: 'E-1',  name: '편집팀',       type: 'edit',    x: 2,   z: 4,   w: 5,   d: 4 },
  { id: 'E-2',  name: '분류실2',      type: 'edit',    x: 8,   z: 4,   w: 5,   d: 4 },
  { id: 'E-3',  name: '분류실3',      type: 'edit',    x: 14,  z: 4,   w: 5,   d: 4 },
  { id: 'E-4',  name: '분류실4',      type: 'edit',    x: 2,   z: 9,   w: 5,   d: 4 },
  { id: 'E-5',  name: '분류실5',      type: 'edit',    x: 8,   z: 9,   w: 5,   d: 4 },
  { id: 'E-6',  name: '분류실6',      type: 'edit',    x: 14,  z: 9,   w: 5,   d: 4 },
  { id: 'P-4',  name: 'P-4',          type: 'project', x: 20,  z: 4,   w: 6,   d: 5 },
  // M 회의실 (중앙 좌측)
  { id: 'M-13', name: '포스터',       type: 'ubicare', x: 27,  z: 13,  w: 5,   d: 4.5 },
  { id: 'M-14', name: '서울',         type: 'ubicare', x: 33,  z: 13,  w: 5,   d: 4.5 },
  { id: 'M-15', name: '삼터실',       type: 'ubicare', x: 39,  z: 13,  w: 5,   d: 4.5 },
  { id: 'M-16', name: '진저고1',      type: 'ubicare', x: 27,  z: 18,  w: 5,   d: 4.5 },
  { id: 'M-17', name: '진저고2',      type: 'ubicare', x: 33,  z: 18,  w: 5,   d: 4.5 },
  { id: 'M-18', name: '장고3',        type: 'ubicare', x: 39,  z: 18,  w: 5,   d: 4.5 },
  { id: 'M-19', name: '도고3',        type: 'ubicare', x: 20,  z: 13,  w: 5,   d: 4.5 },
  { id: 'M-20', name: '요고',         type: 'ubicare', x: 20,  z: 18,  w: 5,   d: 4.5 },
  { id: 'M-21', name: '주고고',       type: 'ubicare', x: 13,  z: 13,  w: 5,   d: 4.5 },
  { id: 'M-22', name: '상고고',       type: 'ubicare', x: 13,  z: 18,  w: 5,   d: 4.5 },
  { id: 'M-23', name: '목악',         type: 'ubicare', x: 45,  z: 13,  w: 5,   d: 4.5 },
  { id: 'M-24', name: '태화실',       type: 'ubicare', x: 45,  z: 18,  w: 5,   d: 4.5 },
  { id: 'P-3',  name: 'P-3',          type: 'project', x: 45,  z: 24,  w: 7,   d: 5 },
  // Lounge #2 (중앙 좌측 휴게)
  { id: 'LOUNGE-2', name: 'Lounge #2', type: 'lounge', x: 5,   z: 27,  w: 12,  d: 8 },
  // S 스튜디오 (하단 좌측)
  { id: 'S-1',  name: 'S-1',          type: 'studio',  x: 2,   z: 38,  w: 7,   d: 5.5 },
  { id: 'S-2',  name: 'S-2',          type: 'studio',  x: 10,  z: 38,  w: 7,   d: 5.5 },
  { id: 'S-3',  name: 'S-3',          type: 'studio',  x: 18,  z: 38,  w: 7,   d: 5.5 },
  { id: 'S-4',  name: 'S-4',          type: 'studio',  x: 2,   z: 44,  w: 7,   d: 5.5 },
  { id: 'S-5',  name: 'S-5',          type: 'studio',  x: 10,  z: 44,  w: 7,   d: 5.5 },
  { id: 'S-6',  name: 'S-6',          type: 'studio',  x: 18,  z: 44,  w: 7,   d: 5.5 },
  { id: 'S-7',  name: 'S-7',          type: 'studio',  x: 26,  z: 44,  w: 7,   d: 5.5 },
];
