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
 * Checks if the user holds operator rights
 */
export const isOperator = (user) => {
  return user?.role === 'operator';
};

/**
 * Checks if the user holds viewer rights
 */
export const isViewer = (user) => {
  return user?.role === 'viewer';
};

/**
 * Checks if the user is one of the queue reviewers
 */
export const isReviewer = (user) => {
  return ['text_reviewer', 'cover_reviewer', 'rights_reviewer'].includes(user?.role);
};

/**
 * Checks if the user is a public reader account
 */
export const isPublicUser = (user) => {
  return user?.account_type === 'public' || user?.role === 'user';
};

/**
 * Checks if the user is an admin/staff account
 */
export const isAdminUser = (user) => {
  return user?.account_type === 'admin' || ['admin', 'operator', 'text_reviewer', 'cover_reviewer', 'rights_reviewer', 'viewer'].includes(user?.role);
};

/**
 * Checks if user is permitted to trigger pipeline phase runs
 */
export const canRunAutomation = (user) => {
  return ['admin', 'operator'].includes(user?.role);
};

/**
 * Checks if user is permitted to trigger retry actions on failed stages
 */
export const canRetry = (user) => {
  return ['admin', 'operator'].includes(user?.role);
};

/**
 * Checks if user is permitted to archive books
 */
export const canArchive = (user) => {
  return user?.role === 'admin';
};

/**
 * Checks if user is permitted to unarchive books
 */
export const canUnarchive = (user) => {
  return user?.role === 'admin';
};


/**
 * Checks if user is permitted to publish/unpublish books
 */
export const canPublish = (user) => {
  return user?.role === 'admin';
};

/**
 * Checks if user is permitted to manually override stage/status
 */
export const canManualOverride = (user) => {
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
 * Checks if user is permitted to upload direct custom human covers
 */
export const canUploadHumanCover = (user) => {
  return ['admin', 'operator', 'cover_reviewer'].includes(user?.role);
};

/**
 * Checks if user is permitted to reupload and replace an approved cover
 */
export const canReuploadCover = (user) => {
  return ['admin', 'operator', 'cover_reviewer'].includes(user?.role);
};

/**
 * Checks if user is permitted to permanently hard delete a book
 */
export const canDeleteBook = (user) => {
  return user?.role === 'admin';
};


