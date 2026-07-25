import { describe, it, expect } from 'vitest';
import { deriveDisplayNameFromKey } from './displayName.js';

describe('deriveDisplayNameFromKey', () => {
  it.each([
    ['quyen', 'Quyen'],
    ['QuyenTran', 'Quyen Tran'],
    ['quyen-tran', 'Quyen Tran'],
    ['quyen_tran', 'Quyen Tran'],
    ['mikeSmith', 'Mike Smith'],
    ['already-Capitalized-Words', 'Already Capitalized Words'],
    ['a', 'A'],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ])('derives %j -> %j', (input, expected) => {
    expect(deriveDisplayNameFromKey(input)).toBe(expected);
  });
});
