export function validateIndianMobileNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Mobile number is required' };
  }
  const clean = phone.trim().replace(/[\s\-+()]/g, '')
    .replace(/^91(?=\d{10}$)/, '')
    .replace(/^0(?=\d{10}$)/, '');

  if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
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
      error: 'Please provide a valid Indian mobile number (sequential or repetitive test numbers are not permitted)'
    };
  }

  return { isValid: true };
}
