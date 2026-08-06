const nationalDigits = (input: string): string => {
  const digits = input.replace(/\D/g, "");
  return digits.length > 10 && digits.startsWith("1")
    ? digits.slice(1, 11)
    : digits.slice(0, 10);
};

export const formatUsPhoneInput = (input: string): string => {
  const digits = nationalDigits(input);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const normalizeUsPhoneNumber = (input: string): string | null => {
  const digits = nationalDigits(input);
  return digits.length === 10 ? `+1${digits}` : null;
};

export const formatE164PhoneNumber = (phoneNumber: string): string => {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phoneNumber);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
};
