import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BatteryGauge from './BatteryGauge.jsx';

function mockTrackRect(width, height) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0, toJSON() {},
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BatteryGauge — viewers (no onCommit)', () => {
  it('renders the level but exposes no slider role or tappable faces', () => {
    render(<BatteryGauge level={42} theme="energetic" orientation="landscape" />);
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('BatteryGauge — tap-to-jump face row (energetic theme: bands end at 15/35/55/80/100)', () => {
  it('commits the tapped band\'s range midpoint, not its edge', () => {
    const onCommit = vi.fn();
    render(<BatteryGauge level={50} theme="energetic" orientation="landscape" onCommit={onCommit} />);

    const faces = screen.getAllByRole('button');
    expect(faces).toHaveLength(5);

    fireEvent.click(faces[0]); // band [0, 15] -> midpoint 8
    expect(onCommit).toHaveBeenLastCalledWith(8);

    fireEvent.click(faces[4]); // band [80, 100] -> midpoint 90
    expect(onCommit).toHaveBeenLastCalledWith(90);

    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it('is available in portrait too, not just landscape', () => {
    const onCommit = vi.fn();
    render(<BatteryGauge level={50} theme="energetic" orientation="portrait" onCommit={onCommit} />);

    fireEvent.click(screen.getAllByRole('button')[2]); // band [35, 55] -> midpoint 45
    expect(onCommit).toHaveBeenCalledWith(45);
  });
});

describe('BatteryGauge — dragging (landscape: left=0%, right=100%)', () => {
  it('previews the dragged value live but only calls onCommit once, on release', () => {
    mockTrackRect(500, 200);
    const onCommit = vi.fn();
    render(<BatteryGauge level={50} theme="energetic" orientation="landscape" onCommit={onCommit} />);

    const track = screen.getByRole('slider');

    fireEvent.pointerDown(track, { clientX: 100, clientY: 100, pointerId: 1 }); // 100/500 = 20%
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.pointerMove(track, { clientX: 400, clientY: 100, pointerId: 1 }); // 400/500 = 80%
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.pointerUp(track, { clientX: 375, clientY: 100, pointerId: 1 }); // 375/500 = 75%
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(75);
  });

  it('clamps to 0-100 when dragged past either edge', () => {
    mockTrackRect(500, 200);
    const onCommit = vi.fn();
    render(<BatteryGauge level={50} theme="energetic" orientation="landscape" onCommit={onCommit} />);
    const track = screen.getByRole('slider');

    fireEvent.pointerDown(track, { clientX: -200, clientY: 100, pointerId: 1 });
    expect(screen.getByText('0%')).toBeInTheDocument();

    fireEvent.pointerUp(track, { clientX: 900, clientY: 100, pointerId: 1 });
    expect(onCommit).toHaveBeenCalledWith(100);
  });

  it('ignores a pointermove that never had a pointerdown', () => {
    mockTrackRect(500, 200);
    const onCommit = vi.fn();
    render(<BatteryGauge level={50} theme="energetic" orientation="landscape" onCommit={onCommit} />);
    const track = screen.getByRole('slider');

    fireEvent.pointerMove(track, { clientX: 400, clientY: 100, pointerId: 1 });

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe('BatteryGauge — dragging (portrait: bottom=0%, top=100%)', () => {
  it('inverts the Y axis so up means fuller', () => {
    mockTrackRect(200, 500); // width, height — bottom is at clientY 500, top at clientY 0
    const onCommit = vi.fn();
    render(<BatteryGauge level={50} theme="energetic" orientation="portrait" onCommit={onCommit} />);
    const track = screen.getByRole('slider');

    // clientY 125 is 375px up from the bottom (500) -> 375/500 = 75%
    fireEvent.pointerDown(track, { clientX: 100, clientY: 125, pointerId: 1 });
    fireEvent.pointerUp(track, { clientX: 100, clientY: 125, pointerId: 1 });

    expect(onCommit).toHaveBeenCalledWith(75);
  });
});
