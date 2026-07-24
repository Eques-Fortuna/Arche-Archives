import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../lib/api';
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  removeStoredToken,
  removeStoredUser
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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      if (data.ok && data.access_token) {
        setStoredToken(data.access_token);
        setStoredUser(data.user);
        setToken(data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        window.dispatchEvent(new Event('auth-change'));
        return { success: true };
      } else {
        return { success: false, error: 'Login failed. Please check credentials.' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    removeStoredToken();
    removeStoredUser();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-change'));
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout: logoutUser,
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
