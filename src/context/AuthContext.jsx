import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginAdmin as apiLoginAdmin,
  loginUser as apiLoginUser,
  registerUser as apiRegisterUser,
  getAdminMe,
  getPublicMe,
  logoutAdmin as apiLogoutAdmin,
  logoutUser as apiLogoutUser
} from '../lib/api';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken,
  removeStoredUser,
  isAdminUser as checkIsAdmin,
  isPublicUser as checkIsPublic
} from '../lib/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const loginAdmin = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLoginAdmin({ email, password });
      if (data.ok && data.access_token) {
        setStoredToken(data.access_token);
        setStoredUser(data.user);
        setToken(data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        window.dispatchEvent(new Event('auth-change'));
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed.' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLoginUser({ email, password });
      if (data.ok && data.access_token) {
        setStoredToken(data.access_token);
        setStoredUser(data.user);
        setToken(data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        window.dispatchEvent(new Event('auth-change'));
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed.' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (payload) => {
    setLoading(true);
    try {
      const data = await apiRegisterUser(payload);
      if (data.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message || 'Registration failed.' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to register account.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user?.account_type === 'admin') {
        await apiLogoutAdmin().catch(() => {});
      } else {
        await apiLogoutUser().catch(() => {});
      }
    } catch (e) {
      // Swallowed to ensure clean local clearance
    } finally {
      removeStoredToken();
      removeStoredUser();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      window.dispatchEvent(new Event('auth-change'));
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    if (!getStoredToken()) return;
    try {
      const isCurrentlyAdmin = user?.account_type === 'admin';
      const freshUser = isCurrentlyAdmin ? await getAdminMe() : await getPublicMe();
      if (freshUser && freshUser.user) {
        setStoredUser(freshUser.user);
        setUser(freshUser.user);
      }
    } catch (e) {
      console.error('Failed to refresh user profile data:', e);
    }
  };

  const value = {
    currentUser: user,
    user, // for backward compatibility
    token,
    isAuthenticated,
    isAdminUser: checkIsAdmin(user),
    isPublicUser: checkIsPublic(user),
    loading,
    loginAdmin,
    loginUser,
    registerUser,
    logout,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
