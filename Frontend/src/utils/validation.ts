import type React from 'react';

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Strips non-digits and handles optional +91 / 91 / leading 0 prefixes cleanly on paste/autofill.
 * Returns up to 10 numeric digits.
 */
export function sanitizeIndianPhoneInput(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length > 10 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/**
 * Allows empty string, blocks letters/e/+/-, preserves single decimal point up to maxDecimals.
 */
export function sanitizeDecimalInput(raw: string, maxDecimals = 2): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    const intPart = cleaned.slice(0, firstDot);
    const fracPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, maxDecimals);
    cleaned = `${intPart}.${fracPart}`;
  }
  // Collapse multiple leading zeros like "005" -> "5" while keeping "0" and "0.xx"
  if (/^0\d+/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+(?=\d)/, '');
  }
  return cleaned;
}

/**
 * Digits-only sanitizer for integer fields (e.g., CIBIL score, OTP). Allows empty string.
 */
export function sanitizeIntegerInput(raw: string, maxLength = 6): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\D/g, '').slice(0, maxLength);
}

/**
 * Person name sanitizer: strips digits, collapses extra spaces, caps maxLength.
 */
export function sanitizePersonNameInput(raw: string, maxLength = 80): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/[0-9]/g, '').slice(0, maxLength);
}

/**
 * IFSC sanitizer: uppercase alphanumeric, max 11 chars.
 */
export function sanitizeIfscInput(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
}

/**
 * Blocks e, E, +, -, and optionally '.' on numeric inputs while allowing navigation/clipboard keys.
 */
export function blockInvalidNumberKeys(
  e: React.KeyboardEvent<HTMLInputElement>,
  allowDecimal = true
): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const blocked = allowDecimal ? ['e', 'E', '+', '-'] : ['e', 'E', '+', '-', '.'];
  if (blocked.includes(e.key)) {
    e.preventDefault();
  }
}

export function validateIndianMobileNumber(phone: string): FieldValidationResult {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return { isValid: false, error: 'Mobile number is required' };
  }
  const clean = phone
    .trim()
    .replace(/[\s\-+()]/g, '')
    .replace(/^91(?=\d{10}$)/, '')
    .replace(/^0(?=\d{10}$)/, '');

  if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
    };
  }

  // Reject all-same digits or sequential dummy numbers to align with backend validation
  const dummyNumbers = new Set(['0123456789', '1234567890', '9876543210', '9848012345']);
  const isAllSameDigit = /^(\d)\1{9}$/.test(clean);
  const isSequential = clean.split('').every((digit, index, digits) => {
    if (index === 0) return true;
    const difference = Number(digit) - Number(digits[index - 1]);
    return difference === 1 || difference === -1;
  });

  if (isAllSameDigit || dummyNumbers.has(clean) || isSequential) {
    return {
      isValid: false,
      error: 'Enter a real 10-digit mobile number (test or sequential numbers are not permitted)',
    };
  }

  return { isValid: true };
}

export function validateEmailAddress(email: string, required = true): FieldValidationResult {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) {
    return required
      ? { isValid: false, error: 'Email address is required' }
      : { isValid: true };
  }
  if (clean.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
    return { isValid: false, error: 'Enter a valid email address (e.g. name@company.in)' };
  }
  return { isValid: true };
}

export function validatePersonName(
  name: string,
  label = 'Full name',
  required = true
): FieldValidationResult {
  const clean = (name || '').trim();
  if (!clean) {
    return required ? { isValid: false, error: `${label} is required` } : { isValid: true };
  }
  if (/\d/.test(clean)) {
    return { isValid: false, error: `${label} cannot contain numbers` };
  }
  if (clean.length < 2) {
    return { isValid: false, error: `${label} must be at least 2 characters` };
  }
  if (clean.length > 80) {
    return { isValid: false, error: `${label} must be 80 characters or fewer` };
  }
  return { isValid: true };
}

export function validateRequiredText(
  value: string,
  label: string,
  maxLength = 120
): FieldValidationResult {
  const clean = (value || '').trim();
  if (!clean) {
    return { isValid: false, error: `${label} is required` };
  }
  if (clean.length > maxLength) {
    return { isValid: false, error: `${label} must be ${maxLength} characters or fewer` };
  }
  return { isValid: true };
}

export function validatePositiveNumber(
  value: string | number | undefined | null,
  label: string,
  opts: { min?: number; max?: number; allowZero?: boolean; required?: boolean } = {}
): FieldValidationResult {
  const { min = 0, max = 100000, allowZero = false, required = true } = opts;
  const str = value === undefined || value === null ? '' : String(value).trim();
  if (!str) {
    return required ? { isValid: false, error: `${label} is required` } : { isValid: true };
  }
  const num = Number(str);
  if (!Number.isFinite(num)) {
    return { isValid: false, error: `Enter a valid number for ${label}` };
  }
  if (allowZero ? num < min : num <= min) {
    return {
      isValid: false,
      error: allowZero
        ? `${label} must be ${min} or greater`
        : `${label} must be greater than ${min}`,
    };
  }
  if (num > max) {
    return { isValid: false, error: `${label} must be ${max.toLocaleString('en-IN')} or less` };
  }
  return { isValid: true };
}

export function validateWebsiteUrl(url: string, required = false): FieldValidationResult {
  const clean = (url || '').trim();
  if (!clean) {
    return required ? { isValid: false, error: 'Website URL is required' } : { isValid: true };
  }
  const withProtocol = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname.includes('.') || parsed.hostname.length < 4) {
      return { isValid: false, error: 'Enter a valid website URL (e.g. https://firm.in)' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Enter a valid website URL (e.g. https://firm.in)' };
  }
}

export function validateIfscCode(code: string, required = false): FieldValidationResult {
  const clean = (code || '').trim().toUpperCase();
  if (!clean) {
    return required ? { isValid: false, error: 'IFSC code is required' } : { isValid: true };
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
    return { isValid: false, error: 'Enter a valid 11-character IFSC code (e.g. SBIN0004562)' };
  }
  return { isValid: true };
}

export function validateCibilScore(
  value: string | number | undefined | null,
  isNewToCredit = false
): FieldValidationResult {
  if (isNewToCredit) return { isValid: true };
  const str = value === undefined || value === null ? '' : String(value).trim();
  if (!str) {
    return { isValid: false, error: 'Enter a CIBIL score between 300 and 900 (or check New to Credit)' };
  }
  const num = Number(str);
  if (!Number.isInteger(num) || num < 300 || num > 900) {
    return { isValid: false, error: 'CIBIL score must be a whole number between 300 and 900' };
  }
  return { isValid: true };
}
