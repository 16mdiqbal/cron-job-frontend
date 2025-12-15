// User roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export const ROLE_LABELS = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.USER]: 'User',
  [UserRole.VIEWER]: 'Viewer',
};

export default UserRole;
