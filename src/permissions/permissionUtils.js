import { ROLE_PERMISSIONS } from './rolePermissions.js';
import { ROLE_DOMAINS, ROLES } from './roles.js';

/**
 * Returns list of permissions assigned to a role.
 */
export function getPermissionsForRole(role) {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Checks if staff has a specific permission.
 */
export function hasPermission(userRole, permission, customPermissions = null) {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;

  const permissions = Array.isArray(customPermissions) && customPermissions.length > 0
    ? customPermissions
    : getPermissionsForRole(userRole);

  return permissions.includes(permission);
}

/**
 * Checks if staff has at least one permission in the given list.
 */
export function hasAnyPermission(userRole, requiredPermissions = [], customPermissions = null) {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  return requiredPermissions.some((perm) => hasPermission(userRole, perm, customPermissions));
}

/**
 * Checks if staff has all permissions in the given list.
 */
export function hasAllPermissions(userRole, requiredPermissions = [], customPermissions = null) {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  return requiredPermissions.every((perm) => hasPermission(userRole, perm, customPermissions));
}

/**
 * Returns allowed domain modules for the role.
 */
export function getAllowedDomainsForRole(userRole) {
  if (!userRole) return [];
  return ROLE_DOMAINS[userRole] || [];
}
