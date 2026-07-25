import { describe, it, expect, beforeEach } from 'vitest';
import { listMyBatteries, recordMyBattery } from './myBatteries.js';

beforeEach(() => {
  localStorage.clear();
});

describe('listMyBatteries', () => {
  it('is empty with nothing recorded', () => {
    expect(listMyBatteries()).toEqual([]);
  });

  it('tolerates corrupted storage instead of throwing', () => {
    localStorage.setItem('social-battery:my-batteries', 'not json');
    expect(listMyBatteries()).toEqual([]);
  });
});

describe('recordMyBattery', () => {
  it('adds a new entry to the front of the list', () => {
    recordMyBattery('quyen', 'Quyen');
    const list = listMyBatteries();
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe('quyen');
    expect(list[0].name).toBe('Quyen');
    expect(typeof list[0].createdAt).toBe('string');
  });

  it('puts the most recently recorded slug first', () => {
    recordMyBattery('quyen', 'Quyen');
    recordMyBattery('mike', 'Mike');
    expect(listMyBatteries().map(b => b.slug)).toEqual(['mike', 'quyen']);
  });

  it('re-recording an existing slug refreshes it in place at the front, not duplicated', () => {
    recordMyBattery('quyen', 'Quyen');
    recordMyBattery('mike', 'Mike');
    recordMyBattery('quyen', 'Quyen Tran'); // name changed, re-recorded

    const list = listMyBatteries();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ slug: 'quyen', name: 'Quyen Tran' });
    expect(list[1]).toMatchObject({ slug: 'mike', name: 'Mike' });
  });

  it('caps the list at 20 entries, dropping the oldest', () => {
    for (let i = 0; i < 25; i++) recordMyBattery(`slug-${i}`, `Name ${i}`);
    const list = listMyBatteries();
    expect(list).toHaveLength(20);
    expect(list[0].slug).toBe('slug-24'); // most recent survives
    expect(list.find(b => b.slug === 'slug-0')).toBeUndefined(); // oldest dropped
  });
});
