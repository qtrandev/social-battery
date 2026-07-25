import { describe, it, expect } from 'vitest';
import { validateFields } from './validate.js';

const validCreatePayload = {
  wakeTime: '07:00',
  workEndTime: '18:00',
  sleepTime: '00:00',
  timezone: 'America/Chicago',
  theme: 'energetic',
};

describe('validateFields — create (partial: false)', () => {
  it('accepts a valid payload with no name at all', () => {
    expect(validateFields(validCreatePayload, { partial: false })).toEqual([]);
  });

  it('accepts an explicit null name', () => {
    expect(validateFields({ ...validCreatePayload, name: null }, { partial: false })).toEqual([]);
  });

  it('accepts a real name string', () => {
    expect(validateFields({ ...validCreatePayload, name: 'Quyen' }, { partial: false })).toEqual([]);
  });

  it('flags every missing required field but never requires name', () => {
    const errors = validateFields({}, { partial: false });
    expect(errors).not.toContain('missing_name');
    expect(errors).toEqual(
      expect.arrayContaining([
        'missing_wakeTime', 'missing_workEndTime', 'missing_sleepTime', 'missing_timezone', 'missing_theme',
      ])
    );
  });

  it('rejects an unknown theme', () => {
    expect(validateFields({ ...validCreatePayload, theme: 'nonexistent' }, { partial: false })).toContain('invalid_theme');
  });

  it('rejects an invalid IANA timezone', () => {
    expect(validateFields({ ...validCreatePayload, timezone: 'Not/AZone' }, { partial: false })).toContain('invalid_timezone');
  });

  it('rejects malformed time-of-day strings', () => {
    expect(validateFields({ ...validCreatePayload, wakeTime: '7am' }, { partial: false })).toContain('invalid_wakeTime');
  });

  it('rejects a non-http(s) image url', () => {
    expect(validateFields({ ...validCreatePayload, profileImageUrl: 'javascript:alert(1)' }, { partial: false })).toContain(
      'invalid_profileImageUrl'
    );
  });

  it('accepts a null image url', () => {
    expect(validateFields({ ...validCreatePayload, coverImageUrl: null }, { partial: false })).toEqual([]);
  });
});

describe('validateFields — update (partial: true)', () => {
  it('accepts a lone lastOverride patch with no other fields present', () => {
    expect(validateFields({ lastOverride: { at: new Date().toISOString(), value: 42 } }, { partial: true })).toEqual([]);
  });

  it('rejects an out-of-range override value', () => {
    expect(validateFields({ lastOverride: { at: new Date().toISOString(), value: 150 } }, { partial: true })).toContain(
      'invalid_lastOverride'
    );
  });

  it('accepts clearing an override back to null', () => {
    expect(validateFields({ lastOverride: null }, { partial: true })).toEqual([]);
  });
});
