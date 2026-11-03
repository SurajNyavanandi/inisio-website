export function validateIndianMobileNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Mobile number is required' };
  }
  const cleaned = phone.replace(/[\s\-+()]/g, '');
  // Extract last 10 digits if country code 91 is included
  const digits = cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
    };
  }
  return { isValid: true };
}
