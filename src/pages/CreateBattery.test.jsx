import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router';
import CreateBattery from './CreateBattery.jsx';
import { listMyBatteries } from '../lib/myBatteries.js';

vi.mock('../lib/api.js', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    createConfig: vi.fn(async payload => ({ ok: true, slug: payload.slug, editToken: 'test-edit-token' })),
  };
});

beforeEach(() => {
  localStorage.clear();
});

// Rendered in StrictMode deliberately: React double-invokes state updater
// functions in dev to catch impure ones. An earlier version of the Key ->
// Display name auto-fill used a ref mutation inside the updater, which was
// pure-looking but broke under double-invocation (only the first keystroke
// ever landed). These tests guard against that class of bug regressing.
//
// Current rule: Key always drives Display name, even overwriting a manually
// typed one — typing directly into Display name only holds until Key changes again.
function renderCreateBattery() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/new']}>
        <CreateBattery />
      </MemoryRouter>
    </StrictMode>
  );
}

describe('CreateBattery — Key to Display name auto-fill', () => {
  it('auto-fills Display name across every keystroke typed into Key', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'bob');

    expect(screen.getByLabelText('Display name')).toHaveValue('Bob');
  });

  it('splits a camelCase key into separate capitalized words', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'QuyenTran');

    expect(screen.getByLabelText('Display name')).toHaveValue('Quyen Tran');
  });

  it('holds a manually-typed Display name until Key changes again', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'bob');
    await user.clear(screen.getByLabelText('Display name'));
    await user.type(screen.getByLabelText('Display name'), 'Bobby');

    expect(screen.getByLabelText('Display name')).toHaveValue('Bobby');
  });

  it('overwrites a manually-typed Display name the next time Key changes', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'bob');
    await user.clear(screen.getByLabelText('Display name'));
    await user.type(screen.getByLabelText('Display name'), 'Bobby');
    await user.type(screen.getByLabelText('Key'), 'x'); // key is now "bobx"

    expect(screen.getByLabelText('Display name')).toHaveValue('Bobx');
  });

  it('re-derives Display name from Key even after being cleared to empty', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'bob');
    await user.clear(screen.getByLabelText('Display name'));
    await user.type(screen.getByLabelText('Key'), 'y'); // key is now "boby"

    expect(screen.getByLabelText('Display name')).toHaveValue('Boby');
  });
});

describe('CreateBattery — reserved key handling', () => {
  it('shows a reserved-key error, not a charset error, when the key is "new"', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'new');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/reserved/i)).toBeInTheDocument();
  });
});

describe('CreateBattery — records to "my batteries" on success', () => {
  it('saves a local history entry for the new slug after creating', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'testkey');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(listMyBatteries()).toEqual([
        expect.objectContaining({ slug: 'testkey', name: 'Testkey' }),
      ]);
    });
  });
});
