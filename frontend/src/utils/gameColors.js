export const GAME_COLORS = {
  V75: '#1e3a8a',
  V86: '#6b21a8',
  V64: '#2563eb',
  V65: '#ea580c',
  GS75: '#be123c',
  DD: '#f97316',
  LD: '#16a34a'
}

export const getGameColor = (code) => GAME_COLORS[code] || 'transparent'
