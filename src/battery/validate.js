// Shared by the create/update Netlify functions — server-side validation is
// authoritative; the frontend form only does light client-side checks.
import { isValidHHMM } from '../lib/time.js';
import { THEME_KEYS } from './themes.js';

const MAX_NAME_LEN = 60;
const MAX_URL_LEN = 500;
const URL_REGEX = /^https?:\/\/.+/i;

function isValidTimezone(tz) {
  if (typeof tz !== 'string' || tz.length > 100) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isValidUrlOrNull(value) {
  if (value === null || value === undefined) return true;
  return typeof value === 'string' && value.length <= MAX_URL_LEN && URL_REGEX.test(value);
}

function isValidOverride(value) {
  if (value === null) return true;
  if (typeof value !== 'object' || Array.isArray(value)) return false;
  const { at, value: v } = value;
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) return false;
  if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 100) return false;
  return true;
}

const VALIDATORS = {
  name: v => typeof v === 'string' && v.trim().length >= 1 && v.length <= MAX_NAME_LEN,
  wakeTime: isValidHHMM,
  workEndTime: isValidHHMM,
  sleepTime: isValidHHMM,
  timezone: isValidTimezone,
  theme: v => THEME_KEYS.includes(v),
  profileImageUrl: isValidUrlOrNull,
  coverImageUrl: isValidUrlOrNull,
  lastOverride: isValidOverride,
};

const REQUIRED_ON_CREATE = ['name', 'wakeTime', 'workEndTime', 'sleepTime', 'timezone', 'theme'];

/** Validates a flat field map. `partial: true` skips the required-on-create check (used by updates). */
export function validateFields(payload, { partial }) {
  const errors = [];
  if (!partial) {
    for (const field of REQUIRED_ON_CREATE) {
      if (!(field in payload)) errors.push(`missing_${field}`);
    }
  }
  for (const [field, value] of Object.entries(payload)) {
    const validator = VALIDATORS[field];
    if (!validator) {
      errors.push(`unknown_field_${field}`);
      continue;
    }
    if (!validator(value)) errors.push(`invalid_${field}`);
  }
  return errors;
}
