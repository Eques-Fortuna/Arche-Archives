import { AUTH_TOKEN_KEY, USER_INFO_KEY } from './constants';

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(AUTH_TOKEN_KEY, token);
export const removeStoredToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_INFO_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem(USER_INFO_KEY);

export const isAuthenticated = () => {
  const token = getStoredToken();
  return !!token;
};

export const logout = () => {
  removeStoredToken();
  removeStoredUser();
  window.dispatchEvent(new Event('auth-change'));
};

/* ==========================================
   ROLE AUTHORIZATION HELPERS
   ========================================== */

/**
 * Checks if the user holds admin rights
 */
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

/**
 * Checks if user is permitted to review text compositions
 */
export const canReviewText = (user) => {
  return ['admin', 'operator', 'text_reviewer'].includes(user?.role);
};

/**
 * Checks if user is permitted to review cover graphics layout designs
 */
export const canReviewCovers = (user) => {
  return ['admin', 'operator', 'cover_reviewer'].includes(user?.role);
};

/**
 * Checks if user is permitted to review copyright rights
 */
export const canReviewRights = (user) => {
  return ['admin', 'operator', 'rights_reviewer'].includes(user?.role);
};

/**
 * Checks if user is permitted to publish datasets / catalog items
 */
export const canPublish = (user) => {
  return ['admin', 'operator'].includes(user?.role);
};
