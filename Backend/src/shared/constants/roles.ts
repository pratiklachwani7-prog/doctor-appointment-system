export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 3,
  [UserRole.DOCTOR]: 2,
  [UserRole.PATIENT]: 1,
} as const;

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
