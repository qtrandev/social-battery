// Themes shift color + copy tone across the whole 0-100 range — a skin/voice
// choice, not a level-specific label. Bands run low→high and must cover 0-100.

export const THEMES = {
  energetic: {
    label: 'Energetic',
    bands: [
      { max: 15, color: '#ef4444', face: '😩', mood: 'Running on empty' },
      { max: 35, color: '#f97316', face: '😔', mood: 'Low battery' },
      { max: 55, color: '#eab308', face: '😐', mood: 'Getting by' },
      { max: 80, color: '#84cc16', face: '🙂', mood: 'Feeling good' },
      { max: 100, color: '#22c55e', face: '😄', mood: 'Fully charged' },
    ],
  },
  content: {
    label: 'Content',
    bands: [
      { max: 15, color: '#f97316', face: '😌', mood: 'Winding down' },
      { max: 35, color: '#fb923c', face: '🙂', mood: 'Quiet mode' },
      { max: 55, color: '#facc15', face: '🙂', mood: 'Steady' },
      { max: 80, color: '#a3e635', face: '😊', mood: 'Content' },
      { max: 100, color: '#4ade80', face: '😊', mood: 'Warmly full' },
    ],
  },
  low: {
    label: 'Low-key',
    bands: [
      { max: 20, color: '#64748b', face: '😴', mood: 'Nearly out' },
      { max: 45, color: '#78716c', face: '😐', mood: 'Conserving' },
      { max: 70, color: '#a8a29e', face: '🙂', mood: 'Ticking along' },
      { max: 100, color: '#d6d3d1', face: '🙂', mood: 'Comfortably topped up' },
    ],
  },
  unmotivated: {
    label: 'Unmotivated',
    bands: [
      { max: 20, color: '#6b7280', face: '🫠', mood: "Can't even" },
      { max: 45, color: '#9ca3af', face: '😑', mood: 'Meh' },
      { max: 70, color: '#a5b4fc', face: '😶', mood: 'Functional' },
      { max: 100, color: '#818cf8', face: '🙂', mood: 'Mildly willing' },
    ],
  },
  depressed: {
    label: 'Heavy day',
    bands: [
      { max: 20, color: '#1e3a5f', face: '😞', mood: 'Underwater' },
      { max: 45, color: '#334155', face: '😔', mood: 'Heavy' },
      { max: 70, color: '#475569', face: '😐', mood: 'Present' },
      { max: 100, color: '#64748b', face: '🙂', mood: 'Okay, for now' },
    ],
  },
};

export const THEME_KEYS = Object.keys(THEMES);
export const DEFAULT_THEME = 'energetic';

export function bandForLevel(theme, level) {
  const bands = (THEMES[theme] ?? THEMES[DEFAULT_THEME]).bands;
  return bands.find(b => level <= b.max) ?? bands[bands.length - 1];
}

/** CSS gradient stops (low → high) for the fill, built from a theme's bands. */
export function gradientStops(theme) {
  const bands = (THEMES[theme] ?? THEMES[DEFAULT_THEME]).bands;
  let prevMax = 0;
  return bands.map(b => {
    const stop = { color: b.color, from: prevMax, to: b.max };
    prevMax = b.max;
    return stop;
  });
}
