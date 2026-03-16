export type PasswordValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const MIN_LENGTH = 12;

export function validateStaffPassword(password: string): PasswordValidationResult {
  const value = password ?? "";
  if (value.length < MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${MIN_LENGTH} characters long.`,
    };
  }

  let categories = 0;
  if (/[a-z]/.test(value)) categories += 1;
  if (/[A-Z]/.test(value)) categories += 1;
  if (/[0-9]/.test(value)) categories += 1;
  if (/[^A-Za-z0-9]/.test(value)) categories += 1;

  if (categories < 3) {
    return {
      valid: false,
      message:
        "Password must include at least three of: uppercase letters, lowercase letters, numbers, and symbols.",
    };
  }

  return { valid: true };
}

