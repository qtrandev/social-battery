// The tap-to-adjust "game" icons that float around the gauge. Edit this
// table to retune values or add/remove icons — nothing else needs to change.
// `delta` can be any nonzero integer; boost values are conventionally
// positive and drain values negative, but that's just convention, not
// enforced, so a future "random" icon could roll its own delta at tap time.
export const BOOST_ICONS = [
  { emoji: '☕', delta: 5, label: 'Coffee' },
  { emoji: '🔥', delta: 10, label: 'Fire' },
  { emoji: '⚡', delta: 7, label: 'Energy boost' },
  { emoji: '👏', delta: 3, label: 'Cheer' },
  { emoji: '👍', delta: 1, label: 'Thumbs up' },
];

export const DRAIN_ICONS = [
  { emoji: '👎', delta: -1, label: 'Thumbs down' },
  { emoji: '😅', delta: -3, label: 'Sweat' },
  { emoji: '🤯', delta: -7, label: 'Brain explode' },
  { emoji: '😰', delta: -5, label: 'Stress' },
  { emoji: '🪫', delta: -10, label: 'Low battery' },
];
