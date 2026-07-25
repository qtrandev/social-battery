import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Home from './Home.jsx';
import { recordMyBattery } from '../lib/myBatteries.js';

beforeEach(() => {
  localStorage.clear();
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home — "yours, on this device" list', () => {
  it('shows nothing extra when this device has never created a battery', () => {
    renderHome();
    expect(screen.queryByText(/yours, on this device/i)).not.toBeInTheDocument();
  });

  it('lists batteries recorded on this device, most recent first, linking to /:slug', async () => {
    recordMyBattery('quyen', 'Quyen');
    recordMyBattery('mike', 'Mike');
    renderHome();

    expect(await screen.findByText(/yours, on this device/i)).toBeInTheDocument();

    const links = screen.getAllByRole('link').filter(a => a.getAttribute('href')?.match(/^\/[^/]+$/) && a.getAttribute('href') !== '/new');
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/mike', '/quyen']);
    expect(screen.getByText('Mike')).toBeInTheDocument();
    expect(screen.getByText('Quyen')).toBeInTheDocument();
  });
});
