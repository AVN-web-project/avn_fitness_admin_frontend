import React, { createContext, useContext, useMemo } from 'react';
import { useAdminAuthContext } from './AdminAuthContext.jsx';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole,
  getAllowedDomainsForRole,
} from '../permissions/permissionUtils.js';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { user } = useAdminAuthContext();
  const role = user?.role;
  const customPermissions = user?.permissions;

  const permissions = useMemo(() => {
    if (!role) return [];
    return getPermissionsForRole(role);
  }, [role]);

  const allowedDomains = useMemo(() => {
    if (!role) return [];
    return getAllowedDomainsForRole(role);
  }, [role]);

  const can = (permission) => {
    return hasPermission(role, permission, customPermissions);
  };

  const canAny = (requiredPermissions = []) => {
    return hasAnyPermission(role, requiredPermissions, customPermissions);
  };

  const canAll = (requiredPermissions = []) => {
    return hasAllPermissions(role, requiredPermissions, customPermissions);
  };

  const canAccessDomain = (domain) => {
    if (!role) return false;
    return allowedDomains.includes(domain);
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        allowedDomains,
        can,
        canAny,
        canAll,
        canAccessDomain,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissionContext = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
};
