import { User } from "@shared/schema";

const AUTH_STORAGE_KEY = "ing_auth_user";

export function setAuthUser(user: User) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function getAuthUser(): User | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const { ROLE_PERMISSIONS } = require("@shared/schema");
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

export function isGeneralOrHigher(user: User | null): boolean {
  if (!user) return false;
  return user.role === "General" || user.role === "Admin";
}

export function isColonelOrHigher(user: User | null): boolean {
  if (!user) return false;
  return user.role === "Colonel" || isGeneralOrHigher(user);
}

export function canViewAllDisciplinary(user: User | null): boolean {
  if (!user) return false;
  return user.role === "MP" || isColonelOrHigher(user);
}
