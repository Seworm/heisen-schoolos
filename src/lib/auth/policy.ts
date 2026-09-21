export const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() ||
  "atsu.seworm@gmail.com";

export function isConfiguredSuperadminEmail(email: string) {
  return email.trim().toLowerCase() === SUPERADMIN_EMAIL;
}
