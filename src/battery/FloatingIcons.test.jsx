import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FloatingIcons from './FloatingIcons.jsx';

const icons = [
  { emoji: '☕', delta: 7, label: 'Coffee' },
  { emoji: '👎', delta: -3, label: 'Thumbs down' },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FloatingIcons', () => {
  it('renders a tappable button per icon, labeled with its signed delta', () => {
    render(<FloatingIcons icons={icons} onTap={() => {}} />);
    expect(screen.getByRole('button', { name: /coffee: \+7%/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thumbs down: -3%/i })).toBeInTheDocument();
  });

  it('calls onTap with the icon\'s delta when tapped', () => {
    const onTap = vi.fn();
    render(<FloatingIcons icons={icons} onTap={onTap} />);

    fireEvent.click(screen.getByRole('button', { name: /coffee/i }));
    expect(onTap).toHaveBeenCalledWith(7);

    fireEvent.click(screen.getByRole('button', { name: /thumbs down/i }));
    expect(onTap).toHaveBeenCalledWith(-3);
  });

  it('renders nothing when not editable', () => {
    render(<FloatingIcons icons={icons} onTap={() => {}} editable={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('FloatingIcons — tap feedback popup', () => {
  // jsdom has no AnimationEvent implementation, so onAnimationEnd can't be
  // simulated here — instead we exercise the setTimeout safety net, which
  // exists precisely so cleanup doesn't depend solely on that event firing
  // (e.g. prefers-reduced-motion can suppress the animation in real browsers).
  it('shows a signed "+7%" popup after tapping, and clears it via the fallback timeout', () => {
    vi.useFakeTimers();
    render(<FloatingIcons icons={icons} onTap={() => {}} />);

    expect(screen.queryByText('+7%')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /coffee/i }));
    expect(screen.getByText('+7%')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.queryByText('+7%')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('supports multiple simultaneous popups from repeated taps', () => {
    render(<FloatingIcons icons={icons} onTap={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /coffee/i }));
    fireEvent.click(screen.getByRole('button', { name: /thumbs down/i }));

    expect(screen.getByText('+7%')).toBeInTheDocument();
    expect(screen.getByText('-3%')).toBeInTheDocument();
  });
});
