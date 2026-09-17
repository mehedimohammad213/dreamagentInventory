/**
 * Minimal validator returning Laravel-like error bags: { field: ['message'] }
 */

export function validate(data, rules) {
  const errors = {};

  for (const [field, ruleStr] of Object.entries(rules)) {
    const ruleList = String(ruleStr).split('|').filter(Boolean);
    const value = data[field];
    const messages = [];
    const isNumericField = ruleList.some((r) => r === 'integer' || r === 'numeric' || r.startsWith('integer:') || r.startsWith('numeric:'));

    for (const rule of ruleList) {
      const [name, param] = rule.split(':');

      if (name === 'required') {
        if (value === undefined || value === null || value === '') {
          messages.push(`The ${field} field is required.`);
        }
      } else if (name === 'nullable' && (value === undefined || value === null || value === '')) {
        break;
      } else if (name === 'string' && value != null && value !== '' && typeof value !== 'string') {
        messages.push(`The ${field} must be a string.`);
      } else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        messages.push(`The ${field} must be a valid email.`);
      } else if (name === 'integer' || name === 'numeric') {
        if (value !== undefined && value !== null && value !== '' && Number.isNaN(Number(value))) {
          messages.push(`The ${field} must be a number.`);
        }
      } else if (name === 'min') {
        const n = Number(param);
        if (isNumericField && value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value))) {
          if (Number(value) < n) messages.push(`The ${field} must be at least ${n}.`);
        } else if (typeof value === 'string' && value.length < n) {
          messages.push(`The ${field} must be at least ${n} characters.`);
        }
      } else if (name === 'max') {
        const n = Number(param);
        if (isNumericField && value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value))) {
          if (Number(value) > n) messages.push(`The ${field} may not be greater than ${n}.`);
        } else if (typeof value === 'string' && value.length > n) {
          messages.push(`The ${field} may not be greater than ${n} characters.`);
        }
      } else if (name === 'in') {
        const allowed = param.split(',');
        if (value !== undefined && value !== null && value !== '' && !allowed.includes(String(value))) {
          messages.push(`The selected ${field} is invalid.`);
        }
      } else if (name === 'array') {
        if (value != null && !Array.isArray(value)) {
          messages.push(`The ${field} must be an array.`);
        }
      } else if (name === 'boolean') {
        if (value != null && !['true', 'false', '1', '0', true, false, 1, 0].includes(value)) {
          messages.push(`The ${field} must be true or false.`);
        }
      }
    }

    if (messages.length) errors[field] = messages;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

export function parseMaybeJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function toInt(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

export function toFloat(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? fallback : n;
}

export default { validate, parseMaybeJson, toInt, toFloat };
