import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import OwnerPanel from './OwnerPanel.jsx';

function renderPanel(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

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
    renderPanel(<OwnerPanel slug="quyen" editToken="t" onSetLevel={onSetLevel} awake={true} />);
    const user = await openPanel();

    await user.click(screen.getByRole('button', { name: '75%' }));

    expect(onSetLevel).toHaveBeenCalledWith(75);
    expect(screen.queryByText(/recharging/i)).not.toBeInTheDocument();
  });
});

describe('OwnerPanel — reset to default', () => {
  it('hides the reset button when there is no active override', async () => {
    renderPanel(<OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={true} hasOverride={false} />);
    await openPanel();

    expect(screen.queryByRole('button', { name: /reset to default/i })).not.toBeInTheDocument();
  });

  it('shows the reset button and calls onReset when there is an active override', async () => {
    const onReset = vi.fn();
    renderPanel(
      <OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} onReset={onReset} awake={true} hasOverride={true} />
    );
    const user = await openPanel();

    await user.click(screen.getByRole('button', { name: /reset to default/i }));

    expect(onReset).toHaveBeenCalled();
  });
});

describe('OwnerPanel — while asleep (outside wake↔sleep window)', () => {
  it('hides the level presets instead of letting them silently no-op', async () => {
    const onSetLevel = vi.fn();
    renderPanel(<OwnerPanel slug="quyen" editToken="t" onSetLevel={onSetLevel} awake={false} nextWake={null} />);
    await openPanel();

    expect(screen.queryByRole('button', { name: '75%' })).not.toBeInTheDocument();
    expect(screen.getByText(/recharging/i)).toBeInTheDocument();
  });

  it('mentions the next wake time when one is provided', async () => {
    const nextWake = new Date('2026-07-26T12:00:00.000Z'); // formatted in the test runner's local time
    renderPanel(<OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={false} nextWake={nextWake} />);
    await openPanel();

    const expectedTime = nextWake.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    expect(screen.getByText(new RegExp(`until ${expectedTime}`))).toBeInTheDocument();
  });

  it('still allows pinning a version even while asleep', async () => {
    const { pinVersion } = await import('../lib/api.js');
    renderPanel(<OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={false} />);
    const user = await openPanel();

    await user.click(screen.getByRole('button', { name: /pin current state/i }));

    expect(pinVersion).toHaveBeenCalledWith('quyen', 't');
    expect(await screen.findByText(/pinned as/i)).toBeInTheDocument();
  });

  it('calls onPinned after a successful pin, so the caller can refresh its version count', async () => {
    const onPinned = vi.fn();
    renderPanel(<OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={false} onPinned={onPinned} />);
    const user = await openPanel();

    await user.click(screen.getByRole('button', { name: /pin current state/i }));

    expect(await screen.findByText(/pinned as/i)).toBeInTheDocument();
    expect(onPinned).toHaveBeenCalled();
  });
});

describe('OwnerPanel — viewing a pinned version', () => {
  it('hides the level presets and the pin button, showing a frozen-snapshot note instead', async () => {
    renderPanel(
      <OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={true} viewingVersion="v2" latestVersion={3} />
    );
    await openPanel();

    expect(screen.queryByText(/set level/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '75%' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pin current state/i })).not.toBeInTheDocument();
    expect(screen.getByText(/frozen/i)).toBeInTheDocument();
  });

  it('lists latest + every pinned version, graying out the one being viewed', async () => {
    renderPanel(
      <OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={true} viewingVersion="v2" latestVersion={3} />
    );
    await openPanel();

    expect(screen.getByRole('link', { name: 'Latest' })).toHaveAttribute('href', '/quyen');
    expect(screen.getByRole('link', { name: 'v1' })).toHaveAttribute('href', '/quyen/v1');
    expect(screen.getByRole('link', { name: 'v3' })).toHaveAttribute('href', '/quyen/v3');
    // v2 is the one being viewed — rendered as inert text, not a link
    expect(screen.queryByRole('link', { name: 'v2' })).not.toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('shows the version list while live too, with "Latest" grayed out', async () => {
    renderPanel(
      <OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={true} viewingVersion={null} latestVersion={2} />
    );
    await openPanel();

    expect(screen.queryByRole('link', { name: 'Latest' })).not.toBeInTheDocument();
    expect(screen.getByText('Latest')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'v1' })).toHaveAttribute('href', '/quyen/v1');
    expect(screen.getByRole('link', { name: 'v2' })).toHaveAttribute('href', '/quyen/v2');
    expect(screen.getByRole('button', { name: /pin current state/i })).toBeInTheDocument();
  });

  it('shows no version list when nothing has been pinned yet', async () => {
    renderPanel(<OwnerPanel slug="quyen" editToken="t" onSetLevel={vi.fn()} awake={true} latestVersion={0} />);
    await openPanel();

    expect(screen.queryByText(/versions/i)).not.toBeInTheDocument();
  });
});
