import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Without `test.globals: true`, @testing-library/react's automatic
// afterEach(cleanup) never registers — wire it explicitly so each test
// starts from an empty document instead of accumulating prior renders.
afterEach(() => {
  cleanup();
});
