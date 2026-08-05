if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL environment variable is required in production');
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
export const AUTH_TOKEN_KEY = 'arche_token';
export const USER_INFO_KEY = 'arche_user';

export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  TEXT_REVIEWER: 'text_reviewer',
  COVER_REVIEWER: 'cover_reviewer',
  RIGHTS_REVIEWER: 'rights_reviewer',
  VIEWER: 'viewer',
};

export const BOOK_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  REVIEWED: 'reviewed',
  PUBLISHED: 'published',
};
