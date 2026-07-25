import { describe, it, expect, beforeEach } from 'vitest';
import { listRecentlyViewed, recordRecentlyViewed } from './recentlyViewed.js';

beforeEach(() => {
  localStorage.clear();
});

describe('listRecentlyViewed', () => {
  it('is empty with nothing recorded', () => {
    expect(listRecentlyViewed()).toEqual([]);
  });

  it('tolerates corrupted storage instead of throwing', () => {
    localStorage.setItem('social-battery:recently-viewed', 'not json');
    expect(listRecentlyViewed()).toEqual([]);
  });
});

describe('recordRecentlyViewed', () => {
  it('adds a new entry to the front of the list', () => {
    recordRecentlyViewed('quyen', 'Quyen');
    const list = listRecentlyViewed();
    expect(list).toHaveLength(1);
    expect(list[0].slug).toBe('quyen');
    expect(list[0].name).toBe('Quyen');
    expect(typeof list[0].viewedAt).toBe('string');
  });

  it('puts the most recently viewed slug first', () => {
    recordRecentlyViewed('quyen', 'Quyen');
    recordRecentlyViewed('mike', 'Mike');
    expect(listRecentlyViewed().map(b => b.slug)).toEqual(['mike', 'quyen']);
  });

  it('re-recording an existing slug refreshes it in place at the front, not duplicated', () => {
    recordRecentlyViewed('quyen', 'Quyen');
    recordRecentlyViewed('mike', 'Mike');
    recordRecentlyViewed('quyen', 'Quyen Tran'); // name changed, re-recorded

    const list = listRecentlyViewed();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ slug: 'quyen', name: 'Quyen Tran' });
    expect(list[1]).toMatchObject({ slug: 'mike', name: 'Mike' });
  });

  it('caps the list at 20 entries, dropping the oldest', () => {
    for (let i = 0; i < 25; i++) recordRecentlyViewed(`slug-${i}`, `Name ${i}`);
    const list = listRecentlyViewed();
    expect(list).toHaveLength(20);
    expect(list[0].slug).toBe('slug-24'); // most recent survives
    expect(list.find(b => b.slug === 'slug-0')).toBeUndefined(); // oldest dropped
  });
});
