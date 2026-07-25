import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPanel from './SettingsPanel.jsx';
import { updateConfig, ApiError } from '../lib/api.js';
import { getEditToken } from '../lib/ownership.js';

vi.mock('../lib/api.js', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, updateConfig: vi.fn() };
});

const config = {
  name: 'Quyen',
  wakeTime: '07:00',
  workEndTime: '18:00',
  sleepTime: '00:00',
  theme: 'energetic',
  profileImageUrl: null,
  coverImageUrl: null,
};

beforeEach(() => {
  localStorage.clear();
  updateConfig.mockReset();
});

function renderPanel(overrides = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <SettingsPanel
      slug="quyen"
      editToken="test-token"
      config={config}
      onClose={onClose}
      onSaved={onSaved}
      {...overrides}
    />
  );
  return { onClose, onSaved };
}

describe('SettingsPanel — pre-fill and save', () => {
  it('pre-fills fields from the current config', () => {
    renderPanel();
    expect(screen.getByLabelText('Display name')).toHaveValue('Quyen');
    expect(screen.getByLabelText('Wake')).toHaveValue('07:00');
    expect(screen.getByLabelText('Work ends')).toHaveValue('18:00');
    expect(screen.getByLabelText('Sleep')).toHaveValue('00:00');
    expect(screen.getByLabelText('Theme')).toHaveValue('energetic');
  });

  it('saves the edited fields and calls onSaved + onClose on success', async () => {
    updateConfig.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { onClose, onSaved } = renderPanel();

    await user.clear(screen.getByLabelText('Display name'));
    await user.type(screen.getByLabelText('Display name'), 'Q');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(updateConfig).toHaveBeenCalledWith(
      'quyen',
      'test-token',
      expect.objectContaining({ name: 'Q', wakeTime: '07:00', theme: 'energetic' })
    );
    expect(await screen.findByRole('button', { name: /save/i })).toBeEnabled();
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('sends null for a Display name cleared to empty, not an empty string', async () => {
    updateConfig.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderPanel();

    await user.clear(screen.getByLabelText('Display name'));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(updateConfig).toHaveBeenCalledWith('quyen', 'test-token', expect.objectContaining({ name: null }));
  });
});

describe('SettingsPanel — error handling', () => {
  it('shows an error and stays open on a generic failure', async () => {
    updateConfig.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/could not save/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clears the local edit token and closes on a 403 (stale device token)', async () => {
    localStorage.setItem('social-battery:quyen', 'test-token');
    updateConfig.mockRejectedValue(new ApiError('forbidden', 403));
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onClose).toHaveBeenCalled();
    expect(getEditToken('quyen')).toBeNull();
  });
});

describe('SettingsPanel — dismissal', () => {
  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByRole('button', { name: /close/i }).closest('.fixed'));

    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the form', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByLabelText('Display name'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
