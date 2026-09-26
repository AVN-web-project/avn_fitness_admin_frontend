import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi.js';
import { ROLES } from '../permissions/roles.js';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage and verify profile
  const initAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('avn_admin_token');
      const storedUser = localStorage.getItem('avn_admin_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore parsing error
        }

        // Verify with backend
        const profile = await authApi.getProfile();
        if (profile?.user) {
          // Verify staff/admin role
          if (profile.user.role === 'user') {
            throw new Error('Access denied. Admin portal requires staff or admin credentials.');
          }
          setUser(profile.user);
          localStorage.setItem('avn_admin_user', JSON.stringify(profile.user));
        }
      }
    } catch {
      localStorage.removeItem('avn_admin_token');
      localStorage.removeItem('avn_admin_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    const { user: loggedInUser, token } = data;

    if (!loggedInUser || loggedInUser.role === 'user') {
      throw new Error('Unauthorized: Staff or Admin privileges are required to access this portal.');
    }

    if (token) {
      localStorage.setItem('avn_admin_token', token);
    }
    localStorage.setItem('avn_admin_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue cleanup on client
    } finally {
      localStorage.removeItem('avn_admin_token');
      localStorage.removeItem('avn_admin_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isSuperAdmin,
        login,
        logout,
        refreshProfile: initAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuthContext = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuthContext must be used within an AdminAuthProvider');
  }
  return context;
};
