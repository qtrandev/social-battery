import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OwnerPanel from './OwnerPanel.jsx';

vi.mock('../lib/api.js', () => ({
  pinVersion: vi.fn(async () => ({ version: 'v3' })),
}));

async function openPanel() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /edit battery/i }));
  return user;
}

describe('OwnerPanel — while awake', () => {
  it('shows the level presets and calls onSetLevel when one is tapped', async () => {
    const onSetLevel = vi.fn();
    render(<OwnerPanel slug="quyen" editToken="t" onSetLevel={onSetLevel} awake={true} />);
    const user = await openPanel();

    await user.click(screen.getByRole('button', { name: '75%' }));

    expect(onSetLevel).toHaveBeenCalledWith(75);
    expect(screen.queryByText(/recharging/i)).not.toBeInTheDocument();
  });
});

describe('OwnerPanel — while asleep (outside wake↔sleep window)', () => {
  it('hides the level presets instead of letting them silently no-op', async () => {
    const onSetLevel = vi.fn();
    render(<OwnerPanel slug="quyen" editToken="t" onSetLevel={onSetLevel} awake={false} nextWake={null} />);
    await openPanel();

    expect(screen.queryByRole('button', { name: '75%' })).not.toBeInTheDocument();
    expect(screen.getByText(/recharging/i)).toBeInTheDocument();
  });

  it('mentions the next wake time when one is provided', async () => {
    const nextWake = new Date('2026-07-26T12:00:00.000Z'); // formatted in the test runner's local time
    render(<OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={false} nextWake={nextWake} />);
    await openPanel();

    const expectedTime = nextWake.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    expect(screen.getByText(new RegExp(`until ${expectedTime}`))).toBeInTheDocument();
  });

  it('still allows pinning a version even while asleep', async () => {
    const { pinVersion } = await import('../lib/api.js');
    render(<OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={false} />);
    const user = await openPanel();

    await user.click(screen.getByRole('button', { name: /pin current state/i }));

    expect(pinVersion).toHaveBeenCalledWith('quyen', 't');
    expect(await screen.findByText(/pinned as/i)).toBeInTheDocument();
  });
});
