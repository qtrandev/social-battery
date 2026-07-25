import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router';
import CreateBattery from './CreateBattery.jsx';

// Rendered in StrictMode deliberately: React double-invokes state updater
// functions in dev to catch impure ones. An earlier version of the Key ->
// Display name auto-fill used a ref mutation inside the updater, which was
// pure-looking but broke under double-invocation (only the first keystroke
// ever landed). These tests guard against that regressing.
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

  it('stops auto-filling once the user types their own Display name', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'bob');
    await user.clear(screen.getByLabelText('Display name'));
    await user.type(screen.getByLabelText('Display name'), 'Bobby');
    await user.type(screen.getByLabelText('Key'), 'x'); // key is now "bobx"

    expect(screen.getByLabelText('Display name')).toHaveValue('Bobby');
  });

  it('stays manual (does not snap back) even if cleared to empty and Key keeps changing', async () => {
    const user = userEvent.setup();
    renderCreateBattery();

    await user.type(screen.getByLabelText('Key'), 'bob');
    await user.clear(screen.getByLabelText('Display name'));
    await user.type(screen.getByLabelText('Key'), 'y'); // key is now "boby"

    expect(screen.getByLabelText('Display name')).toHaveValue('');
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
