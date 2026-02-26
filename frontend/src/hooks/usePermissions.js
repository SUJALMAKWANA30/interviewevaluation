import { useMemo } from "react";

/**
 * Hook to check permissions for the current logged-in HR user.
 * Reads user data from localStorage (set during login).
 *
 * Usage:
 *   const { can, canAny, isSuperAdmin, user } = usePermissions();
 *   if (can("candidates", "delete")) { ... }
 */
export function usePermissions() {
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem("userData");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const permissions = user.permissions || [];
  const level = user.level ?? 99;

  /**
   * Check if user has a specific permission
   */
  const can = (module, action) => {
    // Super admin bypasses all checks
    if (level === 0) return true;
    return permissions.some(
      (p) => p.module === module && p.actions?.includes(action)
    );
  };

  /**
   * Check if user has ANY of the given actions on a module
   */
  const canAny = (module, actions) => {
    if (level === 0) return true;
    return actions.some((a) => can(module, a));
  };

  /**
   * Check if user has ALL of the given actions on a module
   */
  const canAll = (module, actions) => {
    if (level === 0) return true;
    return actions.every((a) => can(module, a));
  };

  /**
   * Check if user is at or above a certain level (lower number = more privileged)
   */
  const hasLevel = (maxLevel) => level <= maxLevel;

  return {
    user,
    can,
    canAny,
    canAll,
    hasLevel,
    isSuperAdmin: level === 0,
    isAdmin: level <= 1,
    isManager: level <= 2,
    isAuthenticated: !!user.id,
    role: user.role || "unknown",
    roleName: user.roleName || "Unknown",
  };
}
