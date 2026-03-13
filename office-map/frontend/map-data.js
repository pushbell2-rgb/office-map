// 좌표계: map2.jpg (1400×780px) 를 3D 140×78 units 로 1:10 매핑
// x = pixel_x / 10,  z = pixel_y / 10
// 각 방: x/z = 좌상단 꼭짓점,  w = 가로,  d = 깊이

export const ROOM_TYPES = {
  gc:      { label: 'GC 공용 회의실',  color: '#3b82f6', hex: 0x3b82f6 },
  ubicare: { label: '유비케어 회의실', color: '#a78bfa', hex: 0xa78bfa },
  lounge:  { label: '라운지 / 휴게',   color: '#10b981', hex: 0x10b981 },
  project: { label: '프로젝트룸',      color: '#f59e0b', hex: 0xf59e0b },
  studio:  { label: '서버실 / 창고',   color: '#64748b', hex: 0x64748b },
  edit:    { label: '임원실 / 본부장', color: '#f97316', hex: 0xf97316 },
};

export const ROOMS = [

  // ══ GC 공용 회의실 (빨간 점선, 우측) ══════════════════════════════════
  { id: 'M-12', name: '뉴욕',        type: 'gc',      x: 110.8, z: 9.0,  w: 7.2,  d: 9.3  },
  { id: 'M-9',  name: '밴쿠버',      type: 'gc',      x: 128.5, z: 7.2,  w: 11.0, d: 12.8 },
  { id: 'P-1',  name: '보스턴',      type: 'project', x: 122.7, z: 9.0,  w: 5.5,  d: 19.5 },
  { id: 'M-11', name: '마이애미',    type: 'gc',      x: 110.7, z: 18.5, w: 7.1,  d: 7.0  },
  { id: 'M-8',  name: '토론토',      type: 'gc',      x: 128.4, z: 20.4, w: 11.1, d: 8.4  },
  { id: 'S-1',  name: '통합서버실',  type: 'studio',  x: 108.2, z: 12.5, w: 6.8,  d: 14.3 },
  { id: 'M-10', name: '덴버',        type: 'gc',      x: 110.7, z: 25.7, w: 7.1,  d: 6.9  },
  { id: 'M-7',  name: '오타와',      type: 'gc',      x: 128.4, z: 29.2, w: 11.1, d: 8.5  },
  { id: 'LOUNGE-C', name: '공용 Lounge', type: 'lounge', x: 98.8, z: 26.3, w: 16.2, d: 15.4 },
  { id: 'M-6',  name: '괌',          type: 'gc',      x: 114.8, z: 29.4, w: 12.0, d: 8.0  },
  { id: 'M-5',  name: '시애틀',      type: 'gc',      x: 108.2, z: 37.5, w: 8.0,  d: 8.2  },
  { id: 'M-4',  name: '사이판',      type: 'gc',      x: 113.3, z: 41.5, w: 8.0,  d: 7.5  },
  { id: 'M-3',  name: '상파울루',    type: 'gc',      x: 98.5,  z: 44.7, w: 10.0, d: 9.6  },
  { id: 'M-2',  name: '산티아고',    type: 'gc',      x: 109.4, z: 50.3, w: 9.4,  d: 7.0  },
  { id: 'M-1',  name: '칸쿤',        type: 'gc',      x: 119.0, z: 50.3, w: 9.4,  d: 7.0  },

  // ══ 유비케어 회의실 (노란 점선 영역) ══════════════════════════════════
  // 상단 가로 열 (M-21 ~ M-18, P-4)
  { id: 'M-21', name: '다낭',        type: 'ubicare', x: 7.6,  z: 9.0,  w: 4.8,  d: 7.7  },
  { id: 'M-20', name: '푸켓',        type: 'ubicare', x: 12.6, z: 9.0,  w: 4.8,  d: 7.7  },
  { id: 'M-19', name: '발리',        type: 'ubicare', x: 17.6, z: 9.0,  w: 5.0,  d: 7.7  },
  { id: 'M-18', name: '방콕',        type: 'ubicare', x: 22.8, z: 9.0,  w: 5.6,  d: 7.7  },
  { id: 'P-4',  name: '프로젝트룸#3',type: 'project', x: 28.4, z: 9.0,  w: 8.6,  d: 7.7  },

  // E 임원/본부장 (좌측 세로)
  { id: 'E-6',  name: '임원실',      type: 'edit',    x: 8.8,  z: 19.5, w: 5.8,  d: 6.5  },
  { id: 'E-5',  name: '본부장실',    type: 'edit',    x: 8.8,  z: 26.3, w: 5.8,  d: 6.7  },

  // M-17 ~ M-15 (중앙 좌측)
  { id: 'M-17', name: '타이페이',    type: 'ubicare', x: 15.2, z: 19.5, w: 6.6,  d: 6.5  },
  { id: 'M-16', name: '상하이',      type: 'ubicare', x: 15.2, z: 26.3, w: 6.6,  d: 6.7  },
  { id: 'M-15', name: '서울',        type: 'ubicare', x: 21.8, z: 20.0, w: 6.7,  d: 13.0 },

  // M-22 ~ M-24 (좌측 하단 돌출부)
  { id: 'M-24', name: '오키나와',    type: 'ubicare', x: 9.5,  z: 34.0, w: 6.0,  d: 6.8  },
  { id: 'M-23', name: '후쿠오카',    type: 'ubicare', x: 16.0, z: 34.0, w: 6.0,  d: 6.8  },
  { id: 'M-22', name: '도쿄',        type: 'ubicare', x: 8.2,  z: 41.3, w: 6.8,  d: 5.5  },

  // 라운지 #2 (좌측 가운데 녹색)
  { id: 'LOUNGE-2', name: 'Lounge #2', type: 'lounge', x: 20.3, z: 34.5, w: 15.2, d: 10.0 },

  // 중앙 우측 구역
  { id: 'P-2',  name: '프로젝트룸#1',type: 'project', x: 85.0, z: 9.0,  w: 10.3, d: 11.0 },
  { id: 'P-3',  name: '프로젝트룸#2',type: 'project', x: 69.8, z: 21.0, w: 11.7, d: 9.0  },
  { id: 'E-1',  name: '임원실',      type: 'edit',    x: 82.0, z: 21.0, w: 6.5,  d: 8.7  },

  // 라운지 #1 (중앙 우측 큰 녹색)
  { id: 'LOUNGE-1', name: 'Lounge #1', type: 'lounge', x: 71.2, z: 35.5, w: 17.0, d: 14.0 },

  // M-14, M-13
  { id: 'M-14', name: '보라카이',    type: 'ubicare', x: 64.5, z: 35.5, w: 6.7,  d: 9.2  },
  { id: 'M-13', name: '두바이',      type: 'ubicare', x: 55.0, z: 45.3, w: 7.2,  d: 7.2  },

  // E-2 ~ E-4 (하단 중앙)
  { id: 'E-4',  name: '본부장실',    type: 'edit',    x: 51.5, z: 49.3, w: 5.3,  d: 5.5  },
  { id: 'E-3',  name: '본부장실',    type: 'edit',    x: 56.8, z: 49.3, w: 5.4,  d: 5.5  },
  { id: 'E-2',  name: '본부장실',    type: 'edit',    x: 62.2, z: 49.3, w: 5.6,  d: 5.5  },

  // ══ 서버실 / 창고 (하단 좌측 대각선 섹션) ════════════════════════════
  { id: 'S-2',  name: '문서고',      type: 'studio',  x: 6.0,  z: 49.8, w: 7.5,  d: 6.7  },
  { id: 'S-3',  name: '힐링룸',      type: 'studio',  x: 6.0,  z: 56.7, w: 7.5,  d: 6.6  },
  { id: 'S-4',  name: '창고#5',      type: 'studio',  x: 6.0,  z: 63.5, w: 7.5,  d: 6.3  },
  { id: 'S-9',  name: '데모룸',      type: 'studio',  x: 14.3, z: 60.2, w: 7.9,  d: 6.8  },
  { id: 'S-8',  name: '창고#1',      type: 'studio',  x: 22.4, z: 60.2, w: 7.8,  d: 6.8  },
  { id: 'S-5',  name: '창고#4',      type: 'studio',  x: 13.3, z: 68.3, w: 10.1, d: 5.7  },
  { id: 'S-6',  name: '창고#3',      type: 'studio',  x: 24.0, z: 68.3, w: 7.6,  d: 5.7  },
  { id: 'S-7',  name: '창고#2',      type: 'studio',  x: 32.0, z: 68.3, w: 7.9,  d: 5.7  },
];
