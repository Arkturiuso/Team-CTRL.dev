export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  USER: {
    LEVELS: '/user/levels',
    KNOWLEDGE: '/user/knowledge',
    RATING: '/user/rating',
    PROFILE: '/user/profile',
  },
  ADMIN: {
    KNOWLEDGE: '/admin/knowledge',
    USERS: '/admin/users',
    LEVELS: '/admin/levels',
  }
} as const;
