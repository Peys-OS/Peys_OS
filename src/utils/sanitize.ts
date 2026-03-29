export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== "string") return "";
  return input.slice(0, maxLength).trim();
}

export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== "string") return "";
  const sanitized = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : "";
}

export function sanitizePhone(input: string): string {
  if (!input || typeof input !== "string") return "";
  const cleaned = input.replace(/\D/g, "");
  const phoneRegex = /^\+?\d{10,15}$/;
  return phoneRegex.test(cleaned) ? cleaned : "";
}

export function sanitizeAmount(input: string): string {
  if (!input || typeof input !== "string") return "0";
  const sanitized = input.replace(/[^0-9.]/g, "");
  const num = parseFloat(sanitized);
  return isNaN(num) || num < 0 ? "0" : sanitized;
}

export function sanitizeUrlParam(input: string | null): string {
  if (!input) return "";
  return sanitizeString(input, 500)
    .replace(/[<>'";&]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "");
}
