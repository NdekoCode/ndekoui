const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailProblemOf(email: string, emptyMessage: string) {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return emptyMessage;
  }
  const isValid = EMAIL_PATTERN.test(trimmed);
  if (!isValid) {
    return 'Enter an email like name@company.com';
  }
  return null;
}
